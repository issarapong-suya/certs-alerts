\# System Requirements \& AI Prompt Personnel Certificate Management System



Context for AI 

You are an expert Full-Stack Developer specializing in Next.js (App Router), Tailwind CSS, Supabase, and Vercel. Your task is to build a Personnel Certificate Management and Notification System step-by-step based on the requirements below.



\---



\## 1. Tech Stack

&#x20;  Framework Next.js 14+ (App Router)

&#x20;  Styling Tailwind CSS + shadcnui (หรือ UI library ที่รองรับ Tailwind)

&#x20;  Database \& BaaS Supabase (PostgreSQL)

&#x20;  Hosting \& Automation Vercel (รวมถึง Vercel Cron Jobs)

&#x20;  Notifications Discord Webhook API และ Email (ใช้ Resend API)



\## 2. Database Schema (Supabase)

สร้างตารางชื่อ `personnel\_certificates` โดยมีโครงสร้างดังนี้

&#x20;  `id` int8, Primary Key, Auto-increment

&#x20;  `name` text, Not Null (ชื่อ-สกุล)

&#x20;  `position` text (ตำแหน่ง เช่น พยาบาลวิชาชีพ, EMT-B, EMR)

&#x20;  `expire\_date` date, Nullable (วันหมดอายุของใบประกาศ)

&#x20;  `status\_note` text, Nullable (หมายเหตุ เช่น รอต่ออายุ, รออบรม)

&#x20;  `created\_at` timestamptz, default `now()`



\## 3. Core Features \& Requirements



\### 3.1 Authentication

&#x20;  ใช้ Supabase Auth (EmailPassword) สำหรับป้องกันเส้นทาง (Protected Routes) 

&#x20;  อนุญาตให้เฉพาะผู้ใช้ที่ล็อกอินแล้วเท่านั้นที่สามารถเข้าถึงหน้า Dashboard และใช้งาน CRUD ได้



\### 3.2 Dashboard \& CRUD (Frontend)

&#x20;  Read (Dashboard) แสดงตารางรายชื่อบุคลากร ดึงข้อมูลจาก Supabase

&#x20;      มีช่อง Search ค้นหาตามชื่อ หรือ ตำแหน่ง

&#x20;      มี Filter กรองสถานะ ใกล้หมดอายุ (ใน 90 วัน), หมดอายุแล้ว, ปกติ

&#x20;      Color Coding 

&#x20;          แถวที่ใบประกาศหมดอายุแล้ว - แถบสีแดง

&#x20;          แถวที่กำลังจะหมดอายุใน 90 วัน - แถบสีเหลืองส้ม

&#x20;          ไม่มีวันหมดอายุ (Null) - แถบสีเทาพร้อมแสดงข้อความจาก `status\_note`

&#x20;  Create มีปุ่ม เพิ่มบุคลากร เปิด Modal form เพื่อบันทึกข้อมูลใหม่ลงฐานข้อมูล

&#x20;  Update มีปุ่ม Edit ท้ายแถว เพื่อแก้ไขวันหมดอายุ หรืออัปเดตสถานะการอบรม

&#x20;  Delete มีปุ่ม Delete เพื่อลบรายการ (พร้อม Confirm dialog)



\### 3.3 Notification System (Backend \& Cron)

&#x20;  สร้าง Next.js API Route (เช่น `apicronnotify-expiry`) เพื่อใช้ตรวจสอบผู้ที่ใบประกาศกำลังจะหมดอายุ

&#x20;  Logic การแจ้งเตือน 

&#x20;      คิวรีหา `expire\_date` ที่เหลือเวลา 90 วัน, 60 วัน, 30 วัน, 7 วัน และ หมดอายุแล้ว

&#x20;  Channels

&#x20;      Discord Webhook ส่งข้อความที่มีการจัดรูปแบบ (Embed) สรุปรายชื่อคนที่ใกล้หมดอายุ

&#x20;      Email (Resend) ส่งอีเมลสรุปรายงานไปยังผู้ดูแลระบบ

&#x20;  Vercel Cron ตั้งค่าในไฟล์ `vercel.json` ให้รัน API Route นี้ทุกวันเวลา 0800 น. (Timezone AsiaBangkok)



\---



\## 4. Execution Steps for AI Builder

Please generate the code step-by-step in the following order



1\.  Step 1 Database Setup Provide the SQL script to create the `personnel\_certificates` table and RLS (Row Level Security) policies in Supabase.

2\.  Step 2 Project Setup Provide the terminal commands to initialize Next.js, install Supabase client, and required dependencies (e.g., shadcnui, date-fns, resend).

3\.  Step 3 Supabase Client \& API Generate the Supabase client utility file.

4\.  Step 4 CRUD Actions Generate the Server Actions or API Routes for fetching, creating, updating, and deleting records.

5\.  Step 5 Frontend UI Generate the main Dashboard page (Table view, status badges, and searchfilter logic).

6\.  Step 6 Cron Job \& Notifications Generate the API Route for the Cron job, including the logic for calculating date differences and triggering Discord WebhooksResend emails. Provide the `vercel.json` configuration.

