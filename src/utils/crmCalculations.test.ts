import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAge,
  getDaysUntilBirthday,
  filterPeople,
  getPersonConnections,
  calculateGroupBounds,
  formatDateVN,
} from './crmCalculations.ts';
import type { Person, Relationship, FilterState, Group } from '../types/crm.ts';

test('calculateAge calculates correct age based on reference date', () => {
  const refDate = new Date('2026-10-17');
  
  // Person born 2002-05-14 is 24 years old in Oct 2026
  assert.equal(calculateAge('2002-05-14', refDate), 24);
  
  // Person born 2002-11-20 has not had birthday yet in 2026
  assert.equal(calculateAge('2002-11-20', refDate), 23);
  
  // Person born today
  assert.equal(calculateAge('2026-10-17', refDate), 0);
  
  // Invalid string
  assert.equal(calculateAge('', refDate), 0);
});

test('getDaysUntilBirthday returns remaining days and birthday status', () => {
  const refDate = new Date(2026, 9, 17); // Oct 17, 2026

  // Birthday today
  const todayBday = getDaysUntilBirthday('2000-10-17', refDate);
  assert.equal(todayBday.isToday, true);
  assert.equal(todayBday.daysLeft, 0);
  assert.equal(todayBday.turnsAge, 26);

  // Birthday tomorrow
  const tomorrowBday = getDaysUntilBirthday('2000-10-18', refDate);
  assert.equal(tomorrowBday.daysLeft, 1);
  assert.equal(tomorrowBday.isToday, false);

  // Birthday already passed this year (e.g. Jan 10) -> turns into next year (2027)
  const pastBday = getDaysUntilBirthday('2000-01-10', refDate);
  assert.ok(pastBday.daysLeft > 80);
});

test('filterPeople supports multi-group membership and search queries', () => {
  const sampleGroups: Group[] = [
    { id: 'g-doan', name: 'Đoàn Thanh Niên', color: '#3b82f6', center: { x: 200, y: 200 }, radius: 200 },
    { id: 'g-truong', name: 'Trường Bách Khoa', color: '#10b981', center: { x: 600, y: 200 }, radius: 200 },
    { id: 'g-cty', name: 'Công Ty AI Tech', color: '#8b5cf6', center: { x: 600, y: 600 }, radius: 200 },
  ];

  const p1: Person = {
    id: 'p1',
    name: 'Nguyễn Văn Minh',
    birthDate: '2001-08-15',
    tags: ['Bạn Thân', 'Tech', 'Đoàn Viên'],
    groupMemberships: [
      { groupId: 'g-doan', roleInGroup: 'Bí thư chi đoàn' },
      { groupId: 'g-truong', roleInGroup: 'Lớp trưởng K64' },
    ],
    position: { x: 100, y: 100 },
    closeness: 5,
    createdAt: '2026-01-01',
  };

  const p2: Person = {
    id: 'p2',
    name: 'Trần Thị Mai',
    birthDate: '2002-12-05',
    tags: ['Thiết kế', 'Nghệ thuật'],
    groupMemberships: [
      { groupId: 'g-truong', roleInGroup: 'Sinh viên thiết kế' },
    ],
    position: { x: 400, y: 100 },
    closeness: 3,
    createdAt: '2026-01-01',
  };

  const people = [p1, p2];

  // Search by name
  const filterByName: FilterState = {
    searchQuery: 'Minh',
    selectedGroupId: null,
    selectedTag: null,
    birthdayUpcomingOnly: false,
    minCloseness: 1,
    sortBy: 'name',
  };
  assert.equal(filterPeople(people, filterByName, sampleGroups).length, 1);
  assert.equal(filterPeople(people, filterByName, sampleGroups)[0].id, 'p1');

  // Search by role in group
  const filterByRole: FilterState = {
    searchQuery: 'Bí thư',
    selectedGroupId: null,
    selectedTag: null,
    birthdayUpcomingOnly: false,
    minCloseness: 1,
    sortBy: 'name',
  };
  assert.equal(filterPeople(people, filterByRole, sampleGroups).length, 1);

  // Filter by Group: Đoàn Thanh Niên (only p1)
  const filterByDoan: FilterState = {
    searchQuery: '',
    selectedGroupId: 'g-doan',
    selectedTag: null,
    birthdayUpcomingOnly: false,
    minCloseness: 1,
    sortBy: 'name',
  };
  assert.equal(filterPeople(people, filterByDoan, sampleGroups).length, 1);

  // Filter by Group: Trường Bách Khoa (both p1 and p2)
  const filterByTruong: FilterState = {
    searchQuery: '',
    selectedGroupId: 'g-truong',
    selectedTag: null,
    birthdayUpcomingOnly: false,
    minCloseness: 1,
    sortBy: 'name',
  };
  assert.equal(filterPeople(people, filterByTruong, sampleGroups).length, 2);

  // Filter by Tag
  const filterByTag: FilterState = {
    searchQuery: '',
    selectedGroupId: null,
    selectedTag: 'Thiết kế',
    birthdayUpcomingOnly: false,
    minCloseness: 1,
    sortBy: 'name',
  };
  assert.equal(filterPeople(people, filterByTag, sampleGroups).length, 1);
  assert.equal(filterPeople(people, filterByTag, sampleGroups)[0].id, 'p2');
});

test('getPersonConnections returns both incoming and outgoing relationships', () => {
  const relationships: Relationship[] = [
    {
      id: 'r1',
      fromPersonId: 'p1',
      toPersonId: 'p2',
      type: 'Bạn học',
      direction: 'bidirectional',
      strength: 2,
      createdAt: '2026-01-01',
    },
    {
      id: 'r2',
      fromPersonId: 'p3',
      toPersonId: 'p1',
      type: 'Mentor',
      direction: 'from_to',
      strength: 3,
      createdAt: '2026-01-01',
    },
    {
      id: 'r3',
      fromPersonId: 'p2',
      toPersonId: 'p3',
      type: 'Đồng nghiệp',
      direction: 'undirected',
      strength: 1,
      createdAt: '2026-01-01',
    },
  ];

  const p1Connections = getPersonConnections('p1', relationships);
  assert.equal(p1Connections.length, 2);
  assert.ok(p1Connections.some((r) => r.id === 'r1'));
  assert.ok(p1Connections.some((r) => r.id === 'r2'));
});

test('calculateGroupBounds calculates boundary enclosing members', () => {
  const people: Person[] = [
    {
      id: 'p1',
      name: 'P1',
      birthDate: '2000-01-01',
      tags: [],
      groupMemberships: [{ groupId: 'g1', roleInGroup: 'A' }],
      position: { x: 100, y: 100 },
      closeness: 3,
      createdAt: '',
    },
    {
      id: 'p2',
      name: 'P2',
      birthDate: '2000-01-01',
      tags: [],
      groupMemberships: [{ groupId: 'g1', roleInGroup: 'B' }],
      position: { x: 500, y: 300 },
      closeness: 3,
      createdAt: '',
    },
  ];

  const bounds = calculateGroupBounds(people, 'g1', 40);
  assert.ok(bounds !== null);
  // minX = 100, maxX = 500 + 260 = 760 -> width = 660 + 80 = 740
  assert.equal(bounds.x, 60);
  assert.equal(bounds.width, 740);
});

test('formatDateVN formats date strings into DD/MM/YYYY', () => {
  assert.equal(formatDateVN('2024-03-05'), '05/03/2024');
  assert.equal(formatDateVN(''), 'Chưa cập nhật');
});
