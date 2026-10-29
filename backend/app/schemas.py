from pydantic import BaseModel, Field
from typing import List

class PreferencesIn(BaseModel):
    preferences: List[str] = Field(default_factory=list)

class PurchaseIn(BaseModel):
    user_id: str = "demo-user"
    product_id: str
    quantity: int = Field(default=1, ge=1, le=100)
