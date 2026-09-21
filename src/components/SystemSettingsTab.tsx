'use client';

import { useState } from 'react';
import {
  Bell,
  Mail,
  Send,
  Save,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { SystemNotificationSettings } from '@/types/database';
import {
  saveSystemNotificationSettings,
  testSystemNotification,
} from '@/actions/system-settings';
import {
  showSuccess,
  showError,
  showLoading,
  closeLoading,
  showToast,
} from '@/lib/swal';

interface SystemSettingsTabProps {
  initialSettings: SystemNotificationSettings;
  isAdmin: boolean;
  onRefresh?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'วันจันทร์' },
  { value: 2, label: 'วันอังคาร' },
  { value: 3, label: 'วันพุธ' },
  { value: 4, label: 'วันพฤหัสบดี' },
  { value: 5, label: 'วันศุกร์' },
  { value: 6, label: 'วันเสาร์' },
  { value: 7, label: 'วันอาทิตย์' },
];

export default function SystemSettingsTab({
  initialSettings,
  isAdmin,
  onRefresh,
}: SystemSettingsTabProps) {
  const [formData, setFormData] = useState<SystemNotificationSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) {
      showError('ไม่มีสิทธิ์', 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไขการตั้งค่าส่วนกลางได้');
      return;
    }

    setIsSaving(true);
    showLoading('กำลังบันทึกการตั้งค่า...');

    try {
      const res = await saveSystemNotificationSettings(formData);
      closeLoading();

      if (res.success) {
        showSuccess('บันทึกสำเร็จ!', 'การตั้งค่าการแจ้งเตือนส่วนกลางได้รับการอัปเดตเรียบร้อยแล้ว');
        onRefresh?.();
      } else {
        showError('เกิดข้อผิดพลาด', res.error || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (err: any) {
      closeLoading();
      showError('เกิดข้อผิดพลาด', err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    setIsTesting(true);
    showLoading('กำลังส่งข้อความทดสอบไปยัง Discord / Email...');

    try {
      const res = await testSystemNotification();
      closeLoading();

      if (res.success) {
        showSuccess(
          'ทดสอบส่งสำเร็จ!',
          `ผลการทำงาน:\n• Discord: ${res.discordStatus || 'เรียบร้อย'}\n• Email: ${res.emailStatus || 'เรียบร้อย'}`
        );
      } else {
        showError('ทดสอบส่งไม่สำเร็จ', res.error || 'ไม่สามารถส่งข้อความทดสอบได้');
      }
    } catch (err: any) {
      closeLoading();
      showError('เกิดข้อผิดพลาด', err.message);
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-600 inline-block shadow-sm">
              <Bell className="w-7 h-7" />
            </span>
            ตั้งค่าแจ้งเตือนส่วนกลาง (กลุ่ม)
          </h2>
          <p className="text-base text-slate-500 mt-2">
            กำหนดช่องทาง Discord, อีเมลผู้รับ, รอบความถี่ และเวลาในการส่งสรุปรายงานสำหรับผู้บริหาร/แอดมิน
          </p>
        </div>

        {!isAdmin && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            โหมดดูอย่างเดียว (เฉพาะ Admin จึงสามารถแก้ไขได้)
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Discord Webhook */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center font-bold text-xl shadow-inner">
                #
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Discord Webhook ส่วนกลาง
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    ห้องรวมกลุ่ม
                  </span>
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  แจ้งเตือนสรุปภาพรวมใบประกาศหมดอายุเข้าห้องแชท Discord ของทีม
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={formData.enable_discord}
                onChange={(e) =>
                  setFormData({ ...formData, enable_discord: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-13 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#5865F2]"></div>
              <span className="ml-3 text-sm font-bold text-slate-700">
                {formData.enable_discord ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </span>
            </label>
          </div>

          <div className="mt-6 space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              Discord Webhook URL
            </label>
            <input
              type="url"
              disabled={!isAdmin}
              value={formData.discord_webhook_url || ''}
              onChange={(e) =>
                setFormData({ ...formData, discord_webhook_url: e.target.value })
              }
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-base font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60"
            />
            <p className="text-xs text-slate-400">
              วิธีนำ Webhook มาใส่: เข้า Discord ใน Channel ที่ต้องการ &gt; Edit Channel &gt; Integrations &gt; Webhooks &gt; New Webhook &gt; Copy Webhook URL
            </p>
          </div>
        </div>

        {/* Card 2: Email (Resend) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  อีเมลผู้รับรายงานส่วนกลาง
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    ผู้ดูแล/HR
                  </span>
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  ส่งอีเมลสรุปตารางรายชื่อบุคลากรที่มีใบประกาศหมดอายุเข้ากล่องข้อความ
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={formData.enable_email}
                onChange={(e) =>
                  setFormData({ ...formData, enable_email: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-13 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm font-bold text-slate-700">
                {formData.enable_email ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
              </span>
            </label>
          </div>

          <div className="mt-6 space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              รายชื่ออีเมลผู้รับ (ใส่ได้หลายอีเมล คั่นด้วยเครื่องหมายจุลภาค ,)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={formData.admin_emails || ''}
              onChange={(e) =>
                setFormData({ ...formData, admin_emails: e.target.value })
              }
              placeholder="issarapong.suya@gmail.com, hr@organization.org"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60"
            />
            <p className="text-xs text-slate-400">
              ระบบใช้อีเมล Resend ในการจัดส่ง หากต้องการส่งให้หลายคนสามารถกรอกเช่น: <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">admin1@org.com, admin2@org.com</code>
            </p>
          </div>
        </div>

        {/* Card 3: Frequency and Schedule */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                รอบความถี่และเวลาในการแจ้งเตือน (Schedule)
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                เลือกรูปแบบความถี่ที่ระบบจะสรุปรายงานแจ้งเตือนส่วนกลาง
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {/* Frequency selection tabs */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                ความถี่ในการส่งรายงาน (Frequency)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setFormData({ ...formData, schedule_frequency: 'daily' })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    formData.schedule_frequency === 'daily'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-base text-slate-900">🟢 รายวัน (Daily)</span>
                    {formData.schedule_frequency === 'daily' && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    ส่งสรุปภาพรวมทุกวันในเวลาที่กำหนด
                  </p>
                </button>

                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setFormData({ ...formData, schedule_frequency: 'weekly' })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    formData.schedule_frequency === 'weekly'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-base text-slate-900">🔵 รายสัปดาห์ (Weekly)</span>
                    {formData.schedule_frequency === 'weekly' && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    ส่งสรุปสัปดาห์ละ 1 ครั้งตามวันที่เลือก
                  </p>
                </button>

                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => setFormData({ ...formData, schedule_frequency: 'monthly' })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    formData.schedule_frequency === 'monthly'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-base text-slate-900">🟣 รายเดือน (Monthly)</span>
                    {formData.schedule_frequency === 'monthly' && (
                      <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    ส่งสรุปเดือนละ 1 ครั้งตามวันที่กำหนด
                  </p>
                </button>
              </div>
            </div>

            {/* Dynamic options based on frequency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* If weekly: day of week */}
              {formData.schedule_frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    เลือกวันในสัปดาห์ที่ต้องการส่ง
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.schedule_day_of_week}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schedule_day_of_week: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* If monthly: day of month */}
              {formData.schedule_frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    เลือกวันที่ในเดือนที่ต้องการส่ง (1 - 31)
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.schedule_day_of_month}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schedule_day_of_month: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        วันที่ {day} ของทุกเดือน
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time of day */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  เวลาที่ต้องการส่ง (Schedule Time)
                </label>
                <div className="relative">
                  <input
                    type="time"
                    disabled={!isAdmin}
                    value={formData.schedule_time || '08:00'}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule_time: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Note about Vercel Cron */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong>หมายเหตุการทำงานของระบบอัตโนมัติ:</strong> การส่งแจ้งเตือนจะถูกกระตุ้นโดย Vercel Cron (Endpoint: <code>/api/cron/notify-expiry</code>) เมื่อระบบทำงานจะตรวจสอบความถี่และเงื่อนไขวันที่คุณกำหนดไว้ด้านบนโดยอัตโนมัติ
                {formData.last_run_at && (
                  <div className="mt-1 text-slate-500">
                    ทำงานล่าสุดเมื่อ: {new Date(formData.last_run_at).toLocaleString('th-TH')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !isAdmin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-base transition-all cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {isTesting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            ทดสอบส่งการแจ้งเตือนส่วนกลางทันที
          </button>

          {isAdmin && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              บันทึกการตั้งค่า
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
