'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import {
  ClipboardList,
  Newspaper,
  BarChart3,
  Users,
  LayoutDashboard,
  FileText,
  Download,
} from 'lucide-react';

const ICONS: Record<string, React.ElementType> = {
  '/plan': ClipboardList,
  '/industry': Newspaper,
  '/pl': BarChart3,
  '/labor': Users,
  '/dashboard': LayoutDashboard,
  '/operations': FileText,
  '/report': Download,
};

export default function Sidebar() {
  const pathname = usePathname();

  const groups = NAV_ITEMS.reduce(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, typeof NAV_ITEMS[number][]>
  );

  return (
    <aside className="w-60 min-h-screen bg-stone-50 border-r border-stone-200 flex flex-col">
      {/* 로고 */}
      <div className="px-5 py-6 border-b border-stone-200">
        <h1 className="text-lg font-bold text-stone-800">진양오토모티브</h1>
        <p className="text-xs text-stone-500 mt-0.5">월차보고 시스템</p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <p className="px-2 mb-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              {group}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = ICONS[item.href];
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-stone-800 text-white'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                      )}
                    >
                      {Icon && <Icon size={18} />}
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-mono text-stone-400 w-4">
                          {item.step}
                        </span>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* 하단 */}
      <div className="px-5 py-4 border-t border-stone-200">
        <p className="text-[10px] text-stone-400">김해공장 경영관리</p>
      </div>
    </aside>
  );
}
