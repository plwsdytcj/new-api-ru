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
import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleDot,
  Clock3,
  Route,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

interface HeroTerminalDemoProps {
  className?: string
}

export function HeroTerminalDemo(props: HeroTerminalDemoProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'border-border/80 bg-background w-full overflow-hidden rounded-md border shadow-[0_34px_90px_-52px_rgba(20,35,61,0.72)]',
        props.className
      )}
    >
      <div className='border-border/60 bg-[#14233d] flex min-h-12 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 text-white sm:px-5'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className='size-2 shrink-0 rounded-full bg-emerald-500' />
          <span className='font-mono text-xs text-white/80'>
            req_7B2F91
          </span>
          <span className='hidden text-xs text-white/45 sm:inline'>
            {t('Live routing preview')}
          </span>
        </div>
        <div className='flex items-center gap-2 font-mono text-xs'>
          <span className='text-white/45'>184 ms</span>
          <span className='rounded bg-emerald-400/15 px-2 py-1 font-semibold text-emerald-300'>
            200 OK
          </span>
        </div>
      </div>

      <div className='grid md:grid-cols-[1fr_1.25fr_1fr]'>
        <RouteStage
          eyebrow={t('Incoming request')}
          icon={<CircleDot className='size-4' />}
          className='border-border/60 border-b md:border-r md:border-b-0'
        >
          <div className='space-y-3'>
            <CodeValue label='POST' value='/v1/chat/completions' />
            <CodeValue label={t('Model')} value='gpt-4.1' />
            <CodeValue label={t('Token')} value='sk-live-••••••' />
          </div>
        </RouteStage>

        <RouteStage
          eyebrow={t('Smart router')}
          icon={<Route className='size-4' />}
          className='border-border/60 border-b md:border-r md:border-b-0'
        >
          <div className='space-y-2'>
            <ChannelRow
              name={t('Primary channel')}
              meta='184 ms'
              state={t('Selected')}
              selected
            />
            <ChannelRow
              name={t('Reserve channel')}
              meta='ready'
              state={t('Standby')}
            />
            <ChannelRow
              name={t('Rate-limited channel')}
              meta='429'
              state={t('Cooling down')}
              muted
            />
          </div>
        </RouteStage>

        <RouteStage
          eyebrow={t('Unified response')}
          icon={<Check className='size-4' />}
        >
          <div className='flex h-full min-h-36 flex-col justify-between gap-6'>
            <div>
              <p className='text-3xl font-semibold tabular-nums'>200</p>
              <p className='text-muted-foreground mt-1 text-sm'>
                {t('Compatible response returned')}
              </p>
            </div>
            <div className='text-muted-foreground flex items-center gap-2 text-xs'>
              <Clock3 className='size-3.5' />
              <span>{t('Usage recorded automatically')}</span>
            </div>
          </div>
        </RouteStage>
      </div>

      <div className='border-border/60 bg-[#0d182b] px-4 py-3 text-white sm:px-5'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2 font-mono text-xs text-white/70'>
            <span className='text-emerald-400'>$</span>
            <span>base_url=https://russiaapi.com/v1</span>
          </div>
          <div className='flex flex-wrap items-center gap-2 text-xs text-white/55'>
            <span>ChatGPT</span>
            <ArrowRight className='size-3' />
            <span>Claude</span>
            <ArrowRight className='size-3' />
            <span>DeepSeek</span>
            <ArrowRight className='size-3' />
            <span>+ {t('More models')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function RouteStage(props: {
  eyebrow: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative min-w-0 p-5 sm:p-6', props.className)}>
      <div className='text-muted-foreground mb-5 flex items-center gap-2 text-xs font-semibold uppercase'>
        {props.icon}
        <span>{props.eyebrow}</span>
      </div>
      {props.children}
      <ArrowDown className='text-muted-foreground bg-background absolute -bottom-3 left-1/2 z-10 size-6 -translate-x-1/2 rounded-full p-1 md:hidden' />
    </div>
  )
}

function CodeValue(props: { label: string; value: string }) {
  return (
    <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3'>
      <span className='text-muted-foreground text-xs'>{props.label}</span>
      <code className='bg-muted/60 min-w-0 truncate rounded px-2 py-1.5 text-xs'>
        {props.value}
      </code>
    </div>
  )
}

function ChannelRow(props: {
  name: string
  meta: string
  state: string
  selected?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-h-12 items-center justify-between gap-3 rounded-md border px-3',
        props.selected
          ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
          : 'border-border/60 bg-muted/20',
        props.muted && 'opacity-55'
      )}
    >
      <div className='min-w-0'>
        <p className='truncate text-xs font-medium'>{props.name}</p>
        <p className='text-muted-foreground mt-0.5 font-mono text-[11px]'>
          {props.meta}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 text-[11px]',
          props.selected
            ? 'font-medium text-emerald-700 dark:text-emerald-400'
            : 'text-muted-foreground'
        )}
      >
        {props.state}
      </span>
    </div>
  )
}
