'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UserProfile } from '@/types/database';

export async function getCurrentUserProfile(): Promise<{
  profile: UserProfile | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { profile: null, error: 'Not authenticated' };
    }

    const isDesignatedAdmin =
      user.email?.toLowerCase() === 'issarapong.suya@gmail.com' ||
      user.email?.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();

    const adminClient = createAdminClient();

    const { data: profile, error } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error && !error.message.includes('does not exist')) {
      return { profile: null, error: error.message };
    }

    // Guarantee that designated admin email ALWAYS has role 'admin' and status 'approved'
    if (isDesignatedAdmin) {
      if (!profile || profile.role !== 'admin' || profile.status !== 'approved') {
        const adminProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role: 'admin',
          status: 'approved',
        };
        await adminClient.from('user_profiles').upsert(adminProfile);
        return { profile: adminProfile, error: null };
      }
    }

    // If profile row doesn't exist yet for normal user
    if (!profile) {
      const newProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        role: isDesignatedAdmin ? 'admin' : 'staff',
        status: isDesignatedAdmin ? 'approved' : 'pending',
      };

      await adminClient.from('user_profiles').upsert(newProfile);
      return { profile: newProfile, error: null };
    }

    return { profile: profile as UserProfile, error: null };
  } catch (err: any) {
    return { profile: null, error: err.message || 'Failed to fetch user profile' };
  }
}

export async function getAllUserProfiles(): Promise<{
  profiles: UserProfile[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { profiles: null, error: 'ยังไม่ได้เข้าสู่ระบบ' };
    }

    const adminClient = createAdminClient();

    // Auto-sync any users from auth.users who might not be in user_profiles yet
    try {
      const { data: authUsersData } = await adminClient.auth.admin.listUsers();
      if (authUsersData?.users && authUsersData.users.length > 0) {
        for (const u of authUsersData.users) {
          const isDesignated =
            u.email?.toLowerCase() === 'issarapong.suya@gmail.com' ||
            u.email?.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();

          await adminClient.from('user_profiles').upsert(
            {
              id: u.id,
              email: u.email || '',
              full_name: u.user_metadata?.full_name || u.email?.split('@')[0],
              role: isDesignated ? 'admin' : 'staff',
              status: isDesignated ? 'approved' : 'pending',
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );
        }
      }
    } catch {}

    const { data, error } = await adminClient
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { profiles: null, error: error.message };
    }

    return { profiles: data as UserProfile[], error: null };
  } catch (err: any) {
    return { profiles: null, error: err.message || 'Failed to fetch user profiles' };
  }
}

async function checkAdminPermission(): Promise<{ isAdmin: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' };
  }

  const isDesignatedAdmin =
    user.email?.toLowerCase() === 'issarapong.suya@gmail.com' ||
    user.email?.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();

  if (isDesignatedAdmin) {
    return { isAdmin: true };
  }

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin' || profile.status !== 'approved') {
    return { isAdmin: false, error: 'คุณไม่มีสิทธิ์ดำเนินการนี้ (เฉพาะผู้ดูแลระบบ Admin เท่านั้น)' };
  }

  return { isAdmin: true };
}

export async function approveUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const authCheck = await checkAdminPermission();
    if (!authCheck.isAdmin) {
      return { success: false, error: authCheck.error };
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('user_profiles')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to approve user' };
  }
}

export async function rejectUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const authCheck = await checkAdminPermission();
    if (!authCheck.isAdmin) {
      return { success: false, error: authCheck.error };
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from('user_profiles')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to reject user' };
  }
}

export async function changeUserRole(
  userId: string,
  newRole: 'admin' | 'staff'
): Promise<{ success: boolean; error?: string }> {
  try {
    const authCheck = await checkAdminPermission();
    if (!authCheck.isAdmin) {
      return { success: false, error: authCheck.error };
    }

    const adminClient = createAdminClient();

    // Prevent changing role of the designated primary admin
    const { data: targetUser } = await adminClient
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    if (
      targetUser?.email?.toLowerCase() === 'issarapong.suya@gmail.com' ||
      targetUser?.email?.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase()
    ) {
      return {
        success: false,
        error: 'ไม่สามารถเปลี่ยนสิทธิ์ของผู้ดูแลระบบหลัก (Designated Admin) ได้',
      };
    }

    const { error } = await adminClient
      .from('user_profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to change role' };
  }
}


