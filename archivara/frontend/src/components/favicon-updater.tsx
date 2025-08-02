"use client"

import { useEffect, useState } from "react"

export function FaviconUpdater() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side to prevent SSR issues
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Skip if not client-side or document is not ready
    if (!isClient || typeof document === 'undefined') return;
    
    const updateFavicon = () => {
      try {
        // Force white favicon for now since it's more visible
        const faviconUrl = '/favicon-white.png'
        const appleTouchUrl = '/logo-white.png'
        
        // Update existing favicon or create new one (32x32)
        let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement
        if (!faviconLink) {
          faviconLink = document.createElement('link')
          faviconLink.rel = 'icon'
          faviconLink.type = 'image/png'
          faviconLink.sizes = '32x32'
          document.head.appendChild(faviconLink)
        }
        faviconLink.href = faviconUrl
        
        // Update document title to force favicon refresh
        document.title = document.title
        
        // Update existing apple-touch-icon or create new one (larger size for mobile)
        let appleTouchLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement
        if (!appleTouchLink) {
          appleTouchLink = document.createElement('link')
          appleTouchLink.rel = 'apple-touch-icon'
          appleTouchLink.sizes = '180x180'
          document.head.appendChild(appleTouchLink)
        }
        appleTouchLink.href = appleTouchUrl
      } catch (error) {
        // Silently handle any DOM manipulation errors
        console.warn('Failed to update favicon:', error)
      }
    }

    // Initial update
    updateFavicon()

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          // Add a small delay to prevent rapid fire updates
          setTimeout(updateFavicon, 10)
        }
      })
    })

    if (document.documentElement) {
      observer.observe(document.documentElement, { 
        attributes: true, 
        attributeFilter: ['class'] 
      })
    }

    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [isClient])

  return null
} 