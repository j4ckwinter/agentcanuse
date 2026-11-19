import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

const COPIED_MS = 1500

export function CopyButton({ text, label }: { text: () => string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard
      ?.writeText(text())
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), COPIED_MS)
      })
      .catch(() => setCopied(false))
  }
  return (
    <button type="button" onClick={copy} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-label font-medium text-fg-secondary hover:bg-hover hover:text-fg">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  )
}
