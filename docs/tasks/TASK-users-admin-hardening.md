# Task — ปิดช่องโหว่ `/users` + ทำให้เปลี่ยน role ได้จริง (backend)

> ก๊อปทั้งไฟล์นี้ไปวางใน Claude Code session ใหม่ได้เลย
> งานนี้เป็น **prerequisite ของหน้า “จัดการผู้ใช้” (`/admin/users`)** — ถ้าไม่ทำก่อน หน้านั้นจะกดปุ่มแล้วไม่เกิดอะไร
> ขอบเขต: `backend/src/users/**` เท่านั้น **ห้ามแตะ `auth/` flow, AuthGuard, RolesGuard และห้ามแตะ frontend**

---

## บริบทที่ต้องรู้ก่อนแก้

- `User.role` เป็น `'admin' | 'customer'` (default `customer`) — `backend/src/users/entities/user.entity.ts`
- `RolesGuard` (`src/auth/roles.guard.ts`) **อ่าน role จากฐานข้อมูลผ่าน `UsersService.findOne`** ไม่ได้เชื่อ JWT
  และมันต้องรันหลัง `AuthGuard` เสมอ → เขียน `@UseGuards(AuthGuard, RolesGuard)` เรียงแบบนี้เท่านั้น
- `JwtModule` ลงทะเบียนแบบ `global: true` ใน `AuthModule` และ `ConfigModule` เป็น `isGlobal`
  → **`UsersModule` ไม่ต้อง import อะไรเพิ่มเพื่อใช้ guard ทั้งสองตัว** (`UsersService` ก็อยู่ในโมดูลตัวเองอยู่แล้ว)
  อย่าเผลอ import `AuthModule` เข้า `UsersModule` เพราะ `AuthModule` import `UsersModule` อยู่ → จะกลายเป็น circular
- `main.ts` เปิด `ValidationPipe({ whitelist: true, transform: true })` ไว้ทั้งแอป
  → ฟิลด์ที่ไม่มีใน DTO จะถูกตัดทิ้งเงียบๆ (นี่คือเหตุผลหนึ่งที่ `role` ส่งไปแล้วหายไป)
- **ยืนยันแล้วว่า frontend ไม่ได้เรียก `/users` เลยสักที่** → ล็อกเป็น admin-only ได้โดยไม่พังอะไร

---

## งานที่ 1 — ล็อก `/users` ให้เป็น admin-only

**ปัญหา:** `UsersController` มีแค่ `@UseGuards(AuthGuard)` ระดับคลาส ไม่มี `RolesGuard` เลย
→ ลูกค้าที่ล็อกอินคนไหนก็ยิง `GET /users` อ่านอีเมลสมาชิกทุกคนได้ และยิง `DELETE /users/:id` ลบใครก็ได้

**สิ่งที่ต้องทำ:** เปลี่ยน guard ระดับคลาสเป็น `@UseGuards(AuthGuard, RolesGuard)` + `@Roles('admin')`
ครอบทุก route ใน controller นี้ (`create` `findAll` `findOne` `update` `remove`)

หมายเหตุการตัดสินใจ:
- `POST /users` ให้เป็น admin-only เหมือนกัน — การสมัครสมาชิกของผู้ใช้ทั่วไปไปทาง `POST /auth/register` อยู่แล้ว
- `GET /users/:id` ที่ `RolesGuard` เรียกใช้ เป็นการเรียก **service ตรงๆ ไม่ผ่าน HTTP** → ล็อก route ได้ ไม่กระทบ guard

---

## งานที่ 2 — ทำให้เปลี่ยน role ได้จริง

**ปัญหา 2 ชั้น:**
1. `UpdateUserDto` = `PartialType(CreateUserDto)` และใน `CreateUserDto` ฟิลด์ `role` ถูกคอมเมนต์ทิ้ง
   → `role` ที่ส่งมาโดน `whitelist: true` ตัดทิ้งก่อนถึง service
2. `UsersService.update` (`users.service.ts:75`) มีแต่สาขา `if (updateUserDto.password) { ... }` **ไม่มี else**
   → ส่ง PATCH ที่ไม่มีรหัสผ่านมา = ไม่เกิดอะไรเลย และ **คืน `undefined`** (คนเรียกเข้าใจว่าสำเร็จ)

**สิ่งที่ต้องทำ — แยก route ใหม่เฉพาะ role ไม่ยัดเข้า `update` เดิม:**

- DTO ใหม่ `UpdateUserRoleDto` — มีฟิลด์เดียว `role` ตรวจด้วย `@IsEnum(['admin','customer'])`
- Route ใหม่ `PATCH /users/:id/role` (admin-only ตามงานที่ 1) รับ `@Request() req` มาด้วยเพื่อรู้ว่าใครเป็นคนสั่ง
- Service method ใหม่ `updateRole(actorId: number, targetId: number, nextRole)` — กฎอยู่ในงานที่ 3

**เหตุผลที่แยก route:** กันไม่ให้หน้าแอดมินแก้อีเมล/รหัสผ่านของคนอื่นไปพร้อมกัน
และทำให้กฎความปลอดภัยรวมอยู่ที่เดียว ตรวจสอบง่าย

**ต้องจัดการ `update` เดิมด้วย ห้ามปล่อยทิ้งไว้เป็น silent no-op** — เลือกทางใดทางหนึ่งแล้วเขียนเหตุผลกำกับในโค้ด:
- (แนะนำ) แก้ให้ทำงานถูกต้องกับกรณีที่ไม่มี `password` — อัปเดตเฉพาะฟิลด์ที่ส่งมา และคืนผู้ใช้ที่อัปเดตแล้วเสมอ
- หรือถอด `PATCH /users/:id` ทิ้งไปเลย (ไม่มีใครเรียกอยู่แล้ว) แล้วเหลือแต่ route role

