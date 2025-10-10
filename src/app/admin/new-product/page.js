"use client"
import { useState, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import './style.css'

export default function NewProductPage() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // جلب الأقسام عند تحميل الصفحة
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (data.ok && data.categories) {
        setCategories(data.categories)
      }
    } catch (err) {
      console.error('خطأ في جلب الأقسام', err)
    }
  }

  const addNewCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('الرجاء إدخال اسم القسم')
      return
    }
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed')
      
      setMessage('تم إضافة القسم بنجاح')
      setNewCategoryName('')
      setShowNewCategory(false)
      fetchCategories() // تحديث قائمة الأقسام
      setCategory(newCategoryName) // تعيين القسم الجديد كقسم محدد
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert('حدث خطأ: ' + err.message)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), image, description, category }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed')
      setMessage('تم إنشاء المنتج بنجاح')
      setName(''); setPrice(''); setImage(''); setDescription(''); setCategory('')
    } catch (err) {
      setMessage('حدث خطأ أثناء الإنشاء')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-container" dir="rtl">
      <div className="admin-card">
        <h2>✨ إنشاء منتج جديد</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label className="form-label">اسم المنتج</label>
            <input 
              className="form-control" 
              value={name} 
              onChange={e=>setName(e.target.value)} 
              placeholder="مثال: شاورما عربي"
              required 
            />
          </div>

          <div className="form-grid">
            <div>
              <label className="form-label">السعر (ل.س)</label>
              <input 
                type="number" 
                className="form-control" 
                value={price} 
                onChange={e=>setPrice(e.target.value)} 
                placeholder="0"
                required 
              />
            </div>
            <div>
              <label className="form-label">رابط الصورة</label>
              <input 
                className="form-control" 
                value={image} 
                onChange={e=>setImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">القسم</label>
            <div className="input-group-custom">
              <select 
                className="form-control" 
                style={{flex: 1}}
                value={category} 
                onChange={e=>setCategory(e.target.value)}
              >
                <option value="">بدون قسم</option>
                {categories.map((cat, idx) => (
                  <option key={cat._id || idx} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <button 
                type="button" 
                className="btn-outline-custom"
                onClick={() => setShowNewCategory(!showNewCategory)}
              >
                {showNewCategory ? 'إلغاء' : '➕ قسم جديد'}
              </button>
            </div>
          </div>

          {showNewCategory && (
            <div className="category-add-section">
              <div className="input-group-custom">
                <input 
                  className="form-control" 
                  style={{flex: 1}}
                  placeholder="اسم القسم الجديد"
                  value={newCategoryName} 
                  onChange={e=>setNewCategoryName(e.target.value)} 
                />
                <button 
                  type="button" 
                  className="btn-success-custom"
                  onClick={addNewCategory}
                >
                  ✓ إضافة
                </button>
              </div>
            </div>
          )}

          <div className="form-row">
            <label className="form-label">الوصف</label>
            <textarea 
              className="form-control" 
              rows={4} 
              value={description} 
              onChange={e=>setDescription(e.target.value)}
              placeholder="وصف مختصر للمنتج..."
            />
          </div>

          <button 
            className="btn-primary-custom" 
            disabled={submitting}
          >
            {submitting ? '⏳ جارٍ الإرسال...' : '✓ إنشاء المنتج'}
          </button>

          {message && (
            <div className="alert-success-custom">
              ✓ {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}



