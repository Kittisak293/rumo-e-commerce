<template>
  <q-page class="adm-placeholder">
    <div class="adm-placeholder__card">
      <div class="adm-placeholder__icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="#8b5cf6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="7" cy="7" r="1.5" fill="#8b5cf6"/>
        </svg>
      </div>
      <h1 class="adm-placeholder__title">จัดการสินค้า</h1>
      <p class="adm-placeholder__desc">ระบบจัดการสินค้ากำลังพัฒนา — เร็วๆ นี้</p>
      <div class="adm-placeholder__badge">🚧 Coming Soon</div>
    </div>
  </q-page>
</template>

<style scoped>
.adm-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 32px;
}

.adm-placeholder__card {
  text-align: center;
  background: #fff;
  border-radius: 24px;
  padding: 48px 56px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
  max-width: 440px;
  width: 100%;
}

.adm-placeholder__icon {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  background: #f5f3ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.adm-placeholder__title {
  font-size: 22px;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0 0 8px;
}

.adm-placeholder__desc {
  font-size: 15px;
  color: #9ca3af;
  margin: 0 0 20px;
}

.adm-placeholder__badge {
  display: inline-block;
  padding: 6px 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  color: #6d28d9;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
}
</style>
