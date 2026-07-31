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
import { Languages, MapPin, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const capabilities = [
  {
    icon: MapPin,
    index: '01',
    label: 'Russian cloud',
    title: 'Access point in Russia',
    description: 'The API gateway runs in Russian cloud infrastructure.',
  },
  {
    icon: Languages,
    index: '02',
    label: 'Russian-first product',
    title: 'Russian interface and documentation',
    description: 'Interface, documentation, pricing and support in Russian.',
  },
  {
    icon: WalletCards,
    index: '03',
    label: 'USDT',
    title: 'Simple balance top up',
    description: 'Top up with USDT without a foreign bank card.',
  },
] as const

export function RussiaFocus() {
  const { t } = useTranslation()

  return (
    <section className='relative overflow-hidden bg-[#101d33] px-5 py-16 text-white sm:px-6 md:py-20'>
      <div
        aria-hidden
        className='absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:25%_100%] opacity-50'
      />
      <div className='relative mx-auto max-w-6xl'>
        <div className='grid gap-8 border-b border-white/15 pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end'>
          <p className='flex items-center gap-2 font-mono text-[11px] font-semibold text-[#ff6b70] uppercase'>
            <span className='h-px w-8 bg-[#ff6b70]' />
            {t('Built for Russia')}
          </p>
          <h2 className='max-w-3xl text-3xl leading-tight font-semibold tracking-normal text-balance md:text-[2.7rem]'>
            {t('Infrastructure and experience designed for users in Russia.')}
          </h2>
        </div>

        <div className='grid md:grid-cols-3'>
          {capabilities.map((capability, index) => {
            const Icon = capability.icon
            return (
              <article
                key={capability.title}
                className={[
                  'relative min-h-64 py-9 md:px-7',
                  index === 0
                    ? 'md:pl-0'
                    : 'border-t border-white/15 md:border-t-0 md:border-l',
                ].join(' ')}
              >
                <div className='mb-12 flex items-center justify-between'>
                  <Icon className='size-5 text-[#ff6b70]' strokeWidth={1.75} />
                  <span className='font-mono text-[10px] text-white/40'>
                    {capability.index}
                  </span>
                </div>
                <p className='mb-2 font-mono text-[10px] font-semibold text-white/45 uppercase'>
                  {t(capability.label)}
                </p>
                <h3 className='max-w-xs text-xl font-semibold tracking-normal'>
                  {t(capability.title)}
                </h3>
                <p className='mt-4 max-w-sm text-sm leading-6 text-white/62'>
                  {t(capability.description)}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
