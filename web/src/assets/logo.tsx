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
import { type SVGProps } from 'react'

import { cn } from '@/lib/utils'

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      id='newapi-logo'
      viewBox='0 0 64 64'
      xmlns='http://www.w3.org/2000/svg'
      height='64'
      width='64'
      className={cn('size-6', className)}
      {...props}
    >
      <title>RussiaAPI</title>
      <rect x='3' y='3' width='58' height='58' rx='15' fill='#14233d' />
      <path
        d='M20 47V17h14c8.3 0 13 4.4 13 11.6 0 6.2-4.1 10.3-11 11.2L47.5 49'
        fill='none'
        stroke='#fff'
        strokeWidth='7'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx='48.5' cy='49.5' r='6' fill='#e5484d' />
    </svg>
  )
}
