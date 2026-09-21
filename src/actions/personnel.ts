'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Personnel, CertificateItem } from '@/types/database';
import { sendIndividualPersonnelAlert } from '@/lib/notifications';

export async function getPersonnelList(): Promise<{ data: Personnel[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Fetch personnel with all certificates
    const { data, error } = await supabase
      .from('personnel')
      .select('*, certificates(*)')
      .order('is_active', { ascending: false })
      .order('id', { ascending: true });

    if (error) {
      // Fallback: If migration not run yet, handle gracefully
      return { data: null, error: error.message };
    }

    // Sort certificates inside each personnel by expire_date
    const personnelWithSortedCerts = (data as any[]).map((p) => {
      const certs = (p.certificates || []) as CertificateItem[];
      certs.sort((a, b) => {
        if (!a.expire_date) return 1;
        if (!b.expire_date) return -1;
        return a.expire_date.localeCompare(b.expire_date);
      });
      return {
        ...p,
        certificates: certs,
      } as Personnel;
    });

    return { data: personnelWithSortedCerts, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch personnel list' };
  }
}

export async function createPersonnel(formData: {
  name: string;
  position?: string | null;
  email?: string | null;
  discord_webhook_url?: string | null;
  enable_discord?: boolean;
  enable_email?: boolean;
  is_active?: boolean;
  note?: string | null;
  initial_cert?: {
    cert_name: string;
    cert_no?: string | null;
    expire_date?: string | null;
    status_note?: string | null;
  };
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient();

    if (!formData.name?.trim()) {
      return { success: false, error: 'กรุณากรอกชื่อ-สกุล' };
    }

    const { data: newPerson, error: personError } = await supabase
      .from('personnel')
      .insert([
        {
          name: formData.name.trim(),
          position: formData.position?.trim() || null,
          email: formData.email?.trim() || null,
          discord_webhook_url: formData.discord_webhook_url?.trim() || null,
          enable_discord: formData.enable_discord !== false,
          enable_email: formData.enable_email !== false,
          is_active: formData.is_active !== false,
          note: formData.note?.trim() || null,
        },
      ])
      .select()
      .single();

    if (personError) {
      return { success: false, error: personError.message };
    }

    // Add initial certificate if provided
    if (formData.initial_cert && formData.initial_cert.cert_name?.trim()) {
      await supabase.from('certificates').insert([
        {
          personnel_id: newPerson.id,
          cert_name: formData.initial_cert.cert_name.trim(),
          cert_no: formData.initial_cert.cert_no?.trim() || null,
          expire_date: formData.initial_cert.expire_date || null,
          status_note: formData.initial_cert.status_note?.trim() || null,
        },
      ]);
    }

    revalidatePath('/dashboard');
    return { success: true, data: newPerson };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create personnel' };
  }
}

export async function updatePersonnel(
  id: number,
  formData: {
    name: string;
    position?: string | null;
    email?: string | null;
    discord_webhook_url?: string | null;
    enable_discord: boolean;
    enable_email: boolean;
    is_active: boolean;
    note?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    if (!formData.name?.trim()) {
      return { success: false, error: 'กรุณากรอกชื่อ-สกุล' };
    }

    const { error } = await supabase
      .from('personnel')
      .update({
        name: formData.name.trim(),
        position: formData.position?.trim() || null,
        email: formData.email?.trim() || null,
        discord_webhook_url: formData.discord_webhook_url?.trim() || null,
        enable_discord: formData.enable_discord,
        enable_email: formData.enable_email,
        is_active: formData.is_active,
        note: formData.note?.trim() || null,
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update personnel' };
  }
}

export async function togglePersonnelActive(
  id: number,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('personnel')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to toggle active status' };
  }
}

export async function deletePersonnel(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('personnel').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete personnel' };
  }
}

export async function addCertificate(
  personnelId: number,
  certData: {
    cert_name: string;
    cert_no?: string | null;
    expire_date?: string | null;
    status_note?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    if (!certData.cert_name?.trim()) {
      return { success: false, error: 'กรุณากรอกชื่อใบประกาศนียบัตร' };
    }

    const { error } = await supabase.from('certificates').insert([
      {
        personnel_id: personnelId,
        cert_name: certData.cert_name.trim(),
        cert_no: certData.cert_no?.trim() || null,
        expire_date: certData.expire_date || null,
        status_note: certData.status_note?.trim() || null,
      },
    ]);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to add certificate' };
  }
}

export async function updateCertificate(
  certId: number,
  certData: {
    cert_name: string;
    cert_no?: string | null;
    expire_date?: string | null;
    status_note?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    if (!certData.cert_name?.trim()) {
      return { success: false, error: 'กรุณากรอกชื่อใบประกาศนียบัตร' };
    }

    const { error } = await supabase
      .from('certificates')
      .update({
        cert_name: certData.cert_name.trim(),
        cert_no: certData.cert_no?.trim() || null,
        expire_date: certData.expire_date || null,
        status_note: certData.status_note?.trim() || null,
      })
      .eq('id', certId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update certificate' };
  }
}

export async function deleteCertificate(certId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('certificates').delete().eq('id', certId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete certificate' };
  }
}

export async function testIndividualAlert(personnelId: number): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  results?: any;
}> {
  try {
    const supabase = await createClient();

    const { data: person, error } = await supabase
      .from('personnel')
      .select('*, certificates(*)')
      .eq('id', personnelId)
      .single();

    if (error || !person) {
      return { success: false, error: 'ไม่พบข้อมูลบุคลากร' };
    }

    const res = await sendIndividualPersonnelAlert(person as Personnel);
    return res;
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to test individual alert' };
  }
}
