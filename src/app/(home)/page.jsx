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

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch('https://nextback-seven.vercel.app/datamenu', { cache: 'no-store' });
        if (!res.ok) throw new Error('فشل جلب البيانات');
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('صيغة بيانات غير صحيحة');
        if (!isMounted) return;
        const normalized = data.map((d, idx) => ({
          id: d._id || idx,
          name: d.name || '',
          desc: d.description || '',
          price: Number(d.price) || 0,
          img: d.image || ''
        }));
        setItems(normalized);
        setQuantities(Array(normalized.length).fill(0));
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

  return (
    <>
      <div className="container py-4" dir="rtl">
        <h2 className="text-center fw-bold mb-3">قائمة الطعام</h2>
        <p className="text-center text-muted mb-4">جرّب أشهى الأطباق المقدمة خصيصاً لك</p>

        {loading && <p className="text-center">جارٍ التحميل...</p>}
        {!!error && <p className="text-center text-danger">{error}</p>}

        {items.map((item, index) => (
          <div className="menu-card" key={item.id}>
            {quantities[index] > 0 && (
              <span className="total-badge" style={{ display: 'inline-block' }}>ل.س {formatNumber(quantities[index] * item.price)}</span>
            )}
            <div className="menu-img">
              <img src={item.img || 'https://via.placeholder.com/208x138?text=%20'} alt={item.name} />
            </div>
            <div className="menu-info">
              <h6 className="fw-bold mb-1 m-0">{item.name}</h6>
              <div className="meta-row">
                <span className="price-tag">ل.س {formatNumber(item.price)}</span>
              </div>

              {quantities[index] === 0 ? (
                <button className="btn btn-order btn-sm anim-pop" onClick={() => handleAdd(index)}>اضف+</button>
              ) : (
                <div className="quantity-control anim-pop" style={{ display: 'flex' }}>
                  <button className="minus" onClick={() => handleDecrease(index)}>-</button>
                  <span className="count">{quantities[index]}</span>
                  <button className="plus" onClick={() => handleIncrease(index)}>+</button>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="bottom-spacer" aria-hidden="true"></div>


        <div className="bottom-bar">
          <span>الإجمالي الكلي: <span id="totalPrice">ل.س {formatNumber(totalPrice)}</span></span>
          <button onClick={() => (window.location.href = 'https://wa.me/+963964355255')}> ارسال الطلب
            <span>          <svg xmlns="http://www.w3.org/2000/svg" height="30" width="30" viewBox="0 0 640 640"><path d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z" /></svg>
            </span>

          </button>
        </div>
      </div>
    </>
  );
}