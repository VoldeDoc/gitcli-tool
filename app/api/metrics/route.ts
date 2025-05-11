import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const repositoryId = searchParams.get("repositoryId")
    const metricType = searchParams.get("type")
    const days = Number.parseInt(searchParams.get("days") || "30")

    if (!repositoryId) {
      return NextResponse.json({ error: "Repository ID is required" }, { status: 400 })
    }

    if (!metricType) {
      return NextResponse.json({ error: "Metric type is required" }, { status: 400 })
    }

    let data

    switch (metricType) {
      case "quality":
        data = generateQualityScoreData(repositoryId, days)
        break
      case "complexity":
        data = generateComplexityData(repositoryId, days)
        break
      case "issues":
        data = generateIssuesData(repositoryId)
        break
      default:
        return NextResponse.json({ error: "Invalid metric type" }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}

// Helper functions to generate mock data
function generateQualityScoreData(repositoryId: string, days: number) {
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

function generateComplexityData(repositoryId: string, days: number) {
  const data = []
  const today = new Date()

  const repoSeed = repositoryId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

  let complexity = 40 + (repoSeed % 10)

  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const variation = Math.sin(i * 0.2) * 4 + (Math.random() * 5 - 2.5)
    complexity = Math.max(0, Math.min(100, complexity + variation))

    data.push({
      date: date.toISOString(),
      complexity: Math.round(complexity),
    })
  }

  return data
}

function generateIssuesData(repositoryId: string) {
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
