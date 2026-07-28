/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()
  if (props.isAuthenticated) return null

  return (
    <section className='border-border/60 border-b px-5 py-20 sm:px-6 md:py-24'>
      <AnimateInView className='mx-auto flex max-w-6xl flex-col justify-between gap-8 md:flex-row md:items-center'>
        <div>
          <p className='text-muted-foreground text-xs font-semibold uppercase'>
            {t('Start building')}
          </p>
          <h2 className='mt-3 max-w-2xl text-3xl leading-tight font-semibold tracking-normal md:text-4xl'>
            {t('One endpoint for your next AI product.')}
          </h2>
        </div>
        <div className='flex shrink-0 items-center gap-3'>
          <Button
            className='group h-11 rounded-md bg-[#111713] px-5 text-white hover:bg-[#253128] dark:bg-white dark:text-[#111713]'
            render={<Link to='/sign-up' />}
          >
            {t('Create API key')}
            <ArrowRight className='ml-1.5 size-4 transition-transform group-hover:translate-x-0.5' />
          </Button>
          <Button
            variant='outline'
            className='h-11 rounded-md px-5'
            render={<Link to='/pricing' />}
          >
            {t('View Pricing')}
          </Button>
        </div>
      </AnimateInView>
    </section>
  )
}
