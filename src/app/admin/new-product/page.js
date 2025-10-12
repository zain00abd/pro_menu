"use client"
import { useState, useEffect } from 'react'
import Image from 'next/image'
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
  const [imageType, setImageType] = useState('url') // 'url' or 'upload'
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  // جلب الأقسام عند تحميل الصفحة
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' })
      const data = await res.json()
      console.log('Fetched categories data:', data)
      if (data.ok && data.categories) {
        console.log('Setting categories:', data.categories)
        setCategories(data.categories)
      } else {
        console.error('Failed to fetch categories:', data)
      }
    } catch (err) {
      console.error('خطأ في جلب الأقسام', err)
    }
  }

  // دالة التعامل مع رفع الصور
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        alert('الرجاء اختيار ملف صورة صالح')
        return
      }
      
      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً. الحد الأقصى 5MB')
        return
      }
      
      setUploadedImage(file)
      
      // إنشاء معاينة للصورة
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // دالة تحويل الصورة إلى base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const addNewCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('الرجاء إدخال اسم القسم')
      return
    }
    
    const categoryNameToAdd = newCategoryName.trim()
    
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryNameToAdd }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        // إذا كان القسم موجود مسبقاً، لا بأس
        if (res.status === 400 && data.error.includes('already exists')) {
          // فقط اختره
          setCategory(categoryNameToAdd)
          setNewCategoryName('')
          setShowNewCategory(false)
          return
        }
        throw new Error(data.error || 'Request failed')
      }
      
      // إضافة القسم الجديد مباشرة للقائمة
      setCategories(prev => [...prev, { name: categoryNameToAdd }].sort((a, b) => a.name.localeCompare(b, 'ar')))
      setCategory(categoryNameToAdd)
      setMessage('تم إضافة القسم بنجاح')
      setNewCategoryName('')
      setShowNewCategory(false)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      alert('حدث خطأ: ' + err.message)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    
    if (!category) {
      alert('الرجاء اختيار قسم للمنتج')
      setSubmitting(false)
      return
    }
    
    try {
      // البحث عن القسم المحدد
      const selectedCategory = categories.find(cat => cat.name === category)
      
      if (!selectedCategory) {
        alert('القسم المحدد غير موجود')
        setSubmitting(false)
        return
      }
      
      let finalImage = image
      
      // إذا كان المستخدم اختار رفع صورة
      if (imageType === 'upload' && uploadedImage) {
        finalImage = await convertImageToBase64(uploadedImage)
      }
      
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          categoryId: selectedCategory._id,
          action: 'addProduct',
          product: { 
            name, 
            price: Number(price), 
            image: finalImage, 
            description 
          }
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed')
      
      setMessage('تم إنشاء المنتج بنجاح')
      // إعادة تعيين جميع الحقول
      setName('')
      setPrice('')
      setImage('')
      setDescription('')
      setCategory('')
      setUploadedImage(null)
      setImagePreview('')
      
      // تحديث قائمة الأقسام لإظهار المنتج الجديد
      fetchCategories()
    } catch (err) {
      setMessage('حدث خطأ أثناء الإنشاء: ' + err.message)
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
              <label className="form-label">الصورة</label>
              
              {/* أزرار التبديل بين نوعي الصورة */}
              <div className="image-type-toggle">
                <button 
                  type="button"
                  className={`toggle-btn ${imageType === 'url' ? 'active' : ''}`}
                  onClick={() => {
                    setImageType('url')
                    setUploadedImage(null)
                    setImagePreview('')
                  }}
                >
                  🔗 رابط
                </button>
                <button 
                  type="button"
                  className={`toggle-btn ${imageType === 'upload' ? 'active' : ''}`}
                  onClick={() => {
                    setImageType('upload')
                    setImage('')
                  }}
                >
                  📁 رفع صورة
                </button>
              </div>
              
              {/* حقل رابط الصورة */}
              {imageType === 'url' && (
                <input 
                  className="form-control" 
                  value={image} 
                  onChange={e=>setImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              )}
              
              {/* حقل رفع الصورة */}
              {imageType === 'upload' && (
                <div className="image-upload-section">
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                    id="imageUpload"
                  />
                  <label htmlFor="imageUpload" className="file-input-label">
                    📁 اختر صورة من الجهاز
                  </label>
                  
                  {/* معاينة الصورة */}
                  {imagePreview && (
                    <div className="image-preview">
                      <Image 
                        src={imagePreview} 
                        alt="معاينة الصورة" 
                        width={200}
                        height={150}
                        style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px' }}
                      />
                      <button 
                        type="button"
                        className="remove-image-btn"
                        onClick={() => {
                          setUploadedImage(null)
                          setImagePreview('')
                        }}
                      >
                        ❌ إزالة الصورة
                      </button>
                    </div>
                  )}
                </div>
              )}
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



