"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Github, CheckCircle, BarChart3, Database, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ReviewSummary } from "@/components/review-summary"
import Link from "next/link"

export default function Home() {
  const [repositoryCount, setRepositoryCount] = useState(0)
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    // Check if there are any repositories configured
    const storedRepos = localStorage.getItem("pr-review-repositories")
    if (storedRepos) {
      try {
        const repos = JSON.parse(storedRepos)
        setRepositoryCount(repos.length)
      } catch (error) {
        console.error("Error parsing stored repositories:", error)
      }
    }
  }, [])

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex flex-col items-center justify-center mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Github className="h-8 w-8" />
          <h1 className="text-3xl font-bold">PR Review Helper</h1>
        </div>
        <p className="text-muted-foreground text-center max-w-2xl">
          Automated pull request reviews powered by Amazon Q Developer. Get insights, suggestions, and code quality
          analysis for your GitHub repositories.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Repository Management
            </CardTitle>
            <CardDescription>Manage your repositories</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-theme(spacing.16))]">
            <p className="text-sm text-muted-foreground mb-4">
              {repositoryCount > 0
                ? `You have ${repositoryCount} repositories configured.`
                : "Add repositories to track them over time."}
            </p>
            <div className="flex-1"></div>
            <Button asChild className="w-full">
              <Link href="/repositories">Manage Repositories</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Metrics Dashboard
            </CardTitle>
            <CardDescription>View code quality metrics</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-theme(spacing.16))]">
            <p className="text-sm text-muted-foreground mb-4">
              Track code quality metrics over time and identify trends.
            </p>
            <div className="flex-1"></div>
            <Button asChild className="w-full">
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {reviews && reviews.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Pull Request Reviews</h2>

          <Tabs defaultValue="summary">
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
              <TabsTrigger value="comments">GitHub Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              {reviews.map((review, index) => (
                <ReviewSummary key={index} review={review} />
              ))}
            </TabsContent>

            <TabsContent value="details">
              {reviews.map((review, index) => (
                <Card key={index} className="mb-6">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        <a href={review.prUrl} className="hover:underline flex items-center gap-2">
                          <FileCode className="h-5 w-5" />
                          {review.title || `Pull Request #${review.prNumber}`}
                        </a>
                      </CardTitle>
                      <Badge
                        variant={
                          !review.riskLevel ? "outline" :
                          review.riskLevel.toLowerCase() === "high"
                            ? "destructive"
                            : review.riskLevel.toLowerCase() === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {review.riskLevel || "Unknown"} Risk
                      </Badge>
                    </div>
                    <CardDescription>
                      PR #{review.prNumber} {review.author && `by ${review.author}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Complex Functions</h4>
                        {review.complexFunctions && review.complexFunctions.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {review.complexFunctions.map((func: string, i: number) => (
                              <li key={i} className="text-sm">
                                {func}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No complex functions detected.</p>
                        )}
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Refactoring Suggestions</h4>
                        {review.refactoringSuggestions && review.refactoringSuggestions.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                            {review.refactoringSuggestions.map((suggestion: string, i: number) => (
                              <li key={i} className="text-sm">
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No refactoring suggestions.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>GitHub Comments</CardTitle>
                  <CardDescription>Comments posted to GitHub pull requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Posted to PR #{review.prNumber}</span>
                        </div>
                        <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                          {review.commentPosted}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </main>
  )
}
