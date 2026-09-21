'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }
    return { error: error.message };
  }

  if (data?.user) {
    // Check user profile approval status
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('status, role')
      .eq('id', data.user.id)
      .maybeSingle();

    const isDesignatedAdmin =
      data.user.email?.toLowerCase() === 'issarapong.suya@gmail.com' ||
      data.user.email?.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();

    if (!isDesignatedAdmin && profile && profile.status === 'pending') {
      await supabase.auth.signOut();
      return {
        error:
          'บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ (Pending Approval) กรุณาติดต่อแอดมินเพื่อเปิดใช้งาน',
      };
    }

    if (!isDesignatedAdmin && profile && profile.status === 'rejected') {
      await supabase.auth.signOut();
      return {
        error:
          'บัญชีของคุณไม่ได้รับการอนุมัติการเข้าใช้งาน (Rejected) กรุณาติดต่อผู้ดูแลระบบ',
      };
    }
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'กรุณากรอกอีเมลและรหัสผ่าน' };
  }

  if (password.length < 6) {
    return { error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' };
  }

  try {
    const adminClient = createAdminClient();
    const isDesignatedAdmin =
      email.toLowerCase() === 'issarapong.suya@gmail.com' ||
      email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();

    // Use admin.createUser to bypass Supabase built-in SMTP rate limits
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: email.split('@')[0],
      },
    });

    if (createError) {
      if (
        createError.message.includes('already registered') ||
        createError.message.includes('already been registered')
      ) {
        return { error: 'อีเมลนี้ได้ลงทะเบียนไว้ในระบบแล้ว กรุณาเข้าสู่ระบบ' };
      }
      return { error: createError.message };
    }

    if (newUser?.user) {
      // Upsert profile into public.user_profiles
      await adminClient.from('user_profiles').upsert({
        id: newUser.user.id,
        email: newUser.user.email,
        full_name: newUser.user.email?.split('@')[0],
        role: isDesignatedAdmin ? 'admin' : 'staff',
        status: isDesignatedAdmin ? 'approved' : 'pending',
      });
    }

    return {
      success: isDesignatedAdmin
        ? 'สร้างบัญชีผู้ดูแลระบบสำเร็จ! สามารถเข้าสู่ระบบได้ทันที'
        : 'ลงทะเบียนสำเร็จ! บัญชีของคุณอยู่ในสถานะ "รอการอนุมัติ" กรุณารอผู้ดูแลระบบอนุมัติก่อนเข้าใช้งาน',
    };
  } catch (err: any) {
    return { error: err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน' };
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

