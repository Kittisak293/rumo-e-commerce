`rumo-e-commerce`)

---

Implement the Stripe checkout flow in `frontend/` ตาม mockup ที่อยู่ใน Claude Design
(`Checkout Stripe.dc.html` — การ์ด 1a/1b = confirm, 1d/1e = PromptPay, 1f/1g/1h = result).

## Constraints (ห้ามฝืน)
- Vue 3 `<script setup lang="ts">` + Quasar app-vite, ตาม pattern เดิมใน `src/pages/`.
- ใช้ plain `<input>/<button>` + scoped CSS เหมือน `CheckoutConfirmPage.vue` / `auth.scss` เดิม — อย่าใช้ QBtn/QInput สำหรับ element ที่มีสไตล์ใน mockup.
- state ทั้งหมดอยู่ใน `stores/checkoutStore.ts` (Pinia) — component ไม่ยิง axios เอง, ใช้ `$api` จาก `boot/axios.ts`.
- ค่าสี/ระยะทุกตัวมาจาก mockup ห้ามคิดเอง (ดูตาราง token ด้านล่าง).
- Kanit ถูก force ไว้แล้วใน `app.scss` — อย่าใส่ font-family ซ้ำ.

## Design tokens
| ใช้ทำอะไร | ค่า |
|---|---|
| brand / ราคา | `#6d28d9` |
| brand อ่อน (ปุ่ม, active) | `#8e4dff` |
| ปุ่มหลัก | `linear-gradient(135deg,#8e4dff,#6d28d9)` + `box-shadow:0 4px 12px rgba(109,40,217,.3)` |
| ตัวอักษรหลัก / รอง / จาง | `#1d1d1d` / `#6b7280` / `#9ca3af` |
| เส้นขอบ / เส้นคั่นอ่อน | `#e5e7eb` / `#f3f4f6` |
| พื้นหน้า / การ์ด | `#fafafa` / `#fff` |
| สำเร็จ | `#16a34a` บนพื้น `#dcfce7` |
| ผิดพลาด | `#dc2626`/`#b91c1c` บนพื้น `#fef2f2`, ขอบ `#fecaca` |
| นับถอยหลัง | `#c2410c` บนพื้น `#fff7ed`, ขอบ `#fed7aa` |
| การ์ด | `border-radius:18px; padding:20px; box-shadow:0 4px 14px rgba(0,0,0,.06)` |
| ปุ่ม | `border-radius:14px; padding:15px; font-size:16px; font-weight:600` **ต้องมี `box-sizing:border-box`** |
| tile วิธีชำระเงิน | `border-radius:14px; border:1.5px solid #e5e7eb`; active = `#8e4dff` + พื้น `#f5f3ff` |
| placeholder Stripe | `border:1.5px dashed #d8b4fe; background:#faf7ff; border-radius:16px` |

## 1. `pages/CheckoutConfirmPage.vue` (แก้ของเดิม)
- desktop: grid `1fr 420px` — ซ้าย = รายการสินค้า + ที่อยู่ + สรุปยอด, ขวา = กล่องชำระเงิน `position:sticky; top:24px`. `@media (max-width:860px)` เหลือคอลัมน์เดียว สรุปยอดอยู่บน ฟอร์มอยู่ล่าง.
- แถวสินค้า: รูป 64×64 (มือถือ 52) radius 12 `object-fit:cover`, ชื่อ 14px/500, ตัวเลือก+`฿ราคา × จำนวน` 12.5px `#9ca3af`, ยอดต่อแถว 15px/600 ชิดขวา.
- ยอดรวม: label 16px/600 + ตัวเลข **34px/700 `#6d28d9`** (มือถือ 30px), `letter-spacing:-.5px`.
- กล่องชำระเงิน: label `เลือกวิธีชำระเงิน` (13px `#6b7280`) → tile 2 อัน (บัตรเครดิต/เดบิต, PromptPay) → กล่อง dashed `#payment-element` สูง 210px (มือถือ 150) ข้อความ `Stripe Payment Element จะแสดงตรงนี้` → ปุ่ม → บรรทัด `ชำระเงินปลอดภัยผ่าน Stripe`.
- ปุ่ม `ยืนยันการชำระเงิน · ฿{{ total }}` 3 สถานะ:
  - ปกติ: gradient
  - loading (`store.checkoutLoading`): `opacity:.5; cursor:not-allowed` + spinner 18px หมุน 0.8s + `กำลังดำเนินการ...`
  - disabled (ไม่มี `selectedAddressId` หรือไม่ได้เลือกวิธีชำระ): `background:#e5e7eb; color:#9ca3af`, ไม่มีเงา
