# PR Review Helper

An automated pull request review tool that uses Amazon Q Developer to analyze code changes and provide feedback.

## Features

- Pull open pull requests from a GitHub repository
- Run static analysis on code changes using Amazon Q Developer
- Generate summary reports highlighting:
  - Risky sections of code
  - Complex functions
  - Refactoring suggestions
  - Security concerns
- Automatically post comments back to GitHub
- CLI tool for easy integration into workflows
- Web interface for visualizing results

## Getting Started

### Prerequisites

- Node.js 18 or higher
- GitHub access token with repo permissions
- AWS credentials with access to Amazon Q Developer

### Environment Variables

Create a `.env.local` file with the following variables:


GITHUB_TOKEN=your_github_token
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

Alternatively, you can set the environment variables directly in your terminal:

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Build the project:
`bash
npm run build

4. Install the CLI globally (optional):

`bash
npm install -g .

## Usage

### Web Interface

Start the development server:

bash
npm run dev


Open [http://localhost:3000](http://localhost:3000) in your browser. 

\bash
npm run dev


Open [http://localhost:3000](http://localhost:3000) in your browser.

### CLI Tool

You can use the CLI tool to analyze pull requests directly from your terminal:

\`\`\`bash
# Analyze all open PRs in a repository
pr-review analyze username/repo

# Analyze a specific PR
pr-review analyze username/repo --pr 123

# Automatically post comments to GitHub
pr-review analyze username/repo --auto-comment
\`\`\`

## How It Works

1. The tool connects to GitHub using the Octokit API to fetch open pull requests
2. For each PR, it retrieves the changed files and their content
3. The code changes are sent to Amazon Q Developer for analysis
4. The analysis results are processed and formatted
5. A summary report is generated highlighting potential issues and suggestions
6. Optionally, the report is posted as a comment on the PR

## Architecture

- **Next.js Frontend**: React-based UI for visualizing PR reviews
- **Express API**: Handles requests to analyze repositories and PRs
- **GitHub Integration**: Uses Octokit to interact with GitHub API
- **Amazon Q Integration**: Leverages AWS SDK to access Amazon Q Developer
- **CLI Tool**: Commander.js-based command-line interface

## Development

### Building the CLI

\`\`\`bash
npm run build
\`\`\`

### Running Tests

\`\`\`bash
npm test
\`\`\`

## License

MIT

#   g i t c l i - t o o l 
 
 
