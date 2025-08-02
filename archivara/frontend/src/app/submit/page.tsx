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
  affiliation?: string
  isAI?: boolean
}

export default function SubmitPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    abstract: "",
    authors: [{ name: "", affiliation: "", isAI: false }] as Author[],
    categories: [] as string[],
    ai_tools: [] as string[],
    generation_method: "",
    code_url: "",
    data_url: "",
    pdf_file: null as File | null,
    tex_file: null as File | null,
  })

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    } else {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }
  }, [router])

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
      authors: [...formData.authors, { name: "", affiliation: "", isAI: false }],
    })
  }

  const removeAuthor = (index: number) => {
    const newAuthors = formData.authors.filter((_, i) => i !== index)
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

  const toggleAITool = (tool: string) => {
    setFormData({
      ...formData,
      ai_tools: formData.ai_tools.includes(tool)
        ? formData.ai_tools.filter(t => t !== tool)
        : [...formData.ai_tools, tool],
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
        return formData.ai_tools.length > 0 && formData.generation_method.length > 0
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
      submitData.append("ai_tools", JSON.stringify(formData.ai_tools))
      submitData.append("generation_method", formData.generation_method)
      if (formData.code_url) submitData.append("code_url", formData.code_url)
      if (formData.data_url) submitData.append("data_url", formData.data_url)
      if (formData.pdf_file) submitData.append("pdf_file", formData.pdf_file)
      if (formData.tex_file) submitData.append("tex_file", formData.tex_file)

      const response = await api.post("/papers/submit", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      // Redirect to success page or paper page
      router.push(`/paper/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit paper")
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

  const commonAITools = ["GPT-4", "Claude-3", "Gemini", "LLaMA", "DALL-E", "Midjourney", "SciBERT", "Other"]

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
                <div className="space-y-4">
                  {formData.authors.map((author, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Author {index + 1}</h4>
                          {formData.authors.length > 1 && (
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
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-medium">Name *</label>
                            <Input
                              value={author.name}
                              onChange={(e) => handleAuthorChange(index, "name", e.target.value)}
                              placeholder="Author name"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Affiliation</label>
                            <Input
                              value={author.affiliation || ""}
                              onChange={(e) => handleAuthorChange(index, "affiliation", e.target.value)}
                              placeholder="Institution or organization"
                            />
                          </div>
                        </div>
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
                    </Card>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addAuthor}>
                  <Icons.plus className="mr-2 h-4 w-4" />
                  Add Author
                </Button>
              </div>
            )}

                        {/* Step 3: Categories */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Select all categories that apply to your paper
                </p>
                {Object.values(subjects).map((subject) => (
                  <div key={subject.name} className="space-y-4">
                    <h4 className="font-medium text-lg">{subject.name}</h4>
                    {Object.values(subject.categories).map((category) => (
                      <div key={category.name} className="ml-4 space-y-2">
                        <h5 className="font-medium text-sm text-muted-foreground">{category.name}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                          {category.subcategories.map((subcat) => (
                            <label
                              key={subcat}
                              className="flex items-center space-x-2 cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={formData.categories.includes(subcat)}
                                onChange={() => toggleCategory(subcat)}
                                className="rounded border-gray-300"
                              />
                              <span>{subcat}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: AI Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">
                    AI Tools Used *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {commonAITools.map((tool) => (
                      <label
                        key={tool}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.ai_tools.includes(tool)}
                          onChange={() => toggleAITool(tool)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{tool}</span>
                      </label>
                    ))}
                  </div>
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