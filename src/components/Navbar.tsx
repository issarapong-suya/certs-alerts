'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Bell, LogOut, Loader2, User } from 'lucide-react';
import { showConfirm, showLoading } from '@/lib/swal';

interface NavbarProps {
  userEmail?: string | null;
  isAdmin?: boolean;
  onOpenTestNotification: () => void;
}

export default function Navbar({
  userEmail,
  isAdmin = false,
  onOpenTestNotification,
}: NavbarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    const confirmed = await showConfirm(
      'ยืนยันการออกจากระบบ?',
      'คุณต้องการออกจากระบบบริหารจัดการใบประกาศนียบัตรใช่หรือไม่',
      'ออกจากระบบ',
      'ยกเลิก',
      '#ef4444'
    );

    if (confirmed) {
      setIsLoggingOut(true);
      showLoading('กำลังออกจากระบบ...');
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
      } catch (err) {
        window.location.href = '/login';
      }
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight block leading-tight">
                Certs Alerts
              </span>
              <span className="text-xs text-slate-500 font-normal">
                ระบบจัดการและแจ้งเตือนใบประกาศนียบัตรบุคลากร
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* System Test Alerts Button */}
            <button
              type="button"
              onClick={onOpenTestNotification}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer border border-indigo-100"
              title="ทดสอบส่งแจ้งเตือนผ่าน Discord & Resend Email"
            >
              <Bell className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">ส่งแจ้งเตือนระบบ</span>
            </button>

            {userEmail && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium truncate max-w-[130px] sm:max-w-[220px]">{userEmail}</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-lg text-[11px] ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  {isAdmin ? 'แอดมินระบบ (Admin)' : 'เจ้าหน้าที่ (Staff)'}
                </span>
              </div>
            )}

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
