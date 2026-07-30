/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

interface CodeBlockProps {
  code: string
  label: string
}

export function CodeBlock(props: CodeBlockProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(props.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className='overflow-hidden rounded-lg border bg-[#101512] text-white'>
      <div className='flex h-10 items-center justify-between border-b border-white/10 px-3'>
        <span className='text-xs text-white/60'>{props.label}</span>
        <Button
          size='icon-sm'
          variant='ghost'
          className='text-white/70 hover:bg-white/10 hover:text-white'
          aria-label={t('Copy')}
          onClick={handleCopy}
        >
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      <pre className='overflow-x-auto p-4 text-xs leading-6'>
        <code>{props.code}</code>
      </pre>
    </div>
  )
}
