import React, { useState } from 'react';
import { Cake, Link as LinkIcon, Star } from 'lucide-react';
import type { Person, Group } from '../../types/crm';
import { calculateAge, getDaysUntilBirthday } from '../../utils/crmCalculations';

interface CircularPersonNodeProps {
  person: Person;
  group?: Group | null;
  isSelected: boolean;
  isConnectingSource: boolean;
  isDimmed: boolean;
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
  onSelect,
  onStartConnect,
  onEndConnect,
  onDragStart,
}) => {
  const [imageError, setImageError] = useState(false);
  const age = calculateAge(person.birthDate);
  const birthdayInfo = getDaysUntilBirthday(person.birthDate);

  const nodeRadius = person.radius || 48; // default radius 48px -> diameter 96px
  const diameter = nodeRadius * 2;

  const accentColor = person.colorAccent || group?.color || '#3b82f6';

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isBirthdaySoon = birthdayInfo.daysLeft <= 30;

  const position = person.position && typeof person.position.x === 'number' ? person.position : { x: 400, y: 350 };

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
        borderColor: isSelected ? '#6366f1' : isConnectingSource ? '#f59e0b' : accentColor,
        boxShadow: isSelected
          ? `0 0 0 3px #6366f1, 0 16px 32px -8px rgba(0,0,0,0.6)`
          : `0 8px 24px -4px rgba(0,0,0,0.4)`,
        zIndex: isSelected ? 40 : 30,
      }}
      className={`absolute select-none cursor-pointer rounded-full bg-neutral-900 border-2.5 flex flex-col items-center justify-center p-2 text-center transition-all duration-150 group/node pointer-events-auto ${
        isDimmed ? 'opacity-30' : 'opacity-100'
      } ${isSelected ? 'ring-2 ring-indigo-500/50 scale-105' : 'hover:scale-105 hover:border-white'}`}
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
        className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-neutral-900 border-2 border-indigo-400 hover:bg-indigo-600 hover:scale-125 transition-all flex items-center justify-center text-white z-50 opacity-0 group-hover/node:opacity-100 shadow-md"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnect(person.id, e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onStartConnect(person.id, e);
        }}
      >
        <LinkIcon className="w-3 h-3 text-indigo-200" />
      </button>

      {/* Birthday Alert Dot */}
      {isBirthdaySoon && (
        <div
          title={birthdayInfo.isToday ? 'Sinh nhật hôm nay!' : `Sinh nhật còn ${birthdayInfo.daysLeft} ngày`}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-md animate-pulse z-40 border border-neutral-900"
        >
          <Cake className="w-3 h-3" />
        </div>
      )}

      {/* Center Avatar or Initials */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700/80 shrink-0 flex items-center justify-center text-xs font-bold text-neutral-200 mb-1 pointer-events-none">
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
        <h4 className="text-[11px] font-bold text-white leading-tight truncate">
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
          <p className="text-[9px] text-neutral-400 leading-tight truncate mt-0.5">
            {group.name}
          </p>
        ) : (
          <p className="text-[9px] text-neutral-500 leading-tight truncate mt-0.5">
            {age > 0 ? `${age} tuổi` : 'Tự do'}
          </p>
        )}
      </div>
    </div>
  );
};
