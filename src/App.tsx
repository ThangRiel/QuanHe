import React, { useState, useEffect, useMemo } from 'react';
import type { Person, Group, Relationship, FilterState } from './types/crm';
import {
  INITIAL_GROUPS,
  INITIAL_PEOPLE,
  INITIAL_RELATIONSHIPS,
} from './data/initialData';
import { filterPeople, getDaysUntilBirthday } from './utils/crmCalculations';
import { resolveGroupCollisions, arrangeNodesInCircle } from './utils/circleLayout';
import { TopBar, type ActiveView } from './components/TopBar/TopBar';
import { FilterBar } from './components/FilterBar/FilterBar';
import { WhiteboardCanvas } from './components/Canvas/WhiteboardCanvas';
import { PersonInspector } from './components/Inspector/PersonInspector';
import { RelationshipModal } from './components/Inspector/RelationshipModal';
import { AddPersonModal } from './components/Modals/AddPersonModal';
import { GroupModal } from './components/Modals/GroupModal';
import { TableView } from './components/Views/TableView';
import { BirthdaysView } from './components/Views/BirthdaysView';

import { Users, CheckCircle2, Filter, X } from 'lucide-react';

const STORAGE_KEY = 'crm_whiteboard_relationship_data_v3';
const LEGACY_KEY_V2 = 'crm_whiteboard_relationship_data_v2';
const LEGACY_KEY_V1 = 'crm_whiteboard_relationship_data_v1';

function sanitizePeople(raw: unknown): Person[] {
  if (!Array.isArray(raw) || raw.length === 0) return INITIAL_PEOPLE;

  let list = (raw as any[]).slice();
  const hasSelf = list.some((p) => p && (p.isSelf || p.id === 'p-self'));
  if (!hasSelf && INITIAL_PEOPLE[0]?.isSelf) {
    list = [INITIAL_PEOPLE[0], ...list];
  }

  return list.map((p, idx) => {
    const isSelf = Boolean(p.isSelf || p.id === 'p-self');
    const defaultRadius = isSelf ? 144 : 48;
    const pos =
      p && p.position && typeof p.position.x === 'number' && !isNaN(p.position.x)
        ? p.position
        : isSelf
        ? { x: 680, y: 620 }
        : { x: 280 + (idx % 3) * 130, y: 320 + Math.floor(idx / 3) * 130 };

    return {
      ...p,
      isSelf,
      groupId: isSelf ? null : p.groupId,
      position: pos,
      radius: isSelf ? 144 : typeof p.radius === 'number' && p.radius >= 30 ? p.radius : defaultRadius,
      groupMemberships: Array.isArray(p.groupMemberships)
        ? p.groupMemberships
        : p.groupId
        ? [{ groupId: p.groupId, roleInGroup: p.roleInGroup || p.role || '' }]
        : [],
    };
  });
}

function sanitizeGroups(raw: unknown): Group[] {
  if (!Array.isArray(raw) || raw.length === 0) return INITIAL_GROUPS;
  return raw.map((g, idx) => {
    let center = g.center;
    let radius = g.radius;
    if (!center || typeof center.x !== 'number' || isNaN(center.x)) {
      if (g.bounds && typeof g.bounds.x === 'number') {
        center = {
          x: Math.round(g.bounds.x + (g.bounds.width || 360) / 2),
          y: Math.round(g.bounds.y + (g.bounds.height || 360) / 2),
        };
        radius = Math.round(Math.max(g.bounds.width || 360, g.bounds.height || 360) / 2);
      } else {
        const fallback = INITIAL_GROUPS[idx % INITIAL_GROUPS.length];
        center = fallback ? { ...fallback.center } : { x: 350 + idx * 350, y: 350 };
        radius = fallback ? fallback.radius : 200;
      }
    }
    if (!radius || typeof radius !== 'number' || isNaN(radius) || radius < 50) {
      radius = 200;
    }
    return {
      id: g.id || `g-${idx}`,
      name: g.name || `Nhóm ${idx + 1}`,
      description: g.description,
      color: g.color || '#3b82f6',
      center,
      radius,
    };
  });
}

