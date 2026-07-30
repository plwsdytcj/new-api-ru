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
import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'

import type {
  SupportTicket,
  SupportTicketStatus,
  UpdateSupportTicketRequest,
} from '../types'

const STATUS_OPTIONS: SupportTicketStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'rejected',
  'refunded',
]

function statusVariant(status: SupportTicketStatus) {
  if (status === 'rejected') return 'destructive'
  if (status === 'refunded' || status === 'resolved') return 'secondary'
  if (status === 'in_progress') return 'warning'
  return 'outline'
}

interface TicketCardProps {
  ticket: SupportTicket
  admin: boolean
  saving: boolean
  onUpdate: (request: UpdateSupportTicketRequest) => void
}

export function TicketCard(props: TicketCardProps) {
  const { t, i18n } = useTranslation()
  const ticket = props.ticket
  const createdAt = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(ticket.create_time * 1000))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    props.onUpdate({
      status: String(formData.get('status')) as SupportTicketStatus,
      resolution: String(formData.get('resolution') || ''),
      refund_amount: Number(formData.get('refund_amount') || 0),
      refund_transaction: String(formData.get('refund_transaction') || ''),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          <span>#{ticket.id}</span>
          <span>{ticket.subject}</span>
          <Badge variant={statusVariant(ticket.status)}>
            {t(`support.status.${ticket.status}`)}
          </Badge>
        </CardTitle>
        <CardDescription>
          {t(`support.type.${ticket.type}`)} · {createdAt}
          {ticket.username ? ` · ${ticket.username}` : ''}
        </CardDescription>
        {ticket.order_no && (
          <CardAction>
            <span className='font-mono text-xs'>{ticket.order_no}</span>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-sm leading-6 whitespace-pre-wrap'>
          {ticket.description}
        </p>

        {ticket.telegram_username && (
          <a
            className='text-primary inline-flex items-center gap-1 text-sm hover:underline'
            href={`https://t.me/${ticket.telegram_username}`}
            target='_blank'
            rel='noreferrer'
          >
            @{ticket.telegram_username}
            <ExternalLink className='size-3.5' />
          </a>
        )}

        {!props.admin && ticket.resolution && (
          <div className='bg-muted/50 rounded-lg border p-3'>
            <div className='mb-1 text-xs font-medium'>
              {t('support.resolution')}
            </div>
            <p className='text-sm whitespace-pre-wrap'>{ticket.resolution}</p>
            {ticket.refund_transaction && (
              <p className='text-muted-foreground mt-2 font-mono text-xs'>
                {ticket.refund_transaction}
              </p>
            )}
          </div>
        )}

        {props.admin && (
          <form className='grid gap-3 border-t pt-4' onSubmit={handleSubmit}>
            <div className='grid gap-3 md:grid-cols-2'>
              <label className='grid gap-1.5 text-sm'>
                <span>{t('Status')}</span>
                <NativeSelect
                  className='w-full'
                  name='status'
                  defaultValue={ticket.status}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {t(`support.status.${status}`)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              {ticket.type === 'refund' && (
                <label className='grid gap-1.5 text-sm'>
                  <span>{t('support.refundAmount')}</span>
                  <Input
                    name='refund_amount'
                    type='number'
                    min='0'
                    step='0.01'
                    defaultValue={ticket.refund_amount || ''}
                  />
                </label>
              )}
            </div>
            <label className='grid gap-1.5 text-sm'>
              <span>{t('support.resolution')}</span>
              <Textarea
                name='resolution'
                rows={3}
                defaultValue={ticket.resolution}
              />
            </label>
            {ticket.type === 'refund' && (
              <label className='grid gap-1.5 text-sm'>
                <span>{t('support.refundTransaction')}</span>
                <Input
                  name='refund_transaction'
                  defaultValue={ticket.refund_transaction}
                  placeholder='0x...'
                />
              </label>
            )}
            <Button className='justify-self-start' disabled={props.saving}>
              {props.saving ? t('Saving...') : t('Save')}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
