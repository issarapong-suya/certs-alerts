'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Shield,
  Clock,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '@/types/database';
import { approveUser, rejectUser, changeUserRole } from '@/actions/users';
import { showToast, showConfirm, showError, showLoading, closeLoading } from '@/lib/swal';

interface UserManagementTabProps {
  users: UserProfile[];
  currentUserId?: string;
  isAdmin?: boolean;
  onRefresh: () => void;
}

export default function UserManagementTab({
  users,
  currentUserId,
  isAdmin = false,
  onRefresh,
}: UserManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (q) {
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchName = u.full_name?.toLowerCase().includes(q) || false;
        return matchEmail || matchName;
      }
      return true;
    });
  }, [users, searchQuery, statusFilter]);

  const pendingCount = users.filter((u) => u.status === 'pending').length;

  async function handleApprove(user: UserProfile) {
    if (!isAdmin) {
      showError('ไม่มีสิทธิ์', 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถอนุมัติผู้ใช้งานได้');
      return;
    }

    const confirmed = await showConfirm(
      'อนุมัติการใช้งาน?',
      `คุณต้องการอนุมัติให้ "${user.email}" เข้าใช้งานระบบใช่หรือไม่`,
      'ใช่, อนุมัติ',
      'ยกเลิก',
      '#10b981'
    );

    if (confirmed) {
      showLoading('กำลังอนุมัติผู้ใช้งาน...');
      const res = await approveUser(user.id);
      closeLoading();
      if (res.success) {
        showToast(`อนุมัติ ${user.email} เรียบร้อยแล้ว`, 'success');
        onRefresh();
      } else {
        showError('อนุมัติไม่สำเร็จ', res.error);
      }
    }
  }

  async function handleReject(user: UserProfile) {
    if (!isAdmin) {
      showError('ไม่มีสิทธิ์', 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถปฏิเสธผู้ใช้งานได้');
      return;
    }

    const confirmed = await showConfirm(
      'ปฏิเสธการใช้งาน?',
      `คุณต้องการปฏิเสธการเข้าใช้งานของ "${user.email}" ใช่หรือไม่`,
      'ใช่, ปฏิเสธ',
      'ยกเลิก',
      '#ef4444'
    );

    if (confirmed) {
      showLoading('กำลังบันทึก...');
      const res = await rejectUser(user.id);
      closeLoading();
      if (res.success) {
        showToast(`ปฏิเสธการเข้าใช้งานของ ${user.email} แล้ว`, 'info');
        onRefresh();
      } else {
        showError('เกิดข้อผิดพลาด', res.error);
      }
    }
  }

  async function handleToggleRole(user: UserProfile) {
    if (!isAdmin) {
      showError('ไม่มีสิทธิ์', 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเปลี่ยนสิทธิ์ผู้ใช้งานได้');
      return;
    }

    const nextRole = user.role === 'admin' ? 'staff' : 'admin';
    const roleLabel = nextRole === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าหน้าที่ทั่วไป (Staff)';

    const confirmed = await showConfirm(
      'เปลี่ยนสิทธิ์การใช้งาน?',
      `ต้องการเปลี่ยนสิทธิ์ของ "${user.email}" ให้เป็น ${roleLabel} ใช่หรือไม่`,
      'ใช่, เปลี่ยนสิทธิ์',
      'ยกเลิก',
      '#4f46e5'
    );

    if (confirmed) {
      showLoading('กำลังเปลี่ยนสิทธิ์...');
      const res = await changeUserRole(user.id, nextRole);
      closeLoading();
      if (res.success) {
        showToast(`ปรับสิทธิ์เป็น ${roleLabel} เรียบร้อยแล้ว`, 'success');
        onRefresh();
      } else {
        showError('เปลี่ยนสิทธิ์ไม่สำเร็จ', res.error);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            การจัดการและอนุมัติผู้ใช้งานระบบ (User Approval & Roles)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            ผู้ใช้ใหม่ที่สมัครสมาชิกจะอยู่ในสถานะรออนุมัติ แอดมินสามารถตรวจสอบและกดอนุมัติการเข้าใช้งานได้ที่นี่
          </p>
          {!isAdmin && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              ⚠️ โหมดดูรายชื่อเท่านั้น (เฉพาะ Admin จึงสามารถอนุมัติ ปฏิเสธ หรือเปลี่ยนสิทธิ์ได้)
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2 text-sm font-semibold">
            <Clock className="w-4 h-4 text-amber-600" />
            รออนุมัติ: <span className="text-base font-bold text-amber-700">{pendingCount}</span> คน
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-xs"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar: Search and Filter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาตามชื่อ หรือ อีเมล..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(
            [
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'pending', label: `รออนุมัติ (${pendingCount})` },
              { id: 'approved', label: 'อนุมัติแล้ว' },
              { id: 'rejected', label: 'ปฏิเสธ' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">ผู้ใช้งาน (ชื่อ / อีเมล)</th>
                <th className="py-4 px-4 text-center">บทบาท (Role)</th>
                <th className="py-4 px-4 text-center">สถานะการอนุมัติ</th>
                <th className="py-4 px-4">วันที่ลงทะเบียน</th>
                <th className="py-4 px-6 text-right">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    ไม่พบรายการผู้ใช้งานที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUserId;

                  let statusBadge = {
                    label: 'รออนุมัติ',
                    bg: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
                    icon: Clock,
                  };

                  if (u.status === 'approved') {
                    statusBadge = {
                      label: 'อนุมัติแล้ว',
                      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
                      icon: CheckCircle2,
                    };
                  } else if (u.status === 'rejected') {
                    statusBadge = {
                      label: 'ปฏิเสธ',
                      bg: 'bg-red-100 text-red-800 border-red-300 font-semibold',
                      icon: XCircle,
                    };
                  }

                  const StatusIcon = statusBadge.icon;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        u.status === 'pending' ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {u.full_name || u.email.split('@')[0]}
                          {isCurrent && (
                            <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                              คุณ
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role === 'admin' ? 'Admin' : 'Staff'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border ${statusBadge.bg}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('th-TH') : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* Approve button */}
                            {u.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleApprove(u)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
                                title="อนุมัติการใช้งาน"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                อนุมัติ
                              </button>
                            )}

                            {/* Reject button */}
                            {u.status !== 'rejected' && !isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleReject(u)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold border border-red-200 cursor-pointer"
                                title="ปฏิเสธการเข้าใช้งาน"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                ปฏิเสธ
                              </button>
                            )}

                            {/* Toggle Role */}
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleToggleRole(u)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                                title="สลับสิทธิ์ Admin / Staff"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {u.role === 'admin' ? 'เป็น Staff' : 'ตั้งเป็น Admin'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            เฉพาะผู้ดูแลระบบ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
