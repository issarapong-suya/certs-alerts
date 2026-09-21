export interface CertificateItem {
  id: number;
  personnel_id: number;
  cert_name: string;
  cert_no?: string | null;
  expire_date: string | null; // ISO Date YYYY-MM-DD
  status_note?: string | null;
  created_at?: string;
}

// Alias for backwards compatibility
export type PersonnelCertificate = CertificateItem;

export interface Personnel {
  id: number;
  name: string;
  position: string | null;
  email: string | null;
  discord_webhook_url: string | null;
  discord_user_id?: string | null;
  enable_discord: boolean;
  enable_email: boolean;
  is_active: boolean;
  note?: string | null;
  created_at?: string;
  certificates: CertificateItem[];
}

export type CertificateStatus = 
  | 'expired'          // Expired (date < today)
  | 'expiring_soon'    // Expiring within 90 days (0 <= days <= 90)
  | 'active'           // Normal (> 90 days)
  | 'no_expiry';       // expire_date is null

export interface CertificateStatusInfo {
  status: CertificateStatus;
  daysRemaining: number | null;
  badgeLabel: string;
  badgeClass: string;
  rowClass: string;
}

export interface UserNotificationSettings {
  id?: number;
  user_id: string;
  discord_webhook_url: string | null;
  alert_email: string | null;
  enable_discord: boolean;
  enable_email: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  role: 'admin' | 'staff';
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export interface MasterPosition {
  id: number;
  name: string;
  created_at?: string;
}

export interface MasterCertType {
  id: number;
  name: string;
  created_at?: string;
}

export interface SystemNotificationSettings {
  id: number;
  discord_webhook_url: string | null;
  admin_emails: string | null;
  enable_discord: boolean;
  enable_email: boolean;
  schedule_frequency: 'daily' | 'weekly' | 'monthly';
  schedule_day_of_week: number; // 1 = Monday, 7 = Sunday
  schedule_day_of_month: number; // 1 to 31
  schedule_time: string; // e.g. "08:00"
  last_run_at?: string | null;
  updated_at?: string;
}

