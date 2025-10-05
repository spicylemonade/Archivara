"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { api } from "@/lib/api"
import { subjects } from "@/config/subjects"

interface Author {
  name: string
  email?: string
  affiliation?: string
  isAI?: boolean
  author_id?: string  // For linked accounts
}

const SUBMISSION_TIMEOUT_MS = 6 * 60 * 1000

export default function SubmitPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [authorUrlInput, setAuthorUrlInput] = useState<Record<number, string>>({})
  const [linkingAuthor, setLinkingAuthor] = useState<Record<number, boolean>>({})

  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    authors: [] as Author[],  // Will be populated with current user
    categories: [] as string[],
    ai_tools: "",
    generation_method: "",
    code_url: "",
    data_url: "",
    pdf_file: null as File | null,
    tex_file: null as File | null,
  })

  useEffect(() => {
    // Check if user is authenticated and load their info
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    } else {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      loadCurrentUser()
    }
  }, [router])

  const loadCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me")
      console.log("User data:", response.data) // Debug
      setCurrentUser(response.data)

      // Use name field from response
      const userName = response.data.full_name || response.data.name || response.data.email

      setFormData(prev => ({
        ...prev,
        authors: [{
          name: userName,
          email: response.data.email,
          affiliation: response.data.affiliation || "",
          isAI: false
        }]
      }))
    } catch (err) {
      console.error("Failed to load user:", err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleAuthorChange = (index: number, field: keyof Author, value: string | boolean) => {
    const newAuthors = [...formData.authors]
    newAuthors[index] = { ...newAuthors[index], [field]: value }
    setFormData({ ...formData, authors: newAuthors })
  }

  const addAuthor = () => {
    setFormData({
      ...formData,
      authors: [...formData.authors, { name: "", isAI: false }],
    })
  }

  const removeAuthor = (index: number) => {
    // Don't allow removing the first author (submitter)
    if (index === 0) return
    const newAuthors = formData.authors.filter((_, i) => i !== index)
    setFormData({ ...formData, authors: newAuthors })
  }

  const linkAuthorByUrl = async (index: number) => {
    const url = authorUrlInput[index]
    if (!url) return

    // Extract author ID from URL (supports /author/123, https://archivara.org/author/123, etc.)
    const match = url.match(/\/author\/([a-zA-Z0-9-]+)/)
    if (!match) {
      setError("Invalid author URL. Please paste a valid author profile URL.")
      return
    }

    const authorId = match[1]
    setLinkingAuthor(prev => ({ ...prev, [index]: true }))

    try {
      // Fetch author details
      const response = await api.get(`/authors/${authorId}`)
      const author = response.data

      // Update author with linked data
      const newAuthors = [...formData.authors]
      newAuthors[index] = {
        name: author.name,
        email: author.email,
        affiliation: author.affiliation,
        isAI: author.is_ai_model || false,
        author_id: author.id
      }
      setFormData({ ...formData, authors: newAuthors })
      setAuthorUrlInput(prev => ({ ...prev, [index]: "" }))
      setError(null)
    } catch (err: any) {
      console.error("Failed to link author:", err)
      setError(err.response?.data?.detail || "Failed to find author. Check the URL and try again.")
    } finally {
      setLinkingAuthor(prev => ({ ...prev, [index]: false }))
    }
  }

  const unlinkAuthor = (index: number) => {
    const newAuthors = [...formData.authors]
    newAuthors[index] = {
      ...newAuthors[index],
      email: undefined,
      affiliation: undefined,
      author_id: undefined
    }
    setFormData({ ...formData, authors: newAuthors })
  }

  const toggleCategory = (categoryId: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.includes(categoryId)
        ? formData.categories.filter(c => c !== categoryId)
        : [...formData.categories, categoryId],
    })
  }


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "pdf_file" | "tex_file") => {
    const file = e.target.files?.[0] || null
    setFormData({ ...formData, [field]: file })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.title.length > 0 && formData.abstract.length > 100
      case 2:
        return formData.authors.every(a => a.name.length > 0) && formData.authors.length > 0
      case 3:
        return formData.categories.length > 0
      case 4:
        return formData.ai_tools.trim().length > 0 && formData.generation_method.length > 0
      case 5:
        return formData.pdf_file !== null
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const submitData = new FormData()
      submitData.append("title", formData.title)
      submitData.append("abstract", formData.abstract)
      submitData.append("authors", JSON.stringify(formData.authors))
      submitData.append("categories", JSON.stringify(formData.categories))
      // Convert comma-separated string to array
      const aiToolsArray = formData.ai_tools.split(',').map(t => t.trim()).filter(t => t.length > 0)
      submitData.append("ai_tools", JSON.stringify(aiToolsArray))
      submitData.append("generation_method", formData.generation_method)
      if (formData.code_url) submitData.append("code_url", formData.code_url)
      if (formData.data_url) submitData.append("data_url", formData.data_url)
      if (formData.pdf_file) submitData.append("pdf_file", formData.pdf_file)
      if (formData.tex_file) submitData.append("tex_file", formData.tex_file)

      const response = await api.post("/papers/submit", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: SUBMISSION_TIMEOUT_MS,
      })

      // Redirect to success page or paper page
      router.push(`/paper/${response.data.id}`)
    } catch (err: any) {
      console.error('Submission error:', err)

      // Handle rejection with detailed reasons
      if (err.response?.status === 422 && err.response?.data?.detail) {
        const detail = err.response.data.detail
        if (typeof detail === 'object' && detail.reasons) {
          setError(`Submission rejected:\n${detail.reasons.join('\n')}${detail.quality_score ? `\n\nQuality score: ${detail.quality_score}/100` : ''}`)
        } else {
          setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
        }
      } else if (err.response?.status === 429) {
        // Handle cooldown error
        setError(err.response?.data?.detail || "Too many submissions. Please wait before trying again.")
      } else {
        setError(err.response?.data?.detail || "Failed to submit paper")
      }

      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: "Basic Information", description: "Title and abstract" },
    { number: 2, title: "Authors", description: "Add authors and affiliations" },
    { number: 3, title: "Categories", description: "Select relevant categories" },
    { number: 4, title: "AI Details", description: "AI tools and generation method" },
    { number: 5, title: "Files", description: "Upload paper files" },
  ]

  return (
    <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex-1 ${step.number < steps.length ? "relative" : ""}`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Icons.checkCircle className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  {step.number < steps.length && (
                    <div
                      className={`absolute left-10 right-0 top-5 h-[2px] -z-10 ${
                        currentStep > step.number ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-3 text-sm text-red-800 dark:text-red-200 mb-6">
                {error}
              </div>
            )}

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Paper Title *
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter your paper title"
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="abstract" className="block text-sm font-medium mb-2">
                    Abstract * (minimum 100 characters)
                  </label>
                  <textarea
                    id="abstract"
                    name="abstract"
                    value={formData.abstract}
                    onChange={handleInputChange}
                    placeholder="Enter your paper abstract..."
                    className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.abstract.length} characters
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Authors */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  You are automatically listed as the first author. Add co-authors manually, and optionally link their Archivara account.
                </p>
                <div className="space-y-4">
                  {formData.authors.map((author, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {index === 0 ? "You (First Author)" : `Co-author ${index}`}
                          </h4>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAuthor(index)}
                            >
                              <Icons.x className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {index === 0 ? (
                          /* First author - display only (current user) */
                          <div className="bg-muted/30 rounded-md p-3 space-y-2">
                            <p className="text-sm"><span className="font-medium">Name:</span> {author.name}</p>
                            <p className="text-sm"><span className="font-medium">Email:</span> {author.email}</p>
                            {author.affiliation && (
                              <p className="text-sm"><span className="font-medium">Affiliation:</span> {author.affiliation}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Your information is pulled from your account
                            </p>
                          </div>
                        ) : (
                          /* Co-authors - manual entry with optional link */
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">Name *</label>
                              <Input
                                value={author.name}
                                onChange={(e) => handleAuthorChange(index, "name", e.target.value)}
                                placeholder="Author's full name"
                              />
                            </div>

                            {author.author_id ? (
                              /* Show linked account info */
                              <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                                    <Icons.checkCircle className="h-4 w-4 mr-2" />
                                    <span className="font-medium">Linked to Archivara account</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => unlinkAuthor(index)}
                                    className="text-xs"
                                  >
                                    Unlink
                                  </Button>
                                </div>
                                {author.email && (
                                  <p className="text-xs text-muted-foreground">{author.email}</p>
                                )}
                                {author.affiliation && (
                                  <p className="text-xs text-muted-foreground">{author.affiliation}</p>
                                )}
                              </div>
                            ) : (
                              /* Show URL input to link account */
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                  Link Archivara Account (Optional)
                                </label>
                                <div className="flex gap-2">
                                  <Input
                                    value={authorUrlInput[index] || ""}
                                    onChange={(e) => setAuthorUrlInput(prev => ({ ...prev, [index]: e.target.value }))}
                                    placeholder="Paste author profile URL (e.g., /author/abc123)"
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => linkAuthorByUrl(index)}
                                    disabled={!authorUrlInput[index] || linkingAuthor[index]}
                                  >
                                    {linkingAuthor[index] ? (
                                      <>
                                        <Icons.loader className="mr-2 h-3 w-3 animate-spin" />
                                        Linking...
                                      </>
                                    ) : (
                                      <>
                                        <Icons.link className="mr-2 h-3 w-3" />
                                        Link
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Paste their author profile URL to link their account
                                </p>
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`ai-author-${index}`}
                                checked={author.isAI || false}
                                onChange={(e) => handleAuthorChange(index, "isAI", e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <label htmlFor={`ai-author-${index}`} className="text-sm">
                                This is an AI model/agent
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addAuthor}>
                  <Icons.plus className="mr-2 h-4 w-4" />
                  Add Co-author
                </Button>
              </div>
            )}

                        {/* Step 3: Categories */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Select all categories that apply to your paper
                </p>
                <div className="max-h-[500px] overflow-y-auto pr-2 space-y-6">
                  {Object.values(subjects).map((subject) => (
                    <div key={subject.name} className="space-y-3">
                      <h4 className="font-semibold text-base border-b pb-2">{subject.name}</h4>
                      {Object.values(subject.categories).map((category) => (
                        <div key={category.name} className="ml-2 space-y-2">
                          {category.subcategories.length > 0 ? (
                            <>
                              <h5 className="font-medium text-sm text-muted-foreground">{category.name}</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-3">
                                {category.subcategories.map((subcat) => (
                                  <label
                                    key={subcat}
                                    className="flex items-start space-x-2 cursor-pointer text-sm hover:bg-accent/50 p-1.5 rounded group"
                                  >
                                    <div className="relative mt-0.5 flex-shrink-0">
                                      <input
                                        type="checkbox"
                                        checked={formData.categories.includes(subcat)}
                                        onChange={() => toggleCategory(subcat)}
                                        className="sr-only peer"
                                      />
                                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 peer-checked:bg-accent peer-checked:border-accent transition-colors" />
                                    </div>
                                    <span className="leading-tight">{subcat}</span>
                                  </label>
                                ))}
                              </div>
                            </>
                          ) : (
                            <label
                              className="flex items-start space-x-2 cursor-pointer text-sm hover:bg-accent/50 p-1.5 rounded group"
                            >
                              <div className="relative mt-0.5 flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={formData.categories.includes(category.name)}
                                  onChange={() => toggleCategory(category.name)}
                                  className="sr-only peer"
                                />
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 peer-checked:bg-accent peer-checked:border-accent transition-colors" />
                              </div>
                              <span className="leading-tight font-medium">{category.name}</span>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {formData.categories.length > 0 && (
                  <div className="mt-4 p-3 bg-accent/20 rounded-md">
                    <p className="text-sm font-medium mb-2">Selected categories ({formData.categories.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.categories.map((cat) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: AI Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="ai_tools" className="block text-sm font-medium mb-2">
                    AI Tools Used * (comma-separated)
                  </label>
                  <Input
                    id="ai_tools"
                    name="ai_tools"
                    value={formData.ai_tools}
                    onChange={handleInputChange}
                    placeholder="e.g., GPT-4, Claude-3, DALL-E, Midjourney"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the AI tools and models used, separated by commas
                  </p>
                </div>
                <div>
                  <label htmlFor="generation_method" className="block text-sm font-medium mb-2">
                    Generation Method *
                  </label>
                  <textarea
                    id="generation_method"
                    name="generation_method"
                    value={formData.generation_method}
                    onChange={handleInputChange}
                    placeholder="Describe how the paper was generated (e.g., prompts used, collaboration between models, human involvement)..."
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="code_url" className="block text-sm font-medium mb-2">
                      Code Repository URL
                    </label>
                    <Input
                      id="code_url"
                      name="code_url"
                      value={formData.code_url}
                      onChange={handleInputChange}
                      placeholder="https://github.com/..."
                      type="url"
                    />
                  </div>
                  <div>
                    <label htmlFor="data_url" className="block text-sm font-medium mb-2">
                      Dataset URL
                    </label>
                    <Input
                      id="data_url"
                      name="data_url"
                      value={formData.data_url}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      type="url"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Files */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="pdf_file" className="block text-sm font-medium mb-2">
                    PDF File * (required)
                  </label>
                  <input
                    id="pdf_file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, "pdf_file")}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {formData.pdf_file && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {formData.pdf_file.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="tex_file" className="block text-sm font-medium mb-2">
                    TeX Source (optional)
                  </label>
                  <input
                    id="tex_file"
                    type="file"
                    accept=".tex,.zip"
                    onChange={(e) => handleFileChange(e, "tex_file")}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {formData.tex_file && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {formData.tex_file.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          {/* Navigation */}
          <CardContent className="pt-0">
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
              >
                <Icons.arrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!validateStep(currentStep)}
                >
                  Next
                  <Icons.arrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="premium"
                  onClick={handleSubmit}
                  disabled={!validateStep(currentStep) || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Paper"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 