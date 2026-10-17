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
    <div className="flex-1 overflow-auto bg-neutral-950 p-6 text-neutral-200">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cake className="w-6 h-6 text-amber-400" />
            <span>Theo dõi sinh nhật & Sự kiện kỷ niệm</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
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
                className={`p-4 rounded-2xl border transition-all cursor-pointer bg-neutral-900/90 hover:border-indigo-500/80 hover:shadow-xl ${
                  isUrgent
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : isSoon
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-neutral-800'
                }`}
                onClick={() => onSelectPerson(person.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectPerson(person.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0 flex items-center justify-center font-bold text-sm text-neutral-300">
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
                      <h3 className="font-semibold text-white text-sm hover:text-indigo-300 transition-colors">
                        {person.name}
                      </h3>
                      <div className="text-xs text-neutral-400 tabular-nums">
                        {bday.formattedDate}
                      </div>
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <div
                    className={`text-center px-2.5 py-1 rounded-xl text-xs font-semibold tabular-nums ${
                      bday.isToday
                        ? 'bg-rose-500 text-white animate-bounce'
                        : isUrgent
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : isSoon
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {bday.isToday ? (
                      'Hôm nay!'
                    ) : (
                      <>
                        <div>Còn {bday.daysLeft}</div>
                        <div className="text-[10px] font-normal">ngày</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Turning Age Notice */}
                <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
                  <span>
                    Chuẩn bị tròn{' '}
                    <strong className="text-white font-semibold">{bday.turnsAge} tuổi</strong>
                  </span>
                  {person.phone && (
                    <span className="text-neutral-500 flex items-center gap-1 text-[11px]">
                      <Phone className="w-3 h-3" />
                      {person.phone}
                    </span>
                  )}
                </div>

                {/* Group roles */}
                {person.groupMemberships && person.groupMemberships.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {person.groupMemberships.map((m) => {
                      const g = groups.find((grp) => grp.id === m.groupId);
                      if (!g) return null;
                      return (
                        <span
                          key={g.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 truncate max-w-[150px]"
                        >
                          {g.name}: {m.roleInGroup}
                        </span>
                      );
                    })}
                  </div>
                ) : person.groupId ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(() => {
                      const g = groups.find((grp) => grp.id === person.groupId);
                      if (!g) return null;
                      return (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 truncate max-w-[150px]">
                          {g.name}: {person.roleInGroup || 'Thành viên'}
                        </span>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
