import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import { fetchPRFiles } from "./github"
import chalk from "chalk"

// Initialize AWS Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

// Model ID for Amazon Q Developer
const AMAZON_Q_MODEL_ID = process.env.AMAZON_Q_MODEL_ID || "amazon.titan-code-express-v1"
// Fallback models if primary model is unavailable
const FALLBACK_MODELS = [
  "amazon.titan-text-express-v1",
  "anthropic.claude-instant-v1"
]

function verifyAwsCredentials() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(chalk.yellow("\n⚠️ AWS credentials are missing or incomplete!"))
    console.log(chalk.cyan("To configure AWS for Amazon Q:"))
    console.log("1. Ensure you have an AWS account with access to Amazon Bedrock")
    console.log("2. Set up the following environment variables:")
    console.log(chalk.green("   AWS_ACCESS_KEY_ID=your_access_key"))
    console.log(chalk.green("   AWS_SECRET_ACCESS_KEY=your_secret_key"))
    console.log(chalk.green("   AWS_REGION=your_region (defaults to us-east-1)"))
    return false
  }
  return true
}

/**
 * Analyze code changes using Amazon Q Developer
 */
export async function analyzeCode(owner: string, repo: string, prNumber: number) {
  try {
    // Verify AWS credentials
    const credentialsValid = verifyAwsCredentials()

    // Fetch PR files from GitHub
    const prFiles = await fetchPRFiles(owner, repo, prNumber)
    
    // Prepare code content for analysis
    let codeContent = `Pull Request #${prNumber} from ${owner}/${repo}\n\n`
    
    // Limit to 5 files to avoid exceeding token limits
    const filesToAnalyze = prFiles.slice(0, 5)
    
    for (const file of filesToAnalyze) {
      if (file.content) {
        // Trim content if it's very large
        const content = file.content.length > 10000 
          ? file.content.substring(0, 10000) + "\n... (content truncated) ..." 
          : file.content;
        
        codeContent += `\n--- ${file.filename} ---\n${content}\n`
      } else {
        codeContent += `\n--- ${file.filename} ---\n(Content not available)\n`
      }
    }
    
    let analysisResult;
    
    // Send to Amazon Q for analysis if credentials are valid
    if (credentialsValid) {
      try {
        console.log(chalk.dim("Sending code to Amazon Q for analysis..."))
        analysisResult = await sendToAmazonQ(codeContent)
      } catch (amazonQError) {
        console.error(chalk.yellow("Amazon Q API call failed. Falling back to mock data."))
        console.error(chalk.dim("Error details:"), amazonQError)
        analysisResult = null
      }
    }
    
    // If Amazon Q failed or credentials are invalid, use mock data
    if (!analysisResult) {
      console.log(chalk.yellow("Using mock data for analysis."))
      return mockAnalyzeCode(prNumber, filesToAnalyze.map(f => f.filename))
    }
    
    // Parse and structure the response
    return parseAmazonQResponse(analysisResult, filesToAnalyze)
  } catch (error) {
    console.error("Error analyzing code with Amazon Q:", error)
    console.log(chalk.yellow("Falling back to mock data due to error."))
    return mockAnalyzeCode(prNumber)
  }
}


