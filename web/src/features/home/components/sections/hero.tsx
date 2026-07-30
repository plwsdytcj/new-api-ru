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
import {
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  CreditCard,
  KeyRound,
  MapPin,
  RefreshCw,
} from 'lucide-react'
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
  const signals = [
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
    <section className='relative overflow-hidden border-b px-5 pt-24 pb-14 sm:px-6 md:pt-28 md:pb-18'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_70%)] bg-[size:64px_64px] opacity-[0.12]'
      />

      <div className='mx-auto max-w-6xl'>
        <div className='max-w-[58rem]'>
          <div className='landing-animate-fade-up mb-7 flex flex-wrap items-center gap-3 opacity-0'>
            <span className='inline-flex items-center gap-2 text-xs font-semibold text-[#14233d] dark:text-white'>
              <MapPin className='size-3.5 text-[#e5484d]' />
              {t('Infrastructure for developers in Russia')}
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
            className='landing-animate-fade-up text-[2.65rem] leading-[1.04] font-semibold tracking-normal text-balance opacity-0 sm:text-6xl md:text-[4.25rem]'
            style={{ animationDelay: '50ms' }}
          >
            <span className='block text-[#14233d] dark:text-white'>
              RussiaAPI
            </span>
            <span className='text-foreground/68 mt-2 block max-w-[54rem] text-[0.66em] leading-[1.1]'>
              {t('GPT API and leading AI models in Russia')}
            </span>
          </h1>

          <p
            className='landing-animate-fade-up text-muted-foreground mt-6 max-w-3xl text-base leading-7 text-pretty opacity-0 md:text-[17px]'
            style={{ animationDelay: '100ms' }}
          >
            {t(
              'Connect GPT and OpenAI-compatible clients through one endpoint in Russia. Use one interface for American and Chinese AI models, with automatic routing, failover and usage accounting.'
            )}
          </p>

          <div className='landing-animate-fade-up mt-8 flex flex-col gap-5 opacity-0 sm:flex-row sm:items-center'>
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
            className='landing-animate-fade-up border-border/70 mt-8 flex w-full max-w-3xl flex-col border-y py-3 opacity-0 sm:flex-row sm:items-center sm:justify-between'
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
          className='landing-animate-fade-up border-border/70 mt-10 grid grid-cols-2 border-y opacity-0 lg:grid-cols-4'
          style={{ animationDelay: '210ms' }}
        >
          {signals.map((signal, index) => (
            <div
              key={signal.value}
              className={[
                'flex min-h-24 items-start gap-3 px-4 py-5 first:pl-0 lg:px-5',
                index % 2 === 0 ? 'border-r' : '',
                index < 2 ? 'border-b lg:border-b-0' : '',
                index < 3 ? 'lg:border-r' : '',
              ].join(' ')}
            >
              <signal.icon className='mt-0.5 size-4 shrink-0 text-[#e5484d]' />
              <div className='min-w-0'>
                <p className='text-sm leading-5 font-semibold'>
                  {signal.value}
                </p>
                <p className='text-muted-foreground mt-1 text-xs leading-5'>
                  {signal.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className='landing-animate-fade-up mt-8 opacity-0 md:mt-10'
          style={{ animationDelay: '250ms' }}
        >
          <HeroTerminalDemo />
        </div>
      </div>
    </section>
  )
}
