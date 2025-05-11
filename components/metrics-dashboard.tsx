"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QualityScoreChart } from "./charts/quality-score-chart"
import { ComplexityChart } from "./charts/complexity-chart"
import { IssuesChart } from "./charts/issues-chart"
import { RepositorySummary } from "./repository-summary"

interface Repository {
  id: string
  name: string
  owner: string
}

interface MetricsDashboardProps {
  repositories: Repository[]
}

export function MetricsDashboard({ repositories }: MetricsDashboardProps) {
  const [selectedRepo, setSelectedRepo] = useState<string>(repositories[0]?.id || "")
  const [timeRange, setTimeRange] = useState<string>("30")

  const currentRepo = repositories.find((repo) => repo.id === selectedRepo)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-3xl font-bold">Code Quality Dashboard</h2>

        <div className="flex gap-2">
          <Select value={selectedRepo} onValueChange={setSelectedRepo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent>
              {repositories.map((repo) => (
                <SelectItem key={repo.id} value={repo.id}>
                  {repo.owner}/{repo.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentRepo ? (
        <>
          <RepositorySummary repository={currentRepo} />

          <Tabs defaultValue="quality" className="space-y-4">
            <TabsList>
              <TabsTrigger value="quality">Quality Score</TabsTrigger>
              <TabsTrigger value="complexity">Complexity</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
            </TabsList>

            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Score Trend</CardTitle>
                  <CardDescription>Overall code quality score over time (higher is better)</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <QualityScoreChart repositoryId={selectedRepo} days={Number.parseInt(timeRange)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="complexity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Code Complexity</CardTitle>
                  <CardDescription>Average complexity score of functions over time (lower is better)</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ComplexityChart repositoryId={selectedRepo} days={Number.parseInt(timeRange)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Issues by Category</CardTitle>
                  <CardDescription>Number of issues detected by category</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <IssuesChart repositoryId={selectedRepo} days={Number.parseInt(timeRange)} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <p>No repositories available. Add a repository to view metrics.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
