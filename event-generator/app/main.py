import asyncio
import time
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from app.generator import EventGenerator
from app.scenarios import AttackScenarioManager
from app.kafka_producer import KafkaEventProducer

app = FastAPI(title="CyberStream Event Generator")

class RateConfig(BaseModel):
    rate: int

class GeneratorState:
    def __init__(self):
        self.status = "stopped"
        self.rate = 100
        self.total_generated = 0
        self.start_time = None
        self.generator = EventGenerator()
        self.scenario_manager = AttackScenarioManager()
        self.kafka_producer = KafkaEventProducer()
        self.demo_mode = False
        self.scenario_queue = []

state = GeneratorState()

async def generate_events_loop():
    while True:
        if state.status != "running":
            await asyncio.sleep(0.1)
            continue
            
        start_t = time.time()
        
        events_to_publish = []
        
        # Check scenario queue
        if state.scenario_queue:
            scenario_name = state.scenario_queue.pop(0)
            events_to_publish.extend(state.scenario_manager.generate_scenario_events(scenario_name))
            
        # Demo mode logic - periodically trigger scenarios
        if state.demo_mode and random.random() < 0.01: # 1% chance per iteration
            scenarios = ['brute_force', 'credential_stuffing', 'ddos', 'port_scan', 
                         'server_error_spike', 'dns_attack', 'database_violation', 'excessive_access_denied']
            scenario_name = random.choice(scenarios)
            events_to_publish.extend(state.scenario_manager.generate_scenario_events(scenario_name))
            
        # Normal events to make up the rate
        normal_count = state.rate - len(events_to_publish)
        if normal_count > 0:
            for _ in range(normal_count):
                events_to_publish.append(state.generator.generate_event())
                
        state.total_generated += len(events_to_publish)
        state.kafka_producer.publish_events(events_to_publish)
        
        elapsed = time.time() - start_t
        sleep_time = max(0, 1.0 - elapsed)
        await asyncio.sleep(sleep_time)

import random

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(generate_events_loop())

@app.post("/control/start")
def start_generator():
    state.status = "running"
    if not state.start_time:
        state.start_time = time.time()
    return {"message": "Started"}

@app.post("/control/stop")
def stop_generator():
    state.status = "stopped"
    state.demo_mode = False
    return {"message": "Stopped"}

@app.post("/control/pause")
def pause_generator():
    state.status = "paused"
    return {"message": "Paused"}

@app.post("/control/resume")
def resume_generator():
    state.status = "running"
    return {"message": "Resumed"}

@app.post("/control/rate")
def set_rate(config: RateConfig):
    if config.rate in [10, 50, 100, 500, 1000]:
        state.rate = config.rate
        return {"message": f"Rate set to {state.rate}"}
    return {"error": "Invalid rate"}, 400

@app.get("/control/status")
def get_status():
    uptime = int(time.time() - state.start_time) if state.start_time else 0
    return {
        "status": state.status,
        "rate": state.rate,
        "total_generated": state.total_generated,
        "total_published": state.kafka_producer.total_published,
        "total_failed": state.kafka_producer.total_failed,
        "uptime_seconds": uptime,
        "kafka_connected": state.kafka_producer.producer is not None,
        "current_scenario": state.scenario_manager.current_scenario,
        "scenarios_triggered": state.scenario_manager.scenarios_triggered
    }

class ScenarioConfig(BaseModel):
    scenario: str

@app.post("/control/scenario")
def trigger_scenario(config: ScenarioConfig):
    valid_scenarios = ['brute_force', 'credential_stuffing', 'ddos', 'port_scan', 
                         'server_error_spike', 'dns_attack', 'database_violation', 'excessive_access_denied']
    if config.scenario in valid_scenarios:
        state.scenario_queue.append(config.scenario)
        return {"message": f"Scenario {config.scenario} queued"}
    return {"error": "Invalid scenario"}, 400

@app.post("/control/demo")
def start_demo():
    state.demo_mode = True
    state.status = "running"
    if not state.start_time:
        state.start_time = time.time()
    return {"message": "Demo mode started"}