ไม่ว่าทางไหน **ห้ามเพิ่ม `role` เข้าไปใน `CreateUserDto`** — การสมัครสมาชิกต้องได้ `customer` เสมอ

---

## งานที่ 3 — บังคับกฎความปลอดภัยฝั่ง server

กฎทั้งสองข้อนี้ **ต้องอยู่ใน service ไม่ใช่แค่ disable ปุ่มใน UI** (UI เป็นแค่ชั้นความสะดวก ยิง API ตรงยังทะลุได้)

**กฎ 1 — ห้ามเปลี่ยน role ของตัวเอง**
`actorId === targetId` → โยน `ForbiddenException` พร้อมข้อความที่อ่านรู้เรื่อง
ครอบทั้งขาขึ้นและขาลง ไม่ใช่เฉพาะการปลดสิทธิ์

**กฎ 2 — ห้ามเหลือแอดมิน 0 คน**
ถ้ากำลังปลด (`target.role === 'admin'` และ `nextRole === 'customer'`) ให้นับแอดมินที่ยังไม่ถูก soft delete
ถ้าเหลือ ≤ 1 คน → โยน error (เลือก `ConflictException` หรือ `BadRequestException` แล้วใช้ให้สม่ำเสมอ)

**รายละเอียดที่ต้องไม่ลืม:**
- ไม่เจอ target → `NotFoundException`
- role ใหม่เท่ากับของเดิม → ไม่ต้องเขียนฐานข้อมูล คืนผู้ใช้กลับไปเฉยๆ
- **นับแล้วอัปเดตต้องอยู่ในทรานแซกชันเดียวกัน** ไม่งั้นแอดมิน 2 คนกดปลดกันเองพร้อมกันจะเหลือ 0 คนได้
  (ใช้ `dataSource.transaction` + ล็อกแถวที่จะแก้ หรืออย่างน้อยนับใหม่ในทรานแซกชัน)
- คืนค่าเป็นผู้ใช้ที่อัปเดตแล้ว **ห้ามคืน `passwordHash`** ออกไปกับ response (ใช้ `select` ชุดเดียวกับ `findOne`)

---

## งานที่ 4 (ทำพ่วงได้ ไม่บังคับ) — เปิด `createdAt` ให้หน้าจัดการผู้ใช้

`findAll`/`findOne` เลือกส่งแค่ `id, email, name, role, age, emailVerified`
คอลัมน์ `createdAt` มีอยู่ในตารางแต่ไม่ถูกส่งออกมา → หน้าแอดมินโชว์ “วันที่สมัคร” ไม่ได้
ถ้าจะทำหน้า `/admin/users` ต่อ ให้เพิ่ม `createdAt` เข้าไปใน `select` ทั้งสองที่

---

## เทสต์ที่ต้องมี

`users.service.spec.ts` มีของจริงอยู่แล้ว (ไม่ใช่ scaffold เปล่า) — เพิ่มเคสต่อจากของเดิม:

- เปลี่ยน role สำเร็จ (customer → admin)
- เปลี่ยน role ของตัวเอง → `ForbiddenException`
- ปลดแอดมินคนสุดท้าย → error (และ **ปลดแอดมินตอนมี 2 คนต้องผ่าน**)
- target ไม่มีอยู่จริง → `NotFoundException`
- role เดิมเท่ากับใหม่ → ไม่เรียก write ฐานข้อมูล

กับดักของโปรเจกต์นี้ที่ต้องระวัง (อยู่ใน CLAUDE.md แล้ว):
- `bcrypt` เป็น native addon → `jest.spyOn(bcrypt, 'compare')` พัง ต้อง `jest.mock('bcrypt', () => ({ ... }))`
- controller spec ต้อง `.overrideGuard(AuthGuard)` และ `.overrideGuard(RolesGuard)` ไม่งั้น DI พังตั้งแต่ compile
- รัน `npx jest users` จาก `backend/` (jest `rootDir` คือ `src`)
- **สเปกเก่าอีก ~29 ไฟล์ในโปรเจกต์แดงอยู่ก่อนแล้ว** อย่าไปไล่แก้ ให้ดูเฉพาะ suite ของ users

---

## เกณฑ์ว่างานเสร็จ

1. `cd backend && npm run build` ผ่าน
2. `npx jest users` เขียว
3. `npm run lint` ไม่มี error ใหม่
4. ตรวจด้วยการยิงจริง: token ของ `customer` ยิง `GET /users` ต้องได้ **403** (ก่อนแก้ได้ 200)
5. token ของ `admin` ยิง `PATCH /users/:id/role` แล้ว role เปลี่ยนจริงในฐานข้อมูล
6. admin ยิง `PATCH /users/<ตัวเอง>/role` ต้องได้ 403
7. เหลือแอดมินคนเดียวแล้วปลดตัวเอง/ปลดคนนั้น ต้องถูกปฏิเสธ

## สิ่งที่ห้ามทำในงานนี้

- ห้ามแตะ `AuthGuard`, `RolesGuard`, `@Roles()` decorator หรือ flow ใน `auth/`
- ห้ามเชื่อ `role` จาก JWT claim (โทเคนเก่าไม่มี claim นี้ — นี่คือเหตุผลที่ `RolesGuard` อ่านจาก DB)
- ห้ามเพิ่ม `role` เข้า `CreateUserDto` / flow สมัครสมาชิก
- ห้ามแก้ frontend ในงานนี้ (หน้า `/admin/users` ยังไม่ได้ออกแบบ)
- ห้ามเปลี่ยน `remove` จาก soft delete เป็น hard delete
