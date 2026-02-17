import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "motion/react";
import ClassCard from "../shared/ClassCard";
import AttributeBlock, {
  type AttributeData,
} from "../shared/AttributeBlock";
import MethodBlock, { type MethodData } from "../shared/MethodBlock";
import ObjectBadge from "../shared/ObjectBadge";
import SpiceParticles from "./SpiceParticles";

interface ObjectInstance {
  instance_name: string;
  class_name: string;
  attributes: {
    name: string;
    type_hint: string;
    is_private: boolean;
    value?: string;
  }[];
}

interface BlueprintBuilderProps {
  onCodeChange: (code: string) => void;
  resetKey?: number;
  renderBeforeInstantiate?: React.ReactNode;
}

let nextId = 1;
const uid = () => `item-${nextId++}`;

const TYPE_OPTIONS = ["str", "int", "float", "bool", "list"];

export default function BlueprintBuilder({
  onCodeChange,
  resetKey,
  renderBeforeInstantiate,
}: BlueprintBuilderProps) {
  const [className, setClassName] = useState("Dog");
  const [classAttributes, setClassAttributes] = useState<AttributeData[]>([]);
  const [classMethods, setClassMethods] = useState<MethodData[]>([]);
  const [objects, setObjects] = useState<ObjectInstance[]>([]);
  const [showParticles, setShowParticles] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Form state for adding new attributes/methods
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrType, setNewAttrType] = useState("str");
  const [newAttrPrivate, setNewAttrPrivate] = useState(false);

  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodParams, setNewMethodParams] = useState("");
  const [newMethodBody, setNewMethodBody] = useState('print("hello")');

  // Instantiation form
  const [instanceName, setInstanceName] = useState("");
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resetKey === undefined || resetKey === 0) return;
    setClassName("Dog");
    setClassAttributes([]);
    setClassMethods([]);
    setObjects([]);
    setNewAttrName("");
    setNewMethodName("");
    setNewMethodParams("");
    setNewMethodBody('print("hello")');
    setInstanceName("");
    setAttrValues({});
    setError(null);
  }, [resetKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const addAttribute = () => {
    if (!newAttrName.trim()) return;
    const rawName = newAttrName.trim();
    const name = newAttrPrivate && !rawName.startsWith("_")
      ? `_${rawName}`
      : rawName;
    setClassAttributes((prev) => [
      ...prev,
      {
        id: uid(),
        name,
        type_hint: newAttrType,
        is_private: newAttrPrivate,
      },
    ]);
    setNewAttrName("");
    setNewAttrPrivate(false);
  };

  const addMethod = () => {
    if (!newMethodName.trim()) return;
    const params = newMethodParams
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    setClassMethods((prev) => [
      ...prev,
      {
        id: uid(),
        name: newMethodName.trim(),
        params,
        body: newMethodBody,
      },
    ]);
    setNewMethodName("");
    setNewMethodParams("");
    setNewMethodBody('print("hello")');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Reorder within attributes
    const attrIndex = classAttributes.findIndex((a) => a.id === active.id);
    const overAttrIndex = classAttributes.findIndex((a) => a.id === over.id);
    if (attrIndex !== -1 && overAttrIndex !== -1) {
      setClassAttributes(arrayMove(classAttributes, attrIndex, overAttrIndex));
      return;
    }

    // Reorder within methods
    const methodIndex = classMethods.findIndex((m) => m.id === active.id);
    const overMethodIndex = classMethods.findIndex((m) => m.id === over.id);
    if (methodIndex !== -1 && overMethodIndex !== -1) {
      setClassMethods(arrayMove(classMethods, methodIndex, overMethodIndex));
    }
  };

  const createClass = useCallback(async () => {
    if (!className.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/class/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oop_class: {
            name: className,
            parent: null,
            attributes: classAttributes.map((a) => ({
              name: a.name,
              type_hint: a.type_hint,
              is_private: a.is_private,
            })),
            methods: classMethods.map((m) => ({
              name: m.name,
              params: m.params,
              body: m.body,
            })),
          },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onCodeChange(data.python_code);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setLoading(false);
    }
  }, [className, classAttributes, classMethods, onCodeChange]);

  const instantiate = useCallback(async () => {
    if (!instanceName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/class/instantiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_name: className,
          instance_name: instanceName,
          attribute_values: attrValues,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setObjects((prev) => [...prev, data.instance]);
      onCodeChange(data.python_code);
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 1500);
      setInstanceName("");
      setAttrValues({});
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to instantiate object"
      );
    } finally {
      setLoading(false);
    }
  }, [className, instanceName, attrValues, onCodeChange]);

  const activeItem =
    classAttributes.find((a) => a.id === activeId) ??
    classMethods.find((m) => m.id === activeId);

  const inputStyle: React.CSSProperties = {
    padding: "0.4rem 0.6rem",
    background: "var(--code-bg)",
    border: "1px solid rgba(232,114,42,0.15)",
    borderRadius: 4,
    color: "var(--text-primary)",
    fontFamily: "var(--font-code)",
    fontSize: "0.78rem",
    outline: "none",
  };

  const btnStyle: React.CSSProperties = {
    padding: "0.4rem 0.8rem",
    background: "rgba(232,114,42,0.15)",
    border: "1px solid var(--accent-spice)",
    borderRadius: 6,
    color: "var(--accent-spice)",
    fontFamily: "var(--font-heading)",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.03em",
  };

  return (
    <div style={{ position: "relative" }}>
      {showParticles && <SpiceParticles />}

      {/* Page title */}
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
          Blueprint Builder
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.82rem",
            marginTop: "0.3rem",
          }}
        >
          Drag attributes and methods to build your class, then instantiate
          objects.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* Left: Class Card with drag & drop */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div>
            {/* Class name input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Class Name
              </label>
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                style={{ ...inputStyle, flex: 1, maxWidth: 200 }}
                placeholder="ClassName"
              />
            </div>

            <ClassCard
              className={className}
              attributes={classAttributes}
              methods={classMethods}
            />

            {/* Build Class button */}
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <button
                onClick={createClass}
                disabled={loading}
                style={{
                  ...btnStyle,
                  opacity: loading ? 0.6 : 1,
                  background: "var(--accent-spice)",
                  color: "var(--bg-primary)",
                  fontWeight: 700,
                }}
              >
                {loading ? "Building..." : "Build Class"}
              </button>
            </div>
          </div>

          <DragOverlay>
            {activeId && activeItem ? (
              "type_hint" in activeItem ? (
                <AttributeBlock
                  attribute={activeItem as AttributeData}
                  isDragOverlay
                />
              ) : (
                <MethodBlock
                  method={activeItem as MethodData}
                  isDragOverlay
                />
              )
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Right: Controls panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {/* Add Attribute form */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid rgba(45,125,210,0.15)",
              borderRadius: 8,
              padding: "0.75rem",
            }}
          >
            <h4
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.8rem",
                color: "var(--accent-fremen)",
                margin: "0 0 0.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              + Attribute
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <input
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                placeholder="name"
                style={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && addAttribute()}
              />
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <select
                  value={newAttrType}
                  onChange={(e) => setNewAttrType(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newAttrPrivate}
                    onChange={(e) => setNewAttrPrivate(e.target.checked)}
                  />
                  Private
                </label>
              </div>
              <button onClick={addAttribute} style={btnStyle}>
                Add
              </button>
            </div>
          </div>

          {/* Add Method form */}
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
                margin: "0 0 0.5rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              + Method
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <input
                value={newMethodName}
                onChange={(e) => setNewMethodName(e.target.value)}
                placeholder="method_name"
                style={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && addMethod()}
              />
              <input
                value={newMethodParams}
                onChange={(e) => setNewMethodParams(e.target.value)}
                placeholder="param1, param2"
                style={inputStyle}
              />
              <input
                value={newMethodBody}
                onChange={(e) => setNewMethodBody(e.target.value)}
                placeholder='print("hello")'
                style={inputStyle}
              />
              <button onClick={addMethod} style={btnStyle}>
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: "1rem",
              padding: "0.6rem 1rem",
              background: "rgba(192,57,43,0.1)",
              border: "1px solid var(--error)",
              borderRadius: 6,
              color: "var(--error)",
              fontSize: "0.78rem",
              fontFamily: "var(--font-code)",
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slot for content before Instantiate (e.g. InteractiveExecutor) */}
      {renderBeforeInstantiate}

      {/* Instantiate form */}
      <div
        style={{
          marginTop: "1.5rem",
          background: "var(--bg-secondary)",
          border: "1px solid rgba(240,160,48,0.2)",
          borderRadius: 8,
          padding: "0.75rem",
        }}
      >
        <h4
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "0.8rem",
            color: "var(--success)",
            margin: "0 0 0.5rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Instantiate Object
        </h4>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          <input
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            placeholder="my_dog"
            style={inputStyle}
          />
          {classAttributes
            .filter((a) => !a.is_private)
            .map((attr) => (
              <div
                key={attr.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-code)",
                    minWidth: 60,
                  }}
                >
                  {attr.name}:
                </span>
                <input
                  value={attrValues[attr.name] ?? ""}
                  onChange={(e) =>
                    setAttrValues((prev) => ({
                      ...prev,
                      [attr.name]: e.target.value,
                    }))
                  }
                  placeholder={`${attr.type_hint} value`}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            ))}
          <button
            onClick={instantiate}
            disabled={loading || !instanceName.trim()}
            style={{
              ...btnStyle,
              background: "var(--success)",
              color: "var(--bg-primary)",
              borderColor: "var(--success)",
              fontWeight: 700,
              opacity: loading || !instanceName.trim() ? 0.5 : 1,
            }}
          >
            {loading ? "Creating..." : "Create Instance"}
          </button>
        </div>
      </div>

      {/* Instantiated Objects */}
      {objects.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              color: "var(--success)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Live Objects
          </h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {objects.map((obj, i) => (
              <ObjectBadge
                key={`${obj.instance_name}-${i}`}
                instanceName={obj.instance_name}
                className={obj.class_name}
                attributes={obj.attributes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
