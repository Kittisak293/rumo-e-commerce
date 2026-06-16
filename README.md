# Multi-Vendor E-Commerce Platform (Individual Project)

โปรเจกต์พัฒนาเว็บแอปพลิเคชัน E-Commerce รูปแบบ Multi-Vendor สเกลระบบขนาดใหญ่ เป็นโปรเจกต์เดี่ยวที่สร้างขึ้นเพื่อท้าทายตัวเองในการออกแบบสถาปัตยกรรมซอฟต์แวร์ที่มีความซับซ้อน รองรับระบบร้านค้าหลายเจ้า และมุ่งเน้นการเพิ่มประสิทธิภาพ (Performance) ของระบบ

---

## Tech Stack

- Frontend: Vue 3, Quasar Framework, HTML5, CSS3, SCSS, TypeScript
- Backend: NestJS (TypeScript), RESTful API
- Database & Caching: PostgreSQL, TypeORM, Redis
- DevOps & Containerization: Docker
- Tools: Figma, Miro

---

## Key Features & Technical Implementations

เนื่องจากเป็นโปรเจกต์ที่ทำคนเดียวทั้งหมด ผมจึงได้รับประสบการณ์ในการคุมระบบตั้งแต่ขั้นตอนการเลือก tech stack การวิเคราะห์ระบบหาข้อมูลไปจนถึงการออกแบบตั้งแต่ERD, databaseและพัฒนาระบบจริง:

### 1. Multi-Vendor System Architecture
- ออกแบบระบบให้รองรับสิทธิ์ผู้ใช้งานหลายระดับ (Role-Based Access Control) ตั้งแต่ลูกค้า (Customers), เจ้าของร้านค้า (Vendors), และผู้ดูแลระบบ (Admins)
- ออกแบบโครงสร้างฐานข้อมูล (PostgreSQL DB Schema) ให้รองรับการแยกคำสั่งซื้อ (Order Splitting) เมื่อลูกค้าสั่งสินค้าจากหลายร้านค้าพร้อมกันในตะกร้าเดียว

### 2. High-Performance Caching with Redis
- แนวคิดนำ Redis มาทำหน้าที่เป็น Caching Layer เพื่อเก็บข้อมูลที่มีการเข้าถึงบ่อย เช่น รายการสินค้าหน้าแรก และข้อมูลหมวดหมู่สินค้า ช่วยลดการ Query ตรงไปยัง PostgreSQL และลด Latency ของระบบลงอย่างเห็นได้ชัด

### 3. Containerization with Docker
- เริ่มต้นศึกษาและประยุกต์ใช้ Docker ในการรันสภาพแวดล้อมจำลอง (Container) สำหรับบริการต่างๆ เช่น PostgreSQL และ Redis เพื่อให้ง่ายต่อการย้ายระบบ (Portability) และทำให้ทีมเดฟสามารถเปิดรันสภาพแวดล้อมที่เหมือนกันได้ทันที

### 4. Advanced Frontend with Vue 3 & Quasar
- พัฒนาเว็บแอปพลิเคชันที่รองรับการแสดงผลแบบ Responsive Design ผ่าน Quasar Framework และจัดการ State การทำงานฝั่งหน้าบ้านอย่างเป็นระบบเพื่อรองรับ Flow การซื้อสินค้าที่ลื่นไหล

---

## Project Status (สถานะโปรเจกต์)
*หมายเหตุ: ปัจจุบันโปรเจกต์นี้อยู่ในสถานะกำลังพัฒนาเนื่องจากสลับมาโฟกัสกับการทำโปรเจคระบบตรวจบ้านให้กับลูกค้าจริงในช่วงเปิดเทอมปี 3 โดยมีแผนจะกลับมาพัฒนาต่อให้สมบูรณ์ในอนาคตครับ*

---

## สิ่งที่ได้เรียนรู้จากโปรเจกต์นี้ (Key Takeaways)
- เข้าใจแนวคิดการสเกลระบบและจัดการสถาปัตยกรรมแบบ Multi-Vendor ที่มีความซับซ้อนด้าน Business Logic มากกว่าเว็บ E-Commerce ทั่วไป
- ได้ลงมือปฏิบัติจริงในฝั่ง DevOps เบื้องต้น (Docker) และเรียนรู้เกี่ยวกับการจัดการหน่วยความจำแคช (Redis) เพื่อเพิ่มประสิทธิภาพให้ระบบหลังบ้าน
- พัฒนาทักษะการเรียนรู้เทคโนโลยีใหม่ๆ ด้วยตัวเอง (Self-learning) และการบริหารเวลาในการทำโปรเจกต์เดี่ยว
