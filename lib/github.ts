import { Octokit } from "@octokit/rest"
import chalk from "chalk"

// Get GitHub token from environment variable
const githubToken = process.env.GITHUB_TOKEN
console.log(githubToken);


// Initialize Octokit with GitHub token if available
const octokit = new Octokit({
  auth: githubToken,
})

//  * Verify if GitHub token is configured correctly
function verifyGitHubToken() {
  if (!githubToken) {
    console.warn(chalk.yellow("\n⚠️ GitHub token not found in environment variables!"))
    console.log(chalk.cyan("To set up your GitHub token:"))
    console.log("1. Create a personal access token at https://github.com/settings/tokens")
    console.log("2. Ensure it has 'repo' permissions for private repositories")
    console.log("3. Set it as an environment variable:")
    console.log(chalk.green("   export GITHUB_TOKEN=your_token_here     # For macOS/Linux"))
    console.log(chalk.green("   set GITHUB_TOKEN=your_token_here        # For Windows CMD"))
    console.log(chalk.green("   $env:GITHUB_TOKEN=\"your_token_here\"     # For Windows PowerShell"))
    
    return false
  }
  return true
}

//  * Fetch open pull requests from a repository
export async function fetchPullRequests(owner: string, repo: string) {
  try {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: "open",
    })

    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      user: pr.user?.login,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
    }))
  } catch (error) {
    console.error("Error fetching pull requests:", error)
    throw new Error("Failed to fetch pull requests from GitHub")
  }
}

//  * Post a comment to a pull request
export async function postCommentToPR(owner: string, repo: string, prNumber: number, comment: string) {
  try {
    // Check if GitHub token is configured
    if (!verifyGitHubToken()) {
      throw new Error("GitHub token is required to post comments")
    }
    
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment,
    })
    
    return true
  } catch (error: any) {
    console.error("Error posting comment:", error.message || error)
    
    // Give more specific guidance based on error code
    if (error.status === 401) {
      console.error(chalk.red("\n❌ Authentication failed. Your GitHub token appears to be invalid or expired."))
      console.log("Please check that your token has the necessary permissions:")
      console.log("- For public repositories: 'public_repo' scope")
      console.log("- For private repositories: 'repo' scope")
      console.log("\nGenerate a new token at: https://github.com/settings/tokens/new")
    } else if (error.status === 403) {
      console.error(chalk.red("\n❌ Permission denied. Your token doesn't have sufficient permissions."))
      console.log("For posting comments, ensure your token has 'repo' or 'public_repo' scope.")
    } else if (error.status === 404) {
      console.error(chalk.red(`\n❌ Not found. Repository '${owner}/${repo}' or PR #${prNumber} doesn't exist or you don't have access to it.`))
      console.log("Please check that the repository exists and that you have access to it.")
    }
    
    throw new Error("Failed to post comment to GitHub")
  }
}

//  * Fetch files from a pull request including their content
export async function fetchPRFiles(owner: string, repo: string, prNumber: number) {
  try {
    // Get the list of files changed in the PR
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    })

    const filesWithContent = []

    // For each file, fetch its content if it's not too large
    for (const file of files) {
      // Skip binary files or files that are too large (>1MB)
      if (file.status === "removed" || (file as any).size > 1000000) {
        filesWithContent.push({
          filename: file.filename,
          status: file.status,
          content: null,
        })
        continue
      }

      try {
        // Get file content from GitHub
        const { data: contentData } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.filename,
          ref: file.blob_url.split("/").pop() || "", // Get the SHA from the blob URL
        })

        // GitHub returns content as base64 encoded string
        let content
        if ("content" in contentData && typeof contentData.content === "string") {
          content = Buffer.from(contentData.content, "base64").toString("utf-8")
        } else {
          content = "Content not available"
        }

        filesWithContent.push({
          filename: file.filename,
          status: file.status,
          content,
        })
      } catch (contentError) {
        console.warn(`Could not fetch content for ${file.filename}:`, contentError)
        filesWithContent.push({
          filename: file.filename,
          status: file.status,
          content: "Content could not be retrieved",
        })
      }
    }

    return filesWithContent
  } catch (error) {
    console.error("Error fetching PR files:", error)
    throw new Error("Failed to fetch PR files from GitHub")
  }
}

/**
 * Helper function to determine if a file is likely binary based on file extension
 */
function isBinaryPath(path: string): boolean {
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp',
    '.pdf', '.zip', '.gz', '.tar', '.tgz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
    '.ttf', '.otf', '.woff', '.woff2',
    '.mp3', '.mp4', '.wav', '.avi', '.mov', '.webm',
    '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
  ]
  
  const extension = path.slice(path.lastIndexOf('.')).toLowerCase()
  return binaryExtensions.includes(extension)
}
