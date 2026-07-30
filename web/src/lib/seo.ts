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

type SEOPage = {
  title: string
  description: string
  indexable: boolean
}

const HOME_DESCRIPTION =
  'Единый OpenAI-совместимый API для доступа к GPT, Claude, Gemini и DeepSeek из России. Маршрутизация, резервирование и прозрачный учёт.'

const PUBLIC_PAGES: Record<string, SEOPage> = {
  '/': {
    title: 'RussiaAPI — единый API для GPT, Claude, Gemini и DeepSeek',
    description: HOME_DESCRIPTION,
    indexable: true,
  },
  '/pricing': {
    title: 'Цены на API GPT, Claude, Gemini и DeepSeek — RussiaAPI',
    description:
      'Актуальные цены RussiaAPI на входные и выходные токены GPT, Claude, Gemini и DeepSeek. Оплата по фактическому использованию.',
    indexable: true,
  },
  '/docs': {
    title:
      'Документация RussiaAPI — подключение OpenAI API, Claude Code и Codex',
    description:
      'Русская документация RussiaAPI: получение API-ключа, OpenAI-совместимые запросы, настройка Claude Code, Codex и обработка ошибок.',
    indexable: true,
  },
  '/about': {
    title: 'О RussiaAPI — инфраструктура доступа к ИИ-моделям',
    description:
      'RussiaAPI объединяет доступ к ведущим ИИ-моделям через совместимый API с маршрутизацией, резервированием и контролем расходов.',
    indexable: true,
  },
  '/user-agreement': {
    title: 'Пользовательское соглашение — RussiaAPI',
    description:
      'Условия использования сервиса RussiaAPI, правила доступа к API, обязанности пользователя и ограничения предоставляемых услуг.',
    indexable: true,
  },
  '/privacy-policy': {
    title: 'Политика конфиденциальности — RussiaAPI',
    description:
      'Информация о сборе, обработке, хранении и защите персональных данных пользователей RussiaAPI.',
    indexable: true,
  },
  '/refund-policy': {
    title: 'Правила возврата средств — RussiaAPI',
    description:
      'Условия и порядок рассмотрения запросов на возврат неиспользованного баланса и ошибочных платежей в RussiaAPI.',
    indexable: true,
  },
  '/billing-policy': {
    title: 'Правила тарификации — RussiaAPI',
    description:
      'Правила расчёта стоимости запросов, списания баланса и отображения использования моделей в RussiaAPI.',
    indexable: true,
  },
  '/receipt-policy': {
    title: 'Информация о платежах и чеках — RussiaAPI',
    description:
      'Информация RussiaAPI о подтверждении платежей, истории операций и документах, связанных с пополнением баланса.',
    indexable: true,
  },
}

function normalizePathname(pathname: string): string {
  const normalized = `/${pathname}`
    .replaceAll(/\/+/g, '/')
    .replace(/\/$/, '')
  return normalized || '/'
}

function runtimePublicURL(): string {
  const configured = (
    window as Window & {
      __RUNTIME_CONFIG__?: { publicUrl?: string }
    }
  ).__RUNTIME_CONFIG__?.publicUrl
  return (configured || window.location.origin).replace(/\/$/, '')
}

function setNamedMeta(name: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`
  )
  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.appendChild(element)
  }
  element.content = content
}

function setPropertyMeta(property: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`
  )
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.content = content
}

function setCanonical(href: string) {
  let element = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  )
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = href
}

export function syncSEOForPath(pathname: string) {
  const normalizedPath = normalizePathname(pathname)
  const page = PUBLIC_PAGES[normalizedPath] || {
    title: 'RussiaAPI',
    description: HOME_DESCRIPTION,
    indexable: false,
  }
  const canonical =
    normalizedPath === '/'
      ? `${runtimePublicURL()}/`
      : `${runtimePublicURL()}${normalizedPath}`
  const robots = page.indexable
    ? 'index, follow, max-image-preview:large'
    : 'noindex, nofollow'

  document.documentElement.lang = 'ru'
  document.title = page.title
  setNamedMeta('title', page.title)
  setNamedMeta('description', page.description)
  setNamedMeta('robots', robots)
  setCanonical(canonical)
  setPropertyMeta('og:locale', 'ru_RU')
  setPropertyMeta('og:type', 'website')
  setPropertyMeta('og:site_name', 'RussiaAPI')
  setPropertyMeta('og:title', page.title)
  setPropertyMeta('og:description', page.description)
  setPropertyMeta('og:url', canonical)
  setNamedMeta('twitter:card', 'summary')
  setNamedMeta('twitter:title', page.title)
  setNamedMeta('twitter:description', page.description)
}
