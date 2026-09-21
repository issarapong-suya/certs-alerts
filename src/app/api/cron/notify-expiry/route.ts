import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendIndividualPersonnelAlert, sendMasterAdminSummary } from '@/lib/notifications';
import { Personnel, SystemNotificationSettings } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  try {
    // 1. Verify Authorization if CRON_SECRET is set
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (cronSecret && cronSecret !== 'your_secure_cron_secret_key_here') {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Invalid CRON_SECRET token' },
          { status: 401 }
        );
      }
    }

    const supabase = createAdminClient();

    // 2. Fetch System Notification Settings
    const { data: settingsData } = await supabase
      .from('system_notification_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    const systemSettings = settingsData as SystemNotificationSettings | null;

    // Determine if Master Summary should run today based on schedule frequency
    const now = new Date();
    let shouldRunMasterSummary = true;
    let skipReason = '';

    if (systemSettings) {
      if (systemSettings.schedule_frequency === 'weekly') {
        // JavaScript getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // We defined schedule_day_of_week: 1 = Monday, 7 = Sunday
        const jsDay = now.getDay();
        const currentDayOfWeek = jsDay === 0 ? 7 : jsDay;
        const targetDayOfWeek = systemSettings.schedule_day_of_week || 1;

        if (currentDayOfWeek !== targetDayOfWeek) {
          shouldRunMasterSummary = false;
          skipReason = `Weekly schedule set for day ${targetDayOfWeek}, but today is day ${currentDayOfWeek}`;
        }
      } else if (systemSettings.schedule_frequency === 'monthly') {
        const currentDayOfMonth = now.getDate();
        const targetDayOfMonth = systemSettings.schedule_day_of_month || 1;

        if (currentDayOfMonth !== targetDayOfMonth) {
          shouldRunMasterSummary = false;
          skipReason = `Monthly schedule set for day ${targetDayOfMonth}, but today is day ${currentDayOfMonth}`;
        }
      }
    }

    // 3. Fetch all active personnel with their certificates
    const { data: personnelList, error: fetchError } = await supabase
      .from('personnel')
      .select('*, certificates(*)')
      .eq('is_active', true);

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: `Database error: ${fetchError.message}` },
        { status: 500 }
      );
    }

    const activePersonnel = (personnelList as Personnel[]) || [];

    // 4. Send Individual alerts to each person (only if they have expiring/expired certificates)
    const individualPromises = activePersonnel.map(async (person) => {
      const hasChannel =
        (person.enable_discord && (person.discord_webhook_url?.trim() || person.discord_user_id?.trim())) ||
        (person.enable_email && person.email?.trim());

      if (!hasChannel) return null;

      return await sendIndividualPersonnelAlert(person, true);
    });

    // 5. Send Master Admin Summary if scheduled
    let masterResult: { success: boolean; error?: string } = { success: true };
    if (shouldRunMasterSummary) {
      masterResult = await sendMasterAdminSummary(activePersonnel, systemSettings);

      // Update last_run_at in system_notification_settings
      await supabase
        .from('system_notification_settings')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', 1);
    }

    const individualResults = await Promise.allSettled(individualPromises);

    const sentCount = individualResults.filter(
      (r) => r.status === 'fulfilled' && r.value && r.value.success
    ).length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalActivePersonnel: activePersonnel.length,
        individualAlertsDispatched: sentCount,
        masterAdminSummarySent: shouldRunMasterSummary ? masterResult.success : false,
        masterSummarySkipped: !shouldRunMasterSummary ? skipReason : undefined,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

