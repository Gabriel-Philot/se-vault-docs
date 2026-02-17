import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "motion/react";

interface Attribute {
  name: string;
  type_hint: string;
  is_private: boolean;
  value?: string | null;
}

interface DemoData {
  class_name: string;
  public_attrs: Attribute[];
  private_attrs: Attribute[];
  getters: string[];
  setters: string[];
  python_code: string;
}

interface VaultPuzzleProps {
  onCodeChange: (code: string) => void;
  resetKey?: number;
}

/* ---------- tiny sub-components ---------- */

function DraggableMethod({ name }: { name: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `method-${name}`,
    data: { methodName: name },
  });

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      whileHover={{ scale: 1.05 }}
      style={{
        padding: "0.4rem 0.7rem",
        background: "var(--bg-secondary)",
        border: "1px solid var(--accent-spice)",
        borderRadius: 6,
        fontSize: "0.75rem",
        fontFamily: "var(--font-code)",
        color: "var(--accent-spice)",
        cursor: "grab",
        opacity: isDragging ? 0.4 : 1,
        boxShadow: "0 0 8px rgba(232,114,42,0.2)",
        userSelect: "none",
        display: "inline-block",
      }}
    >
      <span style={{ fontSize: "0.65rem" }}>ƒ</span> {name}()
    </motion.div>
  );
}

function DroppableAttr({
  attr,
  unlocked,
  denied,
  onDirectClick,
}: {
  attr: Attribute;
  unlocked: boolean;
  denied: boolean;
  onDirectClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `attr-${attr.name}`,
    data: { attrName: attr.name },
  });

  const glowColor = attr.is_private
    ? unlocked
      ? "rgba(240,160,48,0.5)"
      : "rgba(192,57,43,0.5)"
    : "rgba(45,125,210,0.4)";
  const borderColor = attr.is_private
    ? unlocked
      ? "var(--success)"
      : "var(--error)"
    : "var(--accent-fremen)";

  return (
    <motion.div
      ref={setNodeRef}
      onClick={onDirectClick}
      animate={
        denied
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
          : unlocked
            ? { scale: [1, 1.08, 1] }
            : {}
      }
      transition={denied ? { duration: 0.4 } : { duration: 0.3 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        background: isOver
          ? "rgba(232,114,42,0.08)"
          : "var(--bg-secondary)",
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        fontSize: "0.78rem",
        fontFamily: "var(--font-code)",
        cursor: "pointer",
        boxShadow: `0 0 8px ${glowColor}`,
        transition: "background 0.2s",
      }}
    >
      <span style={{ fontSize: "0.7rem" }}>
        {attr.is_private ? (unlocked ? "🔓" : "🔒") : "🔓"}
      </span>
      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
        {attr.name}
      </span>
      <span style={{ color: "var(--text-secondary)", fontSize: "0.7rem" }}>
        : {attr.type_hint}
      </span>
      {attr.value && (
        <span style={{ color: "var(--code-text)", fontSize: "0.7rem" }}>
          = {unlocked || !attr.is_private ? attr.value : "***"}
        </span>
      )}
    </motion.div>
  );
}

/* ---------- main component ---------- */

