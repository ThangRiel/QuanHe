import React, { useState } from 'react';
import { X, Users, Trash2 } from 'lucide-react';
import type { Group } from '../../types/crm';

interface GroupModalProps {
  initialGroup?: Group | null;
  onClose: () => void;
  onSave: (group: Group) => void;
  onDelete?: (groupId: string) => void;
}

const GROUP_COLORS = [
  '#2563eb', // Royal Blue
  '#059669', // Emerald
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#e11d48', // Rose
  '#0284c7', // Sky
  '#ca8a04', // Amber
  '#475569', // Slate
];

export const GroupModal: React.FC<GroupModalProps> = ({
  initialGroup,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = !!initialGroup;
  const [name, setName] = useState(initialGroup?.name || '');
  const [description, setDescription] = useState(initialGroup?.description || '');
  const [color, setColor] = useState(initialGroup?.color || GROUP_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const groupData: Group = {
      id: initialGroup?.id || `g-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      center: initialGroup?.center || {
        x: 450 + Math.random() * 200,
        y: 350 + Math.random() * 200,
      },
      radius: initialGroup?.radius || 220,
      bounds: initialGroup?.bounds,
    };

    onSave(groupData);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Chỉnh sửa nhóm' : 'Tạo nhóm mới'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 space-y-4 text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-base">
              {isEditing ? 'Cập nhật nhóm / Vùng chứa' : 'Tạo nhóm / Vùng chứa mới'}
            </h3>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">
              Tên nhóm (*):
            </label>
            <input
              type="text"
              required
              placeholder="VD: Đoàn Thanh Niên, Công Ty Cũ, Lớp Đại Học..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">
              Mô tả hoạt động của nhóm:
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú về mục đích, kênh liên lạc hoặc vai trò của nhóm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-2">
              Màu chủ đạo & vùng chứa trên bảng trắng:
            </label>
            <div className="flex items-center gap-2">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
            {isEditing && onDelete ? (
              <button
                type="button"
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa nhóm "${initialGroup.name}"?`)) {
                    onDelete(initialGroup.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa nhóm</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-4 py-2 text-neutral-400 hover:text-white"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
              >
                {isEditing ? 'Lưu thay đổi' : 'Tạo nhóm'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
