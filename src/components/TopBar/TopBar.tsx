import React from 'react';
import {
  UserPlus,
  Network,
  Users,
  Cake,
  Download,
  Upload,
  RotateCcw,
  Filter,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

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
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  activeFilterCount: number;
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
  isFilterOpen,
  onToggleFilter,
  activeFilterCount,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="flex items-center justify-between gap-4 lg:gap-8 px-4 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white z-40 shrink-0 transition-colors duration-200 shadow-xs dark:shadow-none">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="text-base font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            onViewChange('canvas');
          }}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Network className="w-4 h-4" />
          </div>
          <span className="hidden sm:inline font-bold">Mạng Lưới Quan Hệ</span>
          <span className="sm:hidden font-bold">CRM</span>
        </a>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="flex items-center gap-2 sm:gap-6 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        <button
          type="button"
          onClick={() => onViewChange('canvas')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 px-1.5 sm:px-0 cursor-pointer ${
            activeView === 'canvas'
              ? 'text-indigo-600 dark:text-white font-semibold border-b-2 border-indigo-600 dark:border-indigo-500'
              : 'hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Bảng trắng
        </button>

        <button
          type="button"
          onClick={() => onViewChange('table')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 px-1.5 sm:px-0 cursor-pointer ${
            activeView === 'table'
              ? 'text-indigo-600 dark:text-white font-semibold border-b-2 border-indigo-600 dark:border-indigo-500'
              : 'hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          Danh bạ
        </button>

        <button
          type="button"
          onClick={() => onViewChange('birthdays')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 px-1.5 sm:px-0 flex items-center gap-1.5 cursor-pointer ${
            activeView === 'birthdays'
              ? 'text-indigo-600 dark:text-white font-semibold border-b-2 border-indigo-600 dark:border-indigo-500'
              : 'hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <span>Sinh nhật</span>
          {upcomingBirthdaysCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 text-[10px] tabular-nums font-semibold">
              {upcomingBirthdaysCount}
            </span>
          )}
        </button>
      </nav>

      {/* Zone 3: Filter Toggle, Dark Mode, Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Filter Toggle Button (Hidden by default, openable on demand) */}
        <button
          type="button"
          onClick={onToggleFilter}
          title={isFilterOpen ? 'Ẩn thanh bộ lọc' : 'Mở bảng tìm kiếm và lọc'}
          aria-label={isFilterOpen ? 'Ẩn bộ lọc' : 'Mở bộ lọc'}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
            isFilterOpen || activeFilterCount > 0
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/50 shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border-neutral-200 dark:border-neutral-700'
          }`}
        >
          <Filter
            className={`w-3.5 h-3.5 ${
              activeFilterCount > 0
                ? 'text-indigo-600 dark:text-indigo-400 fill-indigo-500/20'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          />
          <span className="hidden md:inline">Bộ lọc</span>
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold tabular-nums">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Chuyển sang chế độ Sáng (Light mode)' : 'Chuyển sang chế độ Tối (Dark mode)'}
          aria-label="Chuyển chế độ Sáng / Tối"
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-all cursor-pointer"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Quick add group */}
        <button
          type="button"
          title="Tạo vùng nhóm mới trên bảng trắng"
          aria-label="Tạo vùng nhóm mới"
          onClick={onOpenAddGroup}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          <span>+ Nhóm mới</span>
        </button>

        {/* Primary CTA button */}
        <button
          type="button"
          onClick={onOpenAddPerson}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm hover:shadow transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Thêm người mới</span>
          <span className="sm:hidden">+ Thêm</span>
        </button>

        {/* Data menu dropdown / backup buttons */}
        <div className="hidden lg:flex items-center gap-1 ml-1 pl-2 border-l border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            title="Xuất file JSON sao lưu dữ liệu"
            aria-label="Xuất sao lưu JSON"
            onClick={onExportData}
            className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <label
            title="Nhập file JSON khôi phục dữ liệu"
            aria-label="Nhập dữ liệu JSON"
            className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors border border-neutral-200 dark:border-neutral-700/60 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="hidden xl:inline">Dữ liệu mẫu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
