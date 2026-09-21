'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Clock, RefreshCw, LogOut, ShieldAlert, Loader2 } from 'lucide-react';
import { showToast } from '@/lib/swal';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleCheckStatus() {
    setChecking(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('status')
      .eq('id', user.id)
      .maybeSingle();

    setChecking(false);

    if (profile?.status === 'approved') {
      showToast('บัญชีของคุณได้รับการอนุมัติแล้ว!', 'success');
      window.location.href = '/dashboard';
    } else if (profile?.status === 'rejected') {
      showToast('บัญชีของคุณไม่ผ่านการอนุมัติ กรุณาติดต่อผู้ดูแลระบบ', 'error');
    } else {
      showToast('บัญชียังอยู่ระหว่างรอการอนุมัติ กรุณารอสักครู่', 'info');
      router.refresh();
    }
  }

  async function handleSignOut() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-6 shadow-lg shadow-amber-500/10 animate-pulse">
          <Clock className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
          บัญชีของคุณอยู่ระหว่างรอการอนุมัติ
        </h1>
        <p className="text-base text-slate-400 leading-relaxed mb-8">
          เพื่อความปลอดภัยของข้อมูลบุคลากร ผู้ดูแลระบบ (Admin) จะต้องเป็นผู้อนุมัติการเข้าใช้งานก่อน เมื่อได้รับการอนุมัติแล้ว คุณจะสามารถเข้าใช้งานระบบได้ทันที
        </p>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 mb-8 flex items-start gap-2.5 text-left">
          <ShieldAlert className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            หากคุณเป็นผู้ดูแลระบบคนแรก หรือต้องการเร่งรัดการอนุมัติ กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดสิทธิ์ผ่านแท็บ <strong className="text-slate-300">จัดการผู้ใช้งาน</strong>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            {checking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            ตรวจสถานะการอนุมัติอีกครั้ง
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={loggingOut}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </main>
  );
}
