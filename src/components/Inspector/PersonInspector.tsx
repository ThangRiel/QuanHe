import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Star,
  Plus,
  Trash2,
  ExternalLink,
  Users,
  Link as LinkIcon,
  Cake,
} from 'lucide-react';
import type { Person, Group, Relationship } from '../../types/crm';
import { calculateAge, getDaysUntilBirthday, formatDateVN } from '../../utils/crmCalculations';
import { RELATIONSHIP_TYPES, AVAILABLE_TAGS } from '../../data/initialData';

interface PersonInspectorProps {
  person: Person;
  allPeople: Person[];
  groups: Group[];
  relationships: Relationship[];
  onClose: () => void;
  onUpdatePerson: (updated: Person) => void;
  onDeletePerson: (id: string) => void;
  onAddRelationship: (rel: Omit<Relationship, 'id' | 'createdAt'>) => void;
  onDeleteRelationship: (id: string) => void;
  onJumpToPerson: (personId: string) => void;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ea580c', // Orange
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#eab308', // Amber
  '#64748b', // Slate
];

export const PersonInspector: React.FC<PersonInspectorProps> = ({
  person,
  allPeople,
  groups,
  relationships,
  onClose,
  onUpdatePerson,
  onDeletePerson,
  onAddRelationship,
  onDeleteRelationship,
  onJumpToPerson,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'connections'>('profile');

  // Quick connection adding state
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [connectToPersonId, setConnectToPersonId] = useState('');
  const [connectionType, setConnectionType] = useState(RELATIONSHIP_TYPES[0]);
  const [connectionLabel, setConnectionLabel] = useState('');

  // Tag input state
  const [newTagInput, setNewTagInput] = useState('');

  const age = calculateAge(person.birthDate);
  const birthdayInfo = getDaysUntilBirthday(person.birthDate);

  const currentGroup = groups.find((g) => g.id === person.groupId) || null;

  // Direct relationships
  const directRelationships = relationships.filter(
    (r) => r.fromPersonId === person.id || r.toPersonId === person.id
  );

  // Handle adding tag
  const handleAddTag = (tagToAdd: string) => {
    const cleanTag = tagToAdd.trim().replace(/^#/, '');
    if (!cleanTag || person.tags.includes(cleanTag)) return;
    onUpdatePerson({
      ...person,
      tags: [...person.tags, cleanTag],
    });
    setNewTagInput('');
  };

  // Handle removing tag
  const handleRemoveTag = (tagToRemove: string) => {
    onUpdatePerson({
      ...person,
      tags: person.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Handle saving new connection
  const handleCreateConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectToPersonId) return;

    onAddRelationship({
      fromPersonId: person.id,
      toPersonId: connectToPersonId,
      type: connectionType,
      label: connectionLabel.trim() || connectionType,
      direction: 'bidirectional',
      strength: 2,
      lineStyle: 'solid',
    });

    setConnectToPersonId('');
    setConnectionLabel('');
    setIsAddingConnection(false);
  };

  const availablePeopleToConnect = allPeople.filter((p) => p.id !== person.id);

  return (
    <aside
      role="complementary"
      aria-label={`Chi tiết người liên hệ: ${person.name}`}
      className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-neutral-900/98 backdrop-blur-xl border-l border-neutral-800 shadow-2xl z-50 flex flex-col overflow-hidden text-neutral-200"
    >
      {/* Top Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: person.colorAccent || currentGroup?.color || '#3b82f6' }}
          />
          <h2 className="text-base font-semibold text-white truncate max-w-[240px]">
            {person.name}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Đánh dấu yêu thích"
            aria-label="Đánh dấu người yêu thích"
            className={`p-1.5 rounded-lg transition-colors ${
              person.favorite
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            onClick={() => onUpdatePerson({ ...person, favorite: !person.favorite })}
          >
            <Star className={`w-4 h-4 ${person.favorite ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            title="Đóng bảng chi tiết (Esc)"
            aria-label="Đóng bảng chi tiết"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Overview */}
      <div className="px-5 py-4 border-b border-neutral-800/80 bg-neutral-950/40">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700/80 flex items-center justify-center text-lg font-bold text-neutral-200">
              {person.avatarUrl ? (
                <img
                  src={person.avatarUrl}
                  alt={person.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{person.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-lg font-bold text-white truncate">{person.name}</h3>

            <div className="flex items-center gap-2 text-xs text-neutral-400 tabular-nums">
              <span>{age > 0 ? `${age} tuổi` : 'Chưa rõ tuổi'}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-500" />
                {formatDateVN(person.birthDate)}
              </span>
            </div>

            {/* Birthday Status badge */}
            {birthdayInfo.daysLeft <= 30 && (
              <div
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  birthdayInfo.isToday
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                <Cake className="w-3.5 h-3.5" />
                <span>
                  {birthdayInfo.isToday
                    ? 'Sinh nhật hôm nay!'
                    : `Còn ${birthdayInfo.daysLeft} ngày là sinh nhật (${birthdayInfo.turnsAge} tuổi)`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Closeness Star Rating */}
        <div className="mt-3 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs">
          <span className="text-neutral-400">Mức độ thân thiết:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                type="button"
                aria-label={`Đặt thân thiết ${lvl} sao`}
                className={`p-1 transition-colors ${
                  lvl <= person.closeness
                    ? 'text-amber-400'
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
                onClick={() =>
                  onUpdatePerson({
                    ...person,
                    closeness: lvl as 1 | 2 | 3 | 4 | 5,
                  })
                }
              >
                <Star
                  className={`w-3.5 h-3.5 ${lvl <= person.closeness ? 'fill-current' : ''}`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-neutral-800 bg-neutral-900 px-3">
        <button
          type="button"
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'profile'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Hồ sơ & Ô chứa</span>
        </button>

        <button
          type="button"
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'connections'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
          onClick={() => setActiveTab('connections')}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Mối quan hệ ({directRelationships.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* TAB 1: Profile & Group Assignment */}
        {activeTab === 'profile' && (
          <div className="space-y-6 text-xs">
            {/* Single Group Container Assignment (Per prompt: "mỗi thẻ chỉ nằm trong 1 ô thôi") */}
            <div className="space-y-3 p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ô chứa nhóm (Chỉ thuộc 1 ô):</span>
              </h4>
              <p className="text-[11px] text-neutral-400">
                Thẻ này tự động chuyển nhóm khi bạn kéo thả vào vòng tròn trên bảng trắng.
              </p>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Chọn ô chứa:
                </label>
                <select
                  value={person.groupId || ''}
                  onChange={(e) => {
                    const newGId = e.target.value || null;
                    onUpdatePerson({
                      ...person,
                      groupId: newGId,
                    });
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="">-- Không nằm trong ô nào (Thẻ tự do) --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {person.groupId && (
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Vai trò trong ô này (VD: Trưởng ban, Lớp trưởng, Giảng viên...):
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập vai trò cụ thể..."
                    value={person.roleInGroup || ''}
                    onChange={(e) =>
                      onUpdatePerson({
                        ...person,
                        roleInGroup: e.target.value,
                      })
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Custom Color Accent */}
            <div className="space-y-2 pt-2">
              <label className="block text-[11px] text-neutral-400 mb-1.5">
                Màu viền thẻ hình tròn:
              </label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Chọn màu ${c}`}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      (person.colorAccent || '#3b82f6') === c
                        ? 'scale-125 ring-2 ring-white'
                        : 'hover:scale-110'
                    }`}
                    onClick={() => onUpdatePerson({ ...person, colorAccent: c })}
                  />
                ))}
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 pt-4 border-t border-neutral-800 text-xs">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Thông tin liên hệ & Ghi chú
              </h4>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Số điện thoại:
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    value={person.phone || ''}
                    placeholder="VD: 0912 345 678"
                    onChange={(e) => onUpdatePerson({ ...person, phone: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Địa chỉ Email:
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    value={person.email || ''}
                    placeholder="VD: user@example.com"
                    onChange={(e) => onUpdatePerson({ ...person, email: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Ngày sinh (Năm-Tháng-Ngày):
                </label>
                <input
                  type="date"
                  value={person.birthDate}
                  onChange={(e) => onUpdatePerson({ ...person, birthDate: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  Tiểu sử & Ghi chú:
                </label>
                <textarea
                  rows={2}
                  value={person.bio || ''}
                  placeholder="Mô tả tính cách, sở thích, thế mạnh..."
                  onChange={(e) => onUpdatePerson({ ...person, bio: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            {/* Tags System */}
            <div className="space-y-3 pt-4 border-t border-neutral-800 text-xs">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                Thẻ phân loại (Tags)
              </h4>

              <div className="flex flex-wrap items-center gap-1.5">
                {person.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      aria-label={`Xóa thẻ ${tag}`}
                      className="hover:text-rose-400"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Thêm tag mới..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(newTagInput);
                    }
                  }}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs"
                  onClick={() => handleAddTag(newTagInput)}
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* Danger Zone: Delete Person */}
            <div className="pt-6 border-t border-neutral-800/80 flex items-center justify-between">
              <button
                type="button"
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 hover:underline"
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn xóa "${person.name}" khỏi danh bạ?`)) {
                    onDeletePerson(person.id);
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa người này khỏi sơ đồ</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Direct Relationships */}
        {activeTab === 'connections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Mối quan hệ & Đường nối ({directRelationships.length})
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Các liên kết trực tiếp trên sơ đồ mạng lưới
                </p>
              </div>
              <button
                type="button"
                className="px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1 transition-colors"
                onClick={() => setIsAddingConnection(true)}
              >
                <Plus className="w-3 h-3" />
                <span>Thêm quan hệ</span>
              </button>
            </div>

            {/* Add Connection Form */}
            {isAddingConnection && (
              <form
                onSubmit={handleCreateConnection}
                className="p-3 bg-neutral-950 rounded-xl border border-neutral-700 space-y-3 text-xs"
              >
                <div className="font-semibold text-white">Nối quan hệ với:</div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Chọn người liên kết:
                  </label>
                  <select
                    value={connectToPersonId}
                    onChange={(e) => setConnectToPersonId(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="">-- Chọn một người --</option>
                    {availablePeopleToConnect.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Loại mối quan hệ:
                  </label>
                  <select
                    value={connectionType}
                    onChange={(e) => setConnectionType(e.target.value)}
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
                    Nhãn hiển thị trên mũi tên (tùy chọn):
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Cùng làm đồ án tốt nghiệp"
                    value={connectionLabel}
                    onChange={(e) => setConnectionLabel(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-neutral-400 hover:text-white"
                    onClick={() => setIsAddingConnection(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                  >
                    Tạo mũi tên
                  </button>
                </div>
              </form>
            )}

            {/* List of Relationships */}
            <div className="space-y-2">
              {directRelationships.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-neutral-950/40 border border-neutral-800 text-neutral-500 text-xs">
                  Chưa có mối quan hệ trực tiếp nào. Kéo chốt nối từ cạnh thẻ tròn để tạo liên kết.
                </div>
              ) : (
                directRelationships.map((rel) => {
                  const isOutgoing = rel.fromPersonId === person.id;
                  const otherPersonId = isOutgoing ? rel.toPersonId : rel.fromPersonId;
                  const otherPerson = allPeople.find((p) => p.id === otherPersonId);

                  if (!otherPerson) return null;

                  return (
                    <div
                      key={rel.id}
                      className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="font-semibold text-white hover:text-indigo-300 transition-colors truncate"
                            onClick={() => onJumpToPerson(otherPerson.id)}
                            title="Nhấp để di chuyển tới người này trên bảng trắng"
                          >
                            {otherPerson.name}
                          </button>
                          <ExternalLink className="w-3 h-3 text-neutral-500" />
                        </div>

                        <div className="text-[11px] text-indigo-400 mt-0.5">
                          {rel.label || rel.type}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Xóa mối quan hệ này"
                          aria-label={`Xóa quan hệ với ${otherPerson.name}`}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          onClick={() => onDeleteRelationship(rel.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
