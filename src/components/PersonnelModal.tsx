'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  User,
  Briefcase,
  Mail,
  Bell,
  FileText,
  Send,
  Calendar,
} from 'lucide-react';
import { Personnel, MasterPosition, MasterCertType } from '@/types/database';
import { createPersonnel, updatePersonnel } from '@/actions/personnel';
import { testPersonalDiscord, testPersonalEmail, testPersonalDiscordDM } from '@/actions/settings';
import { showToast, showSuccess, showError, showLoading, closeLoading } from '@/lib/swal';
import { formatDisplayDate } from '@/lib/certificate-utils';

interface PersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: Personnel | null;
  availablePositions?: MasterPosition[];
  availableCertTypes?: MasterCertType[];
  onSuccess: () => void;
}

const FALLBACK_POSITIONS = [
  'พยาบาลวิชาชีพชำนาญการพิเศษ',
  'พยาบาลวิชาชีพชำนาญการ',
  'พยาบาลวิชาชีพปฏิบัติการ',
  'พยาบาลวิชาชีพ',
  'EMT-B (พนักงานการแพทย์ฉุกเฉิน)',
  'EMT-I (เจ้าพนักงานเวชกิจฉุกเฉิน)',
  'EMR (อาสาสมัครฉุกเฉินการแพทย์)',
  'เจ้าหน้าที่เวชกิจฉุกเฉิน',
  'พนักงานขับรถพยาบาล',
  'เจ้าหน้าที่กู้ชีพ',
  'พนักงานช่วยเหลือคนไข้',
];

const FALLBACK_CERTS = [
  'ใบอนุญาตประกอบวิชาชีพการพยาบาลและการผดุงครรภ์',
  'ประกาศนียบัตรผู้ปฏิบัติการแพทย์ขั้นพื้นฐาน (EMT-B)',
  'ประกาศนียบัตรอาสาสมัครฉุกเฉินการแพทย์ (EMR)',
  'ประกาศนียบัตรการช่วยฟื้นคืนชีพขั้นสูง (ACLS)',
  'ประกาศนียบัตรการช่วยฟื้นคืนชีพขั้นพื้นฐาน (BLS/CPR)',
  'ประกาศนียบัตรการดูแลผู้บาดเจ็บขั้นสูง (ITLS/PHTLS)',
  'ใบอนุญาตขับรถยนต์ส่วนบุคคล/รถพยาบาลฉุกเฉิน',
];

