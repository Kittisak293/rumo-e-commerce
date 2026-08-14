`rumo-e-commerce`)

---

Design (Claude Design mockup, then implement in `frontend/`) an internal admin UI for
managing shipments — creating parcels, logging tracking events, and maintaining the
carrier list. This is the operator-facing counterpart to the customer tracking pages
already built from `docs/design/RUMO Shipping Tracking Standalone.html`
(`OrdersPage.vue` / `OrderDetailPage.vue` / `OrderTrackingPage.vue`,
`components/orders/*`, `composables/useOrderStatus.ts`) — reuse that vocabulary,
don't invent a second one.

## Constraints (ห้ามฝืน)

- Vue 3 `<script setup lang="ts">` + Quasar app-vite, ตาม pattern เดิมใน `src/pages/`.
- **ธีม/สี/ฟอนต์ใช้ของเดิมทั้งหมด** — ดูตาราง token ใน `docs/design/HANDOFF-checkout-prompt.md`
  (brand `#6d28d9`/`#8e4dff`, การ์ด `radius:18px; padding:20px; shadow:0 4px 14px rgba(0,0,0,.06)`,
  ปุ่ม `radius:14px` + `box-sizing:border-box`, สี success/error/warning เดิม) — **ไม่ต้องออกแบบธีมใหม่**
  และห้ามใส่ `font-family` ซ้ำ (Kanit ถูก force ไว้ใน `app.scss` แล้ว)
- badge สถานะออเดอร์ใช้ `ORDER_STATUS_META` จาก `composables/useOrderStatus.ts` ตัวเดียวกับหน้าลูกค้า
  — ห้ามสร้าง status map ใหม่
- state ทั้งหมดอยู่ใน Pinia store ใหม่ (`stores/adminShipmentStore.ts`) — component ไม่ยิง axios เอง,
  ใช้ `$api` จาก `boot/axios.ts`
- Route อยู่ใต้ `/admin/...` เป็น children ของ `MainLayout` เหมือนหน้าอื่น (ไม่ต้องทำ layout แยก),
  `meta: { requiresAuth: true }` + เพิ่ม guard ใหม่ที่เช็ค `authStore.user?.role === 'admin'`
  ใน `router/index.ts` (ตอนนี้ guard เช็คแค่ `requiresAuth`/`guestOnly`/`requiresChallenge` — ต้องเพิ่ม
  `meta.requiresAdmin` เป็นเคสที่ 4 แล้ว redirect ไป `home` ถ้าไม่ใช่ admin)

## สถานะ backend ตอนนี้ (อ่านก่อนออกแบบ)

Endpoint ฝั่งเขียนถูกล็อกเป็น `@Roles('admin')` ไว้แล้วหมด (ดู `backend/src/shipments`,
`backend/src/shipment_events`, `backend/src/carriers`) แต่ **ยังไม่มี admin UI มาเรียกใช้เลย** —
งานนี้คือสร้าง UI นั้น ไม่ใช่แก้ backend ใหม่ ยกเว้น 2 จุดที่ยังขาดและต้องเพิ่มก่อนหน้า UI จะใช้งานได้จริง:

1. **`GET /orders` (admin) ตอนนี้ไม่โหลด `orderItems`/`shipments`** — คืนแค่ `relations: ['user','address']`
   ต้องขยาย relations (หรือเพิ่ม endpoint เฉพาะ เช่น `GET /orders/admin/pending-shipment`) ให้ตารางในข้อ 1
   ด้านล่างมีข้อมูลจำนวนสินค้า/จำนวนพัสดุได้
2. **ไม่มี endpoint ให้ admin เห็นขนส่งที่ปิดใช้งาน** — `GET /carriers` (public) กรอง `isActive:true`
   ไว้แล้วโดยตั้งใจ (ป้องกันลูกค้าเลือกขนส่งที่เลิกใช้) ต้องเพิ่ม `GET /carriers/admin` หรือคล้ายกัน
   (`@Roles('admin')`) ที่คืนทุกแถวให้หน้าจัดการขนส่งใช้

