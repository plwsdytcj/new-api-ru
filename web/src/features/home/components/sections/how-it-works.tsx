/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

export function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    {
      number: '01',
      title: t('Create a key'),
      description: t('Set a balance, quota and model permissions.'),
    },
    {
      number: '02',
      title: t('Change the base URL'),
      description: 'https://russiaapi.com/v1',
    },
    {
      number: '03',
      title: t('Send requests'),
      description: t('Use the SDK or client you already have.'),
    },
  ]

  return (
    <section className='bg-[#111713] px-5 py-20 text-white sm:px-6 md:py-24'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='flex flex-col justify-between gap-5 md:flex-row md:items-end'>
          <div>
            <p className='text-xs font-semibold text-emerald-400 uppercase'>
              {t('Quick start')}
            </p>
            <h2 className='mt-4 max-w-xl text-3xl leading-tight font-semibold tracking-normal md:text-4xl'>
              {t('Keep your client. Change one address.')}
            </h2>
          </div>
          <p className='max-w-sm text-sm leading-6 text-white/55'>
            {t(
              'OpenAI-compatible clients can start without a custom integration.'
            )}
          </p>
        </AnimateInView>

        <div className='mt-12 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center'>
          {steps.map((step, index) => (
            <div key={step.number} className='contents'>
              <AnimateInView
                delay={index * 90}
                className='border border-white/15 p-5'
              >
                <span className='font-mono text-xs text-white/40'>
                  {step.number}
                </span>
                <h3 className='mt-7 text-base font-semibold'>{step.title}</h3>
                <p className='mt-2 font-mono text-xs leading-5 break-all text-white/55'>
                  {step.description}
                </p>
              </AnimateInView>
              {index < steps.length - 1 && (
                <ArrowRight className='mx-2 hidden size-4 text-white/30 md:block' />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
