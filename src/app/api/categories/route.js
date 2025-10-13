export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Headers لمنع التخزين المؤقت
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0'
}

// ============================================
// GET - جلب جميع الأقسام
// ============================================
export async function GET() {
  try {
    const col = await getCollection('categories')
    
    const categories = await col
      .find({})
      .sort({ order: 1, name: 1 })
      .toArray()
    
    return NextResponse.json(
      { ok: true, categories },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (error) {
    console.error('خطأ في جلب الأقسام:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// POST - إنشاء قسم جديد
// ============================================
export async function POST(request) {
  try {
    const { name, order = 0 } = await request.json()

    // التحقق من الاسم
    if (!name || !name.trim()) {
      return NextResponse.json(
        { ok: false, error: 'الاسم مطلوب' },
        { status: 400 }
      )
    }

    const col = await getCollection('categories')
    
    // التحقق من عدم تكرار الاسم
    const exists = await col.findOne({ name: name.trim() })
    if (exists) {
      return NextResponse.json(
        { ok: false, error: 'القسم موجود مسبقاً' },
        { status: 400 }
      )
    }

    // إنشاء القسم الجديد
    const newCategory = {
      name: name.trim(),
      order,
      products: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await col.insertOne(newCategory)

    return NextResponse.json({
      ok: true,
      id: result.insertedId,
      category: newCategory
    })
  } catch (error) {
    console.error('خطأ في إنشاء القسم:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - تحديث (إعادة ترتيب، إضافة، تعديل، حذف)
// ============================================
export async function PUT(request) {
  try {
    const body = await request.json()
    const { action, categoryId, product, categories } = body

    if (!action) {
      return NextResponse.json(
        { ok: false, error: 'action مطلوب' },
        { status: 400 }
      )
    }

    const col = await getCollection('categories')

    // -----------------------------------
    // إعادة ترتيب الأقسام
    // -----------------------------------
    if (action === 'reorderCategories') {
      if (!categories || !Array.isArray(categories)) {
        return NextResponse.json(
          { ok: false, error: 'categories مطلوب' },
          { status: 400 }
        )
      }

      // تحديث ترتيب كل قسم
      const updates = categories.map((cat, index) =>
        col.updateOne(
          { _id: new ObjectId(cat._id) },
          { $set: { order: index, updatedAt: new Date() } }
        )
      )

      await Promise.all(updates)

      return NextResponse.json(
        { ok: true, message: 'تم تحديث الترتيب بنجاح' },
        { headers: NO_CACHE_HEADERS }
      )
    }

    // -----------------------------------
    // إضافة منتج جديد
    // -----------------------------------
    if (action === 'addProduct') {
      if (!categoryId) {
        return NextResponse.json(
          { ok: false, error: 'categoryId مطلوب' },
          { status: 400 }
        )
      }

      if (!product?.name || !product?.price) {
        return NextResponse.json(
          { ok: false, error: 'اسم وسعر المنتج مطلوبان' },
          { status: 400 }
        )
      }

      const newProduct = {
        id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: product.name.trim(),
        price: Number(product.price),
        image: product.image?.trim() || '',
        description: product.description?.trim() || '',
        createdAt: new Date()
      }

      await col.updateOne(
        { _id: new ObjectId(categoryId) },
        {
          $push: { products: newProduct },
          $set: { updatedAt: new Date() }
        }
      )

      return NextResponse.json({ ok: true, product: newProduct })
    }

    // -----------------------------------
    // تحديث منتج موجود
    // -----------------------------------
    if (action === 'updateProduct') {
      if (!categoryId || !product?.id) {
        return NextResponse.json(
          { ok: false, error: 'categoryId و product.id مطلوبان' },
          { status: 400 }
        )
      }

      await col.updateOne(
        { _id: new ObjectId(categoryId), 'products.id': product.id },
        {
          $set: {
            'products.$.name': product.name.trim(),
            'products.$.price': Number(product.price),
            'products.$.image': product.image?.trim() || '',
            'products.$.description': product.description?.trim() || '',
            'products.$.updatedAt': new Date(),
            updatedAt: new Date()
          }
        }
      )

      return NextResponse.json({ ok: true })
    }

    // -----------------------------------
    // حذف منتج
    // -----------------------------------
    if (action === 'deleteProduct') {
      if (!categoryId || !product?.id) {
        return NextResponse.json(
          { ok: false, error: 'categoryId و product.id مطلوبان' },
          { status: 400 }
        )
      }

      await col.updateOne(
        { _id: new ObjectId(categoryId) },
        {
          $pull: { products: { id: product.id } },
          $set: { updatedAt: new Date() }
        }
      )

      return NextResponse.json({ ok: true })
    }

    // إذا كان action غير معروف
    return NextResponse.json(
      { ok: false, error: 'action غير معروف' },
      { status: 400 }
    )
  } catch (error) {
    console.error('خطأ في التحديث:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - حذف قسم كامل
// ============================================
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (!categoryId) {
      return NextResponse.json(
        { ok: false, error: 'id مطلوب' },
        { status: 400 }
      )
    }

    const col = await getCollection('categories')
    const result = await col.deleteOne({ _id: new ObjectId(categoryId) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { ok: false, error: 'القسم غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('خطأ في حذف القسم:', error)
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    )
  }
}
