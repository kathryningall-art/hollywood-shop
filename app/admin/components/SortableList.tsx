"use client";

import { ReactNode, CSSProperties } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Identifiable = { id: string };

type SortableRowProps = {
  ref: (node: HTMLElement | null) => void;
  style: CSSProperties;
  handleProps: {
    attributes: Record<string, unknown>;
    listeners: Record<string, unknown> | undefined;
  };
  isDragging: boolean;
};

/**
 * SortableProvider wraps the DndContext. Render it OUTSIDE any <table> —
 * it produces hidden accessibility divs that would otherwise be invalid HTML
 * inside a <tbody>.
 */
export function SortableProvider<T extends Identifiable>({
  items,
  onReorder,
  children,
  id,
}: {
  items: T[];
  onReorder: (next: T[]) => void | Promise<void>;
  children: ReactNode;
  id?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onReorder(arrayMove(items, oldIdx, newIdx));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      id={id}
    >
      {children}
    </DndContext>
  );
}

/**
 * SortableScope provides the SortableContext and renders each item.
 * Safe to use inside <tbody> — SortableContext renders no DOM.
 */
export function SortableScope<T extends Identifiable>({
  items,
  strategy = "vertical",
  children,
}: {
  items: T[];
  strategy?: "vertical" | "grid";
  children: (item: T, props: SortableRowProps) => ReactNode;
}) {
  return (
    <SortableContext
      items={items.map((i) => i.id)}
      strategy={strategy === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
    >
      {items.map((item) => (
        <SortableRow key={item.id} id={item.id}>
          {(props) => children(item, props)}
        </SortableRow>
      ))}
    </SortableContext>
  );
}

/**
 * SortableList = Provider + Scope in one. Use this when the sortable items
 * live inside a div (no <table>/<tbody> nesting concerns).
 */
export default function SortableList<T extends Identifiable>({
  items,
  onReorder,
  strategy = "vertical",
  children,
  id,
}: {
  items: T[];
  onReorder: (next: T[]) => void | Promise<void>;
  strategy?: "vertical" | "grid";
  children: (item: T, props: SortableRowProps) => ReactNode;
  id?: string;
}) {
  return (
    <SortableProvider items={items} onReorder={onReorder} id={id}>
      <SortableScope items={items} strategy={strategy}>
        {children}
      </SortableScope>
    </SortableProvider>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: (props: SortableRowProps) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <>
      {children({
        ref: setNodeRef,
        style,
        handleProps: {
          attributes: attributes as unknown as Record<string, unknown>,
          listeners: listeners as unknown as Record<string, unknown> | undefined,
        },
        isDragging,
      })}
    </>
  );
}

/**
 * Compute display_order updates from a reordered list.
 * Returns only the rows whose index changed.
 */
export function diffOrder<T extends Identifiable & { display_order: number }>(
  prev: T[],
  next: T[]
): { id: string; display_order: number }[] {
  const updates: { id: string; display_order: number }[] = [];
  next.forEach((item, idx) => {
    const before = prev.find((p) => p.id === item.id);
    if (!before || before.display_order !== idx) {
      updates.push({ id: item.id, display_order: idx });
    }
  });
  return updates;
}

/** Standard drag-handle SVG glyph (six dots). Spread handleProps onto it. */
export function DragHandle({
  attributes,
  listeners,
  className = "",
}: {
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown> | undefined;
  className?: string;
}) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing text-navy/30 hover:text-navy/70 transition-colors px-1 ${className}`}
      aria-label="Drag to reorder"
      title="Drag to reorder"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
        <circle cx="4" cy="3" r="1.2" />
        <circle cx="10" cy="3" r="1.2" />
        <circle cx="4" cy="7" r="1.2" />
        <circle cx="10" cy="7" r="1.2" />
        <circle cx="4" cy="11" r="1.2" />
        <circle cx="10" cy="11" r="1.2" />
      </svg>
    </button>
  );
}
