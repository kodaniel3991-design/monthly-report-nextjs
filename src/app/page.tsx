import Link from 'next/link';
import { NAV_ITEMS } from '@/lib/constants';

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-800 mb-2">월차보고 시스템</h1>
      <p className="text-stone-500 mb-8">
        진양오토모티브 김해공장 월별 경영실적 자동 집계·보고서 생성
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl border border-stone-200 p-6
                       hover:border-stone-400 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 rounded-full bg-stone-800 text-white
                              text-xs font-bold flex items-center justify-center">
                {item.step}
              </span>
              <h2 className="text-lg font-semibold text-stone-800">{item.label}</h2>
            </div>
            <p className="text-sm text-stone-500">{item.group}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
