'use server';

import { createClient } from '@/lib/supabase/server';
import { UserNotificationSettings } from '@/types/database';
import { Resend } from 'resend';

export async function getUserNotificationSettings(): Promise<{
  data: UserNotificationSettings | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'ยังไม่ได้เข้าสู่ระบบ' };
    }

    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: data || {
        user_id: user.id,
        discord_webhook_url: '',
        alert_email: user.email || '',
        enable_discord: true,
        enable_email: true,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch settings' };
  }
}

export async function saveUserNotificationSettings(formData: {
  discord_webhook_url?: string | null;
  alert_email?: string | null;
  enable_discord: boolean;
  enable_email: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'ยังไม่ได้เข้าสู่ระบบ' };
    }

    const payload = {
      user_id: user.id,
      discord_webhook_url: formData.discord_webhook_url?.trim() || null,
      alert_email: formData.alert_email?.trim() || null,
      enable_discord: formData.enable_discord,
      enable_email: formData.enable_email,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('user_notification_settings')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save settings' };
  }
}

export async function testPersonalDiscord(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
  if (!webhookUrl?.trim()) {
    return { success: false, error: 'กรุณาระบุ Discord Webhook URL' };
  }

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🔔 **ทดสอบการแจ้งเตือน Discord Webhook สำเร็จ!**\nระบบ Personnel Certificate Alert System สามารถส่งข้อความเข้าช่องนี้ได้เรียบร้อยแล้ว`,
        embeds: [
          {
            title: '✅ การเชื่อมต่อสำเร็จ (Connection Verified)',
            description: 'ระบบพร้อมส่งการแจ้งเตือนวันหมดอายุใบประกาศนียบัตรของคุณแล้ว',
            color: 5763719, // Green
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!res.ok) {
      return { success: false, error: `Discord Webhook error: ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send Discord test' };
  }
}

export async function testPersonalEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email?.trim()) {
    return { success: false, error: 'กรุณาระบุอีเมล' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'ยังไม่ได้ระบุ RESEND_API_KEY ในระบบ' };
  }

  try {
    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Personnel Certs <onboarding@resend.dev>';

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email.trim(),
      subject: '🔔 ทดสอบการแจ้งเตือน Personnel Certificate Alert System',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc;">
          <div style="max-width: 500px; margin: 0 auto; background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0f172a; margin-top: 0;">✅ การเชื่อมต่ออีเมลสำเร็จ!</h2>
            <p style="color: #475569;">ระบบ Personnel Certificate Alert System สามารถส่งอีเมลแจ้งเตือนวันหมดอายุมายัง ${email} ได้เรียบร้อยแล้ว</p>
          </div>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send Email test' };
  }
}

export async function testPersonalDiscordDM(discordUserId: string): Promise<{ success: boolean; error?: string }> {
  if (!discordUserId?.trim()) {
    return { success: false, error: 'กรุณาระบุ Discord User ID' };
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return {
      success: false,
      error: 'ยังไม่ได้ระบุ DISCORD_BOT_TOKEN ในระบบ (กรุณาเพิ่ม DISCORD_BOT_TOKEN ใน Environment Variables)',
    };
  }

  try {
    const createDmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient_id: discordUserId.trim() }),
    });

    if (!createDmRes.ok) {
      const errJson = await createDmRes.json().catch(() => ({}));
      return {
        success: false,
        error: `ไม่สามารถเปิดห้อง DM กับผู้ใช้ได้ (${createDmRes.status}): ${errJson.message || 'ตรวจดูว่าผู้ใช้อยู่ในเซิร์ฟเวอร์เดียวกับบอท และเปิดรับ DM หรือไม่'}`,
      };
    }

    const dmChannel = await createDmRes.json();

    const msgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `🔔 **ทดสอบการแจ้งเตือน Discord Direct Message (DM) สำเร็จ!**\nระบบ Personnel Certificate Alert System สามารถส่งข้อความส่วนตัวถึงคุณได้เรียบร้อยแล้ว`,
        embeds: [
          {
            title: '✅ การเชื่อมต่อ DM สำเร็จ (Direct Message Verified)',
            description: 'ระบบพร้อมส่งการแจ้งเตือนวันหมดอายุใบประกาศนียบัตรเข้า DM ของคุณโดยตรงแล้ว',
            color: 5763719,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!msgRes.ok) {
      const errJson = await msgRes.json().catch(() => ({}));
      return {
        success: false,
        error: `ส่ง DM ไม่สำเร็จ: ${errJson.message || 'Discord API Error'}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send Discord DM test' };
  }
}

