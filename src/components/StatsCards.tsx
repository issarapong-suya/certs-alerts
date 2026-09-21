'use client';

import { Users, AlertTriangle, Clock, CheckCircle, HelpCircle } from 'lucide-react';
import { CertificateStatus } from '@/types/database';

interface StatsCardsProps {
  stats: {
    total: number;
    expired: number;
    expiringSoon: number;
    active: number;
    noExpiry: number;
  };
  currentFilter: CertificateStatus | 'all';
  onSelectFilter: (status: CertificateStatus | 'all') => void;
}

export default function StatsCards({ stats, currentFilter, onSelectFilter }: StatsCardsProps) {
  const cards = [
    {
      id: 'all' as const,
      label: 'บุคลากรทั้งหมด',
      count: stats.total,
      icon: Users,
      color: 'indigo',
      activeBorder: 'ring-2 ring-indigo-500 bg-indigo-50/50',
      iconBg: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'expired' as const,
      label: 'หมดอายุแล้ว',
      count: stats.expired,
      icon: AlertTriangle,
      color: 'red',
      activeBorder: 'ring-2 ring-red-500 bg-red-50/50',
      iconBg: 'bg-red-100 text-red-700',
    },
    {
      id: 'expiring_soon' as const,
      label: 'ใกล้หมดอายุ (≤ 90 วัน)',
      count: stats.expiringSoon,
      icon: Clock,
      color: 'amber',
      activeBorder: 'ring-2 ring-amber-500 bg-amber-50/50',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'active' as const,
      label: 'สถานะปกติ (> 90 วัน)',
      count: stats.active,
      icon: CheckCircle,
      color: 'emerald',
      activeBorder: 'ring-2 ring-emerald-500 bg-emerald-50/50',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'no_expiry' as const,
      label: 'ไม่มีวันหมดอายุ',
      count: stats.noExpiry,
      icon: HelpCircle,
      color: 'slate',
      activeBorder: 'ring-2 ring-slate-500 bg-slate-100/60',
      iconBg: 'bg-slate-200 text-slate-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = currentFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(card.id)}
            className={`text-left p-4 rounded-xl border bg-white transition-all shadow-2xs hover:shadow-md cursor-pointer ${
              isSelected
                ? card.activeBorder
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">{card.label}</span>
              <div className={`p-1.5 rounded-lg ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{card.count}</div>
          </button>
        );
      })}
    </div>
  );
}
