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
import { ArrowRight, BookOpen, Check, MapPin, Send } from 'lucide-react'
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
  const telegramUrl = String(status?.support_telegram_url || '')

  const primaryTarget = props.isAuthenticated ? '/dashboard' : '/sign-up'
  const primaryLabel = props.isAuthenticated
    ? t('Go to Dashboard')
    : t('Create API key')

  return (
    <section className='relative overflow-hidden border-b px-5 pt-24 pb-12 sm:px-6 md:pt-30 md:pb-16'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_76%)] bg-[size:56px_56px] opacity-[0.14]'
      />

      <div className='mx-auto max-w-6xl'>
        <div className='max-w-4xl'>
          <div className='landing-animate-fade-up text-muted-foreground mb-6 flex flex-wrap items-center gap-2 text-xs font-medium opacity-0'>
            <MapPin className='size-3.5 text-emerald-600' />
            <span>{t('Infrastructure for developers in Russia')}</span>
            <span className='bg-border size-1 rounded-full' />
            <span className='inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400'>
              <span className='size-1.5 rounded-full bg-emerald-500' />
              {t('Operational')}
            </span>
          </div>

          <h1
            className='landing-animate-fade-up text-[2.75rem] leading-[1.03] font-semibold tracking-normal opacity-0 sm:text-6xl md:text-7xl'
            style={{ animationDelay: '50ms' }}
          >
            RussiaAPI
            <span className='text-muted-foreground mt-2 block max-w-4xl text-[0.72em] leading-[1.08]'>
              {t('GPT API and leading AI models in Russia')}
            </span>
          </h1>

          <p
            className='landing-animate-fade-up text-muted-foreground mt-7 max-w-2xl text-base leading-7 opacity-0 md:text-lg'
            style={{ animationDelay: '100ms' }}
          >
            {t(
              'Connect GPT and OpenAI-compatible clients through one endpoint in Russia. Use one interface for American and Chinese AI models, with automatic routing, failover and usage accounting.'
            )}
          </p>

          <div className='landing-animate-fade-up mt-8 flex flex-col gap-5 opacity-0 sm:flex-row sm:items-center'>
            <div className='flex flex-wrap items-center gap-3'>
              <Button
                className='group h-11 rounded-md bg-[#111713] px-5 text-white hover:bg-[#253128] dark:bg-white dark:text-[#111713]'
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
                className='h-11 rounded-md px-4'
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
              {telegramUrl && (
                <Button
                  variant='ghost'
                  className='h-11 rounded-md px-4'
                  render={
                    <a
                      href={telegramUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                    />
                  }
                >
                  <Send className='mr-2 size-4' />
                  Telegram
                </Button>
              )}
            </div>
          </div>

          <div
            className='landing-animate-fade-up border-border/70 mt-8 flex w-full max-w-2xl flex-col border-y py-3 opacity-0 sm:flex-row sm:items-center sm:justify-between'
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
          className='landing-animate-fade-up mt-10 opacity-0 md:mt-12'
          style={{ animationDelay: '220ms' }}
        >
          <HeroTerminalDemo />
        </div>
      </div>
    </section>
  )
}
