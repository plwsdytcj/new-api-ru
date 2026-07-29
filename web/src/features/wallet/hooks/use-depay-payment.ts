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
import i18next from 'i18next'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { isApiSuccess, requestDePayPayment } from '../api'

const DEPAY_WIDGET_URL = 'https://integrate.depay.com/widgets/v13.js'

interface DePayWidgetOptions {
  integration: string
  payload: {
    trade_no: string
  }
}

interface DePayWidgets {
  Payment: (options: DePayWidgetOptions) => Promise<unknown>
}

declare global {
  interface Window {
    DePayWidgets?: DePayWidgets
  }
}

let widgetPromise: Promise<DePayWidgets> | null = null

function loadDePayWidget(): Promise<DePayWidgets> {
  if (window.DePayWidgets) {
    return Promise.resolve(window.DePayWidgets)
  }
  if (widgetPromise) {
    return widgetPromise
  }

  widgetPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${DEPAY_WIDGET_URL}"]`
    )
    const script = existing || document.createElement('script')

    const handleLoad = () => {
      if (window.DePayWidgets) {
        resolve(window.DePayWidgets)
      } else {
        widgetPromise = null
        reject(new Error('DePay widget did not initialize'))
      }
    }
    const handleError = () => {
      widgetPromise = null
      reject(new Error('Failed to load DePay widget'))
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
    if (!existing) {
      script.src = DEPAY_WIDGET_URL
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })

  return widgetPromise
}

export function useDePayPayment() {
  const [processing, setProcessing] = useState(false)

  const processDePayPayment = useCallback(async (topupAmount: number) => {
    setProcessing(true)
    try {
      const response = await requestDePayPayment({
        amount: Math.floor(topupAmount),
      })
      if (
        !isApiSuccess(response) ||
        !response.data?.integration_id ||
        !response.data?.order_id
      ) {
        toast.error(response.message || i18next.t('Payment request failed'))
        return false
      }

      const widget = await loadDePayWidget()
      await widget.Payment({
        integration: response.data.integration_id,
        payload: { trade_no: response.data.order_id },
      })
      await new Promise((resolve) => window.setTimeout(resolve, 1500))
      return true
    } catch {
      toast.error(i18next.t('Payment request failed'))
      return false
    } finally {
      setProcessing(false)
    }
  }, [])

  return { processing, processDePayPayment }
}
