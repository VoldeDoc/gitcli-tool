#!/usr/bin/env node
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"
import inquirer from "inquirer"
import { fetchPullRequests, postCommentToPR } from "@/lib/github"
import { analyzeCode } from "@/lib/amazon-q"
const program = new Command()

program.name("pr-review").description("Automated PR Review Helper using Amazon Q Developer").version("1.0.0")

/**
 * Parse repository input to extract owner and repo name
 * Supports formats: 
 * - owner/repo
 * - https://github.com/owner/repo
 * - github.com/owner/repo
 */
function parseRepoInput(input: string): { owner: string, repo: string } | null {
  // Handle github URLs
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/i
  const urlMatch = input.match(urlPattern)
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2]
    }
  }
  
  // Handle owner/repo format
  const parts = input.split('/')
  if (parts.length === 2) {
    return {
      owner: parts[0],
      repo: parts[1]
    }
  }
  
  return null
}

program
  .command("analyze")
  .description("Analyze open pull requests in a repository")
  .argument("<repo>", "GitHub repository (owner/repo or GitHub URL)")
  .option("-p, --pr <number>", "Specific PR number to analyze")
  .option("-a, --auto-comment", "Automatically post comments to GitHub")
  .option("-t, --token <token>", "GitHub personal access token (overrides GITHUB_TOKEN env variable)")
  .action(async (repoInput, options) => {
    if (options.token) {
      process.env.GITHUB_TOKEN = options.token;
    }
    
    const spinner = ora("Initializing PR review").start()

    try {
      // Parse repository input
      const repoInfo = parseRepoInput(repoInput)
      
      if (!repoInfo) {
        spinner.fail("Invalid repository format. Use 'owner/repo' or a GitHub URL")
        return
      }
      
      const { owner, repo: repoName } = repoInfo

      // Fetch PRs
      spinner.text = "Fetching pull requests"
      let pullRequests

      if (options.pr) {
        // Fetch specific PR
        pullRequests = [{ number: Number.parseInt(options.pr) }]
        spinner.text = `Analyzing PR #${options.pr}`
      } else {
        // Fetch all open PRs
        pullRequests = await fetchPullRequests(owner, repoName)
        spinner.text = `Found ${pullRequests.length} open pull requests`
        spinner.succeed()

        // If multiple PRs, ask which ones to analyze
        if (pullRequests.length > 1 && !options.all) {
          const { selectedPRs } = await inquirer.prompt([
            {
              type: "checkbox",
              name: "selectedPRs",
              message: "Select PRs to analyze:",
              choices: pullRequests.map((pr) => ({
                name: `#${pr.number} - ${pr.title}`,
                value: pr.number,
              })),
            },
          ])

          if (selectedPRs.length === 0) {
            console.log(chalk.yellow("No PRs selected. Exiting."))
            return
          }

          pullRequests = pullRequests.filter((pr) => selectedPRs.includes(pr.number))
        }
      }

      // Analyze each PR
      for (const pr of pullRequests) {
        spinner.start(`Analyzing PR #${pr.number}`)
        const analysis = await analyzeCode(owner, repoName, pr.number)
        spinner.succeed(`Analysis complete for PR #${pr.number}`)

        // Display results
        console.log("\n" + chalk.bold("Analysis Results:"))
        console.log(chalk.cyan("Summary:"), analysis.summary)

        if (analysis.riskyFiles?.length > 0) {
          console.log("\n" + chalk.yellow("Risky Files:"))
          analysis.riskyFiles.forEach((file: string) => {
            console.log(`- ${file}`)
          })
        }

        if (analysis.complexFunctions?.length > 0) {
          console.log("\n" + chalk.yellow("Complex Functions:"))
          analysis.complexFunctions.forEach((func: string) => {
            console.log(`- ${func}`)
          })
        }

        if (analysis.refactoringSuggestions?.length > 0) {
          console.log("\n" + chalk.green("Refactoring Suggestions:"))
          analysis.refactoringSuggestions.forEach((suggestion: string) => {
            console.log(`- ${suggestion}`)
          })
        }

        // Post comment if auto-comment is enabled
        if (options.autoComment) {
          spinner.start("Posting comment to GitHub")
          const comment = generateComment(analysis)
          await postCommentToPR(owner, repoName, pr.number, comment)
          spinner.succeed("Comment posted to GitHub")
        } else {
          // Ask if user wants to post comment
          const { shouldPost } = await inquirer.prompt([
            {
              type: "confirm",
              name: "shouldPost",
              message: "Post this analysis as a comment on the PR?",
              default: false,
            },
          ])

          if (shouldPost) {
            spinner.start("Posting comment to GitHub")
            const comment = generateComment(analysis)
            await postCommentToPR(owner, repoName, pr.number, comment)
            spinner.succeed("Comment posted to GitHub")
          }
        }

        console.log("\n" + chalk.bold("---"))
      }

      console.log(chalk.green("\nPR review completed successfully!"))
    } catch (error) {
      spinner.fail("Error during PR review")
      console.error(chalk.red("Error:"), error)
    }
  })

// Handle undefined commands with helpful message
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`))
  console.log(chalk.bold("\nCorrect usage:"))
  console.log(`${chalk.yellow('npm run cli -- analyze')} ${chalk.green('<owner/repo>')}`)
  console.log(`\nExamples:`)
  console.log(`${chalk.gray('# Analyze all PRs in a repository:')}`)
  console.log(`npm run cli -- analyze facebook/react`)
  console.log(`\n${chalk.gray('# Analyze a specific PR:')}`)
  console.log(`npm run cli -- analyze facebook/react -p 12345`)
  console.log(`\n${chalk.gray('# You can also use a GitHub URL:')}`)
  console.log(`npm run cli -- analyze https://github.com/facebook/react`)
  console.log(`\nSee more options with: npm run cli -- analyze --help`)
  process.exit(1)
})

program.parse()

//  * Generate a formatted comment for GitHub
 
function generateComment(analysis: any) {
  const { summary, complexFunctions, refactoringSuggestions, securityIssues } = analysis

  let comment = `## Automated Code Review\n\n${summary}\n\n`

  if (complexFunctions?.length > 0) {
    comment += "### Complex Functions\n"
    complexFunctions.forEach((func: string) => {
      comment += `- ${func}\n`
    })
    comment += "\n"
  }

  if (refactoringSuggestions?.length > 0) {
    comment += "### Refactoring Suggestions\n"
    refactoringSuggestions.forEach((suggestion: string) => {
      comment += `- ${suggestion}\n`
    })
    comment += "\n"
  }

  if (securityIssues?.length > 0) {
    comment += "### Security Concerns\n"
    securityIssues.forEach((issue: string) => {
      comment += `- ⚠️ ${issue}\n`
    })
    comment += "\n"
  }

  comment += "_This review was automatically generated by PR Review Helper._"

  return comment
}
