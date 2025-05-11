import { AlertCircle, FileCode } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ReviewSummaryProps {
  review: {
    title: string
    prNumber: number
    prUrl: string
    author: string
    riskLevel: string
    codeQualityScore: number
    riskyFiles: string[]
    summary: string
  }
}

export function ReviewSummary({ review }: ReviewSummaryProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            <a href={review.prUrl} className="hover:underline flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              {review.title}
            </a>
          </CardTitle>
          <Badge
            variant={
              review.riskLevel === "High" ? "destructive" : review.riskLevel === "Medium" ? "warning" : "success"
            }
          >
            {review.riskLevel} Risk
          </Badge>
        </div>
        <CardDescription>
          PR #{review.prNumber} by {review.author}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Code Quality Score</span>
              <span className="text-sm font-medium">{review.codeQualityScore}/100</span>
            </div>
            <Progress value={review.codeQualityScore} className="h-2" />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Summary</h4>
            <p className="text-sm text-muted-foreground">{review.summary}</p>
          </div>

          {review.riskyFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Risky Files
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                {review.riskyFiles.map((file, i) => (
                  <li key={i} className="text-sm">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
