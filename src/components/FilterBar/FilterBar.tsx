import React from 'react';
import { Search, X, Cake, Users, Tag, ArrowUpDown, ChevronUp } from 'lucide-react';
import type { FilterState, Group } from '../../types/crm';

interface FilterBarProps {
  filters: FilterState;
  groups: Group[];
  allTags: string[];
  totalCount: number;
  filteredCount: number;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  onClose?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  groups,
  allTags,
  totalCount,
  filteredCount,
  onFilterChange,
  onResetFilters,
  onClose,
}) => {
  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedGroupId !== null ||
    filters.selectedTag !== null ||
    filters.birthdayUpcomingOnly ||
    filters.minCloseness > 1;

  return (
    <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-30 transition-all duration-200 shadow-sm dark:shadow-none">
      {/* Left zone: Search input + group filter + tag filter + birthday */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative min-w-[180px] sm:min-w-[240px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên, vai trò trong nhóm, tag, số điện thoại..."
            value={filters.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...filters, searchQuery: e.target.value })
            }
            className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg pl-8.5 pr-8 py-1.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              type="button"
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Group Selector */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg px-2 py-1">
          <Users className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
          <select
            value={filters.selectedGroupId || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                selectedGroupId: e.target.value ? e.target.value : null,
              })
            }
            className="bg-transparent text-xs text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer pr-1"
          >
            <option value="" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
              Tất cả nhóm ({groups.length})
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Selector */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg px-2 py-1">
          <Tag className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
          <select
            value={filters.selectedTag || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                selectedTag: e.target.value ? e.target.value : null,
              })
            }
            className="bg-transparent text-xs text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer pr-1"
          >
            <option value="" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
              Tất cả thẻ tags
            </option>
            {allTags.map((tag) => (
              <option key={tag} value={tag} className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                #{tag}
              </option>
            ))}
          </select>
        </div>

        {/* Birthday Upcoming Toggle */}
        <button
          type="button"
          onClick={() =>
            onFilterChange({
              ...filters,
              birthdayUpcomingOnly: !filters.birthdayUpcomingOnly,
            })
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
            filters.birthdayUpcomingOnly
              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 font-medium shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <Cake className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Sinh nhật ≤ 30 ngày</span>
        </button>
      </div>

      {/* Right zone: Sort + Counter + Clear + Close button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg px-2 py-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                sortBy: e.target.value as FilterState['sortBy'],
              })
            }
            className="bg-transparent text-xs text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer pr-1"
          >
            <option value="name" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
              Sắp xếp: Tên A-Z
            </option>
            <option value="birthday" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
              Sắp xếp: Sinh nhật gần nhất
            </option>
            <option value="closeness" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
              Sắp xếp: Độ thân thiết
            </option>
            <option value="lastContact" className="bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
              Sắp xếp: Lần gặp gần nhất
            </option>
          </select>
        </div>

        {/* Results Counter */}
        <div className="text-neutral-600 dark:text-neutral-400 text-xs tabular-nums px-1.5 font-medium">
          {filteredCount === totalCount ? (
            <span>Tổng {totalCount} người</span>
          ) : (
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              Khớp {filteredCount}/{totalCount} người
            </span>
          )}
        </div>

        {/* Reset filter button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline px-1 cursor-pointer font-medium"
          >
            <X className="w-3 h-3" />
            <span>Xóa lọc</span>
          </button>
        )}

        {/* Close/Hide Filter Bar button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Đóng / Ẩn thanh bộ lọc"
            aria-label="Đóng thanh bộ lọc"
            className="flex items-center gap-1 p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ml-1 cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
