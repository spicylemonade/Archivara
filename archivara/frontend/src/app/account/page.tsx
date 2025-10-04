"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { PaperCard } from "@/components/paper-card"
import { api } from "@/lib/api"
import { isVerifiedEmailDomain, getVerificationLabel } from "@/lib/verification"

interface User {
  id: string
  email: string
  full_name: string
  affiliation?: string
  created_at: string
  is_verified: boolean
}

interface Paper {
  id: string
  title: string
  authors: any[]
  abstract: string
  published_at: string
  categories?: string[]
  generation_method?: string
  status: "draft" | "submitted" | "published" | "rejected"
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [papers, setPapers] = useState<Paper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"profile" | "submissions">("profile")

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        console.log("No token found, redirecting to login")
        router.push("/login")
        return
      }

      try {
        // Set the authorization header
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`
        
        // First verify the token is valid
        const userResponse = await api.get("/auth/me")
        if (!userResponse.data) {
          throw new Error("Invalid user response")
        }
        setUser(userResponse.data)
        
        // Then fetch user's papers
        try {
          const papersResponse = await api.get("/papers/my-submissions")
          setPapers(papersResponse.data || [])
        } catch (papersError) {
          console.warn("Failed to fetch papers:", papersError)
          setPapers([]) // Set empty array if papers fetch fails
        }
      } catch (error: any) {
        console.error("Failed to fetch user data:", error)
        
        // If unauthorized or token invalid, clear storage and redirect
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        delete api.defaults.headers.common["Authorization"]
        
        // Small delay to ensure cleanup is complete
        setTimeout(() => {
          router.push("/login")
        }, 100)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    delete api.defaults.headers.common["Authorization"]
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
        <div className="flex justify-center items-center min-h-[400px]">
          <Icons.loader className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className="text-muted-foreground mt-2">
              Manage your profile and submissions
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="premium" asChild>
              <Link href="/submit">
                <Icons.plus className="mr-2 h-4 w-4" />
                Submit Paper
              </Link>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <Icons.logOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === "submissions"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Submissions ({papers.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-6">
          {activeTab === "profile" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                    <p className="text-lg">{user.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-lg">{user.email}</p>
                  </div>
                  {user.affiliation && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Affiliation</p>
                      <p className="text-lg">{user.affiliation}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                    {isVerifiedEmailDomain(user.email) ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="flex items-center gap-1">
                          <Icons.checkCircle className="h-3 w-3" />
                          {getVerificationLabel(user.email)}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="secondary">Unverified Email Domain</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                    <p className="text-lg">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                  <CardDescription>Your research impact</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{papers.length}</p>
                      <p className="text-sm text-muted-foreground">Papers Submitted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {papers.filter(p => p.status === "published").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Published</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "submissions" && (
            <div className="space-y-6">
              {papers.length === 0 ? (
                <Card className="p-12 text-center">
                  <Icons.paper className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start by submitting your first AI-generated research paper
                  </p>
                  <Button variant="premium" asChild>
                    <Link href="/submit">Submit your first paper</Link>
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {papers.map((paper) => (
                    <div key={paper.id} className="relative">
                      <Badge 
                        className="absolute top-4 right-4 z-10"
                        variant={
                          paper.status === "published" ? "default" :
                          paper.status === "submitted" ? "secondary" :
                          paper.status === "rejected" ? "destructive" : "outline"
                        }
                      >
                        {paper.status}
                      </Badge>
                      <PaperCard paper={paper} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 