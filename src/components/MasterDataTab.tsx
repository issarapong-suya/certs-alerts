'use client';

import { useState } from 'react';
import {
  Briefcase,
  Award,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { MasterPosition, MasterCertType } from '@/types/database';
import {
  createMasterPosition,
  updateMasterPosition,
  deleteMasterPosition,
  createMasterCertType,
  updateMasterCertType,
  deleteMasterCertType,
} from '@/actions/master-data';
import { showToast, showConfirm, showError } from '@/lib/swal';

interface MasterDataTabProps {
  positions: MasterPosition[];
  certTypes: MasterCertType[];
  onRefresh: () => void;
}

export default function MasterDataTab({
  positions,
  certTypes,
  onRefresh,
}: MasterDataTabProps) {
  // Positions states
  const [newPositionName, setNewPositionName] = useState('');
  const [editingPositionId, setEditingPositionId] = useState<number | null>(null);
  const [editingPositionName, setEditingPositionName] = useState('');

  // Cert Types states
  const [newCertTypeName, setNewCertTypeName] = useState('');
  const [editingCertTypeId, setEditingCertTypeId] = useState<number | null>(null);
  const [editingCertTypeName, setEditingCertTypeName] = useState('');

  // ---------------- Position Handlers ----------------
  async function handleAddPosition(e: React.FormEvent) {
    e.preventDefault();
    if (!newPositionName.trim()) return;

    const res = await createMasterPosition(newPositionName.trim());
    if (res.success) {
      showToast('เพิ่มตำแหน่งใหม่เรียบร้อยแล้ว', 'success');
      setNewPositionName('');
      onRefresh();
    } else {
      showError('เพิ่มไม่สำเร็จ', res.error);
    }
  }

  async function handleSaveEditPosition(id: number) {
    if (!editingPositionName.trim()) return;

    const res = await updateMasterPosition(id, editingPositionName.trim());
    if (res.success) {
      showToast('แก้ไขตำแหน่งเรียบร้อยแล้ว', 'success');
      setEditingPositionId(null);
      onRefresh();
    } else {
      showError('แก้ไขไม่สำเร็จ', res.error);
    }
  }

  async function handleDeletePosition(pos: MasterPosition) {
    const confirmed = await showConfirm(
      'ยืนยันการลบตำแหน่ง?',
      `คุณต้องการลบตำแหน่ง "${pos.name}" ใช่หรือไม่`,
      'ใช่, ลบเลย',
      'ยกเลิก',
      '#ef4444'
    );

    if (confirmed) {
      const res = await deleteMasterPosition(pos.id);
      if (res.success) {
        showToast('ลบตำแหน่งเรียบร้อยแล้ว', 'success');
        onRefresh();
      } else {
        showError('ลบไม่สำเร็จ', res.error);
      }
    }
  }

  // ---------------- Cert Type Handlers ----------------
  async function handleAddCertType(e: React.FormEvent) {
    e.preventDefault();
    if (!newCertTypeName.trim()) return;

    const res = await createMasterCertType(newCertTypeName.trim());
    if (res.success) {
      showToast('เพิ่มประเภทใบประกาศใหม่เรียบร้อยแล้ว', 'success');
      setNewCertTypeName('');
      onRefresh();
    } else {
      showError('เพิ่มไม่สำเร็จ', res.error);
    }
  }

  async function handleSaveEditCertType(id: number) {
    if (!editingCertTypeName.trim()) return;

    const res = await updateMasterCertType(id, editingCertTypeName.trim());
    if (res.success) {
      showToast('แก้ไขประเภทใบประกาศเรียบร้อยแล้ว', 'success');
      setEditingCertTypeId(null);
      onRefresh();
    } else {
      showError('แก้ไขไม่สำเร็จ', res.error);
    }
  }

  async function handleDeleteCertType(certType: MasterCertType) {
    const confirmed = await showConfirm(
      'ยืนยันการลบประเภทใบประกาศ?',
      `คุณต้องการลบ "${certType.name}" ใช่หรือไม่`,
      'ใช่, ลบเลย',
      'ยกเลิก',
      '#ef4444'
    );

    if (confirmed) {
      const res = await deleteMasterCertType(certType.id);
      if (res.success) {
        showToast('ลบประเภทใบประกาศเรียบร้อยแล้ว', 'success');
        onRefresh();
      } else {
        showError('ลบไม่สำเร็จ', res.error);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-indigo-600" />
          การจัดการข้อมูลหลักระบบ (Master Data Management)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          กำหนดตำแหน่งงาน และประเภทใบประกาศนียบัตร/หลักสูตรอบรม เพื่อใช้เป็นตัวเลือกมาตรฐานในการลงทะเบียนบุคลากร
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positions Panel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ตำแหน่งงาน (Positions)</h3>
                <span className="text-xs text-slate-400">ทั้งหมด {positions.length} รายการ</span>
              </div>
            </div>
          </div>

          {/* Add form */}
          <form onSubmit={handleAddPosition} className="flex gap-2 mb-4">
            <input
              type="text"
              required
              value={newPositionName}
              onChange={(e) => setNewPositionName(e.target.value)}
              placeholder="เพิ่มชื่อตำแหน่งใหม่..."
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม
            </button>
          </form>

          {/* List */}
          <div className="flex-1 overflow-y-auto max-h-[450px] space-y-2 pr-1">
            {positions.map((pos) => {
              const isEditing = editingPositionId === pos.id;

              return (
                <div
                  key={pos.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingPositionName}
                        onChange={(e) => setEditingPositionName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-blue-400 rounded-lg bg-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditPosition(pos.id)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPositionId(null)}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-slate-800">
                        {pos.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPositionId(pos.id);
                            setEditingPositionName(pos.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg cursor-pointer"
                          title="แก้ไขตำแหน่ง"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePosition(pos)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg cursor-pointer"
                          title="ลบตำแหน่ง"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate Types Panel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ประเภทใบประกาศนียบัตร / หลักสูตร</h3>
                <span className="text-xs text-slate-400">ทั้งหมด {certTypes.length} รายการ</span>
              </div>
            </div>
          </div>

          {/* Add form */}
          <form onSubmit={handleAddCertType} className="flex gap-2 mb-4">
            <input
              type="text"
              required
              value={newCertTypeName}
              onChange={(e) => setNewCertTypeName(e.target.value)}
              placeholder="เพิ่มประเภทใบประกาศใหม่..."
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-900"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม
            </button>
          </form>

          {/* List */}
          <div className="flex-1 overflow-y-auto max-h-[450px] space-y-2 pr-1">
            {certTypes.map((ct) => {
              const isEditing = editingCertTypeId === ct.id;

              return (
                <div
                  key={ct.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingCertTypeName}
                        onChange={(e) => setEditingCertTypeName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-purple-400 rounded-lg bg-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditCertType(ct.id)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCertTypeId(null)}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-slate-800">
                        {ct.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCertTypeId(ct.id);
                            setEditingCertTypeName(ct.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-white rounded-lg cursor-pointer"
                          title="แก้ไขประเภทใบประกาศ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCertType(ct)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg cursor-pointer"
                          title="ลบประเภทใบประกาศ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