`ShipmentStatus` enum (`backend/src/shipments/shipment-status.enum.ts`) มี 7 ค่า:
`pending`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `failed`, `returned`.
การเพิ่ม `ShipmentEvent` ที่ status เป็น `picked_up`/`in_transit`/`out_for_delivery` จะเลื่อน
`Order.status` เป็น `shipping` อัตโนมัติ, `delivered` เลื่อนเป็น `delivered` อัตโนมัติ
(ดู `ShipmentEventsService.create`, ตาราง `ORDER_STATUS_FOR_EVENT`) — **UI ไม่ต้องมีปุ่มเปลี่ยน
Order.status เอง** แค่บันทึก event แล้ว backend จัดการให้

## Design tokens

ใช้ตารางเต็มใน `docs/design/HANDOFF-checkout-prompt.md` (ห้ามคิดค่าใหม่) เพิ่มเติมเฉพาะของหน้านี้:

| ใช้ทำอะไร | ค่า |
|---|---|
| แถวตารางแบบ hover | `background:#fafafa` เมื่อ hover |
| หัวตาราง | `font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.03em` |
| badge จำนวนพัสดุในตาราง | ใช้โครง pill เดียวกับ `OrderStatusBadge` แต่สีกลาง `#6b7280`/`#f3f4f6` |
| แถบยืนยันก่อนส่งอีเมล | `background:#f5f3ff; border:1px solid #ddd6fe; border-radius:14px` + ไอคอนซองจดหมาย |

## 1. `pages/admin/AdminShipmentsPage.vue` (ไฟล์ใหม่, route `/admin/shipments`)

ตารางออเดอร์ที่ต้องจัดการการจัดส่ง, filter tab บนสุด (`ทั้งหมด` / `เตรียมจัดส่ง` (paid) /
`กำลังจัดส่ง` (shipped+shipping) — ใช้ตัวกรองเดียวกับที่ `orderStore.ts` (`OrderStatusFilter`)
ใช้ฝั่งลูกค้าเพื่อความสอดคล้อง)

คอลัมน์: เลขคำสั่งซื้อ · ลูกค้า (ชื่อ+อีเมล) · วันที่สั่งซื้อ · จำนวนชิ้น · ยอดรวม ·
`OrderStatusBadge` · จำนวนพัสดุ (badge) · ปุ่ม `+ สร้างพัสดุ` (เปิด dialog ข้อ 2) หรือ
`ดู/เพิ่ม event` ถ้ามีพัสดุอยู่แล้ว (เปิด dialog ข้อ 3)

State: loading (skeleton แถวตาราง), empty (`ไม่มีคำสั่งซื้อที่ต้องจัดการตอนนี้`), error
(banner ชุดเดียวกับหน้าลูกค้า + ปุ่มลองใหม่)

## 2. Dialog สร้างพัสดุ (`components/admin/CreateShipmentDialog.vue`)

`q-dialog` หรือ modal card กลางจอ max-width 480px:
- เลือกขนส่ง (`q-select` จาก `GET /carriers/admin`, เฉพาะ `isActive`)
- เลขพัสดุ (text input, required)
- ตำแหน่งเริ่มต้น (text input, optional)
- วันที่คาดว่าจะได้รับ (date picker, optional)
- **แถบเตือนสีม่วงอ่อน**: "ระบบจะส่งอีเมลแจ้งลูกค้าทันทีที่กดยืนยัน" (การส่งอีเมลเป็น side-effect
  ของ `POST /shipments` ที่มีอยู่แล้ว ไม่ใช่ทางเลือก — UI ต้องบอกตรงนี้ให้ชัดก่อนกด)
- ปุ่ม `ยืนยันสร้างพัสดุ` (loading state ระหว่างรอ, disabled ถ้าฟิลด์ required ว่าง)
- error state: แสดงข้อความจาก backend (เช่น orderId/carrierId ไม่ถูกต้อง)

## 3. Dialog เพิ่ม tracking event (`components/admin/AddShipmentEventDialog.vue`)

