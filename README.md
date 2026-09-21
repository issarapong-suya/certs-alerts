# ระบบจัดการและแจ้งเตือนใบประกาศนียบัตรบุคลากร (Personnel Certificate Alert System)

ระบบบริหารจัดการวันหมดอายุของใบประกาศนียบัตรบุคลากร พร้อมระบบแจ้งเตือนอัตโนมัติประจำวันผ่าน **Discord Webhook** และ **Email (Resend)** พัฒนาด้วย **Next.js 14+ (App Router)**, **Tailwind CSS**, **Supabase (PostgreSQL & Auth)** และ **Vercel Cron Jobs**

---

## ✨ ฟีเจอร์หลัก (Features)

1. **Authentication & Protected Routes**:
   - ระบบเข้าสู่ระบบ/สมัครสมาชิกด้วย Supabase Auth (Email & Password)
   - ป้องกันเส้นทาง Dashboard และ CRUD ด้วย Next.js Middleware และ Row Level Security (RLS)
2. **Interactive Dashboard & Summary Statistics**:
   - สรุปสถิติ 5 ด้าน: บุคลากรทั้งหมด, หมดอายุแล้ว (สีแดง), ใกล้หมดอายุใน 90 วัน (สีส้ม/เหลือง), ปกติ (สีเขียว), ไม่มีวันหมดอายุ (สีเทา)
   - คลิกที่การ์ดสถิติเพื่อกรองข้อมูลในตารางได้ทันที
3. **Search & Filter & Color-Coding**:
   - ค้นหาทันทีตามชื่อ, ตำแหน่ง หรือหมายเหตุ
   - กรองตามสถานะ: ทั้งหมด, หมดอายุ, ใกล้หมดอายุ, ปกติ, ไม่มีวันหมดอายุ
   - แถบสีและ Badge แสดงความเร่งด่วน:
     - 🔴 **สีแดง**: หมดอายุแล้ว พร้อมแสดงจำนวนวันที่ผ่านมา
     - 🟠 **สีส้ม/เหลือง**: ใกล้หมดอายุใน 90 วัน พร้อมนับถอยหลังจำนวนวันที่เหลือ
     - 🟢 **สีเขียว**: สถานะปกติ (> 90 วัน)
     - ⚪ **สีเทา**: ไม่มีวันหมดอายุ พร้อมแสดงหมายเหตุ (เช่น รออบรม)
4. **Full CRUD Operations**:
   - **เพิ่มบุคลากร (Create)**: Modal ฟอร์มพร้อม Position Suggestions
   - **แก้ไขข้อมูล (Update)**: ปรับปรุงวันหมดอายุ, ตำแหน่ง หรือหมายเหตุ
   - **ลบข้อมูล (Delete)**: Modal ยืนยันการลบอย่างปลอดภัย
5. **Notification System (Backend & Cron Automation)**:
   - ตรวจสอบวันหมดอายุตามเกณฑ์: หมดอายุแล้ว, 7 วัน, 30 วัน, 60 วัน, 90 วัน
   - **Discord Webhook**: ส่ง Rich Embed สีสันสดใส สรุปรายชื่อผู้ที่ต้องติดตามเข้าช่อง Discord
   - **Resend Email**: ส่งรายงานสรุปในรูปแบบ HTML สวยงามไปยังอีเมลผู้ดูแลระบบ (`ADMIN_EMAIL`)
   - **Vercel Cron**: ตั้งเวลาใน `vercel.json` ให้รันทุกวันเวลา **08:00 น.** (Asia/Bangkok)
   - **Manual Trigger**: ปุ่ม "ทดสอบส่งแจ้งเตือน" บน Navbar ให้ Admin กดทดสอบและดูผลลัพธ์ได้ทันที

---

## 🛠️ โครงสร้างไฟล์ในโปรเจกต์ (Project Structure)

