'use client'

import { MiniNav } from '../../components/MiniNav'
import { MiniAppLayout } from '../../components/MiniAppLayout'
import { PagentCard } from '../../components/features/PagentCard'

export default function CardsPage() {
  return (
    <MiniAppLayout title="Pagent Cards">
      <PagentCard />
      <MiniNav />
    </MiniAppLayout>
  )
}


