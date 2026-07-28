/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/
import { Braces, CreditCard, KeyRound, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Stats() {
  const { t } = useTranslation()
  const items = [
    {
      icon: Braces,
      value: 'OpenAI · Claude · Gemini',
      label: t('Compatible protocols'),
    },
    {
      icon: KeyRound,
      value: t('One API key'),
      label: t('For every connected model'),
    },
    {
      icon: RefreshCw,
      value: t('Automatic failover'),
      label: t('Across configured channels'),
    },
    {
      icon: CreditCard,
      value: t('Usage-based billing'),
      label: t('Transparent request accounting'),
    },
  ]

  return (
    <section className='border-border/60 bg-muted/20 border-b'>
      <div className='mx-auto grid max-w-6xl grid-cols-1 divide-y px-5 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-4'>
        {items.map((item) => (
          <div
            key={item.value}
            className='flex min-h-28 items-center gap-3 py-5 sm:px-5'
          >
            <item.icon className='text-muted-foreground size-4 shrink-0' />
            <div className='min-w-0'>
              <p className='text-sm font-semibold'>{item.value}</p>
              <p className='text-muted-foreground mt-1 text-xs'>{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
