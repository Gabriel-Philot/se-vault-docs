import asyncio
import json
import uuid

from fastapi import APIRouter, HTTPException, Request
from app.models.page5_factory import (
    PipelineStage,
    BuildPipelineRequest,
    BuildPipelineResponse,
    SwapStageRequest,
    PipelineEvent,
)
from app.sse.stream import sse_response

router = APIRouter()

# pipeline_id -> list[PipelineStage]
_pipelines: dict[str, list[PipelineStage]] = {}

# Simulated output per stage class — data "flows" through the pipeline
# Real method bodies — show what each class DOES differently in process()
_STAGE_BODIES: dict[str, str] = {
    "CsvSource":          "return list(csv.DictReader(open(self.path)))",
    "ParquetSource":      "return pq.read_table(self.path).to_pydict()",
    "ApiSource":          "return requests.get(self.url).json()",
    "FilterTransform":    "return [r for r in data if r[self.column] > self.value]",
    "MapTransform":       "return [{**r, self.column: self.fn(r[self.column])} for r in data]",
    "AggregateTransform": "return {self.fn: sum(r.values()) / len(data) for r in data}",
    "ConsoleSink":        "print(data); return data",
    "FileSink":           "open(self.path, 'w').write(str(data)); return data",
    "DatabaseSink":       "db.execute(f'INSERT INTO {self.table} ...', data); return data",
}

# Simulated output per stage class — data "flows" through the pipeline
_STAGE_OUTPUT: dict[str, str] = {
    "CsvSource": '[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]',
    "ParquetSource": '{"id": [1, 2], "value": [10.5, 20.3]}',
    "ApiSource": '{"results": [{"metric": "cpu", "value": 72.5}]}',
    "FilterTransform": '[{"id": 1, "name": "Alice"}]  # filtered rows',
    "MapTransform": '[{"id": 1, "name": "ALICE"}, {"id": 2, "name": "BOB"}]  # mapped',
    "AggregateTransform": '{"count": 2, "mean_value": 15.4}  # aggregated',
    "ConsoleSink": "Output printed to console",
    "FileSink": "Data written to output.csv",
    "DatabaseSink": "2 rows inserted into table 'results'",
}


@router.post("/reset")
def reset_pipelines():
    _pipelines.clear()
    return {"message": "All pipelines cleared."}


def _generate_pipeline_code(stages: list[PipelineStage]) -> tuple[str, str, str]:
    """Generate factory definitions, factory usage, and raw code."""
    # --- Factory definitions (class hierarchy + factory function) ---
    def_lines: list[str] = [
        "# Hierarquia de Classes + Factory Pattern",
        "",
        "from abc import ABC, abstractmethod",
        "",
        "class PipelineStage(ABC):",
        "    @abstractmethod",
        "    def process(self, data): ...",
        "",
        "class Source(PipelineStage): ...",
        "class Transform(PipelineStage): ...",
        "class Sink(PipelineStage): ...",
        "",
    ]

    seen_types: set[str] = set()
    for stage in stages:
        if stage.class_name not in seen_types:
            seen_types.add(stage.class_name)
            parent = {"source": "Source", "transform": "Transform", "sink": "Sink"}.get(stage.stage_type, "PipelineStage")
            config_params = ", ".join(f"{k}: str" for k in stage.config)
            def_lines.append(f"class {stage.class_name}({parent}):")
            if stage.config:
                def_lines.append(f"    def __init__(self, {config_params}):")
                for k in stage.config:
                    def_lines.append(f"        self.{k} = {k}")
            body = _STAGE_BODIES.get(stage.class_name, f"...  # {stage.class_name}")
            def_lines.append(f"    def process(self, data=None):")
            def_lines.append(f'        {body}')
            def_lines.append("")

    def_lines.extend([
        "# Factory cria qualquer stage pelo nome",
        "REGISTRY = {",
    ])
    for name in seen_types:
        def_lines.append(f'    "{name}": {name},')
    def_lines.extend([
        "}",
        "",
        "def create_stage(name, **cfg) -> PipelineStage:",
        "    return REGISTRY[name](**cfg)",
    ])

    factory_code = "\n".join(def_lines)

    # --- Factory usage (clean, polymorphic) ---
    usage_lines: list[str] = [
        "# Com Factory + Polimorfismo",
        "# Pipeline nao sabe qual classe concreta eh",
        "",
    ]
    stage_creates: list[str] = []
    for stage in stages:
        cfg_str = ", ".join(f'{k}="{v}"' for k, v in stage.config.items())
        stage_creates.append(f'create_stage("{stage.class_name}", {cfg_str})')

    usage_lines.append("stages = [")
    for sc in stage_creates:
        usage_lines.append(f"    {sc},")
    usage_lines.append("]")
    usage_lines.append("")
    usage_lines.append("data = None")
    usage_lines.append("for stage in stages:")
    usage_lines.append("    data = stage.process(data)  # polimorfismo!")
    usage_lines.append("")
    usage_lines.append("# Trocar CsvSource por ApiSource?")
    usage_lines.append("# Basta mudar o nome na factory — o loop nao muda!")

    python_code = "\n".join(usage_lines)

    # --- Raw code (sem factory, sem polimorfismo) ---
    raw_lines: list[str] = [
        "# Sem Factory / Sem Polimorfismo",
        "# Codigo acoplado — cada novo tipo exige mudanca",
        "",
        "def run_pipeline(stages_config):",
        "    data = None",
        "    for stage_cfg in stages_config:",
    ]

    for i, stage in enumerate(stages):
        prefix = "if" if i == 0 else "elif"
        raw_lines.append(f'        {prefix} stage_cfg["type"] == "{stage.class_name}":')
        if stage.stage_type == "source":
            cfg_key = next(iter(stage.config), "path")
            raw_lines.append(f'            data = open(stage_cfg["{cfg_key}"]).read()')
        elif stage.stage_type == "transform":
            raw_lines.append(f'            data = transform_{stage.class_name.lower()}(data)')
        else:
            cfg_key = next(iter(stage.config), "target")
            raw_lines.append(f'            save_to_{stage.class_name.lower()}(data, stage_cfg)')

    raw_lines.extend([
        '        # ... mais elif para CADA classe nova',
        "",
        f"# Trocar {stages[0].class_name} por outro? Precisa mexer aqui dentro!",
        "# Adicionar novo tipo? Mais um elif...",
    ])

    raw_code = "\n".join(raw_lines)

    return factory_code, python_code, raw_code


