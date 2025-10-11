export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

// POST - تحويل البيانات من النظام القديم إلى الجديد
export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body || {}
    
    if (action === 'migrate') {
      // جلب البيانات من المصدر القديم
      const oldData = await fetch('https://nextback-seven.vercel.app/datamenu')
      const products = await oldData.json()
      
      if (!Array.isArray(products)) {
        return NextResponse.json({ ok: false, error: 'Invalid data format' }, { status: 400 })
      }
      
      // تجميع المنتجات حسب الأقسام
      const categoriesMap = new Map()
      
      products.forEach(product => {
        const categoryName = product.category || 'بدون قسم'
        
        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, {
            name: categoryName,
            products: [],
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
        
        const category = categoriesMap.get(categoryName)
        category.products.push({
          id: product._id || Date.now().toString() + Math.random(),
          name: product.name || '',
          price: Number(product.price) || 0,
          image: product.image || '',
          description: product.description || '',
          createdAt: new Date()
        })
      })
      
      // حفظ الأقسام في قاعدة البيانات الجديدة
      const categoriesCol = await getCollection('categories')
      
      // مسح البيانات القديمة
      await categoriesCol.deleteMany({})
      
      // إدراج البيانات الجديدة
      const categoriesArray = Array.from(categoriesMap.values())
      const result = await categoriesCol.insertMany(categoriesArray)
      
      return NextResponse.json({ 
        ok: true, 
        message: `تم تحويل ${categoriesArray.length} قسم مع ${products.length} منتج`,
        categories: categoriesArray.length,
        products: products.length
      })
    }
    
    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Migration error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}

