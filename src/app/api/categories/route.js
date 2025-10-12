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
    
    // تحسين الاستعلام لاسترجاع البيانات الأساسية فقط
    const categories = await col.find({}, {
      projection: {
        _id: 1,
        name: 1,
        order: 1,
        products: 1,
        updatedAt: 1
      }
    }).sort({ order: 1, name: 1 }).toArray()
    
    // تحسين البيانات قبل الإرسال
    const optimizedCategories = categories.map(category => ({
      _id: category._id,
      name: category.name,
      order: category.order || 0,
      products: (category.products || []).map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description
      })),
      updatedAt: category.updatedAt
    }))
    
    return NextResponse.json({ 
      ok: true, 
      categories: optimizedCategories,
      timestamp: Date.now() // إضافة timestamp للتخزين المؤقت
    })
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

    if (!action) {
      return NextResponse.json({ ok: false, error: 'action is required' }, { status: 400 })
    }

    const col = await getCollection('categories')
    
    switch (action) {
      case 'reorderCategories':
        console.log('Reordering categories:', body.categories)
        if (!body.categories || !Array.isArray(body.categories)) {
          return NextResponse.json({ ok: false, error: 'categories array is required' }, { status: 400 })
        }
        
        // تحديث ترتيب جميع الأقسام
        const updatePromises = body.categories.map((cat, index) => {
          try {
            console.log(`Updating category ${cat._id} to order ${index}`)
            return col.updateOne(
              { _id: new ObjectId(cat._id) },
              { 
                $set: { 
                  order: index,
                  updatedAt: new Date()
                }
              }
            )
          } catch (error) {
            console.error(`Error updating category ${cat._id}:`, error)
            return Promise.resolve({ matchedCount: 0, modifiedCount: 0 })
          }
        })
        
        const results = await Promise.all(updatePromises)
        console.log('Update results:', results)
        return NextResponse.json({ ok: true, message: 'Categories reordered successfully' })
        
      case 'addProduct':
        if (!categoryId) {
          return NextResponse.json({ ok: false, error: 'categoryId is required for addProduct' }, { status: 400 })
        }
        if (!product || !product.name || !product.price) {
          return NextResponse.json({ ok: false, error: 'Product name and price are required' }, { status: 400 })
        }
        
        const newProduct = {
          id: `product-${Math.random().toString(36).substr(2, 9)}`, // معرف مؤقت آمن
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
        if (!categoryId) {
          return NextResponse.json({ ok: false, error: 'categoryId is required for updateProduct' }, { status: 400 })
        }
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
        if (!categoryId) {
          return NextResponse.json({ ok: false, error: 'categoryId is required for deleteProduct' }, { status: 400 })
        }
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