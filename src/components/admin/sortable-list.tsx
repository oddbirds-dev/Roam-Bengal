import { useId, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Vertical drag-to-reorder, shared by the homepage section builder and (in principle) any
 * future reorderable list — RB's existing `RepeaterField` (fields.tsx) still uses plain
 * up/down arrow buttons and is left as-is; this is additive, not a replacement.
 *
 * A pointer sensor with a small activation distance means a click on a button inside a row
 * still registers as a click. The keyboard sensor is what makes this usable without a
 * mouse: tab to a grip, space to lift, arrows to move, space to drop.
 */
export function SortableList({
  ids,
  onReorder,
  children,
}: {
  ids: string[];
  onReorder: (nextIds: string[]) => void;
  children: ReactNode;
}) {
  const contextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(ids, from, to));
  }

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/**
 * One draggable row. `children` receives the grip handle so each caller can place it
 * wherever its own layout wants it.
 */
export function SortableRow({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const handle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label="Reorder — press space, then use the arrow keys"
      className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted transition-colors hover:bg-cream hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-green active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "relative z-10 opacity-90 shadow-lg", className)}
    >
      {children(handle)}
    </div>
  );
}
