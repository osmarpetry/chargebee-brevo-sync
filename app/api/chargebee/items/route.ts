import { listItemPrices } from '@/lib/chargebee'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const items = await listItemPrices()
    return NextResponse.json(items)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
