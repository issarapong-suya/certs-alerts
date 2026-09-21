import { Resend } from 'resend';
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { Personnel, CertificateItem, SystemNotificationSettings } from '@/types/database';
import { formatDisplayDate, getCertificateStatus } from '@/lib/certificate-utils';

/**
 * Send Individual Alert to a specific personnel member
 * Only includes this person's certificates!
 */
export async function sendIndividualPersonnelAlert(person: Personnel): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  discordResult?: any;
  emailResult?: any;
}> {
  const certs = person.certificates || [];
  const today = new Date();

  const expiredCerts: { cert: CertificateItem; days: number }[] = [];
  const expiringCerts: { cert: CertificateItem; days: number }[] = [];

  for (const cert of certs) {
    if (!cert.expire_date) continue;
    const exp = parseISO(cert.expire_date);
    if (!isValid(exp)) continue;

    const days = differenceInCalendarDays(exp, today);
    if (days < 0) {
      expiredCerts.push({ cert, days: Math.abs(days) });
    } else if (days <= 90) {
      expiringCerts.push({ cert, days });
    }
  }

  const hasAlerts = expiredCerts.length > 0 || expiringCerts.length > 0;

  // Track results
  let discordResult = { attempted: false, success: false, error: '' };
  let emailResult = { attempted: false, success: false, error: '' };

  // 1. Send to Person's Discord Webhook
  if (person.enable_discord && person.discord_webhook_url?.trim()) {
    discordResult.attempted = true;
    try {
      const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

      if (expiredCerts.length > 0) {
        fields.push({
          name: `🚨 ใบประกาศที่หมดอายุแล้ว (${expiredCerts.length} ใบ)`,
          value: expiredCerts
            .map(
              (c) =>
                `• **${c.cert.cert_name}** ${c.cert.cert_no ? `(เลขที่ ${c.cert.cert_no})` : ''}\n  วันหมดอายุ: \`${formatDisplayDate(c.cert.expire_date)}\` *(หมดอายุแล้ว ${c.days} วัน)*${c.cert.status_note ? ` - ${c.cert.status_note}` : ''}`
            )
            .join('\n\n'),
          inline: false,
        });
      }

      if (expiringCerts.length > 0) {
        fields.push({
          name: `⚠️ ใบประกาศที่ใกล้หมดอายุใน 90 วัน (${expiringCerts.length} ใบ)`,
          value: expiringCerts
            .map(
              (c) =>
                `• **${c.cert.cert_name}** ${c.cert.cert_no ? `(เลขที่ ${c.cert.cert_no})` : ''}\n  วันหมดอายุ: \`${formatDisplayDate(c.cert.expire_date)}\` *(เหลืออีก ${c.days} วัน)*${c.cert.status_note ? ` - ${c.cert.status_note}` : ''}`
            )
            .join('\n\n'),
          inline: false,
        });
      }

      if (!hasAlerts) {
        fields.push({
          name: `✅ สถานะใบประกาศทั้งหมด`,
          value: `ใบประกาศทั้งหมดของคุณ (${certs.length} ใบ) ยังอยู่ในเกณฑ์ปกติ ไม่พบรายการหมดอายุ`,
          inline: false,
        });
      }

      const embedColor = expiredCerts.length > 0 ? 15548997 : (expiringCerts.length > 0 ? 16753920 : 5763719);

      const payload = {
        content: `🔔 **แจ้งเตือนสถานะใบประกาศนียบัตร: คุณ${person.name}**`,
        embeds: [
          {
            title: `📋 รายละเอียดใบประกาศนียบัตร (${person.position || 'เจ้าหน้าที่'})`,
            description: hasAlerts
              ? `เรียน คุณ${person.name} ระบบตรวจพบใบประกาศนียบัตรที่ถึงกำหนดต้องต่ออายุ กรุณาตรวจสอบรายละเอียดด้านล่าง:`
              : `เรียน คุณ${person.name} รายการใบประกาศของคุณอยู่ในสถานะเรียบร้อยดี`,
            color: embedColor,
            fields,
            footer: {
              text: 'Personnel Certificate Alert System • แจ้งเตือนเฉพาะบุคคล',
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const res = await fetch(person.discord_webhook_url.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        discordResult.success = true;
      } else {
        discordResult.error = `Discord API error: ${res.status}`;
      }
    } catch (e: any) {
      discordResult.error = e.message || 'Failed to send Discord webhook';
    }
  }

  // 2. Send to Person's Email via Resend
  if (person.enable_email && person.email?.trim()) {
    emailResult.attempted = true;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      emailResult.error = 'RESEND_API_KEY is not configured';
    } else {
      try {
        const resend = new Resend(apiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Personnel Certs <onboarding@resend.dev>';

        const certRows = certs
          .map((c) => {
            const status = getCertificateStatus(c.expire_date);
            return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${c.cert_name}</td>
              <td style="padding: 10px 12px; font-mono: monospace; color: #475569;">${c.cert_no || '-'}</td>
              <td style="padding: 10px 12px; font-weight: 600; color: #4f46e5;">${formatDisplayDate(c.expire_date, true)}</td>
              <td style="padding: 10px 12px;">
                <span style="display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #f1f5f9; border: 1px solid #cbd5e1;">
                  ${status.badgeLabel}
                </span>
              </td>
              <td style="padding: 10px 12px; font-size: 13px; color: #64748b;">${c.status_note || '-'}</td>
            </tr>
          `;
          })
          .join('');

        const html = `
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Prompt', 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
              <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
                  <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">🔔 แจ้งเตือนสถานะใบประกาศนียบัตรของคุณ</h1>
                  <p style="margin: 0; color: #64748b; font-size: 13px;">เรียน คุณ <strong>${person.name}</strong> (${person.position || 'เจ้าหน้าที่'})</p>
                </div>

                <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
                  ระบบได้ตรวจสอบสถานะใบประกาศนียบัตรของคุณ พบว่ามีรายการที่ต้องติดตามหรือใกล้หมดอายุ ดังนี้:
                </p>

                <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                    <thead>
                      <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 12px;">
                        <th style="padding: 10px 12px;">ชื่อใบประกาศ</th>
                        <th style="padding: 10px 12px;">เลขที่</th>
                        <th style="padding: 10px 12px;">วันหมดอายุ (พ.ศ.)</th>
                        <th style="padding: 10px 12px;">สถานะ</th>
                        <th style="padding: 10px 12px;">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>${certRows}</tbody>
                  </table>
                </div>

                <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
                  อีเมลนี้ส่งตรงถึงคุณตามที่ตั้งค่าไว้ในระบบ Personnel Certificate Alert System
                </div>
              </div>
            </body>
          </html>
        `;

        const { error } = await resend.emails.send({
          from: fromEmail,
          to: person.email.trim(),
          subject: `[แจ้งเตือน] สถานะใบประกาศนียบัตรของคุณ ${person.name} (${hasAlerts ? 'มีรายการที่ต้องต่ออายุ' : 'ปกติ'})`,
          html,
        });

        if (error) {
          emailResult.error = error.message;
        } else {
          emailResult.success = true;
        }
      } catch (e: any) {
        emailResult.error = e.message || 'Failed to send Resend email';
      }
    }
  }

  const anyAttempted = discordResult.attempted || emailResult.attempted;
  const anySuccess = discordResult.success || emailResult.success;

  if (!anyAttempted) {
    return {
      success: false,
      error: 'บุคคลนี้ยังไม่ได้ระบุ Discord Webhook หรือ Email หรือปิดการแจ้งเตือนไว้',
    };
  }

  return {
    success: anySuccess,
    error: anySuccess ? undefined : (discordResult.error || emailResult.error || 'ส่งไม่สำเร็จ'),
    discordResult,
    emailResult,
  };
}

/**
 * Send Master Admin Summary to System Discord & System Email
 */
export async function sendMasterAdminSummary(
  activePersonnelList: Personnel[],
  settings?: SystemNotificationSettings | null
): Promise<{ success: boolean; error?: string; details?: any }> {
  const webhookUrl = settings ? settings.discord_webhook_url : process.env.DISCORD_WEBHOOK_URL;
  const enableDiscord = settings ? settings.enable_discord : true;

  const adminEmailsRaw = settings ? settings.admin_emails : process.env.ADMIN_EMAIL;
  const enableEmail = settings ? settings.enable_email : true;
  const resendApiKey = process.env.RESEND_API_KEY;

  const today = new Date();
  const alertList: {
    person: Personnel;
    expired: CertificateItem[];
    expiring: CertificateItem[];
  }[] = [];

  for (const person of activePersonnelList) {
    const expired: CertificateItem[] = [];
    const expiring: CertificateItem[] = [];

    for (const cert of person.certificates || []) {
      if (!cert.expire_date) continue;
      const exp = parseISO(cert.expire_date);
      if (!isValid(exp)) continue;

      const diff = differenceInCalendarDays(exp, today);
      if (diff < 0) {
        expired.push(cert);
      } else if (diff <= 90) {
        expiring.push(cert);
      }
    }

    if (expired.length > 0 || expiring.length > 0) {
      alertList.push({ person, expired, expiring });
    }
  }

  if (alertList.length === 0) {
    return { success: true };
  }

  const errors: string[] = [];

  // 1. Discord Master Embed
  if (enableDiscord && webhookUrl?.trim()) {
    try {
      const fields = alertList.slice(0, 15).map(({ person, expired, expiring }) => {
        const details: string[] = [];
        if (expired.length > 0) {
          details.push(`🚨 หมดอายุ: ${expired.map((c) => `${c.cert_name} (\`${formatDisplayDate(c.expire_date)}\`)`).join(', ')}`);
        }
        if (expiring.length > 0) {
          details.push(`⚠️ ใกล้หมดอายุ: ${expiring.map((c) => `${c.cert_name} (\`${formatDisplayDate(c.expire_date)}\`)`).join(', ')}`);
        }
        return {
          name: `👤 ${person.name} [${person.position || 'เจ้าหน้าที่'}]`,
          value: details.join('\n'),
          inline: false,
        };
      });

      const freqLabel =
        settings?.schedule_frequency === 'weekly'
          ? 'ประจำสัปดาห์'
          : settings?.schedule_frequency === 'monthly'
          ? 'ประจำเดือน'
          : 'ประจำวัน';

      const res = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📢 **รายงานภาพรวมใบประกาศนียบัตรบุคลากร (${freqLabel})**`,
          embeds: [
            {
              title: `📊 สรุปบุคลากรที่มีใบประกาศหมดอายุและใกล้หมดอายุ (${alertList.length} คน)`,
              description: `ระบบตรวจพบรายการใบประกาศที่ต้องต่ออายุหรือติดตาม ดังนี้:`,
              color: 15548997,
              fields,
              footer: { text: `Personnel Certificate Alert System • รายงาน${freqLabel}` },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (!res.ok) {
        errors.push(`Discord error: HTTP ${res.status}`);
      }
    } catch (e: any) {
      errors.push(`Discord exception: ${e.message}`);
    }
  }

  // 2. Resend Admin Email (Supports multiple comma-separated emails)
  if (enableEmail && adminEmailsRaw?.trim() && resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Personnel Certs <onboarding@resend.dev>';

      // Parse emails separated by comma or semicolon
      const recipients = adminEmailsRaw
        .split(/[,;]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0 && e.includes('@'));

      if (recipients.length > 0) {
        const rows = alertList
          .map(({ person, expired, expiring }) => {
            const certInfo = [
              ...expired.map((c) => `<span style="color:#b91c1c; font-weight:600;">[หมดอายุ] ${c.cert_name} (${formatDisplayDate(c.expire_date)})</span>`),
              ...expiring.map((c) => `<span style="color:#b45309; font-weight:600;">[ใกล้หมดอายุ] ${c.cert_name} (${formatDisplayDate(c.expire_date)})</span>`),
            ].join('<br/>');

            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight:600; color:#0f172a;">${person.name}</td>
                <td style="padding: 10px 12px; color:#475569;">${person.position || '-'}</td>
                <td style="padding: 10px 12px;">${certInfo}</td>
                <td style="padding: 10px 12px; font-size:12px; color:#64748b;">
                  Discord: ${person.enable_discord && person.discord_webhook_url ? 'เปิด' : 'ปิด'}<br/>
                  Email: ${person.enable_email && person.email ? person.email : 'ไม่ได้ตั้ง'}
                </td>
              </tr>
            `;
          })
          .join('');

        const freqLabel =
          settings?.schedule_frequency === 'weekly'
            ? 'ประจำสัปดาห์'
            : settings?.schedule_frequency === 'monthly'
            ? 'ประจำเดือน'
            : 'ประจำวัน';

        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          to: recipients,
          subject: `[รายงาน${freqLabel}] สรุปใบประกาศนียบัตรที่หมดอายุและใกล้หมดอายุ (${alertList.length} คน)`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Prompt', sans-serif; padding:24px; background-color:#f8fafc;">
              <div style="max-width:700px; margin:0 auto; background:#ffffff; padding:24px; border-radius:12px; border:1px solid #e2e8f0;">
                <h2 style="color:#0f172a; margin-top:0;">📊 รายงานภาพรวมสำหรับผู้ดูแลระบบ (${freqLabel})</h2>
                <p style="color:#475569; font-size:14px;">ระบบตรวจพบบุคลากรที่มีใบประกาศหมดอายุหรือใกล้หมดอายุใน 90 วัน จำนวน <strong>${alertList.length}</strong> คน:</p>
                <table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:16px;">
                  <thead>
                    <tr style="background:#f1f5f9; text-align:left;">
                      <th style="padding:8px 12px;">ชื่อ-สกุล</th>
                      <th style="padding:8px 12px;">ตำแหน่ง</th>
                      <th style="padding:8px 12px;">รายการใบประกาศ</th>
                      <th style="padding:8px 12px;">การแจ้งเตือนส่วนตัว</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
            </div>
          `,
        });

        if (emailError) {
          errors.push(`Email error: ${emailError.message}`);
        }
      }
    } catch (e: any) {
      errors.push(`Email exception: ${e.message}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join(', ') };
  }

  return { success: true };
}

