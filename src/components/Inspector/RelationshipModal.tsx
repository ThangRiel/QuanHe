import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ArrowLeftRight, Minus } from 'lucide-react';
import type { Relationship, Person } from '../../types/crm';
import { RELATIONSHIP_TYPES } from '../../data/initialData';

interface RelationshipModalProps {
  relationship: Relationship;
  people: Person[];
  onClose: () => void;
  onUpdate: (updated: Relationship) => void;
  onDelete: (id: string) => void;
}

const LINE_COLORS = [
  '#6366f1', // Indigo
  '#0284c7', // Sky
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ea580c', // Orange
  '#e11d48', // Rose
  '#64748b', // Slate
];

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  relationship,
  people,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const fromPerson = people.find((p) => p.id === relationship.fromPersonId);
  const toPerson = people.find((p) => p.id === relationship.toPersonId);

  const [type, setType] = useState(relationship.type);
  const [label, setLabel] = useState(relationship.label || '');
  const [direction, setDirection] = useState(relationship.direction);
  const [strength, setStrength] = useState<1 | 2 | 3>(relationship.strength);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed' | 'dotted'>(
    relationship.lineStyle || 'solid'
  );
  const [color, setColor] = useState(relationship.color || '#6366f1');
  const [notes, setNotes] = useState(relationship.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...relationship,
      type,
      label: label.trim() || type,
      direction,
      strength,
      lineStyle,
      color,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết mối quan hệ"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="text-base font-semibold text-white">Mối quan hệ liên kết</h3>
          <button
            type="button"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Link Overview */}
        <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-white">{fromPerson?.name || 'Người A'}</span>
          </div>

          <div className="px-2 py-1 rounded bg-neutral-800 text-indigo-300 flex items-center gap-1.5 font-mono">
            {direction === 'bidirectional' && <ArrowLeftRight className="w-3.5 h-3.5" />}
            {direction === 'from_to' && <ArrowRight className="w-3.5 h-3.5" />}
            {direction === 'undirected' && <Minus className="w-3.5 h-3.5" />}
            <span>{label || type}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white">{toPerson?.name || 'Người B'}</span>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">
              Loại mối quan hệ:
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                if (!label) setLabel(e.target.value);
              }}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
            >
              {RELATIONSHIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">
              Nhãn hiển thị trên đường nối:
            </label>
            <input
              type="text"
              value={label}
              placeholder="VD: Bạn cùng lớp & đồng đội đồ án"
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Hướng mũi tên:
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as Relationship['direction'])}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="bidirectional">Hai chiều (A ⟷ B)</option>
                <option value="from_to">Một chiều (A ➔ B)</option>
                <option value="undirected">Không mũi tên (A — B)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Kiểu nét vẽ:
              </label>
              <select
                value={lineStyle}
                onChange={(e) =>
                  setLineStyle(e.target.value as 'solid' | 'dashed' | 'dotted')
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="solid">Nét liền (Solid)</option>
                <option value="dashed">Nét đứt (Dashed)</option>
                <option value="dotted">Chấm chấm (Dotted)</option>
              </select>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1.5">
              Màu sắc đường nối:
            </label>
            <div className="flex items-center gap-2">
              {LINE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">
              Ghi chú thêm về mối quan hệ:
            </label>
            <textarea
              rows={2}
              value={notes}
              placeholder="VD: Quen nhau từ sự kiện Chào tân sinh viên..."
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
            <button
              type="button"
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              onClick={() => {
                if (confirm('Bạn có chắc muốn xóa mối quan hệ này?')) {
                  onDelete(relationship.id);
                  onClose();
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa quan hệ</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-neutral-400 hover:text-white"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
