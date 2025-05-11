"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"

interface QualityScoreChartProps {
  repositoryId: string
  days: number
}

export function QualityScoreChart({ repositoryId, days }: QualityScoreChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
     
        const mockData = generateMockData(days, repositoryId)
        setData(mockData)
      } catch (error) {
        console.error("Error fetching quality score data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [repositoryId, days])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available for the selected time range</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          stroke="#888888"
          fontSize={12}
        />
        <YAxis domain={[0, 100]} stroke="#888888" fontSize={12} tickFormatter={(value) => `${value}`} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <Card className="p-2 border shadow-sm bg-background">
                  <div className="text-xs">
                    <p className="font-medium">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
                    <p>Score: {payload[0].value}</p>
                  </div>
                </Card>
              )
            }
            return null
          }}
        />
        <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 1 }} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function generateMockData(days: number, repositoryId: string) {
  const data = []
  const today = new Date()

  const repoSeed = repositoryId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

  let score = 70 + (repoSeed % 15)

  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const variation = Math.sin(i * 0.3) * 5 + (Math.random() * 6 - 3)
    score = Math.max(0, Math.min(100, score + variation))

    data.push({
      date: date.toISOString(),
      score: Math.round(score),
    })
  }

  return data
}
