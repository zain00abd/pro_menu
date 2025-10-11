import Link from 'next/link'

export const metadata = {
  title: 'إدارة المطعم',
  description: 'لوحة تحكم إدارة المطعم',
}

export default function AdminLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container">
            <Link className="navbar-brand" href="/admin/new-product">
              🍽️ إدارة المطعم
            </Link>
            <div className="navbar-nav">
              <Link className="nav-link" href="/admin/new-product">
                ➕ منتج جديد
              </Link>
              <Link className="nav-link" href="/admin/category-order">
                📋 ترتيب الأقسام
              </Link>
              <Link className="nav-link" href="/">
                🏠 الصفحة الرئيسية
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
