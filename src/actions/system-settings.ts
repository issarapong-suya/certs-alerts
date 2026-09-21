'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { SystemNotificationSettings } from '@/types/database';
import { sendMasterAdminSummary } from '@/lib/notifications';
import { getPersonnelList } from '@/actions/personnel';

const DEFAULT_SETTINGS: SystemNotificationSettings = {
  id: 1,
  discord_webhook_url: process.env.DISCORD_WEBHOOK_URL || '',
  admin_emails: process.env.ADMIN_EMAIL || '',
  enable_discord: true,
  enable_email: true,
  schedule_frequency: 'daily',
  schedule_day_of_week: 1, // Monday
  schedule_day_of_month: 1, // 1st
  schedule_time: '08:00',
};

export async function getSystemNotificationSettings(): Promise<{
  settings: SystemNotificationSettings;
  error?: string;
}> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('system_notification_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error && !error.message.includes('does not exist')) {
      return { settings: DEFAULT_SETTINGS, error: error.message };
    }

    if (!data) {
      return { settings: DEFAULT_SETTINGS };
    }

    return { settings: data as SystemNotificationSettings };
  } catch (err: any) {
    return { settings: DEFAULT_SETTINGS, error: err.message };
  }
}

export async function saveSystemNotificationSettings(
  settings: Partial<SystemNotificationSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
    }

    const adminClient = createAdminClient();

    const payload = {
      id: 1,
      discord_webhook_url: settings.discord_webhook_url?.trim() || null,
      admin_emails: settings.admin_emails?.trim() || null,
      enable_discord: settings.enable_discord ?? true,
      enable_email: settings.enable_email ?? true,
      schedule_frequency: settings.schedule_frequency || 'daily',
      schedule_day_of_week: Number(settings.schedule_day_of_week) || 1,
      schedule_day_of_month: Number(settings.schedule_day_of_month) || 1,
      schedule_time: settings.schedule_time || '08:00',
      updated_at: new Date().toISOString(),
    };

    const { error } = await adminClient
      .from('system_notification_settings')
      .upsert(payload);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'บันทึกการตั้งค่าไม่สำเร็จ' };
  }
}

export async function testSystemNotification(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  discordStatus?: string;
  emailStatus?: string;
}> {
  try {
    const { settings } = await getSystemNotificationSettings();
    const { data: personnelList } = await getPersonnelList();

    const result = await sendMasterAdminSummary(personnelList || [], settings);

    if (!result.success && result.error) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      message: 'ทดสอบส่งการแจ้งเตือนส่วนกลางเรียบร้อยแล้ว',
      discordStatus: settings.enable_discord ? 'ส่งไปยัง Discord เรียบร้อย' : 'ปิดใช้งาน Discord',
      emailStatus: settings.enable_email ? 'ส่งไปยัง Email ผู้รับเรียบร้อย' : 'ปิดใช้งาน Email',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'ทดสอบส่งการแจ้งเตือนไม่สำเร็จ' };
  }
}
