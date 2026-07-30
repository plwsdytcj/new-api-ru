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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'

import type { CreateSupportTicketRequest, SupportTicketType } from '../types'

interface CreateTicketFormProps {
  submitting: boolean
  onSubmit: (request: CreateSupportTicketRequest) => Promise<boolean>
}

export function CreateTicketForm(props: CreateTicketFormProps) {
  const { t } = useTranslation()
  const [ticketType, setTicketType] = useState<SupportTicketType>('general')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const success = await props.onSubmit({
      type: ticketType,
      subject: String(formData.get('subject') || ''),
      description: String(formData.get('description') || ''),
      order_no: String(formData.get('order_no') || ''),
      telegram_username: String(formData.get('telegram_username') || ''),
    })
    if (success) {
      form.reset()
      setTicketType('general')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('support.newTicket')}</CardTitle>
        <CardDescription>{t('support.newTicketDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className='grid gap-4' onSubmit={handleSubmit}>
          <label className='grid gap-1.5 text-sm'>
            <span>{t('support.ticketType')}</span>
            <NativeSelect
              className='w-full'
              value={ticketType}
              onChange={(event) =>
                setTicketType(event.target.value as SupportTicketType)
              }
            >
              <NativeSelectOption value='general'>
                {t('support.type.general')}
              </NativeSelectOption>
              <NativeSelectOption value='payment_appeal'>
                {t('support.type.payment_appeal')}
              </NativeSelectOption>
              <NativeSelectOption value='refund'>
                {t('support.type.refund')}
              </NativeSelectOption>
            </NativeSelect>
          </label>
          {ticketType !== 'general' && (
            <label className='grid gap-1.5 text-sm'>
              <span>{t('support.orderNumber')}</span>
              <Input
                name='order_no'
                required
                placeholder='DEPAY-...'
                autoComplete='off'
              />
            </label>
          )}
          <label className='grid gap-1.5 text-sm'>
            <span>{t('support.subject')}</span>
            <Input name='subject' required minLength={3} maxLength={160} />
          </label>
          <label className='grid gap-1.5 text-sm'>
            <span>{t('support.description')}</span>
            <Textarea
              name='description'
              required
              minLength={10}
              maxLength={5000}
              rows={5}
            />
          </label>
          <label className='grid gap-1.5 text-sm'>
            <span>{t('support.telegramUsername')}</span>
            <Input
              name='telegram_username'
              placeholder='username'
              autoComplete='off'
            />
          </label>
          <Button className='justify-self-start' disabled={props.submitting}>
            {props.submitting ? t('Submitting...') : t('Submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
