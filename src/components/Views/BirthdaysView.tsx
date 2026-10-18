import React from 'react';
import { Cake, Calendar, Gift, Phone, MessageSquare, Star } from 'lucide-react';
import type { Person, Group } from '../../types/crm';
import { calculateAge, getDaysUntilBirthday, formatDateVN } from '../../utils/crmCalculations';

interface BirthdaysViewProps {
  people: Person[];
  groups: Group[];
  onSelectPerson: (id: string) => void;
}

export const BirthdaysView: React.FC<BirthdaysViewProps> = ({
  people,
  groups,
  onSelectPerson,
}) => {
  // Sort people by days until birthday
  const sorted = [...people].map((person) => ({
    person,
    bday: getDaysUntilBirthday(person.birthDate),
    currentAge: calculateAge(person.birthDate),
  })).sort((a, b) => a.bday.daysLeft - b.bday.daysLeft);

  return (
    <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-950 p-4 sm:p-6 text-neutral-800 dark:text-neutral-200 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Cake className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            <span>Theo dõi sinh nhật & Sự kiện kỷ niệm</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Không bao giờ bỏ lỡ sinh nhật của bạn bè, đồng chí, mentor và người thân trong mạng lưới.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(({ person, bday, currentAge }) => {
            const isSoon = bday.daysLeft <= 30;
            const isUrgent = bday.daysLeft <= 7;

            return (
              <div
                key={person.id}
                role="button"
                tabIndex={0}
                className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-neutral-900/90 hover:border-indigo-500 hover:shadow-xl ${
                  isUrgent
                    ? 'border-rose-400 dark:border-rose-500/50 bg-rose-50/60 dark:bg-rose-950/10'
                    : isSoon
                    ? 'border-amber-400 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/10'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
                onClick={() => onSelectPerson(person.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectPerson(person.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 shrink-0 flex items-center justify-center font-bold text-sm text-neutral-700 dark:text-neutral-300">
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
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white text-sm hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors">
                        {person.name}
                      </h3>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                        {bday.formattedDate}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-bold px-2.5 py-1 rounded-full inline-block ${
                        bday.isToday
                          ? 'bg-rose-600 text-white animate-bounce'
                          : isUrgent
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                          : isSoon
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {bday.isToday ? 'Hôm nay!' : `Còn ${bday.daysLeft} ngày`}
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                      Sắp tròn {currentAge + 1} tuổi
                    </div>
                  </div>
                </div>

                {/* Groups */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {person.groupMemberships && person.groupMemberships.map((m) => {
                    const group = groups.find((g) => g.id === m.groupId);
                    if (!group) return null;
                    return (
                      <span
                        key={group.id}
                        className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 bg-neutral-100 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: group.color }} />
                        <span>{group.name}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Footer Quick Action */}
                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Lần gặp: {formatDateVN(person.lastContactDate)}</span>
                  </div>
                  {person.phone && (
                    <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
                      <Phone className="w-3 h-3" /> Gọi chúc mừng
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
