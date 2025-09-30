"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { api } from "@/lib/api"

interface AuthContextType {
  isAuthenticated: boolean
  user: any | null
  login: (token: string, userData: any) => void
  logout: () => void
  checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any | null>(null)

  const checkAuth = () => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setIsAuthenticated(true)
        setUser(parsedUser)
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      } catch (error) {
        console.error("Error parsing user data:", error)
        logout()
      }
    } else {
      setIsAuthenticated(false)
      setUser(null)
      delete api.defaults.headers.common["Authorization"]
    }
  }

  const login = (token: string, userData: any) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    setUser(null)
    delete api.defaults.headers.common["Authorization"]
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 