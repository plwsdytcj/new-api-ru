/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

export function ModelCoverage() {
  const { t } = useTranslation()

  const groups = [
    {
      eyebrow: t('US models'),
      title: t('GPT and American AI models'),
      models: 'GPT · Claude · Gemini',
      description: t(
        'Use an OpenAI-compatible interface for GPT and integrations with leading US model providers.'
      ),
    },
    {
      eyebrow: t('Chinese models'),
      title: t('Kimi, DeepSeek and Qwen'),
      models: 'Kimi · DeepSeek · Qwen',
      description: t(
        'Connect Chinese AI models through the same API format as they become available in the live catalog.'
      ),
    },
  ]

  return (
    <section className='border-border/60 border-b px-5 py-20 sm:px-6 md:py-24'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='max-w-3xl'>
          <p className='text-muted-foreground text-xs font-semibold uppercase'>
            {t('Model catalog')}
          </p>
          <h2 className='mt-4 text-3xl leading-tight font-semibold tracking-normal md:text-4xl'>
            {t('American and Chinese AI models in one API')}
          </h2>
          <p className='text-muted-foreground mt-5 text-base leading-7'>
            {t(
              'RussiaAPI gives developers in Russia one integration surface for models from US and Chinese providers.'
            )}
          </p>
        </AnimateInView>

        <div className='border-border/60 mt-12 grid border-y md:grid-cols-2'>
          {groups.map((group, index) => (
            <AnimateInView
              key={group.eyebrow}
              delay={index * 80}
              className={[
                'py-8 md:p-8',
                index === 0
                  ? 'border-border/60 border-b md:border-r md:border-b-0'
                  : '',
              ].join(' ')}
            >
              <p className='text-muted-foreground text-xs font-semibold uppercase'>
                {group.eyebrow}
              </p>
              <h3 className='mt-4 text-xl font-semibold'>{group.title}</h3>
              <p className='mt-5 font-mono text-sm'>{group.models}</p>
              <p className='text-muted-foreground mt-4 max-w-md text-sm leading-6'>
                {group.description}
              </p>
            </AnimateInView>
          ))}
        </div>

        <AnimateInView className='mt-7 flex flex-wrap items-center justify-between gap-4'>
          <p className='text-muted-foreground max-w-2xl text-sm leading-6'>
            {t(
              'Model availability changes over time. Check the pricing catalog for models that can be called now.'
            )}
          </p>
          <Link
            to='/pricing'
            className='inline-flex items-center gap-2 text-sm font-semibold hover:underline'
          >
            {t('View live model catalog')}
            <ArrowRight className='size-4' />
          </Link>
        </AnimateInView>
      </div>
    </section>
  )
}
