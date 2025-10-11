"use client"
import { useState, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'

export default function CategoryOrderPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/categories?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      
      if (data.ok && data.categories) {
        // ترتيب الأقسام حسب order
        const sortedCategories = data.categories.sort((a, b) => (a.order || 0) - (b.order || 0))
        setCategories(sortedCategories)
      } else {
        setMessage('خطأ في جلب الأقسام')
      }
    } catch (err) {
      console.error('خطأ في جلب الأقسام', err)
      setMessage('خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const moveCategory = (fromIndex, toIndex) => {
    const newCategories = [...categories]
    const [movedCategory] = newCategories.splice(fromIndex, 1)
    newCategories.splice(toIndex, 0, movedCategory)
    setCategories(newCategories)
  }

  const saveOrder = async () => {
    try {
      setSaving(true)
      setMessage('')
      
      const res = await fetch(`/api/categories?t=${Date.now()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorderCategories',
          categories: categories.map((cat, index) => ({
            _id: cat._id,
            order: index
          }))
        })
      })
      
      const data = await res.json()
      
      if (data.ok) {
        setMessage('✅ تم حفظ ترتيب الأقسام بنجاح')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(`❌ خطأ: ${data.error}`)
      }
    } catch (err) {
      console.error('خطأ في حفظ الترتيب', err)
      setMessage('❌ خطأ في الاتصال بالخادم')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-4" dir="rtl">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">جارٍ التحميل...</span>
          </div>
          <p className="mt-2">جارٍ تحميل الأقسام...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4" dir="rtl">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">📋 ترتيب أقسام القائمة</h4>
            </div>
            <div className="card-body">
              {message && (
                <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
                  {message}
                </div>
              )}
              
              <p className="text-muted mb-4">
                اسحب الأقسام لترتيبها حسب الأولوية. سيظهر الترتيب في الصفحة الرئيسية.
              </p>
              
              <div className="category-list">
                {categories.map((category, index) => (
                  <div
                    key={category._id}
                    className="category-item"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', index.toString())
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                      moveCategory(fromIndex, index)
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div className="drag-handle me-3">
                          <i className="fas fa-grip-vertical text-muted"></i>
                        </div>
                        <div>
                          <h6 className="mb-1">{category.name}</h6>
                          <small className="text-muted">
                            {category.products?.length || 0} منتج
                          </small>
                        </div>
                      </div>
                      <div className="order-number">
                        <span className="badge bg-secondary">{index + 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {categories.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted">لا توجد أقسام متاحة</p>
                </div>
              )}
              
              <div className="mt-4 d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={saveOrder}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      جاري الحفظ...
                    </>
                  ) : (
                    '💾 حفظ الترتيب'
                  )}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={fetchCategories}
                  disabled={saving}
                >
                  🔄 إعادة تحميل
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .category-item {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 10px;
          cursor: move;
          transition: all 0.2s ease;
        }
        
        .category-item:hover {
          background: #e9ecef;
          border-color: #adb5bd;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .category-item:active {
          transform: scale(0.98);
        }
        
        .drag-handle {
          cursor: grab;
        }
        
        .drag-handle:active {
          cursor: grabbing;
        }
        
        .order-number {
          font-size: 1.1rem;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}
