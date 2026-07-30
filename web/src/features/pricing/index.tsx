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
  ArrowUpRight,
  CircleDollarSign,
  ImageIcon,
  MessageSquareText,
  Search,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { PageTransition } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { LoadingSkeleton, ModelDetailsDrawer } from './components'
import { QUOTA_TYPE_VALUES } from './constants'
import { usePricingData } from './hooks/use-pricing-data'
import {
  formatPrice,
  formatRequestPrice,
  formatTypicalRequestPrice,
} from './lib/price'
import type { PricingModel } from './types'

type ModelKind = 'all' | 'text' | 'image'

const modelKindOptions: Array<{
  value: ModelKind
  label: string
  icon: typeof MessageSquareText
}> = [
  { value: 'all', label: 'All Models', icon: CircleDollarSign },
  { value: 'text', label: 'Text', icon: MessageSquareText },
  { value: 'image', label: 'Image', icon: ImageIcon },
]

function PriceValue({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className='min-w-0'>
      <div className='text-muted-foreground text-xs'>{label}</div>
      <div className='mt-1 truncate text-sm font-semibold tabular-nums'>
        {value}
      </div>
      {hint && (
        <div className='text-muted-foreground mt-0.5 text-[11px]'>{hint}</div>
      )}
    </div>
  )
}

