'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Bell, Mail, Send, Loader2, CheckCircle2, Shield } from 'lucide-react';
import { UserNotificationSettings } from '@/types/database';
import {
  getUserNotificationSettings,
  saveUserNotificationSettings,
  testPersonalDiscord,
  testPersonalEmail,
} from '@/actions/settings';
import { showToast, showSuccess, showError, showLoading, closeLoading } from '@/lib/swal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [enableDiscord, setEnableDiscord] = useState(true);
  const [enableEmail, setEnableEmail] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  async function loadSettings() {
    setLoading(true);
    const res = await getUserNotificationSettings();
    setLoading(false);

    if (res.data) {
      setDiscordWebhookUrl(res.data.discord_webhook_url || '');
      setAlertEmail(res.data.alert_email || '');
      setEnableDiscord(res.data.enable_discord !== false);
      setEnableEmail(res.data.enable_email !== false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await saveUserNotificationSettings({
      discord_webhook_url: discordWebhookUrl,
      alert_email: alertEmail,
      enable_discord: enableDiscord,
      enable_email: enableEmail,
    });

    setSaving(false);

    if (res.success) {
      showToast('บันทึกการตั้งค่าส่วนตัวเรียบร้อยแล้ว', 'success');
      onClose();
    } else {
      showError('บันทึกไม่สำเร็จ', res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  }

  async function handleTestDiscord() {
    if (!discordWebhookUrl.trim()) {
      showError('กรุณาระบุ Discord Webhook URL ก่อนกดทดสอบ');
      return;
    }

    setTestingDiscord(true);
    showLoading('กำลังส่งข้อความทดสอบเข้า Discord...');
    const res = await testPersonalDiscord(discordWebhookUrl);
    closeLoading();
    setTestingDiscord(false);

    if (res.success) {
      showSuccess('ส่งข้อความทดสอบเข้า Discord สำเร็จแล้ว!', 'กรุณาตรวจสอบข้อความในช่อง Discord ของคุณ');
    } else {
      showError('ส่งไม่สำเร็จ', res.error || 'Webhook URL ไม่ถูกต้อง หรือ Discord ปฏิเสธการเชื่อมต่อ');
    }
  }

  async function handleTestEmail() {
    if (!alertEmail.trim()) {
      showError('กรุณาระบุอีเมลก่อนกดทดสอบ');
      return;
    }

    setTestingEmail(true);
    showLoading('กำลังส่งอีเมลทดสอบผ่าน Resend...');
    const res = await testPersonalEmail(alertEmail);
    closeLoading();
    setTestingEmail(false);

    if (res.success) {
      showSuccess('ส่งอีเมลทดสอบสำเร็จแล้ว!', `ระบบได้ส่งรายงานไปยัง ${alertEmail} เรียบร้อยแล้ว`);
    } else {
      showError('ส่งไม่สำเร็จ', res.error || 'ไม่สามารถส่งอีเมลได้ ตรวจสอบ Resend API Key หรือสิทธิ์ส่ง');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ตั้งค่าการแจ้งเตือนส่วนตัว (Notification Settings)
              </h3>
              <p className="text-xs text-slate-500">
                กำหนดช่องทางรับการแจ้งเตือนวันหมดอายุสำหรับบัญชีของคุณ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-xs">กำลังโหลดการตั้งค่า...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="mt-5 space-y-6">
            {/* Info note */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                การตั้งค่าในหน้านี้เป็นของบัญชีคุณโดยเฉพาะ ระบบ Vercel Cron จะส่งรายงานสรุปใบประกาศมายังช่องทางที่คุณเปิดใช้งานทุกเช้าเวลา 08:00 น.
              </div>
            </div>

            {/* Discord Webhook Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  Discord Webhook ส่วนตัว
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableDiscord}
                    onChange={(e) => setEnableDiscord(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2 text-xs font-medium text-slate-600">
                    {enableDiscord ? 'เปิดใช้งาน' : 'ปิด'}
                  </span>
                </label>
              </div>

              <div>
                <input
                  type="url"
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  disabled={!enableDiscord}
                  className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  คัดลอกจาก Discord Channel Settings → Integrations → Webhooks
                </span>
                <button
                  type="button"
                  onClick={handleTestDiscord}
                  disabled={!enableDiscord || !discordWebhookUrl.trim() || testingDiscord}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  ทดสอบส่ง Discord
                </button>
              </div>
            </div>

            {/* Email Section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  Email รับการแจ้งเตือนส่วนตัว
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableEmail}
                    onChange={(e) => setEnableEmail(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-2 text-xs font-medium text-slate-600">
                    {enableEmail ? 'เปิดใช้งาน' : 'ปิด'}
                  </span>
                </label>
              </div>

              <div>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="your.email@organization.org"
                  disabled={!enableEmail}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  ส่งรายงานสรุปทางอีเมลผ่านบริการ Resend
                </span>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={!enableEmail || !alertEmail.trim() || testingEmail}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  ทดสอบส่ง Email
                </button>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                บันทึกการตั้งค่า
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
