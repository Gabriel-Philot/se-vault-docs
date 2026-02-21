import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { Code2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface Method {
  id: string;
  name: string;
  code: string;
  responsibility: string;
}

const INITIAL_METHODS: Method[] = [
  { 
    id: "save_to_db", 
    name: "save_to_db()", 
    code: "def save_to_db(self):\n  db.execute('INSERT INTO users...')", 
    responsibility: "Persistence" 
  },
  { 
    id: "send_email", 
    name: "send_email()", 
    code: "def send_email(self):\n  smtp.send(self.email, 'Welcome!')", 
    responsibility: "Notification" 
  },
  { 
    id: "validate_age", 
    name: "validate_age()", 
    code: "def validate_age(self):\n  return self.age >= 18", 
    responsibility: "Validation" 
  },
];

interface DraggableMethodProps {
  method: Method;
  key?: React.Key;
}

const DraggableMethod = ({ method }: DraggableMethodProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: method.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-3 mb-2 rounded-lg bg-code border border-white/10 cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-50 scale-105 z-50 shadow-xl border-srp/50"
      )}
    >
      <div className="flex items-center gap-2">
        <Code2 className="w-4 h-4 text-srp" />
        <span className="font-mono text-xs">{method.name}</span>
      </div>
    </div>
  );
};

const DroppableTarget = ({
  id,
  label,
  method,
  wrongDropId,
}: {
  id: string;
  label: string;
  method: Method | null;
  wrongDropId: string | null;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <motion.div
      ref={setNodeRef}
      animate={wrongDropId === id ? { x: [-8, 8, -8, 8, 0], backgroundColor: ['rgba(239,68,68,0.2)', 'rgba(255,255,255,0.05)'] } : {}}
      transition={{ duration: 0.5 }}
      className={cn(
        "h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all",
        isOver ? "border-srp bg-srp/10 scale-105" : "border-white/10 bg-white/5",
        method && "border-solid border-srp/30 bg-srp/5"
      )}
    >
      <span className="text-[10px] uppercase tracking-widest text-white/40 mb-2">{label}</span>
      {method ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full"
        >
          <div className="p-2 rounded bg-code border border-srp/20 text-center">
            <span className="font-mono text-xs text-srp">{method.name}</span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            Correto
          </div>
        </motion.div>
      ) : (
        <div className="text-white/20 text-xs text-center">Solte a lógica de {label} aqui</div>
      )}
    </motion.div>
  );
};

export const SRPSection = () => {
  const [methods, setMethods] = useState<Method[]>(INITIAL_METHODS);
  const [targets, setTargets] = useState<Record<string, Method | null>>({
    Persistence: null,
    Notification: null,
    Validation: null,
  });
  const [wrongDropId, setWrongDropId] = useState<string | null>(null);
  const [showEtl, setShowEtl] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active) {
      const methodId = active.id as string;
      const targetId = over.id as string;
      const method = methods.find(m => m.id === methodId);

      if (method && method.responsibility === targetId) {
        setTargets(prev => ({ ...prev, [targetId]: method }));
        setMethods(prev => prev.filter(m => m.id !== methodId));
      } else {
        setWrongDropId(targetId);
        setTimeout(() => setWrongDropId(null), 600);
      }
    }
  };

  return (
    <section id="srp" className="min-h-screen py-24 px-6 max-w-7xl mx-auto">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: God Class */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-srp/10 border border-srp/20">
                <AlertTriangle className="w-4 h-4 text-srp" />
                <span className="text-xs font-bold text-srp uppercase tracking-wider">Single Responsibility Principle</span>
              </div>
              <h2 className="text-5xl font-bold font-display leading-tight">
                Single <span className="text-srp">Responsibility</span>
              </h2>
              <p className="text-white/40 text-sm font-mono -mt-2">Responsabilidade Única</p>
              <p className="text-white/60 max-w-md">
                A classe <code className="text-srp">User</code> está fazendo coisas demais. Ela cuida da própria persistência, notificações e validação. Arraste os métodos 'cheirosos' para suas classes especializadas.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Code2 className="w-32 h-32" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <span className="ml-2 text-xs font-mono text-white/40">User.py</span>
              </div>
              <div className="code-block min-h-[300px]">
                <div className="text-blue-400">class <span className="text-yellow-400">User</span>:</div>
                <div className="pl-4 text-white/40">def __init__(self, name, email, age):</div>
                <div className="pl-8 text-white/40">self.name = name</div>
                <div className="pl-8 text-white/40">self.email = email</div>
                <div className="pl-8 text-white/40">self.age = age</div>
                
                <div className="mt-6 space-y-2">
                  <AnimatePresence>
                    {methods.map((method) => (
                      <DraggableMethod key={method.id} method={method} />
                    ))}
                  </AnimatePresence>
                  {methods.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-8 text-center text-green-400 font-mono text-sm"
                    >
                      # Classe limpa!
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setShowEtl(!showEtl)}
                className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
              >
                <span>{showEtl ? '▼' : '▶'}</span> Versão ETL (Pipeline de dados)
              </button>
              {showEtl && (
                <div className="glass rounded-xl p-4 border-srp/10 code-block text-xs">
                  <div className="text-white/40 mb-2"># Antes: EtlPipeline faz tudo</div>
                  <div className="text-blue-400">class <span className="text-yellow-400">EtlPipeline</span>:</div>
                  <div className="pl-4 text-white/60">def transform_tax(self, row): ...</div>
                  <div className="pl-4 text-white/60">def validate_row(self, row): ...</div>
                  <div className="pl-4 text-white/60">def send_alert(self, msg): ...</div>
                  <div className="mt-3 text-white/40"># Depois: responsabilidades separadas</div>
                  <div className="text-blue-400">class <span className="text-yellow-400">TaxTransformer</span>: ...</div>
                  <div className="text-blue-400">class <span className="text-yellow-400">RowValidator</span>: ...</div>
                  <div className="text-blue-400">class <span className="text-yellow-400">AlertNotifier</span>: ...</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Specialized Classes */}
          <div className="grid grid-cols-1 gap-6">
            <DroppableTarget id="Persistence" label="UserRepository" method={targets.Persistence} wrongDropId={wrongDropId} />
            <DroppableTarget id="Notification" label="EmailService" method={targets.Notification} wrongDropId={wrongDropId} />
            <DroppableTarget id="Validation" label="UserValidator" method={targets.Validation} wrongDropId={wrongDropId} />
          </div>
        </div>
      </DndContext>
    </section>
  );
};