- error banner เหนือฟอร์ม `v-if="store.paymentError"` — ไอคอน `!` วงกลมแดง + หัวข้อ `ชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง` + บรรทัดรอง `รหัส: {code} · ยังไม่มีการตัดเงินจากบัญชีของคุณ` + ปุ่มปิด.

## 2. `pages/PromptPayWaitPage.vue` (ไฟล์ใหม่)
การ์ดกลางจอ max-width 520px (มือถือเต็มกว้าง), จัดกลางทุกอย่าง:
badge `PromptPay` → หัวข้อ `สแกนเพื่อชำระเงิน` 24px/600 → คำอธิบาย → QR 260×260 (มือถือ 230) → ยอด 36px/700 `#6d28d9` → เลข order → pill `หมดอายุใน mm:ss` → เส้นคั่น → spinner 16px + `กำลังรอการชำระเงิน...` → ปุ่ม `ยกเลิก` secondary (พื้นขาว ขอบ `#e5e7eb` ตัวอักษร `#6b7280`).
- countdown จาก `expiresAt` (`setInterval` 1s, `onUnmounted` เคลียร์); หมดเวลา → เปลี่ยน pill เป็นแดงแล้วเด้งไป result แบบ fail.
- poll สถานะ order ทุก 3s หรือรับ webhook status; `paid` → `/checkout/result?status=success`.

## 3. `pages/CheckoutResultPage.vue` (ไฟล์ใหม่, route `/checkout/result`)
คอมโพเนนต์เดียว สลับด้วย query `status`:
- success: วงกลม 84px พื้น `#dcfce7` + เช็ค `#16a34a` (stroke-width 2.6) → `ชำระเงินสำเร็จ` 24px/700 → การ์ด (เลขที่คำสั่งซื้อ, วิธีชำระเงิน, badge `ชำระเงินแล้ว`, ยอดที่ชำระ 28px/700 ม่วง) → ปุ่ม `ดูรายละเอียดคำสั่งซื้อ` (primary) + `กลับหน้าหลัก` (secondary).
- fail: วงกลม 84px พื้น `#fee2e2` + กากบาท `#dc2626` → `ชำระเงินไม่สำเร็จ` + `ยังไม่มีการตัดเงินจากบัญชีของคุณ` → การ์ดมี error banner + badge `รอชำระเงิน` + ยอด (สีดำ ไม่ใช่ม่วง) → ปุ่ม `ลองใหม่` + `กลับหน้าตะกร้า`.
- ใช้ animation `bounceIn 0.6s ease` กับไอคอน (มีอยู่แล้วใน `PaymentSuccessPage.vue`).

## 4. Store & routing
- `checkoutStore`: เพิ่ม `paymentMethod: 'card'|'promptpay'`, `clientSecret`, `paymentError`, `promptPay: { qrImage, expiresAt, orderId }`, action `createPaymentIntent()`, `confirmPayment()`, `pollOrderStatus(orderId)`.
- `router/routes.ts`: `/checkout/promptpay/:orderId` → `PromptPayWaitPage`, `/checkout/result` → `CheckoutResultPage` (ทั้งคู่ `meta.requiresAuth`).
- Stripe: โหลด `@stripe/stripe-js`, `elements.create('payment')` mount ที่ `#payment-element` เมื่อได้ `clientSecret`; `confirmPayment({ redirect: 'if_required' })` แล้ว route เองตามผลลัพธ์.
- backend: module `payments/` ตาม module-per-resource (`payments.controller/service/module` + dto) — `POST /payments/intent`, `POST /payments/webhook` (raw body), อัปเดต `Order.status` เป็น `paid` เท่านั้นจาก webhook ห้ามเชื่อ client.

## Definition of done
`cd frontend && npm run lint` ผ่าน, ทั้ง 3 หน้าดูตรงกับ mockup ที่ 390px และ 1280px, ปุ่มไม่ล้นขอบ (อย่าลืม `box-sizing:border-box`).
