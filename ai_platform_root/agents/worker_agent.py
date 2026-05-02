"""
Worker Agent - Heavy coding, DAG execution, tech-stack generation
Uses Aliyun Qwen-Max for production-grade code generation
"""

import asyncio
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass
import aiohttp
import subprocess
import tempfile
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class CodeGenerationResult:
    """Result of code generation"""
    code_content: str
    language: str
    files_generated: List[str]
    dependencies: List[str]
    build_commands: List[str]
    test_commands: List[str]
    confidence_score: float
    execution_time: float
    timestamp: datetime

@dataclass
class DAGExecutionResult:
    """Result of DAG execution"""
    dag_id: str
    tasks_completed: int
    tasks_failed: int
    total_execution_time: float
    confidence_scores: List[float]
    output_files: List[str]
    logs: List[str]
    timestamp: datetime

class WorkerAgent:
    """Worker agent for heavy coding and DAG execution"""
    
    def __init__(self, agent_id: str = "worker_001"):
        self.agent_id = agent_id
        self.task_count = 0
        self.success_count = 0
        self.code_generated = 0
        self.dags_executed = 0
        
        # Tech stack configurations
        self.supported_tech_stacks = {
            "web_backend": {
                "languages": ["python", "nodejs", "go"],
                "frameworks": ["fastapi", "express", "gin"],
                "databases": ["postgresql", "mongodb", "redis"],
                "deployment": ["docker", "kubernetes", "serverless"]
            },
            "data_pipeline": {
                "languages": ["python", "scala"],
                "frameworks": ["apache-spark", "apache-flink", "apache-beam"],
                "storage": ["s3", "hdfs", "bigquery"],
                "orchestration": ["airflow", "prefect", "dagster"]
            },
            "ai_ml": {
                "languages": ["python"],
                "frameworks": ["pytorch", "tensorflow", "scikit-learn"],
                "libraries": ["transformers", "langchain", "llama-index"],
                "deployment": ["torchserve", "triton", "sagemaker"]
            }
        }
        
        logger.info(f"Worker Agent {agent_id} initialized")
    
    async def generate_code(self, 
                          requirements: Dict[str, Any],
                          tech_stack: str = "web_backend") -> CodeGenerationResult:
        """Generate production code based on requirements"""
        self.task_count += 1
        start_time = datetime.now()
        
        try:
            logger.info(f"Generating code for {tech_stack} with requirements: {requirements}")
            
            # Determine tech stack components
            stack_config = self.supported_tech_stacks.get(tech_stack, {})
            
            # Generate code based on requirements
            code_content, files = await self._generate_code_content(requirements, stack_config)
            
            # Determine dependencies
            dependencies = self._determine_dependencies(stack_config)
            
            # Generate build and test commands
            build_commands = self._generate_build_commands(stack_config)
            test_commands = self._generate_test_commands(stack_config)
            
            # Calculate confidence score
            confidence = self._calculate_code_confidence(code_content, requirements)
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            result = CodeGenerationResult(
                code_content=code_content,
                language=stack_config.get("languages", ["python"])[0],
                files_generated=files,
                dependencies=dependencies,
                build_commands=build_commands,
                test_commands=test_commands,
                confidence_score=confidence,
                execution_time=execution_time,
                timestamp=datetime.now()
            )
            
            self.success_count += 1
            self.code_generated += len(files)
            logger.info(f"Code generated successfully: {len(files)} files, confidence={confidence:.2%}")
            
            return result
            
        except Exception as e:
            logger.error(f"Code generation failed: {e}")
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return CodeGenerationResult(
                code_content="",
                language="",
                files_generated=[],
                dependencies=[],
                build_commands=[],
                test_commands=[],
                confidence_score=0.0,
                execution_time=execution_time,
                timestamp=datetime.now()
            )
    
    async def execute_dag(self, 
                         dag_definition: Dict[str, Any],
                         execution_context: Dict[str, Any]) -> DAGExecutionResult:
        """Execute a DAG of tasks"""
        self.task_count += 1
        start_time = datetime.now()
        
        try:
            logger.info(f"Executing DAG: {dag_definition.get('id', 'unknown')}")
            
            # Parse DAG definition
            tasks = dag_definition.get("tasks", [])
            dependencies = dag_definition.get("dependencies", {})
            
            # Execute tasks in order respecting dependencies
            results = await self._execute_tasks(tasks, dependencies, execution_context)
            
            # Collect results
            completed_tasks = [r for r in results if r["status"] == "completed"]
            failed_tasks = [r for r in results if r["status"] == "failed"]
            confidence_scores = [r.get("confidence", 0.0) for r in completed_tasks]
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            result = DAGExecutionResult(
                dag_id=dag_definition.get("id", "unknown"),
                tasks_completed=len(completed_tasks),
                tasks_failed=len(failed_tasks),
                total_execution_time=execution_time,
                confidence_scores=confidence_scores,
                output_files=self._collect_output_files(results),
                logs=self._collect_execution_logs(results),
                timestamp=datetime.now()
            )
            
            self.success_count += 1
            self.dags_executed += 1
            logger.info(f"DAG execution completed: {len(completed_tasks)}/{len(tasks)} tasks")
            
            return result
            
        except Exception as e:
            logger.error(f"DAG execution failed: {e}")
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return DAGExecutionResult(
                dag_id=dag_definition.get("id", "unknown"),
                tasks_completed=0,
                tasks_failed=0,
                total_execution_time=execution_time,
                confidence_scores=[],
                output_files=[],
                logs=[f"Execution failed: {str(e)}"],
                timestamp=datetime.now()
            )
    
    async def generate_tech_stack(self,
                                requirements: Dict[str, Any],
                                constraints: Dict[str, Any]) -> Dict[str, Any]:
        """Generate complete technology stack"""
        logger.info(f"Generating tech stack for requirements: {requirements}")
        
        # Analyze requirements
        stack_type = self._determine_stack_type(requirements)
        stack_config = self.supported_tech_stacks.get(stack_type, {})
        
        # Apply constraints
        constrained_config = self._apply_constraints(stack_config, constraints)
        
        # Generate stack specification
        stack_spec = {
            "stack_type": stack_type,
            "components": constrained_config,
            "architecture": self._generate_architecture(constrained_config),
            "deployment": self._generate_deployment_spec(constrained_config),
            "monitoring": self._generate_monitoring_spec(constrained_config),
            "scaling": self._generate_scaling_spec(constrained_config, requirements),
            "estimated_cost": self._estimate_cost(constrained_config, requirements),
            "generated_at": datetime.now().isoformat()
        }
        
        return stack_spec
    
    async def deploy_application(self,
                               code_result: CodeGenerationResult,
                               stack_spec: Dict[str, Any],
                               environment: str = "production") -> Dict[str, Any]:
        """Deploy application to target environment"""
        logger.info(f"Deploying application to {environment}")
        
        try:
            # Create deployment package
            deployment_package = await self._create_deployment_package(code_result, stack_spec)
            
            # Generate deployment scripts
            deployment_scripts = self._generate_deployment_scripts(stack_spec, environment)
            
            # Execute deployment
            deployment_result = await self._execute_deployment(deployment_package, deployment_scripts)
            
            # Verify deployment
            verification_result = await self._verify_deployment(deployment_result)
            
            return {
                "status": "deployed" if verification_result["success"] else "failed",
                "environment": environment,
                "deployment_id": deployment_result.get("deployment_id"),
                "endpoint": deployment_result.get("endpoint"),
                "verification": verification_result,
                "deployment_time": datetime.now().isoformat(),
                "logs": deployment_result.get("logs", [])
            }
            
        except Exception as e:
            logger.error(f"Deployment failed: {e}")
            return {
                "status": "failed",
                "error": str(e),
                "deployment_time": datetime.now().isoformat()
            }
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get agent performance metrics"""
        success_rate = self.success_count / self.task_count if self.task_count > 0 else 0.0
        
        return {
            "agent_id": self.agent_id,
            "task_count": self.task_count,
            "success_count": self.success_count,
            "success_rate": success_rate,
            "code_generated": self.code_generated,
            "dags_executed": self.dags_executed,
            "last_active": datetime.now().isoformat()
        }
    
    # Private methods
    async def _generate_code_content(self, 
                                   requirements: Dict[str, Any],
                                   stack_config: Dict[str, Any]) -> tuple[str, List[str]]:
        """Generate actual code content"""
        # In production, this would call AI models like Aliyun Qwen-Max
        # For simulation, generate template code
        
        language = stack_config.get("languages", ["python"])[0]
        framework = stack_config.get("frameworks", ["fastapi"])[0]
        
        if language == "python" and framework == "fastapi":
            code = self._generate_fastapi_code(requirements)
            files = ["main.py", "requirements.txt", "Dockerfile", "README.md"]
        elif language == "nodejs" and framework == "express":
            code = self._generate_express_code(requirements)
            files = ["app.js", "package.json", "Dockerfile", "README.md"]
        else:
            code = "# Template code\n# Implementation would be generated by AI"
            files = ["main.py"]
        
        return code, files
    
    def _generate_fastapi_code(self, requirements: Dict[str, Any]) -> str:
        """Generate FastAPI code"""
        endpoints = requirements.get("endpoints", [])
        
        code = '''"""
FastAPI Application
Generated by Worker Agent
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

app = FastAPI(
    title="Generated API",
    description="Automatically generated FastAPI application",
    version="1.0.0"
)

class HealthResponse(BaseModel):
    status: str
    timestamp: str

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "API is running"}

@app.get("/health")
async def health():
    """Health