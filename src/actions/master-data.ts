'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MasterPosition, MasterCertType } from '@/types/database';

// ---------------- Master Positions ----------------

export async function getMasterPositions(): Promise<{
  data: MasterPosition[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('master_positions')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as MasterPosition[], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch positions' };
  }
}

export async function createMasterPosition(name: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    if (!name?.trim()) return { success: false, error: 'กรุณากรอกชื่อตำแหน่ง' };

    const { error } = await supabase
      .from('master_positions')
      .insert([{ name: name.trim() }]);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateMasterPosition(id: number, name: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    if (!name?.trim()) return { success: false, error: 'กรุณากรอกชื่อตำแหน่ง' };

    const { error } = await supabase
      .from('master_positions')
      .update({ name: name.trim() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteMasterPosition(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('master_positions')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ---------------- Master Certificate Types ----------------

export async function getMasterCertTypes(): Promise<{
  data: MasterCertType[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('master_cert_types')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data as MasterCertType[], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch certificate types' };
  }
}

export async function createMasterCertType(name: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    if (!name?.trim()) return { success: false, error: 'กรุณากรอกชื่อประเภทใบประกาศ' };

    const { error } = await supabase
      .from('master_cert_types')
      .insert([{ name: name.trim() }]);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateMasterCertType(id: number, name: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    if (!name?.trim()) return { success: false, error: 'กรุณากรอกชื่อประเภทใบประกาศ' };

    const { error } = await supabase
      .from('master_cert_types')
      .update({ name: name.trim() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteMasterCertType(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('master_cert_types')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
