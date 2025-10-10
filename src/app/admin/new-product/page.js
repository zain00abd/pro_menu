"use client"
import { useState } from 'react'

export default function NewProductPage() {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), image, description }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed')
      setMessage('تم إنشاء المنتج بنجاح')
      setName(''); setPrice(''); setImage(''); setDescription('')
    } catch (err) {
      setMessage('حدث خطأ أثناء الإنشاء')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-4" dir="rtl">
      <h2 className="fw-bold mb-3">إنشاء منتج جديد</h2>
      <form onSubmit={submit} className="row g-3" style={{maxWidth: 560}}>
        <div className="col-12">
          <label className="form-label">الاسم</label>
          <input className="form-control" value={name} onChange={e=>setName(e.target.value)} required />
        </div>
        <div className="col-6">
          <label className="form-label">السعر (ل.س)</label>
          <input type="number" className="form-control" value={price} onChange={e=>setPrice(e.target.value)} required />
        </div>
        <div className="col-6">
          <label className="form-label">رابط الصورة</label>
          <input className="form-control" value={image} onChange={e=>setImage(e.target.value)} />
        </div>
        <div className="col-12">
          <label className="form-label">الوصف</label>
          <textarea className="form-control" rows={3} value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <div className="col-12">
          <button className="btn btn-primary" disabled={submitting}>{submitting ? 'جارٍ الإرسال...' : 'إنشاء'}</button>
        </div>
        {message && <div className="col-12 text-success">{message}</div>}
      </form>
    </div>
  )
}



