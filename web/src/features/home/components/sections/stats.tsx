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
      value: 'OpenAI · Anthropic',
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
      value: 'USDT',
      label: t('Balance top up'),
    },
  ]

  return (
    <section className='border-border/60 bg-muted/20 border-b'>
      <div className='mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y px-5 sm:px-6 lg:grid-cols-4 lg:divide-y-0'>
        {items.map((item) => (
          <div
            key={item.value}
            className='flex min-h-28 items-start gap-3 px-3 py-5 first:pl-0 lg:px-5 lg:first:pl-0'
          >
            <item.icon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
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