เปิดจากแถวที่มีพัสดุแล้ว, โชว์ `ShipmentTimeline` เดิม (component ที่มีอยู่แล้ว, reuse ตรง ๆ)
ของพัสดุนั้นเป็น preview ด้านบน แล้วฟอร์มด้านล่าง:
- เลือกสถานะ (`q-select`, ตัวเลือก = 7 ค่าของ `ShipmentStatus`, แสดง label ภาษาไทยที่แปลไว้)
- คำอธิบายเหตุการณ์ (textarea, required — ตรงกับ `ShipmentEvent.description`)
- ตำแหน่ง (text input, optional)
- เวลาที่เกิดเหตุการณ์ (datetime picker, default = ตอนนี้)
- ถ้าเลือกสถานะที่จะเลื่อน `Order.status` (`picked_up`/`in_transit`/`out_for_delivery`/`delivered`)
  ให้โชว์บรรทัดเตือนเล็ก ๆ: "จะปรับสถานะคำสั่งซื้อเป็น {สถานะใหม่} โดยอัตโนมัติ"
- ปุ่ม `บันทึกเหตุการณ์` → หลังสำเร็จ timeline ด้านบน refresh ทันที (ไม่ปิด dialog อัตโนมัติ
  เพื่อให้เพิ่มได้หลายรายการรวด)

## 4. `pages/admin/AdminCarriersPage.vue` (ไฟล์ใหม่, route `/admin/carriers`)

ตาราง: ชื่อ · รหัส (`code`) · เว็บไซต์ · `trackingUrlTemplate` · สถานะ (เปิด/ปิดใช้งาน, toggle
switch ยิง `PATCH /carriers/:id`) · ปุ่มแก้ไข/ลบ

ฟอร์มเพิ่ม/แก้ไข (dialog): ชื่อ, รหัส (unique), เว็บไซต์ (optional, `@IsUrl`), tracking URL
template — **ต้องมีคำอธิบายใต้ช่องนี้ชัดเจน**: "ใช้ `{trackingNumber}` แทนตำแหน่งที่จะแทรกเลขพัสดุ
เช่น `https://track.example.com/?code={trackingNumber}`" (ผิด placeholder แล้ว backend
`buildTrackingUrl()` จะไม่แทนที่ให้ ลิงก์ในอีเมลลูกค้าจะพัง — เคยเกิดมาแล้วกับ seed data เดิม)

## 5. Store & routing

- `stores/adminShipmentStore.ts` (Pinia, options style ตาม `checkoutStore.ts`): state
  `pendingOrders`, `carriers`, `loading`, `error` + actions `fetchPendingOrders()`,
  `createShipment(payload)`, `addShipmentEvent(payload)`, `fetchCarriers()`,
  `createCarrier()`/`updateCarrier()`
- `router/routes.ts`: เพิ่ม `/admin/shipments` → `AdminShipmentsPage`, `/admin/carriers` →
  `AdminCarriersPage`, ทั้งคู่ `meta: { requiresAuth: true, requiresAdmin: true }`
- `router/index.ts`: เพิ่มเช็ค `meta.requiresAdmin` → ถ้า `authStore.user?.role !== 'admin'`
  redirect ไป `home`
- `layouts/MainLayout.vue`: เพิ่มลิงก์ในเมนู `q-menu` ของปุ่มโปรไฟล์ (ข้าง "ออกจากระบบ") ชื่อ
  "จัดการพัสดุ (Admin)" แสดงเฉพาะ `auth.user?.role === 'admin'` — ไม่ต้องเพิ่มใน drawer หลัก
  เพื่อไม่ให้ลูกค้าทั่วไปสับสน

## Definition of done

`cd frontend && npm run lint` ผ่าน, ทดสอบ flow เต็ม: สร้างพัสดุ → เช็คว่าอีเมล dispatch ไปจริง
(`MAIL_TRANSPORT=log` ดูใน terminal) → เพิ่ม event `delivered` → เปิดหน้าลูกค้า
(`OrderTrackingPage.vue`) ยืนยันว่า timeline อัปเดตและ `Order.status` กลายเป็น `delivered` จริง,
ทั้งหมดดูตรงกับ token/สไตล์เดิมของโปรเจกต์ที่ 1280px และ 390px
