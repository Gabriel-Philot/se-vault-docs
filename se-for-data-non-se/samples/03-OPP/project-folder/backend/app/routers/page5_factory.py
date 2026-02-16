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


def _generate_pipeline_code(stages: list[PipelineStage]) -> str:
    """Generate Python code showing the pipeline assembly."""
    lines: list[str] = ["# Pipeline assembly using Factory pattern", ""]

    for i, stage in enumerate(stages):
        config_args = ", ".join(f'{k}="{v}"' for k, v in stage.config.items())
        var_name = f"stage_{i}"
        lines.append(f'{var_name} = {stage.class_name}({config_args})  # {stage.stage_type}')

    lines.append("")
    stage_vars = ", ".join(f"stage_{i}" for i in range(len(stages)))
    lines.append(f"pipeline = Pipeline([{stage_vars}])")
    lines.append("pipeline.run()")

    return "\n".join(lines)


@router.post("/build", response_model=BuildPipelineResponse)
def build_pipeline(req: BuildPipelineRequest):
    if not req.stages:
        raise HTTPException(status_code=400, detail="Pipeline must have at least one stage.")

    pipeline_id = str(uuid.uuid4())
    _pipelines[pipeline_id] = list(req.stages)
    python_code = _generate_pipeline_code(req.stages)

    return BuildPipelineResponse(
        pipeline_id=pipeline_id,
        python_code=python_code,
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
    python_code = _generate_pipeline_code(stages)

    return BuildPipelineResponse(
        pipeline_id=req.pipeline_id,
        python_code=python_code,
        message=f"Swapped stage {req.stage_index}: {old_name} → {req.new_stage.class_name}. Pipeline still works!",
    )
