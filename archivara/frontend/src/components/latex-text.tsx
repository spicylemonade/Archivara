"use client"

import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface LatexTextProps {
  text: string
  className?: string
  inline?: boolean
}

export function LatexText({ text, className = '', inline = true }: LatexTextProps) {
  const containerRef = useRef<HTMLSpanElement | HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    try {
      // Split text by LaTeX delimiters ($ for inline, $$ for display, \(...\) and \[...\])
      const parts: Array<{ type: 'text' | 'latex'; content: string; display?: boolean }> = []
      let currentIndex = 0

      // Match $$...$$, $...$, \[...\], and \(...\) delimiters
      const regex = /\$\$(.*?)\$\$|\$(.*?)\$|\\\[(.*?)\\\]|\\\((.*?)\\\)/gs
      let match

      while ((match = regex.exec(text)) !== null) {
        // Add text before the match
        if (match.index > currentIndex) {
          parts.push({ type: 'text', content: text.slice(currentIndex, match.index) })
        }

        // Add the LaTeX content
        if (match[1] !== undefined) {
          // Display math ($$...$$)
          parts.push({ type: 'latex', content: match[1], display: true })
        } else if (match[2] !== undefined) {
          // Inline math ($...$)
          parts.push({ type: 'latex', content: match[2], display: false })
        } else if (match[3] !== undefined) {
          // Display math (\[...\])
          parts.push({ type: 'latex', content: match[3], display: true })
        } else if (match[4] !== undefined) {
          // Inline math (\(...\))
          parts.push({ type: 'latex', content: match[4], display: false })
        }

        currentIndex = match.index + match[0].length
      }

      // Add remaining text
      if (currentIndex < text.length) {
        parts.push({ type: 'text', content: text.slice(currentIndex) })
      }

      // Render the parts
      const container = containerRef.current
      container.innerHTML = ''

      for (const part of parts) {
        if (part.type === 'text') {
          container.appendChild(document.createTextNode(part.content))
        } else {
          const span = document.createElement('span')
          try {
            katex.render(part.content, span, {
              displayMode: part.display,
              throwOnError: false,
              errorColor: '#cc0000',
            })
            container.appendChild(span)
          } catch (e) {
            // If rendering fails, show the original text
            container.appendChild(document.createTextNode(`$${part.content}$`))
          }
        }
      }
    } catch (e) {
      // If something goes wrong, just show the original text
      if (containerRef.current) {
        containerRef.current.textContent = text
      }
    }
  }, [text])

  if (inline) {
    return <span ref={containerRef as any} className={className} />
  } else {
    return <div ref={containerRef as any} className={className} />
  }
}