```text
├── certs-alerts/
│   ├── .env.example                # ตัวอย่างการตั้งค่า Environment Variables
│   ├── Certs Alerts.md             # ข้อกำหนดของระบบ
│   ├── package.json                # รายการ dependencies & scripts
│   ├── tsconfig.json               # การตั้งค่า TypeScript
│   ├── tailwind.config.ts          # การตั้งค่า Tailwind CSS
│   ├── vercel.json                 # การตั้งค่า Vercel Cron (08:00 น. Asia/Bangkok)
│   ├── supabase/
│   │   └── schema.sql              # สคริปต์ SQL สร้างตาราง, RLS Policies และ Seed Data
│   └── src/
│       ├── actions/
│       │   ├── auth.ts             # Server Actions สำหรับ Supabase Auth (Login/Signup/Logout)
│       │   └── certificates.ts     # Server Actions สำหรับ CRUD และ Manual Trigger
│       ├── app/
│       │   ├── api/cron/notify-expiry/route.ts  # Endpoint สำหรับ Cron Job แจ้งเตือน
│       │   ├── dashboard/
│       │   │   ├── page.tsx        # Dashboard Server Component
│       │   │   └── DashboardClient.tsx # Dashboard Client Component (UI/Table/Search/Filter)
│       │   ├── login/
│       │   │   └── page.tsx        # หน้า Login & Sign Up
│       │   ├── globals.css         # CSS สไตล์หลัก
│       │   ├── layout.tsx          # Root Layout
│       │   └── page.tsx            # Root Page (Redirect to /dashboard)
│       ├── components/
│       │   ├── CertificateModal.tsx    # Modal เพิ่มและแก้ไขข้อมูลบุคลากร
│       │   ├── DeleteConfirmModal.tsx  # Modal ยืนยันการลบ
│       │   ├── Navbar.tsx              # เมนูบาร์ด้านบนพร้อมปุ่มทดสอบและออกจากระบบ
│       │   ├── NotificationModal.tsx   # Modal ทดสอบยิงแจ้งเตือนทันที
│       │   └── StatsCards.tsx          # การ์ดสรุปสถิติจำนวนบุคลากร
│       ├── lib/
│       │   ├── certificate-utils.ts    # ฟังก์ชันคำนวณวันหมดอายุและสถานะสี
│       │   ├── notifications.ts        # ฟังก์ชันส่ง Discord Webhook และ Resend Email
│       │   └── supabase/
│       │       ├── admin.ts            # Supabase Admin Client (Service Role)
│       │       ├── client.ts           # Supabase Browser Client
│       │       └── server.ts           # Supabase Server Client (Cookies)
│       ├── middleware.ts               # Next.js Middleware ป้องกัน Protected Routes
│       └── types/
│           └── database.ts             # TypeScript Types & Interfaces
```

---

## 🚀 ขั้นตอนการติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Supabase Database & Auth
1. ไปที่ [Supabase](https://supabase.com) แล้วสร้างโปรเจกต์ใหม่
2. ไปที่เมนู **SQL Editor**
3. คัดลอกเนื้อหาจากไฟล์ `supabase/schema.sql` ไปวางแล้วกด **Run** เพื่อสร้างตาราง `personnel_certificates`, RLS Policies และข้อมูลตัวอย่าง (Seed Data)
4. ไปที่ **Project Settings -> API** เพื่อคัดลอกค่า:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

### 3. ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env.local`:
```bash
cp .env.example .env.local
```
จากนั้นแก้ไขค่าใน `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Discord Webhook สำหรับแจ้งเตือน (สร้างได้จาก Channel Settings -> Integrations ใน Discord)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Resend API สำหรับส่งอีเมล (รับ API Key จาก https://resend.com)
RESEND_API_KEY=re_123456789
ADMIN_EMAIL=admin@yourorganization.com
RESEND_FROM_EMAIL=onboarding@resend.dev

# Token สำหรับรักษาความปลอดภัย Vercel Cron API
CRON_SECRET=my_secure_cron_secret_123
```

### 4. รันโปรเจกต์ในโหมด Development
```bash
npm run dev
```
เปิดบราวเซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## ⏰ การทำงานของ Cron Job & การ Deploy ขึ้น Vercel

### การตั้งค่า Vercel Cron:
ไฟล์ `vercel.json` ได้กำหนดไว้ดังนี้:
```json
{
  "crons": [
    {
      "path": "/api/cron/notify-expiry",
      "schedule": "0 1 * * *"
    }
  ]
}
```
*หมายเหตุ: เวลา `0 1 * * *` เป็นเวลา UTC 01:00 น. ซึ่งตรงกับ **08:00 น. เวลาประเทศไทย (UTC+7)***

### การทดสอบ Cron Endpoint:
คุณสามารถทดสอบการทำงานของ Cron API ได้ผ่าน curl หรือ Postman:
```bash
curl -X GET http://localhost:3000/api/cron/notify-expiry \
  -H "Authorization: Bearer my_secure_cron_secret_123"
```
หรือกดปุ่ม **"ทดสอบส่งแจ้งเตือน"** ได้โดยตรงจากหน้า Dashboard!
