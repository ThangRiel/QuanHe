import React from 'react';
import { Settings, Move, Scaling, Sparkles } from 'lucide-react';
import type { Group, Person } from '../../types/crm';

interface CircularGroupContainerProps {
  group: Group;
  members: Person[];
  isSelected: boolean;
  onSelect: (groupId: string, e: React.MouseEvent) => void;
  onEditGroup: (group: Group) => void;
  onDragStart: (groupId: string, e: React.MouseEvent) => void;
  onResizeRadiusStart: (groupId: string, e: React.MouseEvent) => void;
  onAutoSpreadMembers: (groupId: string) => void;
}

export const CircularGroupContainer: React.FC<CircularGroupContainerProps> = ({
  group,
  members,
  isSelected,
  onSelect,
  onEditGroup,
  onDragStart,
  onResizeRadiusStart,
  onAutoSpreadMembers,
}) => {
  const center = group.center && typeof group.center.x === 'number' ? group.center : { x: 400, y: 350 };
  const radius = typeof group.radius === 'number' && group.radius > 50 ? group.radius : 200;
  const color = group.color || '#3b82f6';
  const name = group.name || 'Nhóm';
  const description = group.description;
  const diameter = radius * 2;

  return (
    <div
      role="region"
      aria-label={`Vùng nhóm hình tròn: ${name}`}
      data-testid={`circular-group-${group.id}`}
      style={{
        left: `${center.x - radius}px`,
        top: `${center.y - radius}px`,
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderColor: isSelected ? color : `${color}60`,
        backgroundColor: `${color}08`,
      }}
      className={`absolute rounded-full border-2.5 transition-colors duration-150 select-none z-10 pointer-events-auto group/container ${
        isSelected ? 'ring-4 ring-indigo-500/30 shadow-2xl' : 'hover:border-neutral-400'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(group.id, e);
      }}
    >
      {/* 1. Large Editorial Group Title (Positioned on top perimeter like in user diagram) */}
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 cursor-grab active:cursor-grabbing text-xs font-bold text-white shadow-xl z-20 hover:bg-neutral-800 transition-colors"
        style={{
          borderTopColor: color,
          borderTopWidth: '3px',
        }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.stopPropagation();
            onDragStart(group.id, e);
          }
        }}
      >
        <Move className="w-3.5 h-3.5 text-neutral-400 group-hover/container:text-white" />
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-bold tracking-wide">{name}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
          {members.length} thẻ
        </span>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1 border-l border-neutral-800 pl-1.5 ml-1">
          <button
            type="button"
            title="Tự động dãn cách đều các thẻ bên trong"
            aria-label={`Dãn cách đều các thẻ nhóm ${name}`}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onAutoSpreadMembers(group.id);
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </button>
          <button
            type="button"
            title="Đổi tên hoặc màu nhóm"
            aria-label={`Chỉnh sửa nhóm ${name}`}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onEditGroup(group);
            }}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Drag Bar & Size Indicator across circle */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-neutral-900/60 hover:bg-neutral-800/80 cursor-grab active:cursor-grabbing flex items-center gap-1.5 text-[10px] text-neutral-400 border border-neutral-800/60 transition-colors"
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.stopPropagation();
            onDragStart(group.id, e);
          }
        }}
      >
        <Move className="w-3 h-3 text-neutral-500" />
        <span>Kéo di chuyển ô tròn</span>
        <span className="font-mono text-neutral-500">· R: {Math.round(radius)}px</span>
      </div>

      {/* 3. Perimeter Resize Handle (Primary circle expansion handle) */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Kéo thay đổi bán kính nhóm ${name}`}
        title="Kéo điểm này để mở rộng hoặc thu nhỏ ô tròn (ô càng rộng thì các thẻ bên trong càng dãn cách)"
        style={{
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        className="absolute w-8 h-8 rounded-full bg-neutral-900 border-2 border-indigo-400 hover:bg-indigo-600 hover:scale-125 transition-transform flex items-center justify-center text-white shadow-2xl cursor-ew-resize z-30"
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.stopPropagation();
            onResizeRadiusStart(group.id, e);
          }
        }}
      >
        <Scaling className="w-4 h-4 text-indigo-200" />
      </div>

      {/* Opposite resize handle on bottom edge for flexibility */}
      <div
        style={{
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        className="absolute w-6 h-6 rounded-full bg-neutral-900 border-2 border-indigo-400 hover:bg-indigo-600 hover:scale-125 transition-transform flex items-center justify-center text-white shadow-2xl cursor-ns-resize z-30 opacity-70 hover:opacity-100"
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.stopPropagation();
            onResizeRadiusStart(group.id, e);
          }
        }}
      >
        <Scaling className="w-3.5 h-3.5 text-indigo-200" />
      </div>

      {/* 4. Subtle description in bottom */}
      {description && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[260px] text-[10px] text-neutral-400 text-center truncate pointer-events-none opacity-60">
          {description}
        </div>
      )}
    </div>
  );
};
