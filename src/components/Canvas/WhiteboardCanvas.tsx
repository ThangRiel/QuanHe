import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Move,
  MousePointer,
  Sparkles,
  Link as LinkIcon,
  Compass,
} from 'lucide-react';
import type { Person, Group, Relationship, CanvasTransform } from '../../types/crm';
import { CircularPersonNode } from './CircularPersonNode';
import { CircularGroupContainer } from './CircularGroupContainer';
import { RelationshipLines } from './RelationshipLines';
import {
  findContainingGroup,
  resolveGroupCollisions,
  arrangeNodesInCircle,
  resolveNodeOverlaps,
  getDistance,
} from '../../utils/circleLayout';

interface WhiteboardCanvasProps {
  people: Person[];
  groups: Group[];
  relationships: Relationship[];
  selectedPersonId: string | null;
  selectedGroupId: string | null;
  selectedRelationshipId: string | null;
  highlightedPersonIds: Set<string>;
  onSelectPerson: (id: string | null) => void;
  onSelectGroup: (id: string | null) => void;
  onSelectRelationship: (id: string | null) => void;
  onUpdatePersonPosition: (id: string, pos: { x: number; y: number }, newGroupId?: string | null) => void;
  onUpdateGroup: (group: Group) => void;
  onUpdateGroupsAndPeople: (groups: Group[], people: Person[]) => void;
  onCreateRelationship: (fromId: string, toId: string) => void;
  onEditGroup: (group: Group) => void;
  onAutoArrange: () => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  people,
  groups,
  relationships,
  selectedPersonId,
  selectedGroupId,
  selectedRelationshipId,
  highlightedPersonIds,
  onSelectPerson,
  onSelectGroup,
  onSelectRelationship,
  onUpdatePersonPosition,
  onUpdateGroup,
  onUpdateGroupsAndPeople,
  onCreateRelationship,
  onEditGroup,
  onAutoArrange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas pan & zoom state
  const [transform, setTransform] = useState<CanvasTransform>({ x: 120, y: 80, zoom: 0.9 });
  const [gridStyle, setGridStyle] = useState<'dots' | 'lines' | 'none'>('dots');
  const [activeTool, setActiveTool] = useState<'select' | 'pan' | 'connect'>('select');

  // Dragging states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [draggingPersonId, setDraggingPersonId] = useState<string | null>(null);
  const [personDragOffset, setPersonDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [groupDragOffset, setGroupDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialMembersPositions, setInitialMembersPositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );

  // Group radius resize state
  const [resizingGroupId, setResizingGroupId] = useState<string | null>(null);
  const [resizeStartGroupRadius, setResizeStartGroupRadius] = useState<number>(200);
  const [resizeStartDistance, setResizeStartDistance] = useState<number>(200);

  // Connecting line state
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [currentMouseCanvasPos, setCurrentMouseCanvasPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Spacebar panning
  const [spacePressed, setSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSpacePressed(true);
      }
      if (e.key === 'v' || e.key === 'V') {
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          setActiveTool('select');
        }
      }
      if (e.key === 'h' || e.key === 'H') {
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          setActiveTool('pan');
        }
      }
      if (e.key === 'Escape') {
        setConnectingFromId(null);
        onSelectPerson(null);
        onSelectGroup(null);
        onSelectRelationship(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onSelectPerson, onSelectGroup, onSelectRelationship]);

