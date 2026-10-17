export interface GroupMembership {
  groupId: string;
  roleInGroup: string;
}

export type NodeSizeMode = 'compact' | 'standard' | 'detailed';

export interface Person {
  id: string;
  name: string;
  birthDate: string; // YYYY-MM-DD
  avatarUrl?: string;
  phone?: string;
  email?: string;
  bio?: string;
  tags: string[];
  groupId?: string | null; // Belongs to at most 1 circular container
  roleInGroup?: string; // Role in that group
  groupMemberships?: GroupMembership[]; // Kept for backwards compatibility
  position: { x: number; y: number }; // Center coordinate of the circle
  radius?: number; // Circular node radius (default 48px, diameter 96px)
  nodeSize?: NodeSizeMode;
  colorAccent?: string;
  closeness: 1 | 2 | 3 | 4 | 5;
  favorite?: boolean;
  notes?: string;
  lastContactDate?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  color: string;
  center: { x: number; y: number }; // Center of the circular container
  radius: number; // Radius of circular container
  bounds?: { x: number; y: number; width: number; height: number }; // Optional for backward compatibility
}

export type RelationshipDirection = 'undirected' | 'from_to' | 'bidirectional';

export interface Relationship {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  type: string;
  label?: string;
  direction: RelationshipDirection;
  strength: 1 | 2 | 3;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  notes?: string;
  createdAt: string;
}

export interface FilterState {
  searchQuery: string;
  selectedGroupId: string | null;
  selectedTag: string | null;
  birthdayUpcomingOnly: boolean;
  minCloseness: number;
  sortBy: 'name' | 'birthday' | 'closeness' | 'lastContact';
}

export interface CanvasTransform {
  x: number;
  y: number;
  zoom: number;
}