function PricingRow({
  model,
  onOpen,
}: {
  model: PricingModel
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const isRequest = model.quota_type === QUOTA_TYPE_VALUES.REQUEST
  const modelKind = isRequest ? t('Image') : t('Text')
  const inputPrice = formatPrice(model, 'input', 'M')
  const outputPrice = formatPrice(model, 'output', 'M')
  const cachePrice = formatPrice(model, 'cache', 'M')
  const requestPrice = formatRequestPrice(model)

  return (
    <div className='border-border/70 grid grid-cols-2 gap-4 border-b px-4 py-4 last:border-b-0 sm:px-5 lg:grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(110px,0.75fr))_40px] lg:items-center'>
      <div className='col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1'>
        <div className='bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md'>
          {isRequest ? (
            <ImageIcon className='size-4' />
          ) : (
            <MessageSquareText className='size-4' />
          )}
        </div>
        <div className='min-w-0'>
          <button
            type='button'
            onClick={onOpen}
            className='block max-w-full truncate text-left text-sm font-semibold hover:underline'
          >
            {model.model_name}
          </button>
          <div className='text-muted-foreground mt-1 text-xs'>
            {modelKind} · {isRequest ? t('Per Request') : t('Token-based')}
          </div>
        </div>
      </div>

      {isRequest ? (
        <>
          <PriceValue
            label={t('Price')}
            value={requestPrice}
            hint={t('per request')}
          />
          <div className='hidden lg:block' />
          <div className='hidden lg:block' />
          <PriceValue
            label={t('Typical request')}
            value={requestPrice}
            hint={t('per request')}
          />
        </>
      ) : (
        <>
          <PriceValue
            label={t('Input')}
            value={inputPrice}
            hint={t('per 1M tokens')}
          />
          <PriceValue
            label={t('Output')}
            value={outputPrice}
            hint={t('per 1M tokens')}
          />
          <PriceValue
            label={t('Cached input')}
            value={cachePrice}
            hint={t('per 1M tokens')}
          />
          <PriceValue
            label={t('Typical request')}
            value={formatTypicalRequestPrice(model)}
            hint={t('4K input + 1K output')}
          />
        </>
      )}

      <Button
        type='button'
        variant='ghost'
        size='icon'
        onClick={onOpen}
        aria-label={t('Details')}
        title={t('Details')}
        className='hidden lg:inline-flex'
      >
        <ArrowUpRight />
      </Button>
    </div>
  )
}

export function Pricing() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [modelKind, setModelKind] = useState<ModelKind>('all')
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  )

  const {
    models,
    groupRatio,
    usableGroup,
    endpointMap,
    autoGroups,
    isLoading,
    priceRate,
    usdExchangeRate,
  } = usePricingData()

  const filteredModels = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return models
      .filter((model) => {
        if (modelKind === 'text') {
          return model.quota_type === QUOTA_TYPE_VALUES.TOKEN
        }
        if (modelKind === 'image') {
          return model.quota_type === QUOTA_TYPE_VALUES.REQUEST
        }
        return true
      })
      .filter(
        (model) =>
          !normalizedSearch ||
          model.model_name.toLowerCase().includes(normalizedSearch)
      )
      .sort((a, b) => a.model_name.localeCompare(b.model_name))
  }, [modelKind, models, search])

  const selectedModel = useMemo(
    () =>
      selectedModelName
        ? models.find((model) => model.model_name === selectedModelName) || null
        : null,
    [models, selectedModelName]
  )

  if (isLoading) {
    return (
      <PublicLayout showMainContainer={false}>
        <div className='mx-auto w-full max-w-7xl px-4 pt-20 pb-10 sm:px-6'>
          <LoadingSkeleton viewMode='table' />
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <PageTransition className='mx-auto w-full max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-28'>
        <header className='border-border border-b pb-8'>
          <div className='flex flex-col justify-between gap-5 lg:flex-row lg:items-end'>
            <div className='max-w-3xl'>
              <div className='text-muted-foreground flex items-center gap-2 text-xs font-semibold uppercase'>
                <span className='size-1.5 rounded-full bg-emerald-500' />
                {t('Live model catalog')}
              </div>
              <h1 className='mt-4 text-4xl leading-tight font-semibold tracking-normal sm:text-5xl'>
                {t('Transparent API pricing')}
              </h1>
              <p className='text-muted-foreground mt-3 max-w-2xl text-sm leading-6 sm:text-base'>
                {t(
                  'One public price per model. Routing and provider failover never change the price of your request.'
                )}
              </p>
            </div>
            <div className='flex flex-col gap-5 sm:flex-row sm:items-end'>
              <div className='grid grid-cols-2 gap-x-8 gap-y-2 text-sm lg:text-right'>
                <div>
                  <div className='text-muted-foreground'>{t('Models')}</div>
                  <div className='mt-1 font-semibold tabular-nums'>
                    {models.length}
                  </div>
                </div>
                <div>
                  <div className='text-muted-foreground'>{t('Currency')}</div>
                  <div className='mt-1 font-semibold'>USD / USDT</div>
                </div>
              </div>
              <Button
                className='group h-10 rounded-md bg-[#111713] px-4 text-white hover:bg-[#253128] dark:bg-white dark:text-[#111713]'
                render={<Link to='/sign-up' />}
              >
                {t('Create API key')}
                <ArrowRight className='ml-1 size-4 transition-transform group-hover:translate-x-0.5' />
              </Button>
            </div>
          </div>
        </header>

        <section className='border-border grid border-b py-5 sm:grid-cols-3'>
          <div className='py-2 sm:pr-6'>
            <div className='text-sm font-medium'>
              {t('Pay only for actual usage')}
            </div>
            <p className='text-muted-foreground mt-1 text-xs leading-5'>
              {t('Token usage is measured separately for input and output.')}
            </p>
          </div>
          <div className='border-border py-2 sm:border-l sm:px-6'>
            <div className='text-sm font-medium'>
              {t('1 Credit equals 1 USDT')}
            </div>
            <p className='text-muted-foreground mt-1 text-xs leading-5'>
              {t('Your balance and API charges use the same unit.')}
            </p>
          </div>
          <div className='border-border py-2 sm:border-l sm:pl-6'>
            <div className='text-sm font-medium'>
              {t('Stable public pricing')}
            </div>
            <p className='text-muted-foreground mt-1 text-xs leading-5'>
              {t('Automatic failover does not add a surcharge.')}
            </p>
          </div>
        </section>

        <section className='mt-7'>
          <div className='flex flex-col justify-between gap-3 md:flex-row md:items-center'>
            <div className='border-border flex w-fit rounded-lg border p-1'>
              {modelKindOptions.map((option) => {
                const Icon = option.icon
                const selected = modelKind === option.value
                return (
                  <Button
                    key={option.value}
                    type='button'
                    size='sm'
                    variant={selected ? 'secondary' : 'ghost'}
                    onClick={() => setModelKind(option.value)}
                    aria-pressed={selected}
                    className='rounded-md'
                  >
                    <Icon data-icon='inline-start' />
                    {t(option.label)}
                  </Button>
                )
              })}
            </div>

            <div className='relative w-full md:max-w-xs'>
              <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Search model name...')}
                className='pl-8'
              />
            </div>
          </div>

          <div className='border-border bg-background mt-4 overflow-hidden rounded-md border'>
            <div className='bg-muted/40 border-border hidden grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(110px,0.75fr))_40px] gap-4 border-b px-5 py-3 text-xs font-medium lg:grid'>
              <div>{t('Model')}</div>
              <div>{t('Input')}</div>
              <div>{t('Output')}</div>
              <div>{t('Cached input')}</div>
              <div>{t('Typical request')}</div>
              <div />
            </div>
            {filteredModels.length > 0 ? (
              filteredModels.map((model) => (
                <PricingRow
                  key={model.model_name}
                  model={model}
                  onOpen={() => setSelectedModelName(model.model_name)}
                />
              ))
            ) : (
              <div className='text-muted-foreground px-5 py-12 text-center text-sm'>
                {t('No models found')}
              </div>
            )}
          </div>

          <p className='text-muted-foreground mt-4 text-xs leading-5'>
            {t(
              'Typical request is an estimate based on 4K input tokens and 1K output tokens. Final charges follow actual usage.'
            )}
          </p>
        </section>

        {selectedModel && (
          <ModelDetailsDrawer
            open
            onOpenChange={(open) => {
              if (!open) setSelectedModelName(null)
            }}
            model={selectedModel}
            groupRatio={groupRatio}
            usableGroup={usableGroup}
            endpointMap={
              endpointMap as Record<string, { path?: string; method?: string }>
            }
            autoGroups={autoGroups}
            priceRate={priceRate}
            usdExchangeRate={usdExchangeRate}
            tokenUnit='M'
            showRechargePrice={false}
          />
        )}
      </PageTransition>
      <Footer />
    </PublicLayout>
  )
}
