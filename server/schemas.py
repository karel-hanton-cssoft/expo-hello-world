from pydantic import BaseModel, Field
from typing import List, Optional

# Simple alias for identifier strings
ID = str

class User(BaseModel):
    id: ID

class TaskBase(BaseModel):
    id: ID
    title: str
    description: Optional[str] = None
    result: Optional[str] = None
    status: str
    authorId: ID
    assigneeId: Optional[ID] = None
    subtaskIds: List[ID] = Field(default_factory=list)
    parentId: Optional[ID] = None
    createdAt: str
    updatedAt: Optional[str] = None

class Task(TaskBase):
    users: Optional[List[User]] = None
    accessKey: Optional[str] = None

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    authorId: ID
    assigneeId: Optional[ID] = None
    parentId: Optional[ID] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    result: Optional[str] = None
    status: Optional[str] = None
    assigneeId: Optional[ID] = None
    subtaskIds: Optional[List[ID]] = None
