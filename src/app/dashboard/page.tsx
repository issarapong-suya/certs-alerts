import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPersonnelList } from '@/actions/personnel';
import { getCurrentUserProfile, getAllUserProfiles } from '@/actions/users';
import { getMasterPositions, getMasterCertTypes } from '@/actions/master-data';
import { getSystemNotificationSettings } from '@/actions/system-settings';
import DashboardClient from './DashboardClient';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-slate-800/90 border border-slate-700 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 text-amber-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
            <h1 className="text-xl font-bold">ยังไม่ได้กำหนดค่า Supabase Environment</h1>
          </div>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            กรุณาตรวจสอบไฟล์ <code>.env.local</code> และระบุค่า <code>NEXT_PUBLIC_SUPABASE_URL</code> และ <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch current user profile to check role & status
  const { profile: currentUserProfile } = await getCurrentUserProfile();

  if (currentUserProfile && currentUserProfile.status !== 'approved') {
    redirect('/pending-approval');
  }

  // Fetch all parallel data
  const [
    personnelRes,
    positionsRes,
    certTypesRes,
    usersRes,
    settingsRes,
  ] = await Promise.all([
    getPersonnelList(),
    getMasterPositions(),
    getMasterCertTypes(),
    getAllUserProfiles(),
    getSystemNotificationSettings(),
  ]);

  // If table 'personnel' or 'user_profiles' does not exist yet
  const fetchError = personnelRes.error;
  if (fetchError && fetchError.includes('does not exist')) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 text-indigo-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
            <h1 className="text-xl font-bold">กรุณารัน SQL Upgrade สำหรับระบบใหม่</h1>
          </div>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            ระบบได้รับการอัปเกรดเป็นเวอร์ชันใหม่ (อนุมัติผู้ใช้, Master Data และ 1 คนหลายใบประกาศ)<br/>
            กรุณาเปิด <strong>Supabase SQL Editor</strong> แล้วนำโค้ดจากไฟล์{' '}
            <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-300">supabase/upgrade_v3_approval_and_master_data.sql</code> ไปกด <strong>Run</strong> เพื่อเริ่มใช้งาน
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardClient
      initialPersonnel={personnelRes.data || []}
      currentUserProfile={currentUserProfile}
      initialUsers={usersRes.profiles || []}
      initialPositions={positionsRes.data || []}
      initialCertTypes={certTypesRes.data || []}
      initialSystemSettings={settingsRes.settings}
      userEmail={user.email}
    />
  );
}