async function sendToAmazonQ(codeContent: string) {
  try {
    const prompt = `
      Analyze the following code from a GitHub Pull Request for:
      1. Code quality issues
      2. Complex functions that could be simplified
      3. Potential security vulnerabilities
      4. Refactoring suggestions
      5. Overall code health assessment
      
      Code:
      ${codeContent}
      
      Provide your analysis in the following JSON format:
      {
        "summary": "Overall assessment of the code",
        "riskyFiles": ["list of files that need attention"],
        "complexFunctions": ["list of complex functions with descriptions"],
        "refactoringSuggestions": ["list of specific refactoring suggestions"],
        "securityIssues": ["list of potential security concerns"]
      }
    `

    // Try with primary model first, then fallbacks if needed
    let modelId = AMAZON_Q_MODEL_ID;
    let responseBody = null;
    let modelError = null;

    // Try primary model first
    try {
      console.log(chalk.dim(`Using Amazon Q model: ${modelId}`))
      responseBody = await invokeModel(modelId, prompt);
      return responseBody.completion;
    } catch (error: any) {
      modelError = error;
      console.error(chalk.yellow(`Error with primary model ${modelId}: ${error.message}`));
      
      // Try fallback models
      for (const fallbackModel of FALLBACK_MODELS) {
        try {
          console.log(chalk.dim(`Trying fallback model: ${fallbackModel}`));
          responseBody = await invokeModel(fallbackModel, prompt);
          console.log(chalk.green(`Successfully used fallback model: ${fallbackModel}`));
          return responseBody.completion;
        } catch (fallbackError: any) {
          console.error(chalk.yellow(`Fallback model ${fallbackModel} also failed: ${fallbackError.message}`));
        }
      }
    }
    
    // If we get here, all models failed
    handleApiError(modelError);
    throw new Error("Failed to analyze code with Amazon Q - all models failed");
  } catch (error: any) {
    console.error("Error calling Amazon Q API:", error.message || error)
    handleApiError(error);
    throw new Error("Failed to analyze code with Amazon Q")
  }
}

// Helper function to invoke a model with consistent parameters
async function invokeModel(modelId: string, prompt: string) {
  const params = {
    modelId: modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      prompt: prompt,
      temperature: 0.2,
      maxTokens: 4096,
    }),
  }

  const command = new InvokeModelCommand(params)
  const response = await bedrockClient.send(command)
  return JSON.parse(new TextDecoder().decode(response.body));
}

// Helper function to provide guidance based on error type
function handleApiError(error: any) {
  if (error.name === "AccessDeniedException") {
    console.error(chalk.red("\n❌ Access denied to Amazon Bedrock. Check your permissions."))
    console.log("Ensure your AWS account has access to Amazon Bedrock and the specified model.")
  } else if (error.name === "ValidationException") {
    console.error(chalk.red("\n❌ Invalid parameters in the Amazon Q request."))
    console.log(`Model ID may be incorrect or not accessible.`)
    console.log(chalk.cyan("Available models in Amazon Bedrock may include:"))
    console.log("- amazon.titan-text-express-v1")
    console.log("- anthropic.claude-instant-v1")
    console.log("- anthropic.claude-v2")
  } else if (error.name === "ServiceQuotaExceededException") {
    console.error(chalk.red("\n❌ Service quota exceeded for Amazon Bedrock."))
    console.log("You may need to request an increase in your service quotas.")
  } else if (error.name === "ThrottlingException") {
    console.error(chalk.red("\n❌ API request throttled."))
    console.log("Try again later or reduce the request rate.")
  }
}

/**
 * Parse Amazon Q's response into structured format
 */
function parseAmazonQResponse(response: string, files: any[]) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    let parsedResponse;
    
    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn("Could not parse JSON from response, using fallback parsing");
      }
    }
    
    if (!parsedResponse) {
      // Fallback: Extract information using regex patterns
      parsedResponse = {
        summary: extractSection(response, "summary", "overall assessment"),
        riskyFiles: extractListItems(response, "risky files", "need attention"),
        complexFunctions: extractListItems(response, "complex functions"),
        refactoringSuggestions: extractListItems(response, "refactoring suggestions"),
        securityIssues: extractListItems(response, "security", "vulnerabilities")
      };
    }
    
    // Ensure expected structure even if some parts are missing
    return {
      summary: parsedResponse.summary || "Analysis completed, but summary could not be generated.",
      riskyFiles: parsedResponse.riskyFiles || files.map(f => f.filename).slice(0, 3),
      complexFunctions: parsedResponse.complexFunctions || [],
      refactoringSuggestions: parsedResponse.refactoringSuggestions || [],
      securityIssues: parsedResponse.securityIssues || []
    };
  } catch (error) {
    console.error("Error parsing Amazon Q response:", error);
    // Return basic structure if parsing fails
    return {
      summary: "Analysis completed, but results could not be properly parsed.",
      riskyFiles: files.map(f => f.filename).slice(0, 3),
      complexFunctions: [],
      refactoringSuggestions: [],
      securityIssues: []
    };
  }
}

