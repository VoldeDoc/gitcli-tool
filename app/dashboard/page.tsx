"use client"

import { useState, useEffect } from "react"
import { MetricsDashboard } from "@/components/metrics-dashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Repository {
  id: string
  name: string
  owner: string
  isActive: boolean
}

export default function DashboardPage() {
  const [repositories, setRepositories] = useState<Repository[]>([])

  useEffect(() => {
    const storedRepos = localStorage.getItem("pr-review-repositories")
    if (storedRepos) {
      try {
        const allRepos = JSON.parse(storedRepos)
        // Only show active repositories
        const activeRepos = allRepos.filter((repo: Repository) => repo.isActive)
        setRepositories(activeRepos)
      } catch (error) {
        console.error("Error parsing stored repositories:", error)
      }
    }
  }, [])

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {repositories.length > 0 ? (
        <MetricsDashboard repositories={repositories} />
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-2">No Active Repositories</h2>
          <p className="text-muted-foreground mb-6">You need to add and activate repositories to view the dashboard.</p>
          <Button asChild>
            <Link href="/repositories">Manage Repositories</Link>
          </Button>
        </div>
      )}
    </main>
  )
}