export default function PersonnelModal({
  isOpen,
  onClose,
  personnel,
  availablePositions = [],
  availableCertTypes = [],
  onSuccess,
}: PersonnelModalProps) {
  const isEdit = !!personnel;

  // Basic Info
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [note, setNote] = useState('');

  // Personal Alerts
  const [email, setEmail] = useState('');
  const [discordMode, setDiscordMode] = useState<'webhook' | 'dm'>('webhook');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [discordUserId, setDiscordUserId] = useState('');
  const [enableDiscord, setEnableDiscord] = useState(true);
  const [enableEmail, setEnableEmail] = useState(true);

  // Initial certificate (for Add mode only)
  const [initialCertName, setInitialCertName] = useState('');
  const [isCustomCert, setIsCustomCert] = useState(false);
  const [initialCertNo, setInitialCertNo] = useState('');
  const [initialExpireDate, setInitialExpireDate] = useState('');
  const [initialCertNote, setInitialCertNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const positionOptions = availablePositions.length > 0
    ? availablePositions.map((p) => p.name)
    : FALLBACK_POSITIONS;

  const certTypeOptions = availableCertTypes.length > 0
    ? availableCertTypes.map((c) => c.name)
    : FALLBACK_CERTS;

  useEffect(() => {
    if (personnel) {
      setName(personnel.name || '');
      const pos = personnel.position || '';
      setPosition(pos);
      setIsCustomPosition(!!pos && !positionOptions.includes(pos));
      setIsActive(personnel.is_active !== false);
      setNote(personnel.note || '');
      setEmail(personnel.email || '');
      setDiscordWebhookUrl(personnel.discord_webhook_url || '');
      setDiscordUserId(personnel.discord_user_id || '');
      setDiscordMode(personnel.discord_user_id ? 'dm' : 'webhook');
      setEnableDiscord(personnel.enable_discord !== false);
      setEnableEmail(personnel.enable_email !== false);
    } else {
      setName('');
      setPosition('');
      setIsCustomPosition(false);
      setIsActive(true);
      setNote('');
      setEmail('');
      setDiscordWebhookUrl('');
      setDiscordUserId('');
      setDiscordMode('webhook');
      setEnableDiscord(true);
      setEnableEmail(true);
      setInitialCertName('');
      setIsCustomCert(false);
      setInitialCertNo('');
      setInitialExpireDate('');
      setInitialCertNote('');
    }
  }, [personnel, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showError('กรุณากรอกชื่อ-สกุล');
      return;
    }

    setIsSubmitting(true);

    let res;
    if (isEdit && personnel) {
      res = await updatePersonnel(personnel.id, {
        name: name.trim(),
        position: position.trim() || null,
        email: email.trim() || null,
        discord_webhook_url: discordMode === 'webhook' ? (discordWebhookUrl.trim() || null) : null,
        discord_user_id: discordMode === 'dm' ? (discordUserId.trim() || null) : null,
        enable_discord: enableDiscord,
        enable_email: enableEmail,
        is_active: isActive,
        note: note.trim() || null,
      });
    } else {
      res = await createPersonnel({
        name: name.trim(),
        position: position.trim() || null,
        email: email.trim() || null,
        discord_webhook_url: discordMode === 'webhook' ? (discordWebhookUrl.trim() || null) : null,
        discord_user_id: discordMode === 'dm' ? (discordUserId.trim() || null) : null,
        enable_discord: enableDiscord,
        enable_email: enableEmail,
        is_active: isActive,
        note: note.trim() || null,
        initial_cert: initialCertName.trim()
          ? {
              cert_name: initialCertName.trim(),
              cert_no: initialCertNo.trim() || null,
              expire_date: initialExpireDate || null,
              status_note: initialCertNote.trim() || null,
            }
          : undefined,
      });
    }

    setIsSubmitting(false);

    if (res.success) {
      showToast(isEdit ? 'แก้ไขข้อมูลบุคลากรเรียบร้อยแล้ว' : 'เพิ่มบุคลากรเรียบร้อยแล้ว', 'success');
      onSuccess();
      onClose();
    } else {
      showError('บันทึกไม่สำเร็จ', res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  }

  async function handleTestDiscord() {
    if (!discordWebhookUrl.trim()) {
      showError('กรุณากรอก Discord Webhook URL ก่อนกดทดสอบ');
      return;
    }
    showLoading('กำลังทดสอบส่งเข้า Discord Webhook...');
    const res = await testPersonalDiscord(discordWebhookUrl.trim());
    closeLoading();
    if (res.success) {
      showSuccess('ส่งเข้า Discord สำเร็จแล้ว!', 'กรุณาตรวจสอบข้อความในห้องแชท Discord ของคุณ');
    } else {
      showError('ส่งไม่สำเร็จ', res.error || 'Discord Webhook URL ไม่ถูกต้อง');
    }
  }

  async function handleTestDiscordDM() {
    if (!discordUserId.trim()) {
      showError('กรุณากรอก Discord User ID ก่อนกดทดสอบ');
      return;
    }
    showLoading('กำลังทดสอบส่ง Direct Message (DM) เข้า Discord...');
    const res = await testPersonalDiscordDM(discordUserId.trim());
    closeLoading();
    if (res.success) {
      showSuccess('ส่ง DM สำเร็จแล้ว!', 'กรุณาตรวจสอบข้อความ Direct Message ใน Discord ของคุณ');
    } else {
      showError('ส่ง DM ไม่สำเร็จ', res.error || 'ไม่สามารถส่ง DM ได้');
    }
  }

  async function handleTestEmail() {
    if (!email.trim()) {
      showError('กรุณากรอกอีเมลก่อนกดทดสอบ');
      return;
    }
    showLoading('กำลังทดสอบส่งอีเมล...');
    const res = await testPersonalEmail(email.trim());
    closeLoading();
    if (res.success) {
      showSuccess('ส่งอีเมลสำเร็จแล้ว!', `ระบบได้ส่งข้อความทดสอบไปยัง ${email}`);
    } else {
      showError('ส่งไม่สำเร็จ', res.error || 'ไม่สามารถส่งอีเมลได้');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEdit ? 'แก้ไขข้อมูลบุคลากร & การแจ้งเตือนส่วนตัว' : 'เพิ่มบุคลากรใหม่'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isEdit
                ? 'ปรับปรุงข้อมูลประจำตัว และตั้งค่าช่องทางแจ้งเตือนเฉพาะบุคคล'
                : 'บันทึกประวัติบุคลากร พร้อมช่องทางแจ้งเตือนและใบประกาศแรก'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Active Status Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-sm font-bold text-slate-800 block">สถานะการทำงาน (เปิด/ปิดชื่อ)</span>
              <span className="text-xs text-slate-500">
                หากปิดชื่อ ระบบจะไม่นำไปตรวจสอบหรือส่งแจ้งเตือน Cron
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-sm font-semibold text-slate-700">
                {isActive ? 'ใช้งาน (Active)' : 'ปิดชื่อ (Inactive)'}
              </span>
            </label>
          </div>

          {/* Name & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                ชื่อ-สกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น นายสมชาย มั่นคง"
                className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-400" />
                ตำแหน่ง (จากฐานข้อมูล)
              </label>
              <div className="space-y-2">
                <select
                  value={
                    isCustomPosition
                      ? '__custom__'
                      : positionOptions.includes(position)
                      ? position
                      : position
                      ? '__custom__'
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomPosition(true);
                      setPosition('');
                    } else {
                      setIsCustomPosition(false);
                      setPosition(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-base border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white cursor-pointer font-medium"
                >
                  <option value="">-- เลือกตำแหน่งจากฐานข้อมูล ({positionOptions.length} รายการ) --</option>
                  {positionOptions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                  <option value="__custom__">➕ ระบุตำแหน่งอื่นๆ (พิมพ์ระบุเอง)...</option>
                </select>

                {isCustomPosition && (
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="พิมพ์ระบุชื่อตำแหน่ง..."
                    className="w-full px-4 py-2.5 text-sm border border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/20 text-slate-900"
                    autoFocus
                  />
                )}
              </div>
            </div>
          </div>

          {/* Personal Notification Channels */}
          <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Bell className="w-5 h-5 text-indigo-600" />
              การแจ้งเตือนส่วนตัวของบุคคลนี้ (Personal Alerts)
            </div>

            {/* Discord Notification (Webhook or DM) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-700">การแจ้งเตือน Discord</label>
                  <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setDiscordMode('webhook')}
                      className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                        discordMode === 'webhook'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ห้องแชท (Webhook)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscordMode('dm')}
                      className={`px-2.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                        discordMode === 'dm'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ส่วนตัว (DM บอท)
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableDiscord}
                    onChange={(e) => setEnableDiscord(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-600">เปิดส่ง Discord</span>
                </label>
              </div>

              {discordMode === 'webhook' ? (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={discordWebhookUrl}
                      onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="flex-1 px-4 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleTestDiscord}
                      disabled={!discordWebhookUrl.trim()}
                      className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs rounded-xl font-semibold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      ทดสอบ
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ส่งเข้าห้องแชทใน Discord Server (สามารถสร้างห้องส่วนตัวของตนเองเพื่อไม่ให้คนอื่นเห็นได้)
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discordUserId}
                      onChange={(e) => setDiscordUserId(e.target.value)}
                      placeholder="ระบุ Discord User ID (เช่น 412345678901234567)"
                      className="flex-1 px-4 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleTestDiscordDM}
                      disabled={!discordUserId.trim()}
                      className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs rounded-xl font-semibold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      ทดสอบ DM
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    บอทจะทัก DM ข้อความส่วนตัวหาบุคคลนี้โดยตรง (วิธีดู User ID: เปิด Developer Mode ใน Discord &gt; คลิกขวาชื่อตัวเอง &gt; Copy User ID)
                  </p>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <label className="font-semibold text-slate-700">Email รับแจ้งเตือนส่วนตัว</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableEmail}
                    onChange={(e) => setEnableEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-600">เปิดส่ง Email</span>
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="person.email@gmail.com"
                  className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={!email.trim()}
                  className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  ทดสอบ
                </button>
              </div>
            </div>
          </div>

          {/* Initial Certificate Form (Add mode only) */}
          {!isEdit && (
            <div className="border border-slate-200 bg-slate-50/70 rounded-2xl p-5 space-y-4">
              <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                ใบประกาศนียบัตรเริ่มต้น (สามารถเพิ่มใบที่ 2, 3... ได้ภายหลัง)
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  ชื่อใบประกาศ / หลักสูตร (จากฐานข้อมูล)
                </label>
                <select
                  value={
                    isCustomCert
                      ? '__custom__'
                      : certTypeOptions.includes(initialCertName)
                      ? initialCertName
                      : initialCertName
                      ? '__custom__'
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomCert(true);
                      setInitialCertName('');
                    } else {
                      setIsCustomCert(false);
                      setInitialCertName(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white cursor-pointer font-medium"
                >
                  <option value="">-- เลือกประเภทใบประกาศจากฐานข้อมูล ({certTypeOptions.length} รายการ) --</option>
                  {certTypeOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__custom__">➕ ระบุชื่อใบประกาศอื่นๆ (พิมพ์เอง)...</option>
                </select>

                {isCustomCert && (
                  <input
                    type="text"
                    value={initialCertName}
                    onChange={(e) => setInitialCertName(e.target.value)}
                    placeholder="พิมพ์ชื่อใบประกาศ..."
                    className="w-full px-4 py-2 text-sm border border-indigo-300 rounded-xl bg-indigo-50/20 text-slate-900"
                    autoFocus
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">วันหมดอายุ</label>
                    {initialExpireDate && (
                      <span className="text-xs text-indigo-600 font-semibold">
                        พ.ศ. {formatDisplayDate(initialExpireDate)}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={initialExpireDate}
                    onChange={(e) => setInitialExpireDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขที่ใบประกาศ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={initialCertNo}
                    onChange={(e) => setInitialCertNo(e.target.value)}
                    placeholder="เช่น วพ. 12345"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมายเหตุใบประกาศ
                </label>
                <input
                  type="text"
                  value={initialCertNote}
                  onChange={(e) => setInitialCertNote(e.target.value)}
                  placeholder="เช่น รอต่ออายุ, รออบรม"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                />
              </div>
            </div>
          )}

          {/* General Note */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              หมายเหตุทั่วไปเกี่ยวกับบุคลากร
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="บันทึกเพิ่มเติม..."
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลบุคลากร'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
