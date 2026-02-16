import { useState, useCallback } from "react";
import FamilyTree from "@/components/page2/FamilyTree";
import CodeTerminal from "@/components/layout/CodeTerminal";

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

export default function Page2Inheritance() {
  const [code, setCode] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Child creation form
  const [childName, setChildName] = useState("");
  const [parentName, setParentName] = useState("");
  const [ownAttrs, setOwnAttrs] = useState<
    { name: string; type_hint: string; is_private: boolean }[]
  >([]);
  const [ownMethods, setOwnMethods] = useState<
    { name: string; params: string[]; body: string }[]
  >([]);
  const [overriddenMethods, setOverriddenMethods] = useState<
    { name: string; params: string[]; body: string }[]
  >([]);

  // Temp form fields
  const [attrName, setAttrName] = useState("");
  const [attrType, setAttrType] = useState("str");
  const [attrPrivate, setAttrPrivate] = useState(false);
  const [methName, setMethName] = useState("");
  const [methParams, setMethParams] = useState("");
  const [methBody, setMethBody] = useState("");
  const [isOverride, setIsOverride] = useState(false);

  const onSelectClass = useCallback(async (name: string) => {
    try {
      const res = await fetch(`/api/inheritance/${name}/resolved`);
      if (!res.ok) return;
      const data = await res.json();
      setCode(data.python_code);
    } catch {
      // ignore
    }
  }, []);

  const addAttr = () => {
    if (!attrName.trim()) return;
    setOwnAttrs((prev) => [
      ...prev,
      { name: attrName.trim(), type_hint: attrType, is_private: attrPrivate },
    ]);
    setAttrName("");
    setAttrPrivate(false);
  };

  const addMethod = () => {
    if (!methName.trim()) return;
    const params = methParams
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const m = { name: methName.trim(), params, body: methBody || "pass" };
    if (isOverride) {
      setOverriddenMethods((prev) => [...prev, m]);
    } else {
      setOwnMethods((prev) => [...prev, m]);
    }
    setMethName("");
    setMethParams("");
    setMethBody("");
    setIsOverride(false);
  };

  const createChild = async () => {
    if (!childName.trim() || !parentName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inheritance/create-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_name: childName,
          parent_name: parentName,
          own_attributes: ownAttrs,
          own_methods: ownMethods,
          overridden_methods: overriddenMethods,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCode(data.python_code);
      setRefreshKey((k) => k + 1);
      setChildName("");
      setParentName("");
      setOwnAttrs([]);
      setOwnMethods([]);
      setOverriddenMethods([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create child");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.6rem",
            fontWeight: 700,
            color: "var(--accent-spice)",
            margin: 0,
          }}
        >
          Family Tree
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.82rem",
            marginTop: "0.3rem",
          }}
        >
          Visualize class inheritance. Click a node to see its resolved code.
        </p>
      </div>

      {/* Tree visualization */}
      <FamilyTree onSelectClass={onSelectClass} refreshKey={refreshKey} />

      {/* Create child form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1rem",
        }}
      >
        {/* Basic info */}
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
            Create Child Class
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            <input
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Parent class name"
              style={inputStyle}
            />
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Child class name"
              style={inputStyle}
            />

            {/* Listed own attrs */}
            {ownAttrs.map((a, i) => (
              <div
                key={i}
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-code)",
                  color: "var(--text-secondary)",
                  padding: "0.2rem 0.4rem",
                  background: "rgba(45,125,210,0.06)",
                  borderRadius: 3,
                }}
              >
                {a.is_private ? "🔒 " : "🔓 "}
                {a.name}: {a.type_hint}
              </div>
            ))}
            {ownMethods.map((m, i) => (
              <div
                key={`m-${i}`}
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-code)",
                  color: "var(--accent-spice)",
                  padding: "0.2rem 0.4rem",
                  background: "rgba(232,114,42,0.06)",
                  borderRadius: 3,
                }}
              >
                <span style={{ fontSize: "0.6rem" }}>Proprio</span> ƒ{" "}
                {m.name}()
              </div>
            ))}
            {overriddenMethods.map((m, i) => (
              <div
                key={`o-${i}`}
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-code)",
                  color: "var(--success)",
                  padding: "0.2rem 0.4rem",
                  background: "rgba(240,160,48,0.06)",
                  borderRadius: 3,
                }}
              >
                <span style={{ fontSize: "0.6rem" }}>Override</span> ƒ{" "}
                {m.name}()
              </div>
            ))}

            <button
              onClick={createChild}
              disabled={loading || !childName.trim() || !parentName.trim()}
              style={{
                ...btnStyle,
                background: "var(--accent-spice)",
                color: "var(--bg-primary)",
                fontWeight: 700,
                opacity:
                  loading || !childName.trim() || !parentName.trim() ? 0.5 : 1,
                marginTop: "0.3rem",
              }}
            >
              {loading ? "Creating..." : "Create Child"}
            </button>
          </div>
        </div>

        {/* Add Attribute */}
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
            + Own Attribute
          </h4>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            <input
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              placeholder="name"
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && addAttr()}
            />
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <select
                value={attrType}
                onChange={(e) => setAttrType(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                {["str", "int", "float", "bool", "list"].map((t) => (
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
                  checked={attrPrivate}
                  onChange={(e) => setAttrPrivate(e.target.checked)}
                />
                Private
              </label>
            </div>
            <button onClick={addAttr} style={btnStyle}>
              Add
            </button>
          </div>
        </div>

        {/* Add Method */}
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
              value={methName}
              onChange={(e) => setMethName(e.target.value)}
              placeholder="method_name"
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && addMethod()}
            />
            <input
              value={methParams}
              onChange={(e) => setMethParams(e.target.value)}
              placeholder="param1, param2"
              style={inputStyle}
            />
            <input
              value={methBody}
              onChange={(e) => setMethBody(e.target.value)}
              placeholder="print('hello')"
              style={inputStyle}
            />
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
                checked={isOverride}
                onChange={(e) => setIsOverride(e.target.checked)}
              />
              Override parent method
            </label>
            <button onClick={addMethod} style={btnStyle}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
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
        </div>
      )}

      {/* Code terminal */}
      <CodeTerminal code={code} title="Inheritance Code" />
    </div>
  );
}
