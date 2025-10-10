export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, price, image, description, category } = body || {}

    if (!name || !price) {
      return NextResponse.json({ ok: false, error: 'name and price are required' }, { status: 400 })
    }

    const doc = {
      name: String(name).trim(),
      price: Number(price),
      image: image ? String(image).trim() : '',
      description: description ? String(description).trim() : '',
      category: category ? String(category).trim() : 'بدون قسم',
      createdAt: new Date(),
    }

    const col = await getCollection('products')
    const result = await col.insertOne(doc)

    return NextResponse.json({ ok: true, id: result.insertedId, product: doc })
  } catch (err) {
    console.error('Create product error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}


