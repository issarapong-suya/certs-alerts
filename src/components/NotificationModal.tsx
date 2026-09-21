'use client';

import { useState } from 'react';
import { X, Bell, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { triggerManualNotification } from '@/actions/certificates';
import { showToast, showSuccess, showError } from '@/lib/swal';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleTrigger() {
    setIsRunning(true);
    setError(null);
    setResult(null);

    const res = await triggerManualNotification();
    setIsRunning(false);

    if (res.success) {
      setResult(res.results);
      showToast('ตรวจสอบและส่งการแจ้งเตือนสำเร็จแล้ว', 'success');
    } else {
      setError(res.error || 'เกิดข้อผิดพลาดในการส่งแจ้งเตือน');
      showError('ส่งไม่สำเร็จ', res.error || 'เกิดข้อผิดพลาด');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ทดสอบส่งการแจ้งเตือน (System Test Alerts)
              </h3>
              <p className="text-xs text-slate-500">
                จำลองการทำงานของ Cron Job ส่งเข้า Discord & Resend Email หลักของระบบ
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

        <div className="py-4 space-y-4">
          <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
            ระบบจะตรวจสอบวันหมดอายุของบุคลากรทั้งหมด (หมดอายุแล้ว, 7 วัน, 30 วัน, 60 วัน, 90 วัน) และส่งข้อมูลสรุปไปยัง:
            <br />
            1. <strong>Discord Webhook</strong> 
            <br />
            2. <strong>Email ผ่าน Resend</strong> 
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-2">
                <CheckCircle2 className="w-4 h-4" />
                ตรวจสอบและส่งคำขอเรียบร้อยแล้ว
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">บุคลากรทั้งหมด</span>
                  <span className="font-bold text-sm">{result.totalCertificates} คน</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">หมดอายุแล้ว</span>
                  <span className="font-bold text-sm text-red-600">{result.expiredCount} คน</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">ใกล้หมดอายุ (≤ 90 วัน)</span>
                  <span className="font-bold text-sm text-amber-600">{result.within90DaysCount} คน</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Discord Webhook:</span>
                  <span
                    className={`font-medium ${
                      result.discord?.success ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {result.discord?.success
                      ? 'สำเร็จ'
                      : result.discord?.error || 'ยังไม่กำหนด Webhook URL'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Resend Email:</span>
                  <span
                    className={`font-medium ${
                      result.resend?.success ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {result.resend?.success
                      ? 'สำเร็จ'
                      : result.resend?.error || 'ยังไม่กำหนด Resend API Key'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            ปิด
          </button>
          <button
            type="button"
            onClick={handleTrigger}
            disabled={isRunning}
            className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังตรวจสอบและส่ง...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                กดส่งแจ้งเตือนทันที
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