export default function VaultPuzzle({ onCodeChange, resetKey }: VaultPuzzleProps) {
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [unlockedAttrs, setUnlockedAttrs] = useState<Set<string>>(new Set());
  const [deniedAttr, setDeniedAttr] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [activeMethod, setActiveMethod] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/encapsulation/demo");
        if (!res.ok) return;
        const data = await res.json();
        setDemo(data);
        onCodeChange(data.python_code);
        setUnlockedAttrs(new Set());
        setDeniedAttr(null);
        setMessage(null);
      } catch {
        // ignore
      }
    })();
  }, [onCodeChange, resetKey]);

  const tryDirectAccess = useCallback(
    async (attrName: string) => {
      if (!demo) return;
      try {
        const res = await fetch("/api/encapsulation/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class_name: demo.class_name,
            instance_name: "db",
            attribute_name: attrName,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        onCodeChange(data.python_code);
        if (!data.allowed) {
          setDeniedAttr(attrName);
          setTimeout(() => setDeniedAttr(null), 500);
          setMessage({ text: data.message, type: "error" });
        } else {
          setMessage({ text: data.message, type: "success" });
        }
      } catch {
        // ignore
      }
    },
    [demo, onCodeChange]
  );

  const callMethod = useCallback(
    async (methodName: string, attrName: string) => {
      if (!demo) return;
      try {
        const res = await fetch("/api/encapsulation/call-method", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class_name: demo.class_name,
            instance_name: "db",
            method_name: methodName,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        onCodeChange(data.python_code);
        if (data.success) {
          setUnlockedAttrs((prev) => new Set([...prev, attrName]));
          setMessage({ text: data.message, type: "success" });
        }
      } catch {
        // ignore
      }
    },
    [demo, onCodeChange]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveMethod(event.active.data.current?.methodName ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveMethod(null);
    const { active, over } = event;
    if (!over) return;

    const methodName = active.data.current?.methodName as string;
    const attrName = over.data.current?.attrName as string;
    if (methodName && attrName) {
      callMethod(methodName, attrName);
    }
  };

  if (!demo) {
    return (
      <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
        Loading demo...
      </div>
    );
  }

  const allAttrs = [...demo.public_attrs, ...demo.private_attrs];
  const allMethods = [...demo.getters, ...demo.setters];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "var(--accent-spice)",
              margin: 0,
            }}
          >
            Vault Puzzle
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.82rem",
              marginTop: "0.3rem",
            }}
          >
            Click private attributes directly to see access denied. Drag
            getter/setter methods onto them to unlock.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* Left: Class vault visualization */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid rgba(232,114,42,0.2)",
              borderRadius: 12,
              padding: "1.25rem",
            }}
          >
            {/* Class header */}
            <div
              style={{
                textAlign: "center",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid rgba(232,114,42,0.15)",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                class
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "var(--accent-spice)",
                  margin: 0,
                }}
              >
                {demo.class_name}
              </h3>
            </div>

            {/* Attributes */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {allAttrs.map((attr) => (
                <DroppableAttr
                  key={attr.name}
                  attr={attr}
                  unlocked={unlockedAttrs.has(attr.name)}
                  denied={deniedAttr === attr.name}
                  onDirectClick={() => tryDirectAccess(attr.name)}
                />
              ))}
            </div>
          </div>

          {/* Right: Methods toolbox */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid rgba(232,114,42,0.15)",
              borderRadius: 8,
              padding: "0.75rem",
            }}
          >
            <h4
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.8rem",
                color: "var(--accent-spice)",
                margin: "0 0 0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Methods (drag onto attributes)
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {allMethods.map((name) => (
                <DraggableMethod key={name} name={name} />
              ))}
            </div>
          </div>
        </div>

        {/* Message */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              key={message.text}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: "1rem",
                padding: "0.6rem 1rem",
                background:
                  message.type === "error"
                    ? "rgba(192,57,43,0.1)"
                    : "rgba(240,160,48,0.1)",
                border: `1px solid ${
                  message.type === "error" ? "var(--error)" : "var(--success)"
                }`,
                borderRadius: 6,
                color:
                  message.type === "error" ? "var(--error)" : "var(--success)",
                fontSize: "0.78rem",
                fontFamily: "var(--font-code)",
              }}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DragOverlay>
        {activeMethod && (
          <div
            style={{
              padding: "0.4rem 0.7rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--accent-spice)",
              borderRadius: 6,
              fontSize: "0.75rem",
              fontFamily: "var(--font-code)",
              color: "var(--accent-spice)",
              boxShadow: "0 0 12px rgba(232,114,42,0.4)",
            }}
          >
            <span style={{ fontSize: "0.65rem" }}>ƒ</span> {activeMethod}()
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
