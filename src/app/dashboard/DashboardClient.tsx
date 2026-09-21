'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  RefreshCw,
  Award,
  Bell,
  Mail,
  Send,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  Power,
  Layers,
  UserCheck,
} from 'lucide-react';
import {
  Personnel,
  CertificateStatus,
  UserProfile,
  MasterPosition,
  MasterCertType,
  SystemNotificationSettings,
} from '@/types/database';
import {
  getPersonnelOverallStatus,
  formatDisplayDate,
  getCertificateStatus,
} from '@/lib/certificate-utils';
import {
  togglePersonnelActive,
  deletePersonnel,
  testIndividualAlert,
} from '@/actions/personnel';
import {
  showConfirm,
  showToast,
  showSuccess,
  showError,
  showLoading,
  closeLoading,
} from '@/lib/swal';
import Navbar from '@/components/Navbar';
import PersonnelModal from '@/components/PersonnelModal';
import ManageCertificatesModal from '@/components/ManageCertificatesModal';
import NotificationModal from '@/components/NotificationModal';
import MasterDataTab from '@/components/MasterDataTab';
import UserManagementTab from '@/components/UserManagementTab';
import SystemSettingsTab from '@/components/SystemSettingsTab';

interface DashboardClientProps {
  initialPersonnel: Personnel[];
  currentUserProfile?: UserProfile | null;
  initialUsers?: UserProfile[];
  initialPositions?: MasterPosition[];
  initialCertTypes?: MasterCertType[];
  initialSystemSettings?: SystemNotificationSettings;
  userEmail?: string | null;
}

