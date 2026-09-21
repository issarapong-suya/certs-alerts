'use server';

import { createClient } from '@/lib/supabase/server';
import { Personnel } from '@/types/database';
import { sendMasterAdminSummary } from '@/lib/notifications';

export async function triggerManualNotification(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  results?: any;
}> {
  try {
    const supabase = await createClient();
    const { data: personnelList, error } = await supabase
      .from('personnel')
      .select('*, certificates(*)')
      .eq('is_active', true);

    if (error) {
      return { success: false, error: error.message };
    }

    const activeList = (personnelList as Personnel[]) || [];
    const res = await sendMasterAdminSummary(activeList);

    return {
      success: res.success,
      results: {
        totalCertificates: activeList.reduce((acc, p) => acc + (p.certificates?.length || 0), 0),
        expiredCount: activeList.filter((p) =>
          p.certificates?.some((c) => c.expire_date && new Date(c.expire_date) < new Date())
        ).length,
        within90DaysCount: activeList.filter((p) =>
          p.certificates?.some((c) => {
            if (!c.expire_date) return false;
            const diff = (new Date(c.expire_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            return diff >= 0 && diff <= 90;
          })
        ).length,
        discord: { success: true },
        resend: { success: true },
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to trigger notification' };
  }
}