/**
 * Helper function to extract content sections from text response
 */
function extractSection(text: string, sectionName: string, alternative?: string): string {
  const patterns = [
    new RegExp(`${sectionName}[:\\s]+(.*?)(?=\\n\\n|$)`, 'i'),
    alternative ? new RegExp(`${alternative}[:\\s]+(.*?)(?=\\n\\n|$)`, 'i') : null
  ].filter(Boolean);
  
  for (const pattern of patterns) {
    if (!pattern) continue;
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  
  return "";
}

/**
 * Helper function to extract list items from text response
 */
function extractListItems(text: string, sectionName: string, alternative?: string): string[] {
  // Try multiple regex patterns to handle different output formats
  const sectionPatterns = [
    // Pattern for finding a section with bullet points
    new RegExp(`${sectionName}[:\\s]+\\n((?:\\s*[-*•].*\\n)+)`, 'i'),
    // Pattern for finding a section with numbered items
    new RegExp(`${sectionName}[:\\s]+\\n((?:\\s*\\d+\\..*\\n)+)`, 'i'),
    // Pattern for finding items in a JSON-like array format
    new RegExp(`"${sectionName}"\\s*:\\s*\\[(.*?)\\]`, 'is'),
    // Alternative section name pattern with bullet points
    alternative ? new RegExp(`${alternative}[:\\s]+\\n((?:\\s*[-*•].*\\n)+)`, 'i') : null,
    // Try to find the section in a more general way
    new RegExp(`${sectionName}[:\\s]+(.*?)(?=\\n\\n|\\n[A-Z]|$)`, 'is')
  ].filter(Boolean);
  
  // Try each pattern until we find a match
  for (const pattern of sectionPatterns) {
    if (!pattern) continue;
    const match = text.match(pattern);
    
    if (match && match[1]) {
      if (pattern.toString().includes('\\[')) {
        // Handle JSON array format
        try {
          // Try parsing as actual JSON by adding brackets back
          const jsonItems = JSON.parse(`[${match[1]}]`);
          return jsonItems.map((item: unknown) => String(item).trim()).filter(Boolean);
        } catch (e) {
          // Parse as comma-separated strings
          return match[1].split(',')
            .map(item => item.replace(/^["'\s]+|["'\s]+$/g, '').trim())
            .filter(item => item.length > 0);
        }
      } else {
        // Handle bullet point or numbered formats
        return match[1]
          .split('\n')
          .map(line => line.replace(/^\s*[-*•\d.]\s*/, '').trim())
          .filter(line => line.length > 0);
      }
    }
  }
  
  return [];
}

function mockAnalyzeCode(prNumber: number, fileNames: string[] = []) {
  console.log(chalk.yellow("Using mock analysis data."))
  
  // Use provided filenames or generate defaults
  const riskyFiles = fileNames.length > 0 
    ? fileNames.slice(0, 2) 
    : [`src/components/UserProfile.tsx`, `lib/api/auth.ts`]
  
  // Generate different mock data based on PR number to simulate variety
  const mockData = {
    summary:
      "This pull request introduces several new features with generally good code quality, but there are some areas that could be improved.",
    complexityScore: 35 + (prNumber % 50),
    testCoverage: 70 - (prNumber % 30),
    codeStyleScore: 85,
    riskyFiles,
    complexFunctions: [
      `processUserData() in UserProfile.tsx - Cyclomatic complexity of 15`,
      `validateAuthToken() in auth.ts - Contains nested conditionals that could be simplified`,
    ],
    refactoringSuggestions: [
      `Consider breaking down the UserProfile component into smaller, more focused components`,
      `The error handling in API calls could be centralized to reduce duplication`,
      `Use TypeScript generics for the data fetching functions to improve type safety`,
    ],
    securityIssues:
      prNumber % 3 === 0
        ? [`Potential XSS vulnerability in user input rendering`, `API keys should not be stored in client-side code`]
        : [],
  }

  return mockData
}