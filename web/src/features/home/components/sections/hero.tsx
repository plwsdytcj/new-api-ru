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
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Check, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'

import { HeroTerminalDemo } from '../hero-terminal-demo'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const docsUrl = (status?.docs_link as string | undefined) || '/docs'

  const primaryTarget = props.isAuthenticated ? '/dashboard' : '/sign-up'
  const primaryLabel = props.isAuthenticated
    ? t('Go to Dashboard')
    : t('Create API key')
  const internationalModels = ['ChatGPT', 'Claude', 'Gemini', 'Grok']
  const chineseModels = ['DeepSeek', 'Kimi', 'Qwen', 'GLM']

  return (
    <section className='dark:bg-background relative overflow-hidden border-b bg-[#fbfcfe] px-5 pt-24 pb-14 sm:px-6 md:pt-30 md:pb-20'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_62%)] bg-[size:64px_64px] opacity-[0.16]'
      />
      <div
        aria-hidden
        className='absolute top-16 right-[max(1.25rem,calc((100%_-_72rem)/2))] hidden h-32 w-px bg-[#e5484d]/35 lg:block'
      />

      <div className='mx-auto max-w-6xl'>
        <div className='max-w-[62rem]'>
          <div className='landing-animate-fade-up mb-7 flex flex-wrap items-center gap-3 opacity-0'>
            <span className='inline-flex items-center gap-2 text-xs font-semibold text-[#14233d] dark:text-white'>
              <MapPin className='size-3.5 text-[#e5484d]' />
              {t('Built for Russia')}
            </span>
            <span className='bg-border h-4 w-px' />
            <span className='inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400'>
              <span className='relative flex size-2'>
                <span className='absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-40' />
                <span className='relative inline-flex size-2 rounded-full bg-emerald-500' />
              </span>
              {t('Operational')}
            </span>
          </div>

          <h1
            className='landing-animate-fade-up text-[2.7rem] leading-[1.02] font-semibold tracking-normal text-balance opacity-0 sm:text-6xl md:text-[4.65rem]'
            style={{ animationDelay: '50ms' }}
          >
            <span className='block text-[#14233d] dark:text-white'>
              RussiaAPI
            </span>
            <span className='text-foreground/68 mt-3 block max-w-[59rem] text-[0.62em] leading-[1.08]'>
              {t('All leading AI models. One API built for Russia.')}
            </span>
          </h1>

          <p
            className='landing-animate-fade-up text-muted-foreground mt-7 max-w-[50rem] text-base leading-7 text-pretty opacity-0 md:text-[17px]'
            style={{ animationDelay: '100ms' }}
          >
            {t(
              'A single access point in Russia for leading international and Chinese AI models, with a Russian interface, documentation, automatic routing and one balance.'
            )}
          </p>

          <div className='landing-animate-fade-up mt-9 flex flex-col gap-5 opacity-0 sm:flex-row sm:items-center'>
            <div className='flex flex-wrap items-center gap-3'>
              <Button
                className='group h-11 rounded-md bg-[#14233d] px-5 text-white shadow-[0_8px_24px_-14px_rgba(20,35,61,0.9)] hover:bg-[#223655] dark:bg-white dark:text-[#14233d]'
                render={<Link to={primaryTarget} />}
              >
                {primaryLabel}
                <ArrowRight className='ml-1.5 size-4 transition-transform group-hover:translate-x-0.5' />
              </Button>
              <Button
                variant='outline'
                className='h-11 rounded-md px-5'
                render={<Link to='/pricing' />}
              >
                {t('View Pricing')}
              </Button>
              <Button
                variant='ghost'
                className='h-11 rounded-md px-3.5'
                render={
                  docsUrl.startsWith('http') ? (
                    <a
                      href={docsUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    />
                  ) : (
                    <Link to={docsUrl} />
                  )
                }
              >
                <BookOpen className='mr-2 size-4' />
                {t('Docs')}
              </Button>
            </div>
          </div>

          <div
            className='landing-animate-fade-up border-border/70 mt-9 flex w-full max-w-4xl flex-col border-y py-3 opacity-0 sm:flex-row sm:items-center sm:justify-between'
            style={{ animationDelay: '190ms' }}
          >
            <div className='flex min-w-0 items-center gap-3'>
              <span className='text-muted-foreground shrink-0 text-xs'>
                {t('API endpoint')}
              </span>
              <code className='truncate font-mono text-xs sm:text-sm'>
                https://russiaapi.com/v1
              </code>
            </div>
            <div className='text-muted-foreground mt-2 flex shrink-0 items-center gap-1.5 text-xs sm:mt-0'>
              <Check className='size-3.5 text-emerald-600' />
              <span>{t('OpenAI compatible')}</span>
              <CopyButton
                value='https://russiaapi.com/v1'
                className='ml-1 size-7'
                iconClassName='size-3.5'
                tooltip={t('Copy API endpoint')}
              />
            </div>
          </div>
        </div>

        <div
          className='landing-animate-fade-up border-border/70 mt-10 grid overflow-hidden border-y opacity-0 lg:grid-cols-[1fr_auto_1fr]'
          style={{ animationDelay: '210ms' }}
        >
          <ModelRail
            label={t('International models')}
            models={internationalModels}
          />
          <div className='border-border/70 relative flex min-h-20 items-center justify-center border-y px-7 lg:border-x lg:border-y-0'>
            <span className='absolute left-0 h-px w-full bg-[#e5484d]/25 lg:top-1/2' />
            <span className='relative bg-[#14233d] px-3 py-1.5 font-mono text-[11px] font-semibold text-white'>
              RussiaAPI / v1
            </span>
          </div>
          <ModelRail
            label={t('Chinese models')}
            models={chineseModels}
            align='right'
          />
        </div>

        <div
          className='landing-animate-fade-up mt-10 opacity-0 md:mt-12'
          style={{ animationDelay: '250ms' }}
        >
          <HeroTerminalDemo />
        </div>
      </div>
    </section>
  )
}

function ModelRail(props: {
  label: string
  models: string[]
  align?: 'left' | 'right'
}) {
  return (
    <div
      className={[
        'flex min-h-24 flex-col justify-center gap-3 py-4',
        props.align === 'right'
          ? 'items-start lg:items-end lg:pl-7'
          : 'items-start lg:pr-7',
      ].join(' ')}
    >
      <p className='text-muted-foreground font-mono text-[10px] font-semibold uppercase'>
        {props.label}
      </p>
      <div
        className={[
          'flex flex-wrap gap-x-5 gap-y-2',
          props.align === 'right' ? 'lg:justify-end' : '',
        ].join(' ')}
      >
        {props.models.map((model) => (
          <span
            key={model}
            className='text-sm font-semibold tracking-normal text-[#14233d] dark:text-white'
          >
            {model}
          </span>
        ))}
      </div>
    </div>
  )
}
