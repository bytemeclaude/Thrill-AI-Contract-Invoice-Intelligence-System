from sqlalchemy import Column, Integer, String, DateTime, Enum as SqlEnum, JSON, Boolean
from datetime import datetime
import enum
from shared.database import Base

class DocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    REVIEW_NEEDED = "REVIEW_NEEDED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    s3_key = Column(String, unique=True, index=True)
    status = Column(SqlEnum(DocumentStatus), default=DocumentStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    extraction_result = Column(JSON, nullable=True)

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer) # ForeignKey('documents.id') - simplified for MVP
    related_document_id = Column(Integer, nullable=True) # E.g. Contract ID
    finding_type = Column(String)
    severity = Column(String)
    description = Column(String)
    evidence = Column(JSON, nullable=True)
    status = Column(String, default="open") # open, reviewed, overridden
    created_at = Column(DateTime, default=datetime.utcnow)

class ReviewDecision(Base):
    __tablename__ = "review_decisions"
    
    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(Integer, index=True)
    decision = Column(String) # APPROVE, OVERRIDE
    comment = Column(String, nullable=True)
    user_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    AP = "ap"
    LEGAL = "legal"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(SqlEnum(UserRole), default=UserRole.AP)
    is_active = Column(Boolean, default=True)
