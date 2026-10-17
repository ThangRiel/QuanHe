import type { Person, Relationship, FilterState, Group } from '../types/crm';

/**
 * Calculates current age from YYYY-MM-DD birthdate string.
 */
export function calculateAge(birthDate: string, refDate: Date = new Date()): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;

  let age = refDate.getFullYear() - birth.getFullYear();
  const monthDiff = refDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Calculates days remaining until next birthday.
 */
export function getDaysUntilBirthday(birthDate: string, refDate: Date = new Date()): {
  daysLeft: number;
  formattedDate: string;
  isToday: boolean;
  turnsAge: number;
} {
  if (!birthDate) {
    return { daysLeft: 999, formattedDate: '', isToday: false, turnsAge: 0 };
  }
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) {
    return { daysLeft: 999, formattedDate: '', isToday: false, turnsAge: 0 };
  }

  const currentYear = refDate.getFullYear();
  const thisYearBirthday = new Date(currentYear, birth.getMonth(), birth.getDate());
  
  // Set times to midnight for accurate day diff
  const todayMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  let targetBirthday = thisYearBirthday;

  if (thisYearBirthday.getTime() < todayMidnight.getTime()) {
    targetBirthday = new Date(currentYear + 1, birth.getMonth(), birth.getDate());
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((targetBirthday.getTime() - todayMidnight.getTime()) / msPerDay);
  const turnsAge = targetBirthday.getFullYear() - birth.getFullYear();

  const formattedDate = `${String(birth.getDate()).padStart(2, '0')}/${String(birth.getMonth() + 1).padStart(2, '0')}/${birth.getFullYear()}`;

  return {
    daysLeft: diffDays,
    formattedDate,
    isToday: diffDays === 0,
    turnsAge,
  };
}

/**
 * Filters and searches people by attributes, multi-group memberships, tags, upcoming birthdays.
 */
export function filterPeople(people: Person[], filters: FilterState, groups: Group[] = []): Person[] {
  return people.filter((person) => {
    // Search query: checks name, bio, tags, phone, email, notes, and role names
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchName = person.name.toLowerCase().includes(q);
      const matchBio = person.bio?.toLowerCase().includes(q) ?? false;
      const matchTags = person.tags.some(t => t.toLowerCase().includes(q));
      const matchPhone = person.phone?.toLowerCase().includes(q) ?? false;
      const matchEmail = person.email?.toLowerCase().includes(q) ?? false;
      const matchNotes = person.notes?.toLowerCase().includes(q) ?? false;
      const matchRoles =
        (person.roleInGroup?.toLowerCase().includes(q) ?? false) ||
        (person.groupId && (groups.find(g => g.id === person.groupId)?.name.toLowerCase().includes(q) ?? false)) ||
        (person.groupMemberships?.some(m => {
          const group = groups.find(g => g.id === m.groupId);
          return m.roleInGroup.toLowerCase().includes(q) || (group?.name.toLowerCase().includes(q) ?? false);
        }) ?? false);

      if (!matchName && !matchBio && !matchTags && !matchPhone && !matchEmail && !matchNotes && !matchRoles) {
        return false;
      }
    }

    // Group filter: check if person belongs to the selected group
    if (filters.selectedGroupId) {
      const inGroup =
        person.groupId === filters.selectedGroupId ||
        (person.groupMemberships?.some(m => m.groupId === filters.selectedGroupId) ?? false);
      if (!inGroup) return false;
    }

    // Tag filter
    if (filters.selectedTag) {
      if (!person.tags.includes(filters.selectedTag)) return false;
    }

    // Closeness filter
    if (person.closeness < filters.minCloseness) {
      return false;
    }

    // Birthday upcoming filter (within next 30 days)
    if (filters.birthdayUpcomingOnly) {
      const bdayInfo = getDaysUntilBirthday(person.birthDate);
      if (bdayInfo.daysLeft > 30) return false;
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name, 'vi');
      case 'birthday': {
        const aDays = getDaysUntilBirthday(a.birthDate).daysLeft;
        const bDays = getDaysUntilBirthday(b.birthDate).daysLeft;
        return aDays - bDays;
      }
      case 'closeness':
        return b.closeness - a.closeness;
      case 'lastContact': {
        const aDate = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0;
        const bDate = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0;
        return bDate - aDate;
      }
      default:
        return 0;
    }
  });
}

/**
 * Returns all relationships connected to a specific person.
 */
export function getPersonConnections(personId: string, relationships: Relationship[]): Relationship[] {
  return relationships.filter(
    (rel) => rel.fromPersonId === personId || rel.toPersonId === personId
  );
}

/**
 * Calculates a bounding rectangle enclosing all members of a group on the canvas.
 */
export function calculateGroupBounds(
  people: Person[],
  groupId: string,
  padding: number = 60
): { x: number; y: number; width: number; height: number } | null {
  const members = people.filter(
    (p) => p.groupId === groupId || (p.groupMemberships && p.groupMemberships.some((m) => m.groupId === groupId))
  );
  if (members.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const nodeWidth = 260;
  const nodeHeight = 160;

  for (const member of members) {
    minX = Math.min(minX, member.position.x);
    minY = Math.min(minY, member.position.y);
    maxX = Math.max(maxX, member.position.x + nodeWidth);
    maxY = Math.max(maxY, member.position.y + nodeHeight);
  }

  return {
    x: minX - padding,
    y: minY - padding - 40, // extra top padding for group label header
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2 + 40,
  };
}

/**
 * Format date string to Vietnamese display (DD/MM/YYYY)
 */
export function formatDateVN(dateStr?: string): string {
  if (!dateStr) return 'Chưa cập nhật';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
