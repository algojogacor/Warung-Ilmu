"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { YouTubeEmbed } from './youtube-embed'
import { extractYouTubeId, isYouTubeUrl } from '@/lib/youtube'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css' // Import syntax highlight styles

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeKatex,
          rehypeHighlight,
          // Removed rehypeSanitize to allow katex and highlight.js to preserve their structural classes and nodes.
        ]}
        components={{
          p({ children, ...props }) {
            // Determine if paragraph is just a standalone youtube URL
            const text = String(children)
            const youtubeId = isYouTubeUrl(text.trim())
              ? extractYouTubeId(text.trim())
              : null
            if (youtubeId && !text.includes(' ') && !text.includes('\n')) {
              return <YouTubeEmbed id={youtubeId} />
            }
            return <p {...props}>{children}</p>
          },
          a({ href, children, ...props }) {
            if (href && isYouTubeUrl(href)) {
              const id = extractYouTubeId(href)
              if (id) return <YouTubeEmbed id={id} />
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-600 underline" {...props}>
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}