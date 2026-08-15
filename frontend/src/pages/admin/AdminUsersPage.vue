<template>
  <q-page class="adm-placeholder">
    <div class="adm-placeholder__card">
      <div class="adm-placeholder__icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#8b5cf6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="9" cy="7" r="4" stroke="#8b5cf6" stroke-width="1.5"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#8b5cf6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 class="adm-placeholder__title">จัดการผู้ใช้</h1>
      <p class="adm-placeholder__desc">ระบบจัดการผู้ใช้กำลังพัฒนา — เร็วๆ นี้</p>
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
