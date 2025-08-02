"use client"

import { useEffect } from "react"

export function FaviconUpdater() {
  useEffect(() => {
    const updateFavicon = () => {
      const isDark = document.documentElement.classList.contains('dark')
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
      
      if (link) {
        // The icon is white by default, so in light mode we need to invert it
        if (!isDark) {
          link.style.filter = 'invert(1)'
        } else {
          link.style.filter = 'none'
        }
      }

      // Also update the logo filter CSS variable
      document.documentElement.style.setProperty('--logo-filter', isDark ? 'none' : 'invert(1)')
    }

    // Initial update
    updateFavicon()

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          updateFavicon()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

  return null
} 