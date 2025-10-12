"use client"
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";

export default function Menu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [deliveryType, setDeliveryType] = useState(''); // 'delivery' or 'pickup'
  const [address, setAddress] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        if (!res.ok) throw new Error('فشل جلب البيانات');
        const data = await res.json();
        if (!Array.isArray(data.categories)) throw new Error('صيغة بيانات غير صحيحة');
        if (!isMounted) return;
        
        // تحويل البيانات من النظام الجديد إلى النظام القديم للتوافق
        const allItems = [];
        // ترتيب الأقسام حسب order
        const sortedCategories = data.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
        sortedCategories.forEach(category => {
          if (category.products && Array.isArray(category.products)) {
            category.products.forEach(product => {
              allItems.push({
                id: product.id || `product-${Math.random().toString(36).substr(2, 9)}`,
                name: product.name || '',
                desc: product.description || '',
                price: Number(product.price) || 0,
                img: product.image || '',
                category: category.name || 'بدون قسم'
              });
            });
          }
        });
        
        setItems(allItems);
        setQuantities(Array(allItems.length).fill(0));
      } catch (e) {
        if (isMounted) setError(e?.message || 'خطأ غير متوقع');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false };
  }, []);
  const formatNumber = (value) => new Intl.NumberFormat('ar-SY-u-nu-latn', { maximumFractionDigits: 0 }).format(value);

  const handleAdd = (index) => {
    setQuantities((prev) => {
      const next = [...prev];
      next[index] = 1;
      return next;
    });
  };

  const handleIncrease = (index) => {
    setQuantities((prev) => {
      const next = [...prev];
      next[index] += 1;
      return next;
    });
  };

  const handleDecrease = (index) => {
    setQuantities((prev) => {
      const next = [...prev];
      if (next[index] > 1) next[index] -= 1; else next[index] = 0;
      return next;
    });
  };

  const totalPrice = quantities.reduce((sum, q, i) => sum + q * (items[i]?.price || 0), 0);

  // الحصول على المنتجات المطلوبة
  const getOrderedItems = () => {
    return items.filter((item, idx) => quantities[idx] > 0).map((item, idx) => {
      const originalIndex = items.findIndex(i => i.id === item.id);
      return {
        ...item,
        quantity: quantities[originalIndex],
        total: quantities[originalIndex] * item.price
      };
    });
  };

  // إرسال الطلب
  const handleSendOrder = () => {
    const orderedItems = getOrderedItems();
    if (orderedItems.length === 0) {
      alert('الرجاء اختيار منتج واحد على الأقل');
      return;
    }
    setShowOrderModal(true);
  };

  // إرسال إلى واتساب
  const sendToWhatsApp = () => {
    if (!customerName.trim()) {
      alert('الرجاء إدخال الاسم');
      return;
    }
    if (!deliveryType) {
      alert('الرجاء اختيار طريقة الاستلام');
      return;
    }
    if (deliveryType === 'delivery' && !address.trim()) {
      alert('الرجاء إدخال عنوان التوصيل');
      return;
    }

    const orderedItems = getOrderedItems();
    
    // الحصول على التاريخ والوقت
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${day}/${month}/${year}`;
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    let message = '🛒 *طلب جديد*\n\n';
    
    // معلومات العميل
    message += `👤 *الاسم:* ${customerName}\n`;
    message += `📅 *التاريخ:* ${dateStr}\n`;
    message += `🕐 *الوقت:* ${timeStr}\n\n`;
    message += `━━━━━━━━━━━━━━\n\n`;
    
    // المنتجات المطلوبة
    orderedItems.forEach((item, idx) => {
      message += `${idx + 1}. ${item.name} => *( ${item.quantity} )*\n`;
    });

    message += `\n━━━━━━━━━━━━━━\n`;
    message += `💰 *المجموع: ${formatNumber(totalPrice)} ل.س*\n`;
    message += `━━━━━━━━━━━━━━\n\n`;
    
    // طريقة الاستلام
    if (deliveryType === 'delivery') {
      message += `🚗 توصيل\n`;
      message += `📍 ${address}`;
    } else {
      message += `🏪 استلام من المطعم`;
    }

    const encodedMessage = encodeURIComponent(message);
    window.location.href = `https://wa.me/+963964355255?text=${encodedMessage}`;
    
    // إغلاق النافذة وإعادة تعيين
    setShowOrderModal(false);
    setDeliveryType('');
    setAddress('');
    setCustomerName('');
  };
  
  // تجميع المنتجات حسب الأقسام
  const groupedByCategory = {};
  items.forEach(item => {
    const cat = item.category || 'بدون قسم';
    if (!groupedByCategory[cat]) {
      groupedByCategory[cat] = [];
    }
    groupedByCategory[cat].push(item);
  });

  const categoryNames = Object.keys(groupedByCategory);

  // تعيين القسم الأول كنشط عند التحميل
  useEffect(() => {
    if (categoryNames.length > 0 && !activeCategory) {
      setActiveCategory(categoryNames[0]);
    }
  }, [categoryNames, activeCategory]);

  // تحريك الزر النشط إلى منتصف الشريط
  const scrollButtonToCenter = (categoryName) => {
    const button = document.querySelector(`.category-nav-btn[data-category="${categoryName}"]`);
    const container = document.querySelector('.categories-nav-content');
    
    if (button && container) {
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const containerWidth = container.offsetWidth;
      
      const scrollPosition = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      
      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  // مراقبة الأقسام لتحديد القسم النشط
  useEffect(() => {
    if (categoryNames.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const categoryName = entry.target.id.replace('category-', '');
          setActiveCategory(categoryName);
          scrollButtonToCenter(categoryName);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    categoryNames.forEach((categoryName) => {
      const element = document.getElementById(`category-${categoryName}`);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [categoryNames]);

  // التنقل إلى قسم معين
  const scrollToCategory = (categoryName) => {
    setActiveCategory(categoryName);
    scrollButtonToCenter(categoryName);
    
    const element = document.getElementById(`category-${categoryName}`);
    if (element) {
      const offset = 120; // مسافة من الأعلى
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {/* عنوان المطعم المحسن والبسيط */}
      <div className="restaurant-title-improved" dir="rtl">
        <div className="title-container">
          <h1 className="restaurant-name">مطعم النخيل الذهبي</h1>
          <p className="restaurant-tagline">نكهات شرقية أصيلة</p>
        </div>
      </div>

      <div className="container py-4" dir="rtl">

        {loading && <p className="text-center">جارٍ التحميل...</p>}
        {!!error && <p className="text-center text-danger">{error}</p>}

        {/* شريط الأقسام الأفقي الثابت */}
        {!loading && categoryNames.length > 0 && (
          <div className="categories-nav-bar">
            <div className="categories-nav-content">
              {categoryNames.map((categoryName, idx) => (
                <button
                  key={idx}
                  data-category={categoryName}
                  className={`category-nav-btn ${activeCategory === categoryName ? 'active' : ''}`}
                  onClick={() => scrollToCategory(categoryName)}
                >
                  {categoryName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* عرض المنتجات حسب الأقسام */}
        {categoryNames.map((categoryName, catIdx) => (
          <div key={catIdx} className="category-section" id={`category-${categoryName}`}>
            {/* عنوان القسم الثابت */}
            <div className="category-header-sticky">
              <h3>{categoryName}</h3>
            </div>

            {/* منتجات القسم */}
            {groupedByCategory[categoryName].map((item) => {
              const originalIndex = items.findIndex(i => i.id === item.id);
              return (
                <div className="menu-card" key={item.id}>
                  {quantities[originalIndex] > 0 && (
                    <span className="total-badge" style={{ display: 'inline-block' }}>ل.س {formatNumber(quantities[originalIndex] * item.price)}</span>
                  )}
                  <div className="menu-img">
                    <img src={item.img || 'https://via.placeholder.com/208x138?text=%20'} alt={item.name} />
                  </div>
                  <div className="menu-info">
                    <h6 className="fw-bold mb-1 m-0">{item.name}</h6>
                    {item.desc && <p className="text-muted">{item.desc}</p>}
                    <div className="meta-row">
                      <span className="price-tag">ل.س {formatNumber(item.price)}</span>
                    </div>

                    {quantities[originalIndex] === 0 ? (
                      <button className="btn btn-order btn-sm anim-pop" onClick={() => handleAdd(originalIndex)}>اضف+</button>
                    ) : (
                      <div className="quantity-control anim-pop" style={{ display: 'flex' }}>
                        <button className="minus" onClick={() => handleDecrease(originalIndex)}>-</button>
                        <span className="count">{quantities[originalIndex]}</span>
                        <button className="plus" onClick={() => handleIncrease(originalIndex)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div className="bottom-spacer" aria-hidden="true"></div>


        <div className="bottom-bar">
          <span>الإجمالي الكلي: <span id="totalPrice">ل.س {formatNumber(totalPrice)}</span></span>
          <button onClick={handleSendOrder}> ارسال الطلب
            <span>          <svg xmlns="http://www.w3.org/2000/svg" height="30" width="30" viewBox="0 0 640 640"><path d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z" /></svg>
            </span>

          </button>
        </div>

        {/* نافذة تأكيد الطلب */}
        {showOrderModal && (
          <div className="order-modal-overlay" onClick={() => setShowOrderModal(false)}>
            <div className="order-modal" onClick={(e) => e.stopPropagation()}>
              <div className="order-modal-header">
                <h3>🧾 تفاصيل الطلب</h3>
                <button className="close-modal-btn" onClick={() => setShowOrderModal(false)}>×</button>
              </div>

              <div className="order-modal-body">
                {/* حقل الاسم */}
                <div className="customer-name-section">
                  <label htmlFor="customerName">👤 الاسم:</label>
                  <input 
                    id="customerName"
                    type="text"
                    className="customer-name-input"
                    placeholder="أدخل اسمك..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                {/* قائمة المنتجات */}
                <div className="order-items-list">
                  {getOrderedItems().map((item, idx) => (
                    <div key={idx} className="order-item">
                      <div className="order-item-info">
                        <span className="order-item-name">{item.name}</span>
                        <span className="order-item-quantity">× {item.quantity}</span>
                      </div>
                      <div className="order-item-prices">
                        <span className="order-item-unit-price">{formatNumber(item.price)} ل.س</span>
                        <span className="order-item-total">{formatNumber(item.total)} ل.س</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-total-section">
                  <span className="order-total-label">الإجمالي الكلي:</span>
                  <span className="order-total-value">{formatNumber(totalPrice)} ل.س</span>
                </div>

                {/* اختيار طريقة الاستلام */}
                <div className="delivery-options">
                  <h4>طريقة الاستلام:</h4>
                  <div className="delivery-buttons">
                    <button 
                      className={`delivery-option-btn ${deliveryType === 'delivery' ? 'active' : ''}`}
                      onClick={() => setDeliveryType('delivery')}
                    >
                      🚗 توصيل
                    </button>
                    <button 
                      className={`delivery-option-btn ${deliveryType === 'pickup' ? 'active' : ''}`}
                      onClick={() => setDeliveryType('pickup')}
                    >
                      🏪 استلام من المطعم
                    </button>
                  </div>
                </div>

                {/* حقل العنوان للتوصيل */}
                {deliveryType === 'delivery' && (
                  <div className="address-input-section">
                    <label htmlFor="address">📍 عنوان التوصيل:</label>
                    <textarea 
                      id="address"
                      className="address-input"
                      placeholder="أدخل عنوانك الكامل هنا..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="order-modal-footer">
                <button className="cancel-order-btn" onClick={() => setShowOrderModal(false)}>
                  إلغاء
                </button>
                <button className="confirm-order-btn" onClick={sendToWhatsApp}>
                  إرسال الطلب 📤
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}