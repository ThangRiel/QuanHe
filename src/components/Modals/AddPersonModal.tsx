import React, { useState } from 'react';
import { X, UserPlus, Calendar, Phone, Mail, Tag, Users } from 'lucide-react';
import type { Person, Group, GroupMembership } from '../../types/crm';
import { AVAILABLE_TAGS } from '../../data/initialData';

interface AddPersonModalProps {
  groups: Group[];
  onClose: () => void;
  onAdd: (newPerson: Omit<Person, 'id' | 'createdAt'>) => void;
  spawnPosition?: { x: number; y: number };
}

const PRESET_AVATARS = [
  { label: 'Nam sinh viên', url: '/src/assets/images/avatar_viet_student_1792251142125.jpg' },
  { label: 'Nữ cán bộ đoàn', url: '/src/assets/images/avatar_viet_leader_1792251142122.jpg' },
  { label: 'Nam Mentor Tech', url: '/src/assets/images/avatar_viet_mentor_1792251143655.jpg' },
  { label: 'Nữ thiết kế', url: '/src/assets/images/avatar_viet_friend_1792251143794.jpg' },
];

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  groups,
  onClose,
  onAdd,
  spawnPosition = { x: 450, y: 350 },
}) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('2002-01-01');
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0].url);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [notes, setNotes] = useState('');
  const [closeness, setCloseness] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Bạn thân']);
  const [tagInput, setTagInput] = useState('');

  // Multi-group memberships state
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    groups.length > 0 ? [groups[0].id] : []
  );
  const [rolesMap, setRolesMap] = useState<Record<string, string>>({});

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleRoleChange = (groupId: string, role: string) => {
    setRolesMap((prev) => ({ ...prev, [groupId]: role }));
  };

  const handleAddTag = (tag: string) => {
    const clean = tag.trim().replace(/^#/, '');
    if (!clean || selectedTags.includes(clean)) return;
    setSelectedTags([...selectedTags, clean]);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const groupMemberships: GroupMembership[] = selectedGroupIds.map((groupId) => ({
      groupId,
      roleInGroup: rolesMap[groupId]?.trim() || 'Thành viên',
    }));

    onAdd({
      name: name.trim(),
      birthDate,
      avatarUrl: avatarUrl.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      bio: bio.trim() || undefined,
      notes: notes.trim() || undefined,
      tags: selectedTags,
      groupMemberships,
      position: spawnPosition,
      closeness,
      nodeSize: 'standard',
      colorAccent: '#3b82f6',
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thêm hồ sơ người mới"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-base">Thêm người mới vào sơ đồ</h3>
          </div>
          <button
            type="button"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Avatar selector */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-2">
              Ảnh đại diện:
            </label>
            <div className="flex items-center gap-3">
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av.url}
                  type="button"
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                    avatarUrl === av.url
                      ? 'border-indigo-500 scale-110 shadow-lg'
                      : 'border-neutral-700 opacity-60 hover:opacity-100'
                  }`}
                  onClick={() => setAvatarUrl(av.url)}
                  title={av.label}
                >
                  <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="mt-2">
              <input
                type="url"
                placeholder="Hoặc dán URL ảnh đại diện tùy chỉnh..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Name & Birthday */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Họ và tên (*):
              </label>
              <input
                type="text"
                required
                placeholder="VD: Trần Đình Khang"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Ngày sinh (*):
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Multi-Group Membership Selection (Key User Feature) */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sắp xếp vào các nhóm (Có thể chọn nhiều nhóm):</span>
              </label>
            </div>
            <p className="text-[11px] text-neutral-400">
              Chọn các nhóm người này tham gia và nhập vai trò cụ thể tương ứng
            </p>

            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {groups.map((group) => {
                const isChecked = selectedGroupIds.includes(group.id);
                return (
                  <div
                    key={group.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isChecked
                        ? 'bg-neutral-800/90 border-indigo-500/60'
                        : 'bg-neutral-950/40 border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleGroup(group.id)}
                          className="rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5 bg-neutral-900 border-neutral-700"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="font-medium text-white">{group.name}</span>
                      </label>
                    </div>

                    {isChecked && (
                      <div className="mt-2 pl-6">
                        <input
                          type="text"
                          placeholder={`Vai trò trong ${group.name} (VD: Phó bí thư, Lớp trưởng...)`}
                          value={rolesMap[group.id] || ''}
                          onChange={(e) => handleRoleChange(group.id, e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1 text-white text-[11px] outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Số điện thoại:
              </label>
              <input
                type="tel"
                placeholder="VD: 0988 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Email:
              </label>
              <input
                type="email"
                placeholder="VD: email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Bio & Tags */}
          <div className="space-y-2">
            <label className="block text-[11px] text-neutral-400">
              Tiểu sử / Giới thiệu ngắn:
            </label>
            <textarea
              rows={2}
              placeholder="Thông tin chung, lĩnh vực hoạt động..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white outline-none focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-[11px] text-neutral-400">
              Thẻ phân loại (Tags):
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[11px] flex items-center gap-1 border border-neutral-700"
                >
                  #{tag}
                  <button
                    type="button"
                    className="hover:text-rose-400"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nhập tag mới và nhấn Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-indigo-500 text-xs"
              />
              <button
                type="button"
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs"
                onClick={() => handleAddTag(tagInput)}
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Closeness */}
          <div className="pt-2 flex items-center justify-between border-t border-neutral-800">
            <span className="text-[11px] text-neutral-400">Độ thân thiết:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`text-sm ${
                    lvl <= closeness ? 'text-amber-400' : 'text-neutral-600'
                  }`}
                  onClick={() => setCloseness(lvl as 1 | 2 | 3 | 4 | 5)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 text-neutral-400 hover:text-white"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-md transition-colors"
            >
              Thêm vào sơ đồ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
