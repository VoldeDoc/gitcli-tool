"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface Repository {
  id: string
  name: string
  url: string
  owner: string
  lastAnalyzed?: string
  isActive: boolean
}

interface RepositoryManagerProps {
  initialRepositories?: Repository[]
  onRepositoryChange?: (repositories: Repository[]) => void
}

export function RepositoryManager({ initialRepositories = [], onRepositoryChange }: RepositoryManagerProps) {
  const [repositories, setRepositories] = useState<Repository[]>(initialRepositories)
  const [newRepoUrl, setNewRepoUrl] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const addRepository = async () => {
    if (!newRepoUrl.trim()) return

    try {
      setIsAdding(true)

      // Extract owner and repo from URL
      const urlPattern = /github\.com\/([^/]+)\/([^/]+)/
      const match = newRepoUrl.match(urlPattern)

      if (!match) {
        toast({
          title: "Invalid repository URL",
          description: "Please enter a valid GitHub repository URL",
          variant: "destructive",
        })
        return
      }

      const [, owner, name] = match

      // Check if repository already exists
      if (repositories.some((repo) => repo.owner === owner && repo.name === name)) {
        toast({
          title: "Repository already exists",
          description: "This repository is already in your list",
          variant: "destructive",
        })
        return
      }

      const newRepo: Repository = {
        id: Date.now().toString(),
        name,
        owner,
        url: newRepoUrl,
        isActive: true,
      }

      const updatedRepositories = [...repositories, newRepo]
      setRepositories(updatedRepositories)
      setNewRepoUrl("")

      if (onRepositoryChange) {
        onRepositoryChange(updatedRepositories)
      }

      toast({
        title: "Repository added",
        description: `${owner}/${name} has been added to your repositories`,
      })
    } catch (error) {
      console.error("Error adding repository:", error)
      toast({
        title: "Failed to add repository",
        description: "An error occurred while adding the repository",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const removeRepository = (id: string) => {
    const updatedRepositories = repositories.filter((repo) => repo.id !== id)
    setRepositories(updatedRepositories)

    if (onRepositoryChange) {
      onRepositoryChange(updatedRepositories)
    }

    toast({
      title: "Repository removed",
      description: "The repository has been removed from your list",
    })
  }

  const toggleRepositoryActive = (id: string) => {
    const updatedRepositories = repositories.map((repo) =>
      repo.id === id ? { ...repo, isActive: !repo.isActive } : repo,
    )
    setRepositories(updatedRepositories)

    if (onRepositoryChange) {
      onRepositoryChange(updatedRepositories)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Repositories</CardTitle>
        <CardDescription>Add and manage GitHub repositories for PR analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://github.com/username/repo"
              value={newRepoUrl}
              onChange={(e) => setNewRepoUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addRepository} disabled={isAdding}>
              {isAdding ? "Adding..." : "Add Repository"}
            </Button>
          </div>

          <div className="space-y-2">
            {repositories.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No repositories added yet. Add your first repository above.
              </div>
            ) : (
              repositories.map((repo) => (
                <div key={repo.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex flex-col">
                    <div className="font-medium flex items-center gap-2">
                      {repo.owner}/{repo.name}
                      <Badge variant={repo.isActive ? "default" : "outline"}>
                        {repo.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {repo.lastAnalyzed && (
                      <span className="text-xs text-muted-foreground">Last analyzed: {repo.lastAnalyzed}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleRepositoryActive(repo.id)}>
                      {repo.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => removeRepository(repo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Only active repositories will be included in automated analysis runs
      </CardFooter>
    </Card>
  )
}
