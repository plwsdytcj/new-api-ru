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
export type SupportTicketType = 'general' | 'payment_appeal' | 'refund'
export type SupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'refunded'

export interface SupportTicket {
  id: number
  user_id: number
  username?: string
  type: SupportTicketType
  subject: string
  description: string
  order_no: string
  telegram_username: string
  status: SupportTicketStatus
  resolution: string
  refund_amount: number
  refund_transaction: string
  admin_id: number
  create_time: number
  update_time: number
}

export interface SupportTicketPage {
  page: number
  page_size: number
  total: number
  items: SupportTicket[]
}

export interface CreateSupportTicketRequest {
  type: SupportTicketType
  subject: string
  description: string
  order_no: string
  telegram_username: string
}

export interface UpdateSupportTicketRequest {
  status: SupportTicketStatus
  resolution: string
  refund_amount: number
  refund_transaction: string
}
