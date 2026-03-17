import { Suspense } from 'react'
import SuccessCard from '@/components/SuccessCard'

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessCard />
    </Suspense>
  )
}
