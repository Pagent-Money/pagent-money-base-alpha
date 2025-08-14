'use client'

import { MiniNav } from '../../components/MiniNav'
import { MiniAppLayout } from '../../components/MiniAppLayout'
import { CashbackPromo } from '../../components/features/CashbackPromo'

export default function PromosPage() {
  return (
    <MiniAppLayout title="Pagent Promos">
      <CashbackPromo />
      <MiniNav />
    </MiniAppLayout>
  )
}


