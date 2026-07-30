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
import { api } from '@/lib/api'

import type {
  CreateSupportTicketRequest,
  SupportTicket,
  SupportTicketPage,
  UpdateSupportTicketRequest,
} from './types'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

export async function listSupportTickets(admin: boolean) {
  const endpoint = admin ? '/api/support/admin/tickets' : '/api/support/tickets'
  const response = await api.get<ApiResponse<SupportTicketPage>>(endpoint, {
    params: { page: 1, page_size: 100 },
  })
  return response.data
}

export async function createSupportTicket(request: CreateSupportTicketRequest) {
  const response = await api.post<ApiResponse<SupportTicket>>(
    '/api/support/tickets',
    request
  )
  return response.data
}

export async function updateSupportTicket(
  id: number,
  request: UpdateSupportTicketRequest
) {
  const response = await api.patch<ApiResponse<SupportTicket>>(
    `/api/support/admin/tickets/${id}`,
    request
  )
  return response.data
}
