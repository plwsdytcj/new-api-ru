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
import { Braces, Check, Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  return (
    <div className='bg-background relative grid min-h-svh max-w-none lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.68fr)]'>
      <Link
        to='/'
        className='absolute top-4 left-4 z-10 flex items-center gap-2.5 transition-opacity hover:opacity-80 sm:top-7 sm:left-8 lg:text-white'
      >
        <div className='relative h-8 w-8'>
          {loading ? (
            <Skeleton className='absolute inset-0 rounded-lg' />
          ) : (
            <img
              src={logo}
              alt={t('Logo')}
              className='h-8 w-8 rounded-lg object-cover'
            />
          )}
        </div>
        {loading ? (
          <Skeleton className='h-6 w-24' />
        ) : (
          <h1 className='text-[17px] font-semibold tracking-normal'>
            {systemName}
          </h1>
        )}
      </Link>
      <div className='relative hidden overflow-hidden bg-[#14233d] p-12 text-white lg:flex lg:flex-col lg:justify-end'>
        <div
          aria-hidden
          className='absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_72%)] bg-[size:56px_56px] opacity-30'
        />
        <div className='relative max-w-2xl'>
          <div className='mb-8 flex items-center gap-2 font-mono text-xs text-emerald-300'>
            <span className='relative flex size-2'>
              <span className='absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-40' />
              <span className='relative inline-flex size-2 rounded-full bg-emerald-400' />
            </span>
            {t('Gateway operational')}
          </div>
          <h2 className='max-w-xl text-4xl leading-tight font-semibold tracking-normal text-balance'>
            {t('One account for every model and API key.')}
          </h2>
          <div className='mt-10 grid max-w-xl gap-0 border-y border-white/15 text-sm text-white/70'>
            <AuthPoint icon={<Braces />} text={t('Compatible API protocols')} />
            <AuthPoint icon={<Route />} text={t('Automatic channel routing')} />
            <AuthPoint
              icon={<Check />}
              text={t('Usage and balance in one place')}
            />
          </div>
          <div className='mt-8 flex max-w-xl items-center justify-between border border-white/15 bg-white/[0.035] px-4 py-3 font-mono text-xs'>
            <span className='text-white/45'>base_url</span>
            <span className='text-white/85'>https://russiaapi.com/v1</span>
          </div>
          <div className='mt-4 flex items-center gap-2 font-mono text-[11px] text-white/45'>
            <span>GPT</span>
            <span className='h-px flex-1 bg-white/15' />
            <span>Claude</span>
            <span className='h-px flex-1 bg-white/15' />
            <span>Kimi</span>
            <span className='h-px flex-1 bg-white/15' />
            <span>DeepSeek</span>
          </div>
        </div>
      </div>
      <div className='border-border/70 flex items-center border-l pt-16 sm:pt-0'>
        <div className='mx-auto flex w-full max-w-[470px] flex-col justify-center space-y-2 px-6 py-10 sm:px-12'>
          {children}
        </div>
      </div>
    </div>
  )
}

function AuthPoint(props: { icon: React.ReactNode; text: string }) {
  return (
    <div className='flex min-h-14 items-center gap-3 border-b border-white/10 last:border-b-0'>
      <span className='flex size-8 items-center justify-center text-[#ff7378] [&_svg]:size-4'>
        {props.icon}
      </span>
      <span>{props.text}</span>
    </div>
  )
}