  // Screen to Canvas conversion
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - transform.x) / transform.zoom;
      const y = (clientY - rect.top - transform.y) / transform.zoom;
      return { x, y };
    },
    [transform]
  );

  // Wheel handling for zoom and pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    if (e.ctrlKey || e.metaKey) {
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(2.5, Math.max(0.3, transform.zoom * zoomFactor));

      const newX = cursorX - (cursorX - transform.x) * (newZoom / transform.zoom);
      const newY = cursorY - (cursorY - transform.y) * (newZoom / transform.zoom);

      setTransform({ x: newX, y: newY, zoom: newZoom });
    } else {
      setTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || spacePressed || activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      return;
    }

    if (e.button === 0 && e.target === containerRef.current) {
      onSelectPerson(null);
      onSelectGroup(null);
      onSelectRelationship(null);
      if (connectingFromId) {
        setConnectingFromId(null);
      }
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setCurrentMouseCanvasPos(canvasPos);

    if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
      return;
    }

    // 1. Resizing Group Radius
    if (resizingGroupId) {
      const group = groups.find((g) => g.id === resizingGroupId);
      if (group) {
        const curDist = getDistance(canvasPos, group.center);
        const delta = curDist - resizeStartDistance;
        const newRadius = Math.max(160, Math.min(600, Math.round(resizeStartGroupRadius + delta)));

        // Update group radius and adjust member spacing dynamically:
        // "ô càng rộng thì các thẻ ở bên trong sẽ có khoảng cách rộng hơn"
        const groupMembers = people.filter((p) => p.groupId === group.id);
        const rearrangedMembers = arrangeNodesInCircle(
          groupMembers,
          group.center,
          newRadius,
          48
        );

        const updatedPeople = people.map((p) => {
          const match = rearrangedMembers.find((m) => m.id === p.id);
          return match ? { ...p, position: match.position } : p;
        });

        const updatedGroup = { ...group, radius: newRadius };
        const updatedGroups = groups.map((g) => (g.id === group.id ? updatedGroup : g));

        // Also prevent groups from overlapping
        const nonOverlappingGroups = resolveGroupCollisions(updatedGroups, 30);
        onUpdateGroupsAndPeople(nonOverlappingGroups, updatedPeople);
      }
      return;
    }

    // 2. Dragging Person Node
    if (draggingPersonId) {
      const newX = Math.round(canvasPos.x - personDragOffset.x);
      const newY = Math.round(canvasPos.y - personDragOffset.y);

      // Check containing group dynamically
      const detectedGroupId = findContainingGroup({ x: newX, y: newY }, groups, 48);

      onUpdatePersonPosition(draggingPersonId, { x: newX, y: newY }, detectedGroupId);
      return;
    }

    // 3. Dragging Group Container
    if (draggingGroupId) {
      const group = groups.find((g) => g.id === draggingGroupId);
      if (group) {
        const newCenterX = Math.round(canvasPos.x - groupDragOffset.x);
        const newCenterY = Math.round(canvasPos.y - groupDragOffset.y);

        const deltaX = newCenterX - group.center.x;
        const deltaY = newCenterY - group.center.y;

        // Move group's member nodes synchronously along with the container
        const updatedPeople = people.map((p) => {
          if (p.groupId === group.id) {
            return {
              ...p,
              position: {
                x: p.position.x + deltaX,
                y: p.position.y + deltaY,
              },
            };
          }
          return p;
        });

        const updatedGroup = { ...group, center: { x: newCenterX, y: newCenterY } };
        const updatedGroups = groups.map((g) => (g.id === group.id ? updatedGroup : g));

        // Prevent groups from colliding with other groups:
        // "các ô cũng tự động tránh để bị đè lên nhau"
        const nonOverlappingGroups = resolveGroupCollisions(updatedGroups, 30);

        onUpdateGroupsAndPeople(nonOverlappingGroups, updatedPeople);
      }
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);

    // If person was just dropped, resolve overlaps inside the destination group
    if (draggingPersonId) {
      const person = people.find((p) => p.id === draggingPersonId);
      if (person && person.groupId) {
        const group = groups.find((g) => g.id === person.groupId);
        if (group) {
          const groupMembers = people.filter((p) => p.groupId === group.id);
          const relaxed = resolveNodeOverlaps(groupMembers, group.center, group.radius, 48);

          const updatedPeople = people.map((p) => {
            const match = relaxed.find((m) => m.id === p.id);
            return match ? { ...p, position: match.position } : p;
          });

          onUpdateGroupsAndPeople(groups, updatedPeople);
        }
      }
      setDraggingPersonId(null);
    }

    // If group was moved or resized, run a final collision check
    if (draggingGroupId || resizingGroupId) {
      const nonOverlappingGroups = resolveGroupCollisions(groups, 30);
      onUpdateGroupsAndPeople(nonOverlappingGroups, people);
      setDraggingGroupId(null);
      setResizingGroupId(null);
      setInitialMembersPositions(new Map());
    }
  };

  // Start Person Node Drag
  const handlePersonDragStart = (id: string, e: React.MouseEvent) => {
    if (activeTool === 'pan' || spacePressed) return;
    const person = people.find((p) => p.id === id);
    if (!person) return;
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDraggingPersonId(id);
    setPersonDragOffset({
      x: canvasPos.x - person.position.x,
      y: canvasPos.y - person.position.y,
    });
    onSelectPerson(id);
  };

  // Start Group Drag
  const handleGroupDragStart = (groupId: string, e: React.MouseEvent) => {
    if (activeTool === 'pan' || spacePressed) return;
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDraggingGroupId(groupId);
    setGroupDragOffset({
      x: canvasPos.x - group.center.x,
      y: canvasPos.y - group.center.y,
    });

    const posMap = new Map<string, { x: number; y: number }>();
    people.forEach((p) => {
      if (p.groupId === groupId) {
        posMap.set(p.id, { ...p.position });
      }
    });
    setInitialMembersPositions(posMap);
    onSelectGroup(groupId);
  };

  // Start Group Radius Resize
  const handleResizeRadiusStart = (groupId: string, e: React.MouseEvent) => {
    if (activeTool === 'pan' || spacePressed) return;
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setResizingGroupId(groupId);
    setResizeStartGroupRadius(group.radius);
    setResizeStartDistance(getDistance(canvasPos, group.center));
    onSelectGroup(groupId);
  };

  // Spread / dãn cách đều các thẻ bên trong vòng tròn
  const handleAutoSpreadMembers = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const groupMembers = people.filter((p) => p.groupId === groupId);
    const arranged = arrangeNodesInCircle(groupMembers, group.center, group.radius, 48);

    const updatedPeople = people.map((p) => {
      const match = arranged.find((m) => m.id === p.id);
      return match ? { ...p, position: match.position } : p;
    });

    onUpdateGroupsAndPeople(groups, updatedPeople);
  };

  // Connection Creation Flow
  const handleStartConnect = (personId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFromId === personId) {
      setConnectingFromId(null);
    } else if (connectingFromId && connectingFromId !== personId) {
      onCreateRelationship(connectingFromId, personId);
      setConnectingFromId(null);
    } else {
      setConnectingFromId(personId);
    }
  };

  const handleEndConnect = (targetPersonId: string) => {
    if (connectingFromId && connectingFromId !== targetPersonId) {
      onCreateRelationship(connectingFromId, targetPersonId);
      setConnectingFromId(null);
    }
  };

  // Zoom Helpers
  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      zoom: Math.min(2.5, prev.zoom + 0.15),
    }));
  };

  const handleZoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      zoom: Math.max(0.3, prev.zoom - 0.15),
    }));
  };

  const handleResetZoom = () => {
    setTransform({ x: 120, y: 80, zoom: 0.9 });
  };

  const handleFitToScreen = () => {
    if (people.length === 0 || !containerRef.current) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    groups.forEach((g) => {
      minX = Math.min(minX, g.center.x - g.radius);
      minY = Math.min(minY, g.center.y - g.radius);
      maxX = Math.max(maxX, g.center.x + g.radius);
      maxY = Math.max(maxY, g.center.y + g.radius);
    });

    people.forEach((p) => {
      minX = Math.min(minX, p.position.x - 60);
      minY = Math.min(minY, p.position.y - 60);
      maxX = Math.max(maxX, p.position.x + 60);
      maxY = Math.max(maxY, p.position.y + 60);
    });

    const rect = containerRef.current.getBoundingClientRect();
    const contentW = maxX - minX + 200;
    const contentH = maxY - minY + 200;

    const zoomW = rect.width / contentW;
    const zoomH = rect.height / contentH;
    const targetZoom = Math.min(1.2, Math.max(0.4, Math.min(zoomW, zoomH)));

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setTransform({
      x: rect.width / 2 - midX * targetZoom,
      y: rect.height / 2 - midY * targetZoom,
      zoom: targetZoom,
    });
  };

  const getGridBg = () => {
    if (gridStyle === 'none') return 'bg-neutral-950';
    if (gridStyle === 'lines') {
      const size = 32 * transform.zoom;
      return {
        backgroundColor: '#0c0e14',
        backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      };
    }
    const size = 28 * transform.zoom;
    return {
      backgroundColor: '#0c0e14',
      backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.12) 1.2px, transparent 1.2px)`,
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${transform.x}px ${transform.y}px`,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none outline-none ${
        spacePressed || isPanning || activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      style={typeof getGridBg() === 'object' ? (getGridBg() as React.CSSProperties) : {}}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Connecting banner notification */}
      {connectingFromId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-amber-500/90 text-neutral-950 px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 backdrop-blur-md animate-pulse">
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Nhấp vào người thứ hai để tạo mũi tên quan hệ (hoặc nhấn Esc để hủy)</span>
          <button
            type="button"
            className="ml-2 bg-neutral-950/20 hover:bg-neutral-950/40 px-2 py-0.5 rounded text-[11px]"
            onClick={() => setConnectingFromId(null)}
          >
            Hủy
          </button>
        </div>
      )}

      {/* Main Transformable Canvas Surface */}
      <div
        className="absolute inset-0 origin-top-left pointer-events-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
          width: '6000px',
          height: '6000px',
        }}
      >
        {/* Layer 1: Circular Group Containers (Bubble Enclosures) */}
        {groups.map((group) => {
          const members = people.filter((p) => p.groupId === group.id);
          return (
            <CircularGroupContainer
              key={group.id}
              group={group}
              members={members}
              isSelected={selectedGroupId === group.id}
              onSelect={(id) => {
                onSelectGroup(id);
                onSelectPerson(null);
                onSelectRelationship(null);
              }}
              onEditGroup={onEditGroup}
              onDragStart={handleGroupDragStart}
              onResizeRadiusStart={handleResizeRadiusStart}
              onAutoSpreadMembers={handleAutoSpreadMembers}
            />
          );
        })}

        {/* Layer 2: Relationship Connectors between Circles */}
        <RelationshipLines
          relationships={relationships}
          people={people}
          selectedRelationshipId={selectedRelationshipId}
          onSelectRelationship={(id, e) => {
            e.stopPropagation();
            onSelectRelationship(id);
            onSelectPerson(null);
            onSelectGroup(null);
          }}
          connectingState={
            connectingFromId
              ? {
                  fromId: connectingFromId,
                  currentMousePos: currentMouseCanvasPos,
                }
              : null
          }
        />

        {/* Layer 3: Circular Person Nodes */}
        {people.map((person) => {
          const isDimmed =
            highlightedPersonIds.size > 0 && !highlightedPersonIds.has(person.id);
          const group = groups.find((g) => g.id === person.groupId) || null;

          return (
            <CircularPersonNode
              key={person.id}
              person={person}
              group={group}
              isSelected={selectedPersonId === person.id}
              isConnectingSource={connectingFromId === person.id}
              isDimmed={isDimmed}
              onSelect={(id) => {
                if (connectingFromId && connectingFromId !== id) {
                  onCreateRelationship(connectingFromId, id);
                  setConnectingFromId(null);
                } else {
                  onSelectPerson(id);
                  onSelectGroup(null);
                  onSelectRelationship(null);
                }
              }}
              onStartConnect={handleStartConnect}
              onEndConnect={handleEndConnect}
              onDragStart={handlePersonDragStart}
            />
          );
        })}
      </div>

      {/* Floating Canvas HUD / Toolbars */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-1 p-1 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-xl backdrop-blur-md">
        <button
          type="button"
          title="Công cụ chọn & di chuyển thẻ (Phím tắt: V)"
          aria-label="Công cụ chọn (V)"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            activeTool === 'select'
              ? 'bg-indigo-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          onClick={() => setActiveTool('select')}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Chọn (V)</span>
        </button>

        <button
          type="button"
          title="Công cụ bàn tay cuộn bảng trắng (Phím tắt: H hoặc giữ Space)"
          aria-label="Công cụ bàn tay (H)"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
            activeTool === 'pan'
              ? 'bg-indigo-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          onClick={() => setActiveTool('pan')}
        >
          <Move className="w-3.5 h-3.5" />
          <span>Bàn tay (H)</span>
        </button>

        <div className="h-4 w-[1px] bg-neutral-800 mx-0.5" />

        <button
          type="button"
          title="Tự động dãn cách & sắp xếp các ô tròn tránh đè nhau"
          aria-label="Tự động dãn cách sơ đồ"
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-indigo-300 hover:bg-neutral-800 flex items-center gap-1.5 transition-colors"
          onClick={onAutoArrange}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Dãn cách sơ đồ</span>
        </button>
      </div>

      {/* Bottom-Right Zoom & Viewport Controls */}
      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-2">
        <div className="flex items-center p-1 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-xl backdrop-blur-md">
          <button
            type="button"
            title="Đổi kiểu lưới bảng trắng: Chấm / Kẻ sọc / Trống"
            aria-label="Đổi kiểu lưới bảng trắng"
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={() => {
              if (gridStyle === 'dots') setGridStyle('lines');
              else if (gridStyle === 'lines') setGridStyle('none');
              else setGridStyle('dots');
            }}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-xl backdrop-blur-md text-xs font-mono">
          <button
            type="button"
            title="Thu nhỏ sơ đồ (-)"
            aria-label="Thu nhỏ sơ đồ"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={handleZoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            title="Đặt lại mức thu phóng 100%"
            aria-label="Đặt lại mức thu phóng"
            className="px-2 py-1 text-neutral-300 hover:text-white rounded hover:bg-neutral-800 transition-colors tabular-nums min-w-[50px] text-center"
            onClick={handleResetZoom}
          >
            {Math.round(transform.zoom * 100)}%
          </button>

          <button
            type="button"
            title="Phóng to sơ đồ (+)"
            aria-label="Phóng to sơ đồ"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={handleZoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-neutral-800 mx-0.5" />

          <button
            type="button"
            title="Căn chỉnh toàn bộ mạng lưới vào màn hình"
            aria-label="Căn chỉnh toàn bộ mạng lưới"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            onClick={handleFitToScreen}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini-map */}
      <div className="absolute bottom-5 left-5 z-30 p-2 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-xl backdrop-blur-md hidden sm:block">
        <div className="text-[10px] text-neutral-400 font-medium pb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-indigo-400" /> Bản đồ thu nhỏ
          </span>
          <span className="tabular-nums text-neutral-500">{people.length} thẻ</span>
        </div>
        <div
          className="w-40 h-28 bg-neutral-950/80 rounded border border-neutral-800/80 relative overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const canvasX = (clickX / 160) * 1600;
            const canvasY = (clickY / 112) * 1200;
            if (containerRef.current) {
              const cRect = containerRef.current.getBoundingClientRect();
              setTransform((prev) => ({
                ...prev,
                x: cRect.width / 2 - canvasX * prev.zoom,
                y: cRect.height / 2 - canvasY * prev.zoom,
              }));
            }
          }}
        >
          {groups.map((g) => {
            const gx = g.center?.x ?? 400;
            const gy = g.center?.y ?? 350;
            return (
              <div
                key={g.id}
                style={{
                  left: `${(gx / 1600) * 160 - 12}px`,
                  top: `${(gy / 1200) * 112 - 12}px`,
                  borderColor: g.color || '#3b82f6',
                }}
                className="absolute w-6 h-6 rounded-full border opacity-50 pointer-events-none"
              />
            );
          })}

          {people.map((p) => {
            const px = p.position?.x ?? 400;
            const py = p.position?.y ?? 350;
            const mx = (px / 1600) * 160;
            const my = (py / 1200) * 112;
            const isSelected = selectedPersonId === p.id;
            return (
              <div
                key={p.id}
                style={{
                  left: `${Math.max(2, Math.min(154, mx))}px`,
                  top: `${Math.max(2, Math.min(106, my))}px`,
                  backgroundColor: isSelected ? '#818cf8' : p.colorAccent || '#3b82f6',
                }}
                className={`absolute w-2.5 h-2.5 rounded-full ${
                  isSelected ? 'ring-1 ring-white' : ''
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
