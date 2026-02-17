from pydantic import BaseModel


class PipelineStage(BaseModel):
    stage_type: str  # "source", "transform", "sink"
    class_name: str
    config: dict[str, str] = {}


class BuildPipelineRequest(BaseModel):
    stages: list[PipelineStage]


class BuildPipelineResponse(BaseModel):
    pipeline_id: str
    factory_code: str
    python_code: str
    raw_code: str
    message: str


class SwapStageRequest(BaseModel):
    pipeline_id: str
    stage_index: int
    new_stage: PipelineStage


class PipelineEvent(BaseModel):
    stage_index: int
    stage_class: str
    event_type: str  # "start", "processing", "result", "error"
    message: str
    data: str | None = None