@router.post("/build", response_model=BuildPipelineResponse)
def build_pipeline(req: BuildPipelineRequest):
    if not req.stages:
        raise HTTPException(status_code=400, detail="Pipeline must have at least one stage.")

    pipeline_id = str(uuid.uuid4())
    _pipelines[pipeline_id] = list(req.stages)
    factory_code, python_code, raw_code = _generate_pipeline_code(req.stages)

    return BuildPipelineResponse(
        pipeline_id=pipeline_id,
        factory_code=factory_code,
        python_code=python_code,
        raw_code=raw_code,
        message=f"Pipeline built with {len(req.stages)} stage(s).",
    )


@router.post("/run")
async def run_pipeline(pipeline_id: str, request: Request):
    """SSE endpoint — streams PipelineEvent stage by stage."""
    if pipeline_id not in _pipelines:
        raise HTTPException(status_code=404, detail=f"Pipeline '{pipeline_id}' not found.")

    stages = _pipelines[pipeline_id]

    async def event_stream():
        for i, stage in enumerate(stages):
            # start
            yield {
                "event": "start",
                "data": json.dumps(
                    PipelineEvent(
                        stage_index=i,
                        stage_class=stage.class_name,
                        event_type="start",
                        message=f"Stage {i}: {stage.class_name}.run() started",
                    ).model_dump()
                ),
            }
            await asyncio.sleep(0.3)

            # processing
            yield {
                "event": "processing",
                "data": json.dumps(
                    PipelineEvent(
                        stage_index=i,
                        stage_class=stage.class_name,
                        event_type="processing",
                        message=f"Stage {i}: {stage.class_name} processing data...",
                    ).model_dump()
                ),
            }
            await asyncio.sleep(0.5)

            # result
            output = _STAGE_OUTPUT.get(stage.class_name, f"{stage.class_name} completed")
            yield {
                "event": "result",
                "data": json.dumps(
                    PipelineEvent(
                        stage_index=i,
                        stage_class=stage.class_name,
                        event_type="result",
                        message=f"Stage {i}: {stage.class_name} done",
                        data=output,
                    ).model_dump()
                ),
            }
            await asyncio.sleep(0.2)

    return sse_response(event_stream())


@router.post("/swap", response_model=BuildPipelineResponse)
def swap_stage(req: SwapStageRequest):
    if req.pipeline_id not in _pipelines:
        raise HTTPException(status_code=404, detail=f"Pipeline '{req.pipeline_id}' not found.")

    stages = _pipelines[req.pipeline_id]

    if req.stage_index < 0 or req.stage_index >= len(stages):
        raise HTTPException(
            status_code=400,
            detail=f"Stage index {req.stage_index} out of range (0-{len(stages) - 1}).",
        )

    old_name = stages[req.stage_index].class_name
    stages[req.stage_index] = req.new_stage
    factory_code, python_code, raw_code = _generate_pipeline_code(stages)

    return BuildPipelineResponse(
        pipeline_id=req.pipeline_id,
        factory_code=factory_code,
        python_code=python_code,
        raw_code=raw_code,
        message=f"Swapped stage {req.stage_index}: {old_name} \u2192 {req.new_stage.class_name}. Funciona porque ambos implementam PipelineStage.process()!",
    )
