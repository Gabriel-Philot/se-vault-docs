// ── Panel & Status Types ──
export type PanelId = "bytes" | "shell" | "compiler" | "memory";
export type SSEStatus = "idle" | "streaming" | "done" | "error";
export type TraceLanguage = "c" | "python";

// ── Bytes Models ──
export interface BytesCompareRequest {
  value: string;
  type: string;
}

export interface TypeSizeDetail {
  base_size: number;
  overhead: string;
  components: string[];
}

export interface BytesCompareResponse {
  c_size: number;
  py_size: number;
  c_type: string;
  py_type: string;
  details: Record<string, TypeSizeDetail>;
}

export interface BytesEncodeRequest {
  text: string;
  encoding: string;
}

export interface BytesEncodeResponse {
  bytes_list: number[];
  binary: string[];
  hex: string[];
  total_bytes: number;
}

// ── Shell Models ──
export interface ShellExecRequest {
  command: string;
  user: string;
}

export interface ShellEvent {
  stream: string;
  data: string;
  step: number;
  pipe_stage: number | null;
  cwd?: string | null;
}

export interface FilesystemNode {
  name: string;
  type: string;
  permissions: string;
  owner: string;
  group: string;
  children: FilesystemNode[] | null;
  content: string | null;
}

export interface FilesystemResponse {
  tree: FilesystemNode;
  users: string[];
}

export interface SwitchUserRequest {
  user: string;
}

export interface SwitchUserResponse {
  user: string;
  home: string;
  env: Record<string, string>;
}

// ── Compiler Models ──
export interface CompileCRequest {
  code: string;
  optimization: string;
}

export interface CompileStage {
  name: string;
  status: string;
  output_preview: string | null;
  time_ms: number;
  object_size: number | null;
  binary_size: number | null;
}

export interface CompileCResponse {
  stages: CompileStage[];
  output: string;
  exec_time_ms: number;
  compile_time_ms: number;
  binary_size: number;
  peak_rss_kb: number | null;
}

export interface InterpretPythonRequest {
  code: string;
}

export interface Opcode {
  offset: number;
  opname: string;
  arg: number | null;
  argval: string | null;
  line: number | null;
}

export interface InterpretPythonResponse {
  bytecode_raw: string;
  opcodes: Opcode[];
  output: string;
  exec_time_ms: number;
  pyc_size: number;
  peak_rss_kb: number | null;
  error: string | null;
}

// ── Memory Models ──
export interface MemoryTraceRequest {
  code: string;
}

export interface MemoryTraceResponse {
  session_id: string;
  total_steps: number;
}

export interface StackVariable {
  name: string;
  type: string;
  value: string;
  points_to_heap: boolean;
}

export interface StackFrame {
  function: string;
  variables: StackVariable[];
  return_addr: string;
}

export interface HeapBlock {
  address: string;
  size: number;
  type: string;
  status: string;
  allocated_by: string;
}

export interface StepResponse {
  step: number;
  line: number;
  action: string;
  description: string;
  stack: StackFrame[];
  heap: HeapBlock[];
  refcounts: Record<string, number> | null;
}
