'use client'

import { MiniNav } from '../../components/MiniNav'
import { MiniAppLayout } from '../../components/MiniAppLayout'
import { PagentCredits } from '../../components/features/PagentCredits'

export default function CreditsPage() {
  return (
    <MiniAppLayout title="Pagent Credits">
      <PagentCredits />
      <MiniNav />
    </MiniAppLayout>
  )
}


