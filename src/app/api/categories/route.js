export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

// GET - جلب جميع الأقسام
export async function GET(request) {
  try {
    // جلب الأقسام المخزنة في categories collection
    const categoriesCol = await getCollection('categories')
    const savedCategories = await categoriesCol.find({}).sort({ order: 1, name: 1 }).toArray()
    
    // جلب الأقسام المستخدمة فعلياً في المنتجات
    const productsCol = await getCollection('products')
    const usedCategories = await productsCol.distinct('category')
    
    // دمج الأقسام وإزالة التكرار
    const allCategoryNames = new Set()
    
    // إضافة الأقسام المخزنة
    savedCategories.forEach(cat => {
      if (cat.name) allCategoryNames.add(cat.name)
    })
    
    // إضافة الأقسام المستخدمة
    usedCategories.forEach(cat => {
      if (cat && cat.trim()) allCategoryNames.add(cat)
    })
    
    // تحويل إلى مصفوفة من الكائنات
    const categories = Array.from(allCategoryNames)
      .sort()
      .map(name => ({ name }))
    
    return NextResponse.json({ ok: true, categories })
  } catch (err) {
    console.error('Get categories error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}

// POST - إنشاء قسم جديد
export async function POST(request) {
  try {
    const body = await request.json()
    const { name } = body || {}

    if (!name || !name.trim()) {
      return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 })
    }

    const col = await getCollection('categories')
    
    // التحقق من عدم وجود قسم بنفس الاسم
    const existing = await col.findOne({ name: String(name).trim() })
    if (existing) {
      return NextResponse.json({ ok: false, error: 'Category already exists' }, { status: 400 })
    }

    const doc = {
      name: String(name).trim(),
      order: body.order || 0,
      createdAt: new Date(),
    }

    const result = await col.insertOne(doc)

    return NextResponse.json({ ok: true, id: result.insertedId, category: doc })
  } catch (err) {
    console.error('Create category error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}

