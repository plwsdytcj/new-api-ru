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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { useIsAdmin } from '@/hooks/use-admin'
import { useStatus } from '@/hooks/use-status'

import {
  createSupportTicket,
  listSupportTickets,
  updateSupportTicket,
} from './api'
import { CreateTicketForm } from './components/create-ticket-form'
import { TicketCard } from './components/ticket-card'
import type {
  CreateSupportTicketRequest,
  UpdateSupportTicketRequest,
} from './types'

export function Support() {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()
  const queryClient = useQueryClient()
  const { status } = useStatus()
  const telegramURL = String(status?.support_telegram_url || '')
  const telegramName = String(
    status?.support_telegram_name || t('support.telegram')
  )
  const queryKey = ['support-tickets', isAdmin]

  const ticketsQuery = useQuery({
    queryKey,
    queryFn: () => listSupportTickets(isAdmin),
  })
  const createMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: async (response) => {
      if (!response.success) {
        toast.error(response.message || t('support.createFailed'))
        return
      }
      toast.success(t('support.created'))
      await queryClient.invalidateQueries({ queryKey })
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number
      request: UpdateSupportTicketRequest
    }) => updateSupportTicket(id, request),
    onSuccess: async (response) => {
      if (!response.success) {
        toast.error(response.message || t('support.updateFailed'))
        return
      }
      toast.success(t('support.updated'))
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const handleCreate = async (request: CreateSupportTicketRequest) => {
    const response = await createMutation.mutateAsync(request)
    return response.success
  }

  const tickets = ticketsQuery.data?.data?.items || []

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {isAdmin ? t('support.adminTitle') : t('support.title')}
      </SectionPageLayout.Title>
      {telegramURL && (
        <SectionPageLayout.Actions>
          <Button
            variant='outline'
            render={
              <a href={telegramURL} target='_blank' rel='noreferrer'>
                <MessageCircle />
                {telegramName}
                <ExternalLink />
              </a>
            }
          />
        </SectionPageLayout.Actions>
      )}
      <SectionPageLayout.Content>
        <div className='grid gap-6'>
          {!isAdmin && (
            <CreateTicketForm
              submitting={createMutation.isPending}
              onSubmit={handleCreate}
            />
          )}

          <section className='grid gap-3'>
            <div>
              <h2 className='text-lg font-semibold'>
                {isAdmin ? t('support.allTickets') : t('support.myTickets')}
              </h2>
              <p className='text-muted-foreground text-sm'>
                {t('support.listDescription')}
              </p>
            </div>

            {ticketsQuery.isLoading && (
              <div className='text-muted-foreground py-8 text-sm'>
                {t('Loading...')}
              </div>
            )}
            {!ticketsQuery.isLoading && tickets.length === 0 && (
              <div className='text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm'>
                {t('support.empty')}
              </div>
            )}
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                admin={isAdmin}
                saving={updateMutation.isPending}
                onUpdate={(request) =>
                  updateMutation.mutate({ id: ticket.id, request })
                }
              />
            ))}
          </section>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
