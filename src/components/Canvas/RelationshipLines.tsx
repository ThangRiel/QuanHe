import React from 'react';
import type { Relationship, Person } from '../../types/crm';
import { getCircleEdgePoint } from '../../utils/circleLayout';

interface RelationshipLinesProps {
  relationships: Relationship[];
  people: Person[];
  selectedRelationshipId: string | null;
  onSelectRelationship: (id: string, e: React.MouseEvent) => void;
  connectingState?: {
    fromId: string;
    currentMousePos: { x: number; y: number };
  } | null;
}

export const RelationshipLines: React.FC<RelationshipLinesProps> = ({
  relationships,
  people,
  selectedRelationshipId,
  onSelectRelationship,
  connectingState,
}) => {
  const peopleMap = new Map<string, Person>();
  people.forEach((p) => peopleMap.set(p.id, p));

  return (
    <svg
      style={{ zIndex: 10 }}
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
    >
      <defs>
        <marker
          id="arrow-end"
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366f1" />
        </marker>
        <marker
          id="arrow-start"
          viewBox="0 0 10 10"
          refX="3"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 8 1.5 L 0 5 L 8 8.5 z" fill="#6366f1" />
        </marker>
      </defs>

      {/* Render permanent relationship arrows */}
      {relationships.map((rel, index) => {
        const from = peopleMap.get(rel.fromPersonId);
        const to = peopleMap.get(rel.toPersonId);

        if (!from || !to) return null;

        const fromRadius = from.radius || 48;
        const toRadius = to.radius || 48;

        // Calculate boundary edge points of the circles so arrowheads sit nicely on the circumference
        const p1 = getCircleEdgePoint(from.position, fromRadius, to.position);
        const p2 = getCircleEdgePoint(to.position, toRadius, from.position);

        const isSelected = selectedRelationshipId === rel.id;
        const color = rel.color || (isSelected ? '#818cf8' : '#64748b');

        // Curve control point calculation
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const curveOffset = Math.min(45, Math.max(15, dist * 0.12)) * (index % 2 === 0 ? 1 : -1);
        const normalX = -dy / (dist || 1);
        const normalY = dx / (dist || 1);

        const midX = (p1.x + p2.x) / 2 + normalX * curveOffset;
        const midY = (p1.y + p2.y) / 2 + normalY * curveOffset;

        const pathData = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;

        const strokeWidth = rel.strength === 3 ? 2.5 : rel.strength === 2 ? 1.8 : 1.4;
        const strokeDasharray =
          rel.lineStyle === 'dashed' ? '5 4' : rel.lineStyle === 'dotted' ? '2 4' : 'none';

        const hasStartArrow = rel.direction === 'bidirectional';
        const hasEndArrow = rel.direction === 'from_to' || rel.direction === 'bidirectional';

        return (
          <g key={rel.id} className="group/rel pointer-events-auto">
            {/* Click hit path */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="12"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRelationship(rel.id, e);
              }}
            />

            {/* Rendered line */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth={isSelected ? strokeWidth + 1.5 : strokeWidth}
              strokeDasharray={strokeDasharray}
              markerStart={hasStartArrow ? 'url(#arrow-start)' : undefined}
              markerEnd={hasEndArrow ? 'url(#arrow-end)' : undefined}
              className={`transition-all duration-150 cursor-pointer group-hover/rel:stroke-indigo-400 ${
                isSelected ? 'filter drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectRelationship(rel.id, e);
              }}
            />

            {/* Mid-point label badge */}
            <foreignObject
              x={midX - 65}
              y={midY - 12}
              width="130"
              height="24"
              className="overflow-visible pointer-events-none"
            >
              <div
                role="button"
                tabIndex={0}
                className={`mx-auto w-max max-w-[125px] px-2 py-0.5 rounded-full text-[10px] font-medium border backdrop-blur-md shadow-sm transition-all truncate text-center cursor-pointer pointer-events-auto ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 scale-105'
                    : 'bg-neutral-900/90 text-neutral-300 border-neutral-700/80 group-hover/rel:border-indigo-400 group-hover/rel:text-white'
                }`}
                title={rel.label || rel.type}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRelationship(rel.id, e);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSelectRelationship(rel.id, e as unknown as React.MouseEvent);
                  }
                }}
              >
                {rel.label || rel.type}
              </div>
            </foreignObject>
          </g>
        );
      })}

      {/* Connecting line in progress */}
      {connectingState && (() => {
        const sourcePerson = peopleMap.get(connectingState.fromId);
        if (!sourcePerson) return null;
        const p1 = sourcePerson.position;
        const p2 = connectingState.currentMousePos;

        return (
          <g>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 4"
              markerEnd="url(#arrow-end)"
            />
            <circle cx={p2.x} cy={p2.y} r="5" fill="#f59e0b" />
          </g>
        );
      })()}
    </svg>
  );
};
