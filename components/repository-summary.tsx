import { Card, CardContent } from "@/components/ui/card"
import { CircleCheck, CircleAlert, GitPullRequest, Clock } from "lucide-react"

interface Repository {
  id: string
  name: string
  owner: string
}

interface RepositorySummaryProps {
  repository: Repository
}

export function RepositorySummary({ repository }: RepositorySummaryProps) {
 
  const stats = {
    totalPRs: 124,
    analyzedPRs: 98,
    avgQualityScore: 78,
    issuesDetected: 43,
    lastAnalyzed: "2 hours ago",
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <GitPullRequest className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium leading-none">Pull Requests</p>
              <p className="text-2xl font-bold">
                {stats.analyzedPRs}/{stats.totalPRs}
              </p>
              <p className="text-xs text-muted-foreground">Analyzed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <CircleCheck className="h-10 w-10 text-green-500" />
            <div>
              <p className="text-sm font-medium leading-none">Quality Score</p>
              <p className="text-2xl font-bold">{stats.avgQualityScore}/100</p>
              <p className="text-xs text-muted-foreground">Average</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <CircleAlert className="h-10 w-10 text-amber-500" />
            <div>
              <p className="text-sm font-medium leading-none">Issues Detected</p>
              <p className="text-2xl font-bold">{stats.issuesDetected}</p>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Clock className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium leading-none">Last Analyzed</p>
              <p className="text-2xl font-bold">{stats.lastAnalyzed}</p>
              <p className="text-xs text-muted-foreground">
                {repository.owner}/{repository.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
