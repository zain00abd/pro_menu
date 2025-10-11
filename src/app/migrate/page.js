"use client"
import { useState } from 'react'

export default function MigratePage() {
  const [migrating, setMigrating] = useState(false)
  const [message, setMessage] = useState('')

  const handleMigrate = async () => {
    setMigrating(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'migrate' })
      })
      
      const data = await res.json()
      
      if (data.ok) {
        setMessage(`✅ ${data.message}`)
      } else {
        setMessage(`❌ خطأ: ${data.error}`)
      }
    } catch (err) {
      setMessage(`❌ خطأ في الاتصال: ${err.message}`)
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>🔄 تحويل البيانات</h1>
      <p>هذه الصفحة تحول البيانات من النظام القديم إلى النظام الجديد.</p>
      
      <button 
        onClick={handleMigrate}
        disabled={migrating}
        style={{
          padding: '12px 24px',
          backgroundColor: migrating ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: migrating ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        {migrating ? 'جاري التحويل...' : 'بدء التحويل'}
      </button>
      
      {message && (
        <div style={{
          padding: '12px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          color: message.includes('✅') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>ما يحدث أثناء التحويل:</h3>
        <ul>
          <li>جلب البيانات من المصدر القديم</li>
          <li>تجميع المنتجات حسب الأقسام</li>
          <li>حفظ البيانات في النظام الجديد</li>
          <li>مسح البيانات القديمة</li>
        </ul>
      </div>
    </div>
  )
}

