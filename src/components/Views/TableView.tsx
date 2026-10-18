import React from 'react';
import { Phone, Mail, Star, Cake, Calendar, ExternalLink, Users } from 'lucide-react';
import type { Person, Group } from '../../types/crm';
import { calculateAge, getDaysUntilBirthday, formatDateVN } from '../../utils/crmCalculations';

interface TableViewProps {
  people: Person[];
  groups: Group[];
  onSelectPerson: (id: string) => void;
  onOpenAddPerson: () => void;
}

export const TableView: React.FC<TableViewProps> = ({
  people,
  groups,
  onSelectPerson,
  onOpenAddPerson,
}) => {
  if (people.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500 dark:text-neutral-400">
        <Users className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
        <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">Không tìm thấy người nào phù hợp</h3>
        <p className="text-xs text-neutral-500 max-w-sm mb-4">
          Hãy điều chỉnh lại bộ lọc hoặc thêm một người mới vào danh bạ của bạn.
        </p>
        <button
          type="button"
          onClick={onOpenAddPerson}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          + Thêm người mới
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-950 p-4 sm:p-6 transition-colors">
      <div className="max-w-7xl mx-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/70 text-neutral-600 dark:text-neutral-400 font-semibold">
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Tuổi & Ngày sinh</th>
                <th className="py-3 px-4">Các nhóm & Vai trò</th>
                <th className="py-3 px-4">Thẻ tags</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4 text-center">Thân thiết</th>
                <th className="py-3 px-4">Lần gặp gần nhất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60 text-neutral-800 dark:text-neutral-200">
              {people.map((person) => {
                const age = calculateAge(person.birthDate);
                const bday = getDaysUntilBirthday(person.birthDate);

                return (
                  <tr
                    key={person.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                    onClick={() => onSelectPerson(person.id)}
                  >
                    {/* Name + Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 shrink-0 flex items-center justify-center font-bold text-xs text-neutral-700 dark:text-neutral-300">
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
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors truncate">
                            {person.name}
                            {person.isSelf && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                                Tôi
                              </span>
                            )}
                          </div>
                          {person.bio && (
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">
                              {person.bio}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Age & Birthday */}
                    <td className="py-3 px-4 tabular-nums">
                      <div className="font-medium text-neutral-900 dark:text-white">{age > 0 ? `${age} tuổi` : 'Chưa rõ'}</div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                        <span>{bday.formattedDate}</span>
                        {bday.daysLeft <= 30 && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium text-[10px]">
                            ({bday.isToday ? 'Hôm nay!' : `còn ${bday.daysLeft} ngày`})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Multi-Group Memberships & Specific Roles */}
                    <td className="py-3 px-4">
                      <div className="space-y-1 max-w-[260px]">
                        {person.groupMemberships && person.groupMemberships.length > 0 ? (
                          person.groupMemberships.map((m) => {
                            const group = groups.find((g) => g.id === m.groupId);
                            if (!group) return null;
                            return (
                              <div
                                key={group.id}
                                className="flex items-center gap-1.5 text-[11px] bg-neutral-100 dark:bg-neutral-950/60 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800"
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: group.color }}
                                />
                                <span className="font-medium text-neutral-800 dark:text-neutral-300 truncate max-w-[120px]">
                                  {group.name}
                                </span>
                                {m.roleInGroup && (
                                  <span className="text-neutral-500 dark:text-neutral-400 text-[10px] border-l border-neutral-300 dark:border-neutral-800 pl-1.5 truncate">
                                    {m.roleInGroup}
                                  </span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-500 text-[11px] italic">Chưa phân nhóm</span>
                        )}
                      </div>
                    </td>

                    {/* Tags */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {person.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 text-[11px]">
                        {person.phone && (
                          <div className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
                            <Phone className="w-3 h-3 text-neutral-400" />
                            <span>{person.phone}</span>
                          </div>
                        )}
                        {person.email && (
                          <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 truncate max-w-[140px]">
                            <Mail className="w-3 h-3 text-neutral-400" />
                            <span>{person.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Closeness */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < (person.closeness ?? 3)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-neutral-300 dark:text-neutral-700'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Last Contact */}
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 tabular-nums">
                      {formatDateVN(person.lastContactDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
