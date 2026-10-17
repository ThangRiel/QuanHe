import React from 'react';
import {
  UserPlus,
  Network,
  Users,
  Cake,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';

export type ActiveView = 'canvas' | 'table' | 'birthdays';

interface TopBarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenAddPerson: () => void;
  onOpenAddGroup: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSampleData: () => void;
  upcomingBirthdaysCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  onViewChange,
  onOpenAddPerson,
  onOpenAddGroup,
  onExportData,
  onImportData,
  onResetSampleData,
  upcomingBirthdaysCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-neutral-900 border-b border-neutral-800 text-white z-40 shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="text-base font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-2 hover:text-indigo-300 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            onViewChange('canvas');
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Network className="w-4 h-4" />
          </div>
          <span>Mạng Lưới Quan Hệ</span>
        </a>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
        <button
          type="button"
          onClick={() => onViewChange('canvas')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeView === 'canvas'
              ? 'text-white font-semibold border-b-2 border-indigo-500'
              : 'hover:text-white'
          }`}
        >
          Bảng trắng
        </button>

        <button
          type="button"
          onClick={() => onViewChange('table')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeView === 'table'
              ? 'text-white font-semibold border-b-2 border-indigo-500'
              : 'hover:text-white'
          }`}
        >
          Danh bạ chi tiết
        </button>

        <button
          type="button"
          onClick={() => onViewChange('birthdays')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
            activeView === 'birthdays'
              ? 'text-white font-semibold border-b-2 border-indigo-500'
              : 'hover:text-white'
          }`}
        >
          <span>Sinh nhật sắp tới</span>
          {upcomingBirthdaysCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] tabular-nums">
              {upcomingBirthdaysCount}
            </span>
          )}
        </button>
      </nav>

      {/* Zone 3: Primary Action + Secondary Utility */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick add group */}
        <button
          type="button"
          title="Tạo vùng nhóm mới trên bảng trắng"
          aria-label="Tạo vùng nhóm mới"
          onClick={onOpenAddGroup}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 hover:text-white rounded-lg border border-neutral-700 transition-colors whitespace-nowrap shrink-0"
        >
          <Users className="w-3.5 h-3.5 text-neutral-400" />
          <span>+ Nhóm mới</span>
        </button>

        {/* Primary CTA button */}
        <button
          type="button"
          onClick={onOpenAddPerson}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Thêm người mới</span>
        </button>

        {/* Data menu dropdown / buttons */}
        <div className="flex items-center gap-1 ml-1 pl-2 border-l border-neutral-800">
          <button
            type="button"
            title="Xuất file JSON sao lưu dữ liệu"
            aria-label="Xuất sao lưu JSON"
            onClick={onExportData}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <label
            title="Nhập file JSON khôi phục dữ liệu"
            aria-label="Nhập dữ liệu JSON"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={onImportData}
            />
          </label>

          <button
            type="button"
            title="Khôi phục lại toàn bộ dữ liệu mẫu ban đầu"
            aria-label="Khôi phục dữ liệu mẫu ban đầu"
            onClick={onResetSampleData}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 transition-colors border border-neutral-700/60"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Dữ liệu mẫu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
