import React from 'react';
import { Search, Filter, X, Cake, Users, Tag, Star, ArrowUpDown } from 'lucide-react';
import type { FilterState, Group } from '../../types/crm';
import { AVAILABLE_TAGS } from '../../data/initialData';

interface FilterBarProps {
  filters: FilterState;
  groups: Group[];
  allTags: string[];
  totalCount: number;
  filteredCount: number;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  groups,
  allTags,
  totalCount,
  filteredCount,
  onFilterChange,
  onResetFilters,
}) => {
  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedGroupId !== null ||
    filters.selectedTag !== null ||
    filters.birthdayUpcomingOnly ||
    filters.minCloseness > 1;

  return (
    <div className="bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-30">
      {/* Left zone: Search input + group filter + tag filter */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[260px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên, vai trò trong nhóm, tag, số điện thoại..."
            value={filters.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...filters, searchQuery: e.target.value })
            }
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8.5 pr-8 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-indigo-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              type="button"
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2.5 top-2 text-neutral-400 hover:text-white"
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Group Selector */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
          <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <select
            value={filters.selectedGroupId || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                selectedGroupId: e.target.value ? e.target.value : null,
              })
            }
            className="bg-transparent text-xs text-neutral-200 outline-none cursor-pointer pr-1"
          >
            <option value="" className="bg-neutral-900 text-neutral-200">
              Tất cả nhóm ({groups.length})
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id} className="bg-neutral-900 text-neutral-200">
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Selector */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
          <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <select
            value={filters.selectedTag || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                selectedTag: e.target.value ? e.target.value : null,
              })
            }
            className="bg-transparent text-xs text-neutral-200 outline-none cursor-pointer pr-1"
          >
            <option value="" className="bg-neutral-900 text-neutral-200">
              Tất cả thẻ tags
            </option>
            {allTags.map((tag) => (
              <option key={tag} value={tag} className="bg-neutral-900 text-neutral-200">
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
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
            filters.birthdayUpcomingOnly
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
              : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
          }`}
        >
          <Cake className="w-3.5 h-3.5 text-amber-400" />
          <span>Sinh nhật ≤ 30 ngày</span>
        </button>
      </div>

      {/* Right zone: Sort + Counter + Clear button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                sortBy: e.target.value as FilterState['sortBy'],
              })
            }
            className="bg-transparent text-xs text-neutral-200 outline-none cursor-pointer pr-1"
          >
            <option value="name" className="bg-neutral-900 text-neutral-200">
              Sắp xếp: Tên A-Z
            </option>
            <option value="birthday" className="bg-neutral-900 text-neutral-200">
              Sắp xếp: Sinh nhật gần nhất
            </option>
            <option value="closeness" className="bg-neutral-900 text-neutral-200">
              Sắp xếp: Độ thân thiết
            </option>
            <option value="lastContact" className="bg-neutral-900 text-neutral-200">
              Sắp xếp: Lần gặp gần nhất
            </option>
          </select>
        </div>

        {/* Results Counter */}
        <div className="text-neutral-400 text-xs tabular-nums px-1.5">
          {filteredCount === totalCount ? (
            <span>Tổng {totalCount} người</span>
          ) : (
            <span className="text-indigo-400 font-medium">
              Khớp {filteredCount}/{totalCount} người
            </span>
          )}
        </div>

        {/* Reset filter button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white hover:underline px-1"
          >
            <X className="w-3 h-3" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>
    </div>
  );
};
