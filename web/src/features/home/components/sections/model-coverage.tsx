/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { Link } from '@tanstack/react-router'
import { ArrowDown, ArrowRight, Check, Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

export function ModelCoverage() {
  const { t } = useTranslation()

  const groups = [
    {
      code: 'US',
      eyebrow: t('International models'),
      title: t('Global providers'),
      models: [
        { name: 'ChatGPT', maker: 'OpenAI' },
        { name: 'Claude', maker: 'Anthropic' },
        { name: 'Gemini', maker: 'Google' },
        { name: 'Grok', maker: 'xAI' },
      ],
      description: t(
        'Access leading American AI models through one OpenAI-compatible interface.'
      ),
    },
    {
      code: 'CN',
      eyebrow: t('Chinese models'),
      title: t('Chinese providers'),
      models: [
        { name: 'DeepSeek', maker: 'DeepSeek' },
        { name: 'Kimi', maker: 'Moonshot AI' },
        { name: 'Qwen', maker: 'Alibaba Cloud' },
        { name: 'GLM', maker: 'Zhipu AI' },
      ],
      description: t(
        'Connect Chinese AI models through the same API format as they become available in the live catalog.'
      ),
    },
  ]

  return (
    <section className='border-border/60 border-b bg-[#f4f7fb] px-5 py-20 sm:px-6 md:py-24 dark:bg-muted/15'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='grid gap-7 md:grid-cols-[1fr_0.75fr] md:items-end md:gap-16'>
          <div>
            <p className='text-xs font-semibold text-[#e5484d] uppercase'>
              {t('Model catalog')}
            </p>
            <h2 className='mt-4 max-w-3xl text-3xl leading-tight font-semibold tracking-normal md:text-5xl'>
              {t('Leading AI models from around the world')}
            </h2>
          </div>
          <p className='text-muted-foreground max-w-xl text-base leading-7'>
            {t(
              'ChatGPT, Claude, Gemini, Kimi, DeepSeek, Qwen and more — RussiaAPI brings international and Chinese models together in one API.'
            )}
          </p>
        </AnimateInView>

        <div className='border-border/70 mt-12 grid border-y bg-background md:grid-cols-[1fr_10rem_1fr]'>
          <ModelGroup group={groups[0]} />

          <AnimateInView
            delay={80}
            className='border-border/70 relative flex min-h-44 flex-col items-center justify-center overflow-hidden border-y bg-[#14233d] px-5 py-8 text-center text-white md:border-x md:border-y-0'
          >
            <span className='absolute top-0 h-1 w-full bg-[#e5484d]' />
            <Globe2 className='size-6 text-white/55' strokeWidth={1.5} />
            <p className='mt-5 font-mono text-[10px] font-semibold text-[#ff8b8f] uppercase'>
              {t('Unified access')}
            </p>
            <p className='mt-2 text-lg font-semibold'>RussiaAPI</p>
            <code className='mt-2 text-[11px] text-white/45'>/v1</code>
            <ArrowDown className='mt-5 size-4 text-white/35 md:hidden' />
          </AnimateInView>

          <ModelGroup group={groups[1]} delay={160} />
        </div>

        <AnimateInView className='border-border/70 flex flex-col gap-4 border-b py-5 md:flex-row md:items-center md:justify-between'>
          <div className='flex flex-wrap gap-x-6 gap-y-2'>
            {[t('One API key'), t('Automatic failover'), t('Unified billing')].map(
              (item) => (
                <span
                  key={item}
                  className='text-muted-foreground inline-flex items-center gap-2 text-xs font-medium'
                >
                  <Check className='size-3.5 text-emerald-600' />
                  {item}
                </span>
              )
            )}
          </div>
          <Link
            to='/pricing'
            className='inline-flex items-center gap-2 text-sm font-semibold text-[#14233d] hover:underline dark:text-white'
          >
            {t('View live model catalog')}
            <ArrowRight className='size-4' />
          </Link>
        </AnimateInView>
      </div>
    </section>
  )
}

type ModelGroupData = {
  code: string
  eyebrow: string
  title: string
  models: Array<{ name: string; maker: string }>
  description: string
}

function ModelGroup(props: { group: ModelGroupData; delay?: number }) {
  const { group } = props

  return (
    <AnimateInView delay={props.delay} className='min-w-0 p-6 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-muted-foreground font-mono text-[10px] font-semibold uppercase'>
            {group.eyebrow}
          </p>
          <h3 className='mt-2 text-xl font-semibold'>{group.title}</h3>
        </div>
        <span className='text-muted-foreground/50 font-mono text-xs'>
          {group.code}
        </span>
      </div>

      <div className='border-border/70 mt-7 grid grid-cols-2 border-t'>
        {group.models.map((model, index) => (
          <div
            key={model.name}
            className={[
              'border-border/70 min-w-0 py-4',
              index < 2 ? 'border-b' : '',
              index % 2 === 0 ? 'border-r pr-4' : 'pl-4',
            ].join(' ')}
          >
            <p className='truncate text-sm font-semibold'>{model.name}</p>
            <p className='text-muted-foreground mt-1 truncate text-[11px]'>
              {model.maker}
            </p>
          </div>
        ))}
      </div>

      <p className='text-muted-foreground mt-6 max-w-md text-sm leading-6'>
        {group.description}
      </p>
    </AnimateInView>
  )
}