export default function DashboardClient({
  initialPersonnel,
  currentUserProfile,
  initialUsers = [],
  initialPositions = [],
  initialCertTypes = [],
  initialSystemSettings,
  userEmail,
}: DashboardClientProps) {
  const router = useRouter();

  // Active Main Tab
  const [activeMainTab, setActiveMainTab] = useState<'personnel' | 'master_data' | 'users' | 'settings'>('personnel');

  // Search and Filter states for Personnel
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<
    CertificateStatus | 'all' | 'inactive' | 'active_only'
  >('all');

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal states
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);

  const [isManageCertsOpen, setIsManageCertsOpen] = useState(false);
  const [selectedPersonnelForCerts, setSelectedPersonnelForCerts] = useState<Personnel | null>(null);

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Reset page when filter/search/pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilter, pageSize]);

  // Count pending users for badge
  const pendingUsersCount = useMemo(() => {
    return initialUsers.filter((u) => u.status === 'pending').length;
  }, [initialUsers]);

  const isAdmin = currentUserProfile?.role === 'admin';

  // Guard admin tabs for non-admin users
  useEffect(() => {
    if (!isAdmin && (activeMainTab === 'users' || activeMainTab === 'settings')) {
      setActiveMainTab('personnel');
    }
  }, [isAdmin, activeMainTab]);

  // Compute stats across all personnel and certificates
  const stats = useMemo(() => {
    let expired = 0;
    let expiringSoon = 0;
    let active = 0;
    let inactive = 0;
    let totalCerts = 0;

    for (const p of initialPersonnel) {
      totalCerts += p.certificates?.length || 0;
      if (!p.is_active) {
        inactive++;
        continue;
      }
      const { overallStatus } = getPersonnelOverallStatus(p);
      if (overallStatus === 'expired') expired++;
      else if (overallStatus === 'expiring_soon') expiringSoon++;
      else if (overallStatus === 'active') active++;
    }

    return {
      totalPersonnel: initialPersonnel.length,
      totalCerts,
      expired,
      expiringSoon,
      active,
      inactive,
    };
  }, [initialPersonnel]);

  // Filter and search personnel
  const filteredPersonnel = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return initialPersonnel.filter((person) => {
      const overall = getPersonnelOverallStatus(person);

      if (selectedFilter === 'active_only' && !person.is_active) return false;
      if (selectedFilter === 'inactive' && person.is_active) return false;
      if (
        selectedFilter !== 'all' &&
        selectedFilter !== 'active_only' &&
        selectedFilter !== 'inactive'
      ) {
        if (overall.overallStatus !== selectedFilter) return false;
      }

      if (query) {
        const matchName = person.name.toLowerCase().includes(query);
        const matchPos = person.position?.toLowerCase().includes(query) || false;
        const matchNote = person.note?.toLowerCase().includes(query) || false;
        const matchEmail = person.email?.toLowerCase().includes(query) || false;
        const matchCerts = person.certificates?.some(
          (c) =>
            c.cert_name.toLowerCase().includes(query) ||
            c.cert_no?.toLowerCase().includes(query) ||
            c.status_note?.toLowerCase().includes(query)
        );
        return matchName || matchPos || matchNote || matchEmail || matchCerts;
      }

      return true;
    });
  }, [initialPersonnel, searchQuery, selectedFilter]);

  // Pagination calculations
  const totalItems = filteredPersonnel.length;
  const totalPages = pageSize >= 9999 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPersonnel = useMemo(() => {
    if (pageSize >= 9999) return filteredPersonnel;
    const startIndex = (validCurrentPage - 1) * pageSize;
    return filteredPersonnel.slice(startIndex, startIndex + pageSize);
  }, [filteredPersonnel, validCurrentPage, pageSize]);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endItem = pageSize >= 9999 ? totalItems : Math.min(validCurrentPage * pageSize, totalItems);

  function handleAddPersonnel() {
    setEditingPersonnel(null);
    setIsPersonnelModalOpen(true);
  }

  function handleEditPersonnel(person: Personnel) {
    setEditingPersonnel(person);
    setIsPersonnelModalOpen(true);
  }

  function handleManageCerts(person: Personnel) {
    setSelectedPersonnelForCerts(person);
    setIsManageCertsOpen(true);
  }

  async function handleToggleActive(person: Personnel) {
    const nextState = !person.is_active;
    const confirmed = await showConfirm(
      nextState ? 'เปิดใช้งานชื่อบุคลากร?' : 'ปิดชื่อบุคลากรชั่วคราว?',
      nextState
        ? `ต้องการเปิดใช้งาน "${person.name}" ใช่หรือไม่ (ระบบจะเริ่มส่งแจ้งเตือนตามปกติ)`
        : `ต้องการปิดชื่อ "${person.name}" ใช่หรือไม่ (ระบบจะไม่ส่งแจ้งเตือน Cron สำหรับคนนี้)`,
      nextState ? 'ใช่, เปิดใช้งาน' : 'ใช่, ปิดชื่อ',
      'ยกเลิก',
      nextState ? '#10b981' : '#f59e0b'
    );

    if (confirmed) {
      showLoading('กำลังอัปเดตสถานะ...');
      const res = await togglePersonnelActive(person.id, nextState);
      closeLoading();
      if (res.success) {
        showToast(nextState ? 'เปิดใช้งานเรียบร้อย' : 'ปิดชื่อเรียบร้อย', 'success');
        handleRefresh();
      } else {
        showError('เกิดข้อผิดพลาด', res.error);
      }
    }
  }

  async function handleDeletePersonnel(person: Personnel) {
    const confirmed = await showConfirm(
      'ยืนยันการลบข้อมูลบุคลากร?',
      `คุณต้องการลบ "${person.name}" และประวัติใบประกาศทั้งหมด (${person.certificates?.length || 0} ใบ) หรือไม่? การกระทำนี้ไม่สามารถเรียกคืนได้`,
      'ใช่, ลบเลย',
      'ยกเลิก',
      '#ef4444'
    );

    if (confirmed) {
      showLoading('กำลังลบข้อมูล...');
      const res = await deletePersonnel(person.id);
      closeLoading();

      if (res.success) {
        showToast('ลบข้อมูลบุคลากรเรียบร้อยแล้ว', 'success');
        handleRefresh();
      } else {
        showError('เกิดข้อผิดพลาดในการลบ', res.error);
      }
    }
  }

  async function handleTestAlert(person: Personnel) {
    if (!person.discord_webhook_url && !person.discord_user_id && !person.email) {
      showError(
        'ยังไม่ได้ตั้งค่าช่องทางแจ้งเตือน',
        `กรุณากดแก้ไขข้อมูลของ ${person.name} เพื่อระบุ Discord (Webhook หรือ Bot DM) หรือ Email ก่อน`
      );
      return;
    }

    showLoading(`กำลังส่งแจ้งเตือนเฉพาะบุคคลถึง ${person.name}...`);
    const res = await testIndividualAlert(person.id);
    closeLoading();

    if (res.success) {
      showSuccess(
        'ส่งการแจ้งเตือนส่วนตัวสำเร็จ!',
        `ระบบได้ส่งข้อมูลใบประกาศเฉพาะของ คุณ${person.name} เข้าช่องทางที่เปิดใช้งานเรียบร้อยแล้ว`
      );
    } else {
      showError('ส่งไม่สำเร็จ', res.error || 'เกิดข้อผิดพลาดในการส่ง');
    }
  }

  function handleRefresh() {
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Navbar */}
      <Navbar
        userEmail={userEmail}
        isAdmin={isAdmin}
        onOpenTestNotification={() => setIsNotificationModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs Bar */}
        <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {/* Tab 1: Personnel */}
            <button
              type="button"
              onClick={() => setActiveMainTab('personnel')}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                activeMainTab === 'personnel'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-5 h-5" />
              ทะเบียนบุคลากร & ใบประกาศ
            </button>

            {/* Tab 2: Master Data */}
            <button
              type="button"
              onClick={() => setActiveMainTab('master_data')}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                activeMainTab === 'master_data'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-5 h-5" />
              ตำแหน่ง & ประเภทใบประกาศ
            </button>

            {/* Tab 3: User Approvals (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveMainTab('users')}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer relative ${
                  activeMainTab === 'users'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                อนุมัติผู้ใช้งานระบบ
                {pendingUsersCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950 animate-bounce">
                    {pendingUsersCount}
                  </span>
                )}
              </button>
            )}

            {/* Tab 4: System Alerts Settings (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveMainTab('settings')}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                  activeMainTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-5 h-5" />
                ตั้งค่าแจ้งเตือนส่วนกลาง
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: PERSONNEL & CERTIFICATES */}
        {activeMainTab === 'personnel' && (
          <div className="space-y-6">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  ทะเบียนบุคลากรและการแจ้งเตือน
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mt-1">
                  ระบบ 1 คนหลายใบประกาศ • แจ้งเตือนตรงเข้า Discord & Email ส่วนตัวของแต่ละบุคคล
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm cursor-pointer"
                  title="รีเฟรชข้อมูล"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleAddPersonnel}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-bold rounded-2xl shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  <Plus className="w-5 h-5" />
                  เพิ่มบุคลากรใหม่
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`text-left p-5 rounded-3xl border bg-white transition-all shadow-sm hover:shadow-md cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'ring-2 ring-indigo-500 bg-indigo-50/40 border-indigo-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">บุคลากรทั้งหมด</span>
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                    <Users className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {stats.totalPersonnel} <span className="text-xs sm:text-sm font-normal text-slate-400">({stats.totalCerts} ใบ)</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('expired')}
                className={`text-left p-5 rounded-3xl border bg-white transition-all shadow-sm hover:shadow-md cursor-pointer ${
                  selectedFilter === 'expired'
                    ? 'ring-2 ring-red-500 bg-red-50/40 border-red-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">มีใบหมดอายุ</span>
                  <div className="p-2 rounded-xl bg-red-100 text-red-700">
                    <AlertTriangle className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-red-600">
                  {stats.expired} <span className="text-xs sm:text-sm font-normal text-slate-400">คน</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('expiring_soon')}
                className={`text-left p-5 rounded-3xl border bg-white transition-all shadow-sm hover:shadow-md cursor-pointer ${
                  selectedFilter === 'expiring_soon'
                    ? 'ring-2 ring-amber-500 bg-amber-50/40 border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">ใกล้หมดอายุ (≤ 90 วัน)</span>
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <Clock className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600">
                  {stats.expiringSoon} <span className="text-xs sm:text-sm font-normal text-slate-400">คน</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('active')}
                className={`text-left p-5 rounded-3xl border bg-white transition-all shadow-sm hover:shadow-md cursor-pointer ${
                  selectedFilter === 'active'
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/40 border-emerald-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">สถานะปกติ</span>
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                  {stats.active} <span className="text-xs sm:text-sm font-normal text-slate-400">คน</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('inactive')}
                className={`text-left p-5 rounded-3xl border bg-white transition-all shadow-sm hover:shadow-md cursor-pointer ${
                  selectedFilter === 'inactive'
                    ? 'ring-2 ring-slate-500 bg-slate-100 border-slate-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">ปิดชื่อ / พักงาน</span>
                  <div className="p-2 rounded-xl bg-slate-200 text-slate-700">
                    <Power className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-600">
                  {stats.inactive} <span className="text-xs sm:text-sm font-normal text-slate-400">คน</span>
                </div>
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาตามชื่อ, ตำแหน่ง, ประเภทใบประกาศ หรืออีเมล..."
                  className="w-full pl-12 pr-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ล้างคำค้น
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-sm">
                <span className="text-slate-400 font-semibold px-1 flex items-center gap-1">
                  <Filter className="w-4 h-4" />
                  กรอง:
                </span>
                {(
                  [
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'expired', label: 'มีหมดอายุ' },
                    { id: 'expiring_soon', label: 'ใกล้หมดอายุ' },
                    { id: 'active', label: 'ปกติ' },
                    { id: 'inactive', label: 'ปิดชื่อ' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedFilter(tab.id)}
                    className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedFilter === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Personnel Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-base">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90 text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-5 px-6">ชื่อ-สกุล / ตำแหน่ง</th>
                      <th className="py-5 px-4 text-center">สถานะ</th>
                      <th className="py-5 px-4">รายการใบประกาศ (คลิกเพื่อจัดการ)</th>
                      <th className="py-5 px-4">ความเร่งด่วน</th>
                      <th className="py-5 px-4 text-center">แจ้งเตือนส่วนตัว</th>
                      <th className="py-5 px-6 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedPersonnel.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-slate-400">
                          <div className="max-w-xs mx-auto flex flex-col items-center">
                            <Info className="w-10 h-10 text-slate-300 mb-2" />
                            <span className="font-bold text-slate-700 text-base">ไม่พบข้อมูลบุคลากร</span>
                            <span className="text-xs text-slate-400 mt-1">
                              ลองปรับคำค้นหา หรือเลือกตัวกรองสถานะเป็น &quot;ทั้งหมด&quot;
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedPersonnel.map((person) => {
                        const overall = getPersonnelOverallStatus(person);
                        const certs = person.certificates || [];

                        return (
                          <tr
                            key={person.id}
                            className={`transition-colors ${overall.rowClass}`}
                          >
                            {/* Name & Position */}
                            <td className="py-5 px-6">
                              <div className="font-bold text-slate-900 text-base sm:text-lg">
                                {person.name}
                              </div>
                              <div className="text-sm text-slate-500 font-medium mt-0.5">
                                {person.position || '-'}
                              </div>
                              {person.note && (
                                <div className="text-xs text-slate-400 mt-1 italic">
                                  หมายเหตุ: {person.note}
                                </div>
                              )}
                            </td>

                            {/* Active Toggle Switch */}
                            <td className="py-5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(person)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                                  person.is_active
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                                title={person.is_active ? 'คลิกเพื่อปิดชื่อ' : 'คลิกเพื่อเปิดใช้งาน'}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    person.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                                  }`}
                                />
                                {person.is_active ? 'ใช้งาน' : 'ปิดชื่อ'}
                              </button>
                            </td>

                            {/* Certificates Column */}
                            <td className="py-5 px-4">
                              <div className="flex flex-wrap items-center gap-2 max-w-md">
                                {certs.length === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleManageCerts(person)}
                                    className="text-xs sm:text-sm text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4" /> เพิ่มใบประกาศ
                                  </button>
                                ) : (
                                  certs.map((c) => {
                                    const certStatus = getCertificateStatus(c.expire_date);
                                    return (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleManageCerts(person)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${certStatus.badgeClass} hover:opacity-85 shadow-2xs`}
                                        title={`${c.cert_name}: วันหมดอายุ ${formatDisplayDate(c.expire_date)}`}
                                      >
                                        <Award className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate max-w-[150px]">{c.cert_name}</span>
                                        <span className="font-mono text-[11px] opacity-85">
                                          ({formatDisplayDate(c.expire_date)})
                                        </span>
                                      </button>
                                    );
                                  })
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleManageCerts(person)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-1.5 py-0.5 rounded-md hover:bg-indigo-50 cursor-pointer"
                                  title="จัดการ/เพิ่มใบประกาศ"
                                >
                                  + จัดการ ({certs.length})
                                </button>
                              </div>
                            </td>

                            {/* Overall Urgency Badge */}
                            <td className="py-5 px-4">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${overall.badgeClass}`}
                              >
                                {overall.badgeLabel}
                              </span>
                            </td>

                            {/* Personal Alert Status Icons */}
                            <td className="py-5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span
                                  className={`p-2 rounded-xl ${
                                    person.enable_discord && person.discord_webhook_url
                                      ? 'bg-indigo-100 text-indigo-700'
                                      : 'bg-slate-100 text-slate-300'
                                  }`}
                                  title={
                                    person.enable_discord && person.discord_webhook_url
                                      ? 'เปิดแจ้งเตือน Discord ส่วนตัว'
                                      : 'ไม่ได้ตั้งค่า หรือปิด Discord'
                                  }
                                >
                                  <Bell className="w-4 h-4" />
                                </span>

                                <span
                                  className={`p-2 rounded-xl ${
                                    person.enable_email && person.email
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-100 text-slate-300'
                                  }`}
                                  title={
                                    person.enable_email && person.email
                                      ? `เปิดแจ้งเตือน Email: ${person.email}`
                                      : 'ไม่ได้ตั้งค่า หรือปิด Email'
                                  }
                                >
                                  <Mail className="w-4 h-4" />
                                </span>
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-5 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleTestAlert(person)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                                  title="ทดสอบส่งแจ้งเตือนเฉพาะบุคคลนี้"
                                >
                                  <Send className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleEditPersonnel(person)}
                                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                  title="แก้ไขข้อมูล & ตั้งค่าแจ้งเตือนส่วนตัว"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeletePersonnel(person)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                  title="ลบข้อมูลบุคลากร"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer: Pagination */}
              <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  <span>
                    แสดง <strong className="text-slate-800 font-bold">{startItem} - {endItem}</strong> จากทั้งหมด{' '}
                    <strong className="text-slate-800 font-bold">{totalItems}</strong> คน
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">แสดง:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value={5}>5 คน</option>
                      <option value={10}>10 คน</option>
                      <option value={20}>20 คน</option>
                      <option value={50}>50 คน</option>
                      <option value={9999}>ทั้งหมด</option>
                    </select>
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      disabled={validCurrentPage <= 1}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="หน้าแรก"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={validCurrentPage <= 1}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="หน้าก่อนหน้า"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        Math.abs(pageNum - validCurrentPage) <= 1
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`min-w-[34px] h-9 px-3 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                              validCurrentPage === pageNum
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === validCurrentPage - 2 ||
                        pageNum === validCurrentPage + 2
                      ) {
                        return (
                          <span key={pageNum} className="px-1 text-slate-400 font-bold">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={validCurrentPage >= totalPages}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="หน้าถัดไป"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={validCurrentPage >= totalPages}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="หน้าสุดท้าย"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MASTER DATA */}
        {activeMainTab === 'master_data' && (
          <MasterDataTab
            positions={initialPositions}
            certTypes={initialCertTypes}
            onRefresh={handleRefresh}
          />
        )}

        {/* TAB 3: USER MANAGEMENT & APPROVALS (ADMIN ONLY) */}
        {activeMainTab === 'users' && isAdmin && (
          <UserManagementTab
            users={initialUsers}
            currentUserId={currentUserProfile?.id}
            isAdmin={isAdmin}
            onRefresh={handleRefresh}
          />
        )}

        {/* TAB 4: SYSTEM NOTIFICATION SETTINGS (ADMIN ONLY) */}
        {activeMainTab === 'settings' && isAdmin && (
          <SystemSettingsTab
            initialSettings={
              initialSystemSettings || {
                id: 1,
                discord_webhook_url: '',
                admin_emails: '',
                enable_discord: true,
                enable_email: true,
                schedule_frequency: 'daily',
                schedule_day_of_week: 1,
                schedule_day_of_month: 1,
                schedule_time: '08:00',
              }
            }
            isAdmin={isAdmin}
            onRefresh={handleRefresh}
          />
        )}
      </main>

      {/* Modals */}
      <PersonnelModal
        isOpen={isPersonnelModalOpen}
        onClose={() => setIsPersonnelModalOpen(false)}
        personnel={editingPersonnel}
        availablePositions={initialPositions}
        availableCertTypes={initialCertTypes}
        onSuccess={handleRefresh}
      />

      <ManageCertificatesModal
        isOpen={isManageCertsOpen}
        onClose={() => setIsManageCertsOpen(false)}
        personnel={selectedPersonnelForCerts}
        availableCertTypes={initialCertTypes}
        onSuccess={handleRefresh}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </div>
  );
}
