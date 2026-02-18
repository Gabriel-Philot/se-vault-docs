from pydantic import BaseModel, Field


class CreateOrderRequest(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)
    user_id: str
    country: str
    channel: str


class PipelineConfigRequest(BaseModel):
    route_threshold: float = Field(gt=0)
