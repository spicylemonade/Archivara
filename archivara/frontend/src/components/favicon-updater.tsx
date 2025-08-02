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
        
        // Update existing apple-touch-icon or create new one (larger size for mobile)
        let appleTouchLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement
        if (!appleTouchLink) {
          appleTouchLink = document.createElement('link')
          appleTouchLink.rel = 'apple-touch-icon'
          appleTouchLink.sizes = '180x180'
          document.head.appendChild(appleTouchLink)
        }
        appleTouchLink.href = appleTouchUrl
        
        // Also update shortcut icon
        let shortcutLink = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement
        if (!shortcutLink) {
          shortcutLink = document.createElement('link')
          shortcutLink.rel = 'shortcut icon'
          shortcutLink.type = 'image/png'
          document.head.appendChild(shortcutLink)
        }
        shortcutLink.href = faviconUrl
        
        console.log("Favicon updated to:", faviconUrl)
      } catch (error) {
        // Silently handle any DOM manipulation errors
        console.warn('Failed to update favicon:', error)
      }
    }

    // Initial update
    updateFavicon()

    // Update favicon more frequently to handle navigation
    const intervalId = setInterval(updateFavicon, 1000)

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

    // Listen for navigation events
    const handleNavigation = () => {
      setTimeout(updateFavicon, 100)
    }
    
    window.addEventListener('popstate', handleNavigation)
    window.addEventListener('pushstate', handleNavigation)
    window.addEventListener('replacestate', handleNavigation)

    return () => {
      clearInterval(intervalId)
      if (observer) {
        observer.disconnect()
      }
      window.removeEventListener('popstate', handleNavigation)
      window.removeEventListener('pushstate', handleNavigation)
      window.removeEventListener('replacestate', handleNavigation)
    }
  }, [isClient])

  return null
} 