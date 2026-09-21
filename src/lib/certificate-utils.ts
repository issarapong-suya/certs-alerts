import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { CertificateStatusInfo, CertificateItem, Personnel, CertificateStatus } from '@/types/database';

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const THAI_MONTHS_LONG = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export function getCertificateStatus(expireDateStr: string | null): CertificateStatusInfo {
  if (!expireDateStr) {
    return {
      status: 'no_expiry',
      daysRemaining: null,
      badgeLabel: 'ไม่มีวันหมดอายุ',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      rowClass: 'hover:bg-slate-50 border-l-4 border-l-slate-300',
    };
  }

  const expireDate = parseISO(expireDateStr);
  if (!isValid(expireDate)) {
    return {
      status: 'no_expiry',
      daysRemaining: null,
      badgeLabel: 'รูปแบบวันที่ไม่ถูกต้อง',
      badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
      rowClass: 'hover:bg-slate-50',
    };
  }

  const today = new Date();
  const daysDiff = differenceInCalendarDays(expireDate, today);

  if (daysDiff < 0) {
    const pastDays = Math.abs(daysDiff);
    return {
      status: 'expired',
      daysRemaining: daysDiff,
      badgeLabel: `หมดอายุแล้ว (${pastDays} วันที่ผ่านมา)`,
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-semibold',
      rowClass: 'bg-red-50/50 hover:bg-red-50/80 border-l-4 border-l-red-500',
    };
  }

  if (daysDiff === 0) {
    return {
      status: 'expiring_soon',
      daysRemaining: 0,
      badgeLabel: 'หมดอายุวันนี้',
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-semibold animate-pulse',
      rowClass: 'bg-red-50/50 hover:bg-red-50/80 border-l-4 border-l-red-500',
    };
  }

  if (daysDiff <= 90) {
    return {
      status: 'expiring_soon',
      daysRemaining: daysDiff,
      badgeLabel: `เหลืออีก ${daysDiff} วัน`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
      rowClass: 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500',
    };
  }

  return {
    status: 'active',
    daysRemaining: daysDiff,
    badgeLabel: `ปกติ (เหลืออีก ${daysDiff} วัน)`,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    rowClass: 'hover:bg-slate-50 border-l-4 border-l-emerald-500',
  };
}

export interface PersonnelOverallStatus {
  overallStatus: CertificateStatus | 'inactive';
  badgeLabel: string;
  badgeClass: string;
  rowClass: string;
  expiredCount: number;
  expiringCount: number;
  activeCount: number;
  totalCerts: number;
}

export function getPersonnelOverallStatus(person: Personnel): PersonnelOverallStatus {
  if (!person.is_active) {
    return {
      overallStatus: 'inactive',
      badgeLabel: 'ปิดชื่อ / พักงาน',
      badgeClass: 'bg-slate-200 text-slate-600 border-slate-300',
      rowClass: 'bg-slate-100/70 opacity-60 border-l-4 border-l-slate-400',
      expiredCount: 0,
      expiringCount: 0,
      activeCount: 0,
      totalCerts: person.certificates?.length || 0,
    };
  }

  const certs = person.certificates || [];
  if (certs.length === 0) {
    return {
      overallStatus: 'no_expiry',
      badgeLabel: 'ยังไม่มีใบประกาศ',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
      rowClass: 'hover:bg-slate-50 border-l-4 border-l-slate-300',
      expiredCount: 0,
      expiringCount: 0,
      activeCount: 0,
      totalCerts: 0,
    };
  }

  let expiredCount = 0;
  let expiringCount = 0;
  let activeCount = 0;
  let minDaysDiff: number | null = null;

  for (const cert of certs) {
    const info = getCertificateStatus(cert.expire_date);
    if (info.status === 'expired') {
      expiredCount++;
    } else if (info.status === 'expiring_soon') {
      expiringCount++;
      if (info.daysRemaining !== null) {
        if (minDaysDiff === null || info.daysRemaining < minDaysDiff) {
          minDaysDiff = info.daysRemaining;
        }
      }
    } else if (info.status === 'active') {
      activeCount++;
    }
  }

  if (expiredCount > 0) {
    return {
      overallStatus: 'expired',
      badgeLabel: `มีหมดอายุ ${expiredCount} ใบ`,
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-semibold',
      rowClass: 'bg-red-50/50 hover:bg-red-50/80 border-l-4 border-l-red-500',
      expiredCount,
      expiringCount,
      activeCount,
      totalCerts: certs.length,
    };
  }

  if (expiringCount > 0) {
    return {
      overallStatus: 'expiring_soon',
      badgeLabel: minDaysDiff !== null ? `ใกล้หมดอายุ (เร็วสุด ${minDaysDiff} วัน)` : `ใกล้หมดอายุ ${expiringCount} ใบ`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
      rowClass: 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500',
      expiredCount,
      expiringCount,
      activeCount,
      totalCerts: certs.length,
    };
  }

  if (activeCount > 0) {
    return {
      overallStatus: 'active',
      badgeLabel: `ปกติ (${certs.length} ใบ)`,
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      rowClass: 'hover:bg-slate-50 border-l-4 border-l-emerald-500',
      expiredCount,
      expiringCount,
      activeCount,
      totalCerts: certs.length,
    };
  }

  return {
    overallStatus: 'no_expiry',
    badgeLabel: 'ไม่มีวันหมดอายุ',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    rowClass: 'hover:bg-slate-50 border-l-4 border-l-slate-300',
    expiredCount: 0,
    expiringCount: 0,
    activeCount: 0,
    totalCerts: certs.length,
  };
}

/**
 * Format ISO Date (YYYY-MM-DD) into Thai Buddhist Era (พ.ศ.) format
 * @example '2027-12-23' -> '23 ธ.ค. 2570' (short) or '23 ธันวาคม 2570' (full)
 */
export function formatDisplayDate(dateStr: string | null, fullMonth: boolean = false): string {
  if (!dateStr) return '-';
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) return dateStr;

  const day = parsed.getDate();
  const monthIdx = parsed.getMonth();
  const beYear = parsed.getFullYear() + 543;

  const monthName = fullMonth ? THAI_MONTHS_LONG[monthIdx] : THAI_MONTHS_SHORT[monthIdx];
  return `${day} ${monthName} ${beYear}`;
}
