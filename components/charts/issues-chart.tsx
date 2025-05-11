"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"

interface IssuesChartProps {
  repositoryId: string
  days: number
}

export function IssuesChart({ repositoryId, days }: IssuesChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
     
        const mockData = generateMockData(repositoryId)
        setData(mockData)
      } catch (error) {
        console.error("Error fetching issues data:", error)
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
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} />
        <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `${value}`} />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <Card className="p-2 border shadow-sm bg-background">
                  <div className="text-xs">
                    <p className="font-medium">{payload[0].payload.name}</p>
                    <p>Count: {payload[0].value}</p>
                  </div>
                </Card>
              )
            }
            return null
          }}
        />
        <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function generateMockData(repositoryId: string) {
  const repoSeed = repositoryId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

  return [
    {
      name: "Security",
      count: Math.floor(Math.random() * 10) + (repoSeed % 5),
    },
    {
      name: "Performance",
      count: Math.floor(Math.random() * 15) + (repoSeed % 7),
    },
    {
      name: "Complexity",
      count: Math.floor(Math.random() * 20) + (repoSeed % 10),
    },
    {
      name: "Code Style",
      count: Math.floor(Math.random() * 25) + (repoSeed % 12),
    },
    {
      name: "Documentation",
      count: Math.floor(Math.random() * 18) + (repoSeed % 8),
    },
  ]
}
