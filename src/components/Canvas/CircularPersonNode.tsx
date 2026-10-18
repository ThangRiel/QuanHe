import React, { useState } from 'react';
import { Cake, Link as LinkIcon, Sparkles } from 'lucide-react';
import type { Person, Group } from '../../types/crm';
import { calculateAge, getDaysUntilBirthday } from '../../utils/crmCalculations';

interface CircularPersonNodeProps {
  person: Person;
  group?: Group | null;
  isSelected: boolean;
  isConnectingSource: boolean;
  isDimmed: boolean;
  isDragging?: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onStartConnect: (id: string, e: React.MouseEvent) => void;
  onEndConnect?: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
}

export const CircularPersonNode: React.FC<CircularPersonNodeProps> = ({
  person,
  group,
  isSelected,
  isConnectingSource,
  isDimmed,
  isDragging = false,
  onSelect,
  onStartConnect,
  onEndConnect,
  onDragStart,
}) => {
  const [imageError, setImageError] = useState(false);
  const age = calculateAge(person.birthDate);
  const birthdayInfo = getDaysUntilBirthday(person.birthDate);

  // Normal nodes: default radius 48px (diameter 96px).
  // Central "Bản thân" (isSelf): 3x larger = radius 144px (diameter 288px).
  const isSelf = person.isSelf || person.id === 'p-self';
  const nodeRadius = person.radius || (isSelf ? 144 : 48);
  const diameter = nodeRadius * 2;

  const accentColor = isSelf
    ? '#6366f1'
    : person.colorAccent || group?.color || '#3b82f6';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isBirthdaySoon = birthdayInfo.daysLeft <= 30;
  const position =
    person.position && typeof person.position.x === 'number'
      ? person.position
      : { x: 400, y: 350 };

  // ==========================================
  // 1. RENDER CENTRAL USER SELF NODE (3X SIZE)
  // ==========================================
  if (isSelf) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={`Thẻ hình tròn bản thân: ${person.name}`}
        data-testid={`person-node-${person.id}`}
        style={{
          left: `${position.x - nodeRadius}px`,
          top: `${position.y - nodeRadius}px`,
          width: `${diameter}px`,
          height: `${diameter}px`,
          borderColor: isSelected
            ? '#818cf8'
            : isConnectingSource
            ? '#f59e0b'
            : '#6366f1',
          boxShadow: isDragging
            ? `0 28px 60px -12px rgba(0,0,0,0.7), 0 0 60px rgba(99,102,241,0.6)`
            : isSelected
            ? `0 0 0 4px #818cf8, 0 24px 50px -10px rgba(0,0,0,0.6), 0 0 50px rgba(99,102,241,0.4)`
            : `0 16px 36px -8px rgba(0,0,0,0.45), 0 0 40px rgba(99,102,241,0.25)`,
          zIndex: isDragging ? 55 : isSelected ? 45 : 35,
          transition: isDragging
            ? 'none'
            : 'transform 150ms cubic-bezier(0.2, 0, 0, 1), box-shadow 150ms ease, border-color 150ms ease, opacity 150ms ease',
        }}
        className={`absolute select-none rounded-full bg-gradient-to-b from-indigo-50/95 via-white to-purple-50/90 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 border-3 flex flex-col items-center justify-center p-4 text-center group/node pointer-events-auto ${
          isDragging
            ? 'cursor-grabbing scale-105'
            : 'cursor-grab active:cursor-grabbing hover:scale-[1.02]'
        } ${isDimmed ? 'opacity-35' : 'opacity-100'} ${
          isSelected ? 'ring-4 ring-indigo-500/40' : 'hover:border-indigo-400'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(person.id, e);
        }}
        onMouseUp={() => {
          if (onEndConnect) onEndConnect(person.id);
        }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            onDragStart(person.id, e);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect(person.id, e as unknown as React.MouseEvent);
          }
        }}
      >
        {/* Subtle decorative concentric halo ring */}
        <div className="absolute inset-1.5 rounded-full border border-indigo-500/25 pointer-events-none" />

        {/* 4 Connection Handle Buttons Around Perimeter */}
        {/* East */}
        <button
          type="button"
          title="Kéo hoặc nhấn để nối quan hệ tới người khác"
          aria-label="Nối quan hệ sang phải"
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white dark:bg-neutral-900 border-2 border-indigo-500 dark:border-indigo-400 hover:bg-indigo-600 hover:text-white hover:scale-125 transition-all flex items-center justify-center text-indigo-600 dark:text-white z-50 opacity-0 group-hover/node:opacity-100 shadow-xl cursor-pointer"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnect(person.id, e);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onStartConnect(person.id, e);
          }}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* West */}
        <button
          type="button"
          title="Kéo hoặc nhấn để nối quan hệ tới người khác"
          aria-label="Nối quan hệ sang trái"
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white dark:bg-neutral-900 border-2 border-indigo-500 dark:border-indigo-400 hover:bg-indigo-600 hover:text-white hover:scale-125 transition-all flex items-center justify-center text-indigo-600 dark:text-white z-50 opacity-0 group-hover/node:opacity-100 shadow-xl cursor-pointer"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnect(person.id, e);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onStartConnect(person.id, e);
          }}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* North */}
        <button
          type="button"
          title="Kéo hoặc nhấn để nối quan hệ tới người khác"
          aria-label="Nối quan hệ lên trên"
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white dark:bg-neutral-900 border-2 border-indigo-500 dark:border-indigo-400 hover:bg-indigo-600 hover:text-white hover:scale-125 transition-all flex items-center justify-center text-indigo-600 dark:text-white z-50 opacity-0 group-hover/node:opacity-100 shadow-xl cursor-pointer"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnect(person.id, e);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onStartConnect(person.id, e);
          }}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* South */}
        <button
          type="button"
          title="Kéo hoặc nhấn để nối quan hệ tới người khác"
          aria-label="Nối quan hệ xuống dưới"
          className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white dark:bg-neutral-900 border-2 border-indigo-500 dark:border-indigo-400 hover:bg-indigo-600 hover:text-white hover:scale-125 transition-all flex items-center justify-center text-indigo-600 dark:text-white z-50 opacity-0 group-hover/node:opacity-100 shadow-xl cursor-pointer"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnect(person.id, e);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onStartConnect(person.id, e);
          }}
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* Prominent "BẢN THÂN" Pill Badge at Top */}
        <div className="px-3 py-1 rounded-full bg-indigo-500/15 dark:bg-indigo-500/25 border border-indigo-400/50 text-[11px] font-bold text-indigo-700 dark:text-indigo-200 tracking-wider flex items-center gap-1.5 shadow-xs mb-2 backdrop-blur-sm pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
          <span>BẢN THÂN (TÔI)</span>
        </div>

        {/* Large High-Fidelity Avatar */}
        <div className="w-28 h-28 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 border-2.5 border-indigo-500 dark:border-indigo-400/80 shadow-xl shrink-0 mb-2 relative pointer-events-none">
          {person.avatarUrl && !imageError ? (
            <img
              src={person.avatarUrl}
              alt={person.name}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-indigo-700 dark:text-neutral-100 flex items-center justify-center w-full h-full">
              {getInitials(person.name)}
            </span>
          )}
        </div>

        {/* Central Identity Information */}
        <div className="w-full px-2 text-center pointer-events-none">
          <h3 className="text-base font-extrabold text-neutral-900 dark:text-white leading-tight truncate max-w-[240px] mx-auto">
            {person.name}
          </h3>
          <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-300 leading-tight mt-0.5 truncate">
            {person.roleInGroup || 'Trung tâm mạng lưới quan hệ'}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700/80 font-mono">
              Tâm điểm kết nối
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. RENDER STANDARD CIRCULAR NODE (96px)
  // ==========================================
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Thẻ hình tròn: ${person.name}`}
      data-testid={`person-node-${person.id}`}
      style={{
        left: `${position.x - nodeRadius}px`,
        top: `${position.y - nodeRadius}px`,
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderColor: isSelected
          ? '#6366f1'
          : isConnectingSource
          ? '#f59e0b'
          : accentColor,
        boxShadow: isDragging
          ? `0 20px 40px -8px rgba(0,0,0,0.6), 0 0 25px ${accentColor}80`
          : isSelected
          ? `0 0 0 3px #6366f1, 0 16px 32px -8px rgba(0,0,0,0.4)`
          : `0 6px 20px -4px rgba(0,0,0,0.25)`,
        zIndex: isDragging ? 50 : isSelected ? 40 : 30,
        transition: isDragging
          ? 'none'
          : 'transform 150ms cubic-bezier(0.2, 0, 0, 1), box-shadow 150ms ease, border-color 150ms ease, opacity 150ms ease',
      }}
      className={`absolute select-none rounded-full bg-white dark:bg-neutral-900 border-2.5 flex flex-col items-center justify-center p-2 text-center group/node pointer-events-auto ${
        isDragging
          ? 'cursor-grabbing scale-105'
          : 'cursor-grab active:cursor-grabbing hover:scale-105'
      } ${isDimmed ? 'opacity-30' : 'opacity-100'} ${
        isSelected
          ? 'ring-2 ring-indigo-500/50'
          : 'hover:border-indigo-400 dark:hover:border-white'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(person.id, e);
      }}
      onMouseUp={() => {
        if (onEndConnect) onEndConnect(person.id);
      }}
      onMouseDown={(e) => {
        if (e.button === 0) {
          onDragStart(person.id, e);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(person.id, e as unknown as React.MouseEvent);
        }
      }}
    >
      {/* Connection Handle Button (Hover on perimeter) */}
      <button
        type="button"
        title="Kéo hoặc nhấn để nối quan hệ tới người khác"
        aria-label={`Nối quan hệ từ ${person.name}`}
        className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-neutral-900 border-2 border-indigo-500 dark:border-indigo-400 hover:bg-indigo-600 hover:text-white hover:scale-125 transition-all flex items-center justify-center text-indigo-600 dark:text-white z-50 opacity-0 group-hover/node:opacity-100 shadow-md cursor-pointer"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnect(person.id, e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onStartConnect(person.id, e);
        }}
      >
        <LinkIcon className="w-3 h-3 text-indigo-500 dark:text-indigo-200" />
      </button>

      {/* Birthday Alert Dot */}
      {isBirthdaySoon && (
        <div
          title={
            birthdayInfo.isToday
              ? 'Sinh nhật hôm nay!'
              : `Sinh nhật còn ${birthdayInfo.daysLeft} ngày`
          }
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-md animate-pulse z-40 border border-white dark:border-neutral-900"
        >
          <Cake className="w-3 h-3" />
        </div>
      )}

      {/* Center Avatar or Initials */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700/80 shrink-0 flex items-center justify-center text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1 pointer-events-none">
        {person.avatarUrl && !imageError ? (
          <img
            src={person.avatarUrl}
            alt={person.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(person.name)}</span>
        )}
      </div>

      {/* Name inside circular bubble */}
      <div className="w-full px-1 text-center pointer-events-none">
        <h4 className="text-[11px] font-bold text-neutral-900 dark:text-white leading-tight truncate">
          {person.name}
        </h4>

        {/* Role in group */}
        {person.roleInGroup ? (
          <p
            className="text-[9px] font-medium leading-tight truncate mt-0.5"
            style={{ color: accentColor }}
          >
            {person.roleInGroup}
          </p>
        ) : group ? (
          <p className="text-[9px] text-neutral-500 dark:text-neutral-400 leading-tight truncate mt-0.5">
            {group.name}
          </p>
        ) : (
          <p className="text-[9px] text-neutral-400 dark:text-neutral-500 leading-tight truncate mt-0.5">
            {age > 0 ? `${age} tuổi` : 'Tự do'}
          </p>
        )}
      </div>
    </div>
  );
};
