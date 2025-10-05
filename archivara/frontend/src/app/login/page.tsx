"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useSearchParams } from "next/navigation"
import { api, API_BASE_URL } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Registration successful! Please sign in.")
    }
    if (searchParams.get("error") === "oauth_failed") {
      setError("Google sign-in failed. Please try again.")
    }

    // Handle OAuth redirect with token
    const token = searchParams.get("token")
    const email = searchParams.get("email")
    const name = searchParams.get("name")
    if (token && email) {
      login(token, { email, full_name: name || email })
      router.push("/account")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true)
    setError(null)
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/google/login`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const form = new FormData()
      form.append("username", formData.email)
      form.append("password", formData.password)

      const response = await api.post("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      const { access_token, user } = response.data

      if (!access_token || !user) {
        throw new Error("Invalid response from server")
      }

      // Verify the token works by making a test request
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
      await api.get("/auth/me")

      // Use auth context to manage login state
      login(access_token, user)

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/account")
      }, 100)
    } catch (err: any) {
      console.error("Login error:", err)

      // Clear any invalid tokens
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      delete api.defaults.headers.common["Authorization"]

      if (Array.isArray(err.response?.data?.detail)) {
        // Handle validation errors from FastAPI
        const errorMessages = err.response.data.detail.map((d: any) => d.msg).join(", ");
        setError(`Login failed: ${errorMessages}`);
      } else if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else if (err.response?.status === 422) {
        setError("Please check your email and password format");
      } else {
        setError(err.response?.data?.detail || err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-3 text-sm text-red-800 dark:text-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md bg-green-50 dark:bg-green-900/50 p-3 text-sm text-green-800 dark:text-green-200">
                  {success}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="researcher@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Icons.loader className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-accent hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
} 