function sanitizeRelationships(raw: unknown): Relationship[] {
  if (!Array.isArray(raw) || raw.length === 0) return INITIAL_RELATIONSHIPS;
  let rels = (raw as any[]).filter((r) => r && r.fromPersonId && r.toPersonId);

  // If no links to central self exist in saved data, integrate the initial links to p-self
  const hasSelfRel = rels.some((r) => r.fromPersonId === 'p-self' || r.toPersonId === 'p-self');
  if (!hasSelfRel) {
    const selfRels = INITIAL_RELATIONSHIPS.filter(
      (r) => r.fromPersonId === 'p-self' || r.toPersonId === 'p-self'
    );
    rels = [...selfRels, ...rels];
  }

  return rels;
}

export default function App() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Load data from localStorage or fallback to realistic initial sample
  const [people, setPeople] = useState<Person[]>(() => {
    try {
      const savedV3 = localStorage.getItem(`${STORAGE_KEY}_people`);
      if (savedV3) return sanitizePeople(JSON.parse(savedV3));
      const savedV2 = localStorage.getItem(`${LEGACY_KEY_V2}_people`);
      if (savedV2) return sanitizePeople(JSON.parse(savedV2));
      const legacy = localStorage.getItem(`${LEGACY_KEY_V1}_people`);
      if (legacy) return sanitizePeople(JSON.parse(legacy));
      return INITIAL_PEOPLE;
    } catch {
      return INITIAL_PEOPLE;
    }
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const savedV3 = localStorage.getItem(`${STORAGE_KEY}_groups`);
      if (savedV3) return sanitizeGroups(JSON.parse(savedV3));
      const savedV2 = localStorage.getItem(`${LEGACY_KEY_V2}_groups`);
      if (savedV2) return sanitizeGroups(JSON.parse(savedV2));
      const legacy = localStorage.getItem(`${LEGACY_KEY_V1}_groups`);
      if (legacy) return sanitizeGroups(JSON.parse(legacy));
      return INITIAL_GROUPS;
    } catch {
      return INITIAL_GROUPS;
    }
  });

  const [relationships, setRelationships] = useState<Relationship[]>(() => {
    try {
      const savedV3 = localStorage.getItem(`${STORAGE_KEY}_relationships`);
      if (savedV3) return sanitizeRelationships(JSON.parse(savedV3));
      const savedV2 = localStorage.getItem(`${LEGACY_KEY_V2}_relationships`);
      if (savedV2) return sanitizeRelationships(JSON.parse(savedV2));
      const legacy = localStorage.getItem(`${LEGACY_KEY_V1}_relationships`);
      if (legacy) return sanitizeRelationships(JSON.parse(legacy));
      return INITIAL_RELATIONSHIPS;
    } catch {
      return INITIAL_RELATIONSHIPS;
    }
  });

  // Debounced persistent save to prevent main-thread lag during fast drag interactions
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`${STORAGE_KEY}_people`, JSON.stringify(people));
      } catch (e) {
        console.warn('Storage save error:', e);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [people]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`${STORAGE_KEY}_groups`, JSON.stringify(groups));
      } catch (e) {
        console.warn('Storage save error:', e);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [groups]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(`${STORAGE_KEY}_relationships`, JSON.stringify(relationships));
      } catch (e) {
        console.warn('Storage save error:', e);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [relationships]);

  // Active top navigation view ('canvas' | 'table' | 'birthdays')
  const [activeView, setActiveView] = useState<ActiveView>('canvas');

  // Filter Bar visibility toggle (hidden by default to keep navbar roomy and clean)
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Selections
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);

  // Modals
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedGroupId: null,
    selectedTag: null,
    birthdayUpcomingOnly: false,
    minCloseness: 1,
    sortBy: 'name',
  });

  // Active filter count for badge and indicator
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim() !== '') count++;
    if (filters.selectedGroupId !== null) count++;
    if (filters.selectedTag !== null) count++;
    if (filters.birthdayUpcomingOnly) count++;
    if (filters.minCloseness > 1) count++;
    return count;
  }, [filters]);

  // Filtered People
  const filteredPeople = useMemo(() => {
    return filterPeople(people, filters, groups);
  }, [people, filters, groups]);

  // Highlighted IDs for canvas
  const highlightedPersonIds = useMemo(() => {
    const isFiltering =
      filters.searchQuery.trim() !== '' ||
      filters.selectedGroupId !== null ||
      filters.selectedTag !== null ||
      filters.birthdayUpcomingOnly ||
      filters.minCloseness > 1;

    if (!isFiltering) {
      return new Set<string>();
    }
    return new Set(filteredPeople.map((p) => p.id));
  }, [filters, filteredPeople]);

  // All unique tags across people
  const allTags = useMemo(() => {
    const set = new Set<string>();
    people.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [people]);

  // Upcoming birthdays count (next 30 days)
  const upcomingBirthdaysCount = useMemo(() => {
    return people.filter((p) => getDaysUntilBirthday(p.birthDate).daysLeft <= 30).length;
  }, [people]);

  // Selected person reference
  const selectedPerson = useMemo(() => {
    return people.find((p) => p.id === selectedPersonId) || null;
  }, [people, selectedPersonId]);

  // Selected relationship reference
  const selectedRelationship = useMemo(() => {
    return relationships.find((r) => r.id === selectedRelationshipId) || null;
  }, [relationships, selectedRelationshipId]);

  // Handlers for Person
  const handleUpdatePerson = (updated: Person) => {
    setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setRelationships((prev) =>
      prev.filter((r) => r.fromPersonId !== id && r.toPersonId !== id)
    );
    if (selectedPersonId === id) setSelectedPersonId(null);
  };

  const handleAddPerson = (newPersonData: Omit<Person, 'id' | 'createdAt'>) => {
    const newPerson: Person = {
      ...newPersonData,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPeople((prev) => [...prev, newPerson]);
    setSelectedPersonId(newPerson.id);
  };

  const handleUpdatePersonPosition = (
    id: string,
    pos: { x: number; y: number },
    newGroupId?: string | null
  ) => {
    setPeople((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated: Person = { ...p, position: pos };
        if (newGroupId !== undefined) {
          updated.groupId = newGroupId;
          if (newGroupId) {
            const role = p.roleInGroup || p.groupMemberships?.[0]?.roleInGroup || 'Thành viên';
            updated.roleInGroup = role;
            updated.groupMemberships = [{ groupId: newGroupId, roleInGroup: role }];
          } else {
            updated.roleInGroup = undefined;
            updated.groupMemberships = [];
          }
        }
        return updated;
      })
    );
  };

  // Handlers for Group
  const handleSaveGroup = (group: Group) => {
    setGroups((prev) => {
      const exists = prev.some((g) => g.id === group.id);
      if (exists) {
        return prev.map((g) => (g.id === group.id ? group : g));
      }
      return [...prev, group];
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setPeople((prev) =>
      prev.map((p) => {
        const isCurrentGroup = p.groupId === groupId;
        const updatedMemberships = (p.groupMemberships || []).filter((m) => m.groupId !== groupId);
        return {
          ...p,
          groupId: isCurrentGroup ? null : p.groupId,
          roleInGroup: isCurrentGroup ? undefined : p.roleInGroup,
          groupMemberships: updatedMemberships,
        };
      })
    );
    if (selectedGroupId === groupId) setSelectedGroupId(null);
  };

  const handleUpdateGroup = (group: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
  };

  const handleUpdateGroupsAndPeople = (newGroups: Group[], newPeople: Person[]) => {
    setGroups(newGroups);
    setPeople(newPeople);
  };

  // Handlers for Relationships
  const handleCreateRelationship = (fromPersonId: string, toPersonId: string) => {
    if (fromPersonId === toPersonId) return;

    const existing = relationships.find(
      (r) =>
        (r.fromPersonId === fromPersonId && r.toPersonId === toPersonId) ||
        (r.fromPersonId === toPersonId && r.toPersonId === fromPersonId)
    );

    if (existing) {
      setSelectedRelationshipId(existing.id);
      return;
    }

    const newRel: Relationship = {
      id: `r-${Date.now()}`,
      fromPersonId,
      toPersonId,
      type: 'Quan hệ công việc & cá nhân',
      label: 'Liên kết',
      direction: 'bidirectional',
      strength: 2,
      lineStyle: 'solid',
      color: '#6366f1',
      createdAt: new Date().toISOString(),
    };

    setRelationships((prev) => [...prev, newRel]);
    setSelectedRelationshipId(newRel.id);
  };

  const handleUpdateRelationship = (updated: Relationship) => {
    setRelationships((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  const handleDeleteRelationship = (id: string) => {
    setRelationships((prev) => prev.filter((r) => r.id !== id));
    if (selectedRelationshipId === id) setSelectedRelationshipId(null);
  };

  // Auto-arrange algorithm to organize circular groups and distribute nodes cleanly
  const handleAutoArrange = () => {
    // 1. Separate all group circles so they never overlap
    const relaxedGroups = resolveGroupCollisions(groups, 40);

    // 2. For each group, distribute its member nodes cleanly with proportional spacing
    let updatedPeople = [...people];
    relaxedGroups.forEach((group) => {
      const groupMembers = updatedPeople.filter((p) => p.groupId === group.id);
      const arranged = arrangeNodesInCircle(groupMembers, group.center, group.radius, 48);
      updatedPeople = updatedPeople.map((p) => {
        const match = arranged.find((m) => m.id === p.id);
        return match ? { ...p, position: match.position } : p;
      });
    });

    setGroups(relaxedGroups);
    setPeople(updatedPeople);
  };

  // Export Data to JSON
  const handleExportData = () => {
    const exportPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      people,
      groups,
      relationships,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relationship_crm_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import Data from JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.people && Array.isArray(parsed.people)) {
          setPeople(sanitizePeople(parsed.people));
        }
        if (parsed.groups && Array.isArray(parsed.groups)) {
          setGroups(sanitizeGroups(parsed.groups));
        }
        if (parsed.relationships && Array.isArray(parsed.relationships)) {
          setRelationships(sanitizeRelationships(parsed.relationships));
        }
        showToast('Đã khôi phục dữ liệu từ file sao lưu thành công!');
      } catch {
        showToast('Không thể đọc file: định dạng JSON không hợp lệ!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset to initial sample data
  const handleResetSampleData = () => {
    setPeople(INITIAL_PEOPLE);
    setGroups(INITIAL_GROUPS);
    setRelationships(INITIAL_RELATIONSHIPS);
    localStorage.removeItem(`${STORAGE_KEY}_people`);
    localStorage.removeItem(`${STORAGE_KEY}_groups`);
    localStorage.removeItem(`${STORAGE_KEY}_relationships`);
    localStorage.removeItem(`${LEGACY_KEY_V2}_people`);
    localStorage.removeItem(`${LEGACY_KEY_V2}_groups`);
    localStorage.removeItem(`${LEGACY_KEY_V2}_relationships`);
    localStorage.removeItem(`${LEGACY_KEY_V1}_people`);
    localStorage.removeItem(`${LEGACY_KEY_V1}_groups`);
    localStorage.removeItem(`${LEGACY_KEY_V1}_relationships`);
    setSelectedPersonId(null);
    setSelectedGroupId(null);
    setSelectedRelationshipId(null);
    showToast('Đã nạp lại toàn bộ dữ liệu mẫu ban đầu!');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedGroupId: null,
      selectedTag: null,
      birthdayUpcomingOnly: false,
      minCloseness: 1,
      sortBy: 'name',
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {/* 1. Header (Adhering to Top Bar Contract) */}
      <TopBar
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenAddPerson={() => setIsAddPersonOpen(true)}
        onOpenAddGroup={() => {
          setEditingGroup(null);
          setIsGroupModalOpen(true);
        }}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetSampleData={handleResetSampleData}
        upcomingBirthdaysCount={upcomingBirthdaysCount}
        isFilterOpen={isFilterOpen}
        onToggleFilter={() => setIsFilterOpen((prev) => !prev)}
        activeFilterCount={activeFilterCount}
      />

      {/* 2. Collapsible Filter & Advanced Search Bar (Hidden by default, shown when user clicks "Bộ lọc") */}
      {isFilterOpen && (
        <FilterBar
          filters={filters}
          groups={groups}
          allTags={allTags}
          totalCount={people.length}
          filteredCount={filteredPeople.length}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
          onClose={() => setIsFilterOpen(false)}
        />
      )}

      {/* 3. Main Viewport */}
      <main className="flex-1 relative flex overflow-hidden">
        {/* Discrete floating filter pill when filter bar is hidden but filters are actively applied */}
        {!isFilterOpen && activeFilterCount > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-600 dark:bg-indigo-700 text-white text-xs font-medium shadow-xl backdrop-blur-md animate-fade-in">
            <Filter className="w-3.5 h-3.5 fill-white/20" />
            <span>
              Bộ lọc đang bật ({filteredPeople.length}/{people.length} người)
            </span>
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="underline hover:text-indigo-200 ml-1 cursor-pointer font-semibold"
            >
              Xem bộ lọc
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Xóa bộ lọc"
              aria-label="Xóa bộ lọc"
              className="p-0.5 hover:bg-white/20 rounded-full ml-1 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {activeView === 'canvas' && (
          <WhiteboardCanvas
            people={people}
            groups={groups}
            relationships={relationships}
            selectedPersonId={selectedPersonId}
            selectedGroupId={selectedGroupId}
            selectedRelationshipId={selectedRelationshipId}
            highlightedPersonIds={highlightedPersonIds}
            onSelectPerson={setSelectedPersonId}
            onSelectGroup={setSelectedGroupId}
            onSelectRelationship={setSelectedRelationshipId}
            onUpdatePersonPosition={handleUpdatePersonPosition}
            onUpdateGroup={handleUpdateGroup}
            onUpdateGroupsAndPeople={handleUpdateGroupsAndPeople}
            onCreateRelationship={handleCreateRelationship}
            onEditGroup={(grp) => {
              setEditingGroup(grp);
              setIsGroupModalOpen(true);
            }}
            onAutoArrange={handleAutoArrange}
          />
        )}

        {activeView === 'table' && (
          <TableView
            people={filteredPeople}
            groups={groups}
            onSelectPerson={(id) => {
              setSelectedPersonId(id);
              setActiveView('canvas');
            }}
            onOpenAddPerson={() => setIsAddPersonOpen(true)}
          />
        )}

        {activeView === 'birthdays' && (
          <BirthdaysView
            people={filteredPeople}
            groups={groups}
            onSelectPerson={(id) => {
              setSelectedPersonId(id);
              setActiveView('canvas');
            }}
          />
        )}

        {/* 4. Slide-over Person Inspector */}
        {selectedPerson && (
          <PersonInspector
            person={selectedPerson}
            allPeople={people}
            groups={groups}
            relationships={relationships}
            onClose={() => setSelectedPersonId(null)}
            onUpdatePerson={handleUpdatePerson}
            onDeletePerson={handleDeletePerson}
            onAddRelationship={(rel) => {
              const newRel: Relationship = {
                ...rel,
                id: `r-${Date.now()}`,
                createdAt: new Date().toISOString(),
              };
              setRelationships((prev) => [...prev, newRel]);
            }}
            onDeleteRelationship={handleDeleteRelationship}
            onJumpToPerson={(pId) => {
              setSelectedPersonId(pId);
            }}
          />
        )}

        {/* 5. Relationship Details Modal */}
        {selectedRelationship && (
          <RelationshipModal
            relationship={selectedRelationship}
            people={people}
            onClose={() => setSelectedRelationshipId(null)}
            onUpdate={handleUpdateRelationship}
            onDelete={handleDeleteRelationship}
          />
        )}

        {/* 6. Add Person Modal */}
        {isAddPersonOpen && (
          <AddPersonModal
            groups={groups}
            onClose={() => setIsAddPersonOpen(false)}
            onAdd={handleAddPerson}
            spawnPosition={{
              x: 350 + Math.random() * 200,
              y: 250 + Math.random() * 200,
            }}
          />
        )}

        {/* 7. Add/Edit Group Modal */}
        {isGroupModalOpen && (
          <GroupModal
            initialGroup={editingGroup}
            onClose={() => {
              setIsGroupModalOpen(false);
              setEditingGroup(null);
            }}
            onSave={handleSaveGroup}
            onDelete={handleDeleteGroup}
          />
        )}

        {/* Empty state overlay when canvas has 0 people */}
        {activeView === 'canvas' && people.length === 0 && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm pointer-events-auto p-4">
            <div className="max-w-md w-full p-6 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Bảng trắng quan hệ đang trống</h3>
              <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
                Chưa có thẻ quan hệ nào hoặc dữ liệu đã được làm trống. Bạn có thể nạp lại ngay 6 hồ sơ và 4 ô chứa tròn mẫu ban đầu hoặc tự tạo người mới.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleResetSampleData}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors cursor-pointer"
                >
                  Nạp lại 6 hồ sơ & 4 nhóm mẫu
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddPersonOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
                >
                  + Thêm người mới
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast feedback */}
        {toastMessage && (
          <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900/95 border border-neutral-700/80 text-neutral-100 text-xs font-medium shadow-2xl backdrop-blur-md animate-fade-in pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>
    </div>
  );
}
