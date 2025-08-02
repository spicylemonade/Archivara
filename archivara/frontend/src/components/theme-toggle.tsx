"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { Button, ButtonProps } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const currentTheme = localStorage.getItem("theme")
    
    if (currentTheme === "dark" || (!currentTheme && isSystemDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }
  
  const buttonProps: ButtonProps = {
    variant: "ghost",
    size: "icon",
    onClick: toggleTheme,
  }

  return (
    <Button {...buttonProps}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 