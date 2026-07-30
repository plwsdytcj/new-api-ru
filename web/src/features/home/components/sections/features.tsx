/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/
import { BarChart3, Gauge, Route, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

export function Features() {
  const { t } = useTranslation()
  const features = [
    {
      icon: Route,
      number: '01',
      title: t('Route by model'),
      description: t(
        'Present one model name to users while multiple upstream channels compete by priority and weight.'
      ),
    },
    {
      icon: Gauge,
      number: '02',
      title: t('Recover from limits'),
      description: t(
        'Move eligible requests to a healthy channel when an upstream times out, fails or reaches its rate limit.'
      ),
    },
    {
      icon: BarChart3,
      number: '03',
      title: t('Control every ruble'),
      description: t(
        'Track tokens, requests and channel costs from one operational dashboard.'
      ),
    },
    {
      icon: ShieldCheck,
      number: '04',
      title: t('Keep access separated'),
      description: t(
        'Issue scoped keys, quotas and groups without exposing upstream credentials to users.'
      ),
    },
  ]

  return (
    <section className='border-border/60 border-b px-5 py-18 sm:px-6 md:py-22'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16'>
          <div>
            <p className='text-xs font-semibold text-[#e5484d] uppercase'>
              {t('Routing layer')}
            </p>
            <h2 className='mt-4 text-3xl leading-tight font-semibold tracking-normal md:text-4xl'>
              {t('The model stays simple. The routing can be complex.')}
            </h2>
          </div>
          <p className='text-muted-foreground max-w-xl text-base leading-7 md:pt-8'>
            {t(
              'Users choose a model. RussiaAPI evaluates the available channels, sends the request and records the actual usage behind the same API surface.'
            )}
          </p>
        </AnimateInView>

        <div className='border-border/60 mt-12 grid border-y md:grid-cols-2'>
          {features.map((feature, index) => (
            <AnimateInView
              key={feature.number}
              delay={index * 70}
              className={[
                'border-border/60 py-8 md:p-8',
                index < 2 ? 'border-b' : '',
                index % 2 === 0 ? 'md:border-r' : '',
              ].join(' ')}
            >
              <div className='flex items-center justify-between'>
                <feature.icon className='size-5' strokeWidth={1.6} />
                <span className='text-muted-foreground font-mono text-xs'>
                  {feature.number}
                </span>
              </div>
              <h3 className='mt-8 text-lg font-semibold'>{feature.title}</h3>
              <p className='text-muted-foreground mt-3 max-w-md text-sm leading-6'>
                {feature.description}
              </p>
            </AnimateInView>
          ))}
        </div>
      </div>
    </section>
  )
}
