"use client"

import { useState, useEffect } from "react"
import { RepositoryManager } from "@/components/repository-manager"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Repository {
  id: string
  name: string
  url: string
  owner: string
  lastAnalyzed?: string
  isActive: boolean
}

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([])

  useEffect(() => {
   
    const storedRepos = localStorage.getItem("pr-review-repositories")
    if (storedRepos) {
      try {
        setRepositories(JSON.parse(storedRepos))
      } catch (error) {
        console.error("Error parsing stored repositories:", error)
      }
    }
  }, [])

  const handleRepositoryChange = (updatedRepositories: Repository[]) => {
    setRepositories(updatedRepositories)
   
    localStorage.setItem("pr-review-repositories", JSON.stringify(updatedRepositories))
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Repository Management</h1>
      </div>

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manage">Manage Repositories</TabsTrigger>
          <TabsTrigger value="settings">Analysis Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <RepositoryManager initialRepositories={repositories} onRepositoryChange={handleRepositoryChange} />
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Analysis Schedule</h2>
              <p className="text-muted-foreground">Configure how often your repositories should be analyzed</p>

              <div className="p-6 border rounded-lg">
                <p className="text-center text-muted-foreground">Analysis scheduling settings would go here</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Notification Settings</h2>
              <p className="text-muted-foreground">Configure how you want to be notified about analysis results</p>

              <div className="p-6 border rounded-lg">
                <p className="text-center text-muted-foreground">Notification settings would go here</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}
