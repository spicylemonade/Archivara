"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { api } from "@/lib/api"
import Link from "next/link"

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setStatus("error")
      setMessage("Invalid verification link")
      return
    }

    verifyEmail(token)
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      await api.post("/auth/verify-email", null, {
        params: { token }
      })

      setStatus("success")
      setMessage("Your email has been verified successfully!")

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login?verified=true")
      }, 3000)
    } catch (err: any) {
      setStatus("error")
      setMessage(err.response?.data?.detail || "Failed to verify email. The link may be invalid or expired.")
    }
  }

  return (
    <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              {status === "verifying" && (
                <Icons.loader className="h-12 w-12 animate-spin text-accent" />
              )}
              {status === "success" && (
                <Icons.checkCircle className="h-12 w-12 text-green-600" />
              )}
              {status === "error" && (
                <Icons.x className="h-12 w-12 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {status === "verifying" && "Verifying Email..."}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "success" && (
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
            )}
            {status === "error" && (
              <div className="flex flex-col gap-2">
                <Link href="/register">
                  <Button variant="outline" className="w-full">
                    Try Registering Again
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" className="w-full">
                    Go to Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="container pt-24 pb-12 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Icons.loader className="h-12 w-12 animate-spin text-accent" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Loading...
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
