'use client';

import { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Award,
  Edit2,
} from 'lucide-react';
import { Personnel, CertificateItem, MasterCertType } from '@/types/database';
import { addCertificate, updateCertificate, deleteCertificate } from '@/actions/personnel';
import { showToast, showConfirm, showError } from '@/lib/swal';
import { formatDisplayDate, getCertificateStatus } from '@/lib/certificate-utils';

interface ManageCertificatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: Personnel | null;
  availableCertTypes?: MasterCertType[];
  onSuccess: () => void;
}

const FALLBACK_CERTS = [
  'ใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์',
  'ประกาศนียบัตรผู้ปฏิบัติการแพทย์ขั้นพื้นฐาน (EMT-B)',
  'ประกาศนียบัตรอาสาสมัครฉุกเฉินการแพทย์ (EMR)',
  'ประกาศนียบัตรการช่วยฟื้นคืนชีพขั้นสูง (ACLS)',
  'ประกาศนียบัตรการช่วยฟื้นคืนชีพขั้นพื้นฐาน (BLS/CPR)',
  'ใบอนุญาตขับรถยนต์ส่วนบุคคล/รถพยาบาลฉุกเฉิน',
];

export default function ManageCertificatesModal({
  isOpen,
  onClose,
  personnel,
  availableCertTypes = [],
  onSuccess,
}: ManageCertificatesModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCertId, setEditingCertId] = useState<number | null>(null);

  // Form states
  const [certName, setCertName] = useState('');
  const [certNo, setCertNo] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !personnel) return null;

  const certs = personnel.certificates || [];
  const certTypeOptions = availableCertTypes.length > 0
    ? availableCertTypes.map((c) => c.name)
    : FALLBACK_CERTS;

  function resetForm() {
    setIsAdding(false);
    setEditingCertId(null);
    setCertName('');
    setCertNo('');
    setExpireDate('');
    setStatusNote('');
  }

  function startEdit(cert: CertificateItem) {
    setIsAdding(false);
    setEditingCertId(cert.id);
    setCertName(cert.cert_name || '');
    setCertNo(cert.cert_no || '');
    setExpireDate(cert.expire_date || '');
    setStatusNote(cert.status_note || '');
  }

  async function handleSaveNew(e: React.FormEvent) {
    e.preventDefault();
    if (!certName.trim()) {
      showError('กรุณากรอกชื่อใบประกาศนียบัตร');
      return;
    }

    setIsSubmitting(true);
    const res = await addCertificate(personnel!.id, {
      cert_name: certName.trim(),
      cert_no: certNo.trim() || null,
      expire_date: expireDate || null,
      status_note: statusNote.trim() || null,
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('เพิ่มใบประกาศเรียบร้อยแล้ว', 'success');
      resetForm();
      onSuccess();
    } else {
      showError('เพิ่มไม่สำเร็จ', res.error);
    }
  }

  async function handleSaveEdit(certId: number) {
    if (!certName.trim()) {
      showError('กรุณากรอกชื่อใบประกาศนียบัตร');
      return;
    }

    setIsSubmitting(true);
    const res = await updateCertificate(certId, {
      cert_name: certName.trim(),
      cert_no: certNo.trim() || null,
      expire_date: expireDate || null,
      status_note: statusNote.trim() || null,
    });
    setIsSubmitting(false);

    if (res.success) {
      showToast('แก้ไขใบประกาศเรียบร้อยแล้ว', 'success');
      resetForm();
      onSuccess();
    } else {
      showError('แก้ไขไม่สำเร็จ', res.error);
    }
  }

  async function handleDelete(cert: CertificateItem) {
    const confirmed = await showConfirm(
      'ยืนยันการลบใบประกาศ?',
      `คุณต้องการลบ "${cert.cert_name}" หรือไม่?`,
      'ใช่, ลบเลย',
      'ยกเลิก',
      '#ef4444'
    );

    if (confirmed) {
      const res = await deleteCertificate(cert.id);
      if (res.success) {
        showToast('ลบใบประกาศเรียบร้อยแล้ว', 'success');
        onSuccess();
      } else {
        showError('ลบไม่สำเร็จ', res.error);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                จัดการใบประกาศนียบัตร: {personnel.name}
              </h2>
              <p className="text-sm text-slate-500">
                ตำแหน่ง: <strong>{personnel.position || '-'}</strong> • ถือครองทั้งหมด {certs.length} ใบ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Certificate List (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-5 space-y-3.5">
          {certs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              ยังไม่มีรายการใบประกาศนียบัตรสำหรับบุคลากรท่านนี้
            </div>
          ) : (
            certs.map((cert) => {
              const status = getCertificateStatus(cert.expire_date);
              const isEditingThis = editingCertId === cert.id;

              if (isEditingThis) {
                return (
                  <div
                    key={cert.id}
                    className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3.5"
                  >
                    <div className="font-bold text-sm text-indigo-900">
                      แก้ไขใบประกาศนียบัตร
                    </div>
                    <div>
                      <input
                        type="text"
                        list="modal-certs"
                        value={certName}
                        onChange={(e) => setCertName(e.target.value)}
                        placeholder="ชื่อใบประกาศ"
                        className="w-full px-4 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-900"
                      />
                      <datalist id="modal-certs">
                        {certTypeOptions.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={expireDate}
                        onChange={(e) => setExpireDate(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                      />
                      <input
                        type="text"
                        value={certNo}
                        onChange={(e) => setCertNo(e.target.value)}
                        placeholder="เลขที่ใบประกาศ (ถ้ามี)"
                        className="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder="หมายเหตุ เช่น รอต่ออายุ"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cert.id)}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xs"
                      >
                        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cert.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${status.rowClass}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-base text-slate-900">
                        {cert.cert_name}
                      </span>
                      {cert.cert_no && (
                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {cert.cert_no}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3.5 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        วันหมดอายุ: <strong>{formatDisplayDate(cert.expire_date)}</strong>
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border ${status.badgeClass}`}
                      >
                        {status.badgeLabel}
                      </span>
                    </div>
                    {cert.status_note && (
                      <div className="text-xs text-slate-500">
                        หมายเหตุ: {cert.status_note}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(cert)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
                      title="แก้ไขใบประกาศนี้"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cert)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
                      title="ลบใบประกาศนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Form to Add New Certificate */}
          {isAdding && (
            <form
              onSubmit={handleSaveNew}
              className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-3.5 animate-in fade-in"
            >
              <div className="font-bold text-sm text-indigo-900 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                เพิ่มใบประกาศนียบัตรใหม่
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อใบประกาศ / หลักสูตร <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="new-cert-sug"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  placeholder="เลือกหรือพิมพ์ชื่อใบประกาศ"
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                />
                <datalist id="new-cert-sug">
                  {certTypeOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">วันหมดอายุ</label>
                    {expireDate && (
                      <span className="text-xs text-indigo-600 font-semibold">
                        พ.ศ. {formatDisplayDate(expireDate)}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขที่ใบประกาศ
                  </label>
                  <input
                    type="text"
                    value={certNo}
                    onChange={(e) => setCertNo(e.target.value)}
                    placeholder="เช่น วพ. 998877"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุ
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="เช่น รอต่ออายุ, อบรมผ่านแล้ว"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xs"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกใบประกาศ'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          {!isAdding ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsAdding(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-2xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              เพิ่มใบประกาศให้บุคคลนี้
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
