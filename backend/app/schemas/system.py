from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ComponentStatus(BaseModel):
    name: str
    status: str
    latency_ms: Optional[float] = None
    details: Optional[str] = None

class SystemHealth(BaseModel):
    status: str
    components: List[ComponentStatus]

class SystemMetrics(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    events_per_sec: Optional[float] = 0.0
    processed_per_sec: Optional[float] = 0.0
    processing_latency: Optional[float] = 0.0
    max_latency: Optional[float] = 0.0
    consumer_lag: Optional[int] = 0
    total_stored: Optional[int] = 0
    failed_events: Optional[int] = 0
    hdfs_storage: Optional[str] = "1.4 GB"
    ws_clients: Optional[int] = 0

class KafkaStatus(BaseModel):
    connected: bool
    topics: List[str]
    consumer_lag: Dict[str, int]

class PipelineStatus(BaseModel):
    generator_active: bool
    events_processed_per_sec: float
    spark_streaming_active: bool
    kafka_connected: bool = False
