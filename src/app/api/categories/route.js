export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - جلب جميع الأقسام مع منتجاتها
export async function GET(request) {
  try {
    const col = await getCollection('categories')
    const categories = await col.find({}).sort({ order: 1, name: 1 }).toArray()
    
    console.log('Categories with products:', categories)
    
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
      products: [], // مصفوفة المنتجات
      order: body.order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await col.insertOne(doc)

    return NextResponse.json({ ok: true, id: result.insertedId, category: doc })
  } catch (err) {
    console.error('Create category error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}

// PUT - تحديث قسم (إضافة/تعديل/حذف منتج)
export async function PUT(request) {
  try {
    const body = await request.json()
    const { categoryId, action, product } = body || {}

    if (!categoryId || !action) {
      return NextResponse.json({ ok: false, error: 'categoryId and action are required' }, { status: 400 })
    }

    const col = await getCollection('categories')
    
    switch (action) {
      case 'addProduct':
        if (!product || !product.name || !product.price) {
          return NextResponse.json({ ok: false, error: 'Product name and price are required' }, { status: 400 })
        }
        
        const newProduct = {
          id: Date.now().toString(), // معرف مؤقت
          name: String(product.name).trim(),
          price: Number(product.price),
          image: product.image ? String(product.image).trim() : '',
          description: product.description ? String(product.description).trim() : '',
          createdAt: new Date(),
        }
        
        await col.updateOne(
          { _id: new ObjectId(categoryId) },
          { 
            $push: { products: newProduct },
            $set: { updatedAt: new Date() }
          }
        )
        
        return NextResponse.json({ ok: true, product: newProduct })
        
      case 'updateProduct':
        if (!product || !product.id) {
          return NextResponse.json({ ok: false, error: 'Product id is required' }, { status: 400 })
        }
        
        await col.updateOne(
          { _id: new ObjectId(categoryId), 'products.id': product.id },
          { 
            $set: { 
              'products.$.name': String(product.name).trim(),
              'products.$.price': Number(product.price),
              'products.$.image': product.image ? String(product.image).trim() : '',
              'products.$.description': product.description ? String(product.description).trim() : '',
              'products.$.updatedAt': new Date(),
              updatedAt: new Date()
            }
          }
        )
        
        return NextResponse.json({ ok: true })
        
      case 'deleteProduct':
        if (!product || !product.id) {
          return NextResponse.json({ ok: false, error: 'Product id is required' }, { status: 400 })
        }
        
        await col.updateOne(
          { _id: new ObjectId(categoryId) },
          { 
            $pull: { products: { id: product.id } },
            $set: { updatedAt: new Date() }
          }
        )
        
        return NextResponse.json({ ok: true })
        
      default:
        return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (err) {
    console.error('Update category error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}

// DELETE - حذف قسم كامل
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (!categoryId) {
      return NextResponse.json({ ok: false, error: 'Category id is required' }, { status: 400 })
    }

    const col = await getCollection('categories')
    const result = await col.deleteOne({ _id: new ObjectId(categoryId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete category error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}