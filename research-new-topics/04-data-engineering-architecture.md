# Data Engineering Architecture

## Introduction

This document provides a comprehensive guide to modern data engineering architecture patterns for data engineers who already have foundational knowledge of object-oriented programming, memory management, and basic design patterns. We will explore five critical architectural paradigms that form the backbone of contemporary data platforms: event-driven architectures, data contracts and schema evolution, advanced orchestration patterns, microservices for data platforms, and stream processing architectures.

Modern data engineering has evolved far beyond simple ETL pipelines. Today's data platforms must handle real-time streams, maintain data quality at scale, orchestrate complex workflows, and integrate seamlessly with distributed systems. Understanding these architectural patterns is essential for building robust, scalable, and maintainable data infrastructure.

---

## 1. Event-Driven Architectures (Kafka, Pub/Sub)

### What is it?

Event-driven architecture (EDA) is a software design paradigm where the flow of the program is determined by events - significant changes in state that the system needs to react to. In the context of data engineering, events represent discrete facts about something that happened: a user clicked a button, a transaction was completed, a sensor reading was captured.

The core components of event-driven systems include:

- **Event Producers**: Services that emit events when something notable occurs
- **Event Brokers**: Middleware that receives, stores, and distributes events (e.g., Apache Kafka, Google Pub/Sub, Amazon Kinesis)
- **Event Consumers**: Services that subscribe to and process events
- **Event Channels/Topics**: Logical pathways through which events flow

Apache Kafka has emerged as the de facto standard for event streaming platforms, providing:
- **Durability**: Events are persisted to disk with configurable retention
- **Ordering**: Events within a partition maintain strict ordering
- **Scalability**: Horizontal scaling through partitioning
- **Fault Tolerance**: Replication across brokers

### Why it matters for Data Engineers

Event-driven architectures are fundamental to modern data engineering for several reasons:

1. **Real-time Data Processing**: Enable immediate reaction to business events rather than waiting for batch processing windows
2. **Decoupling**: Producers and consumers operate independently, allowing teams to evolve systems without tight coordination
3. **Scalability**: Handle massive throughput by distributing events across partitions and consumers
4. **Data Lineage**: Events provide a natural audit trail of what happened and when
5. **Replay Capability**: Historical events can be replayed to rebuild state or reprocess with updated logic

### Prerequisites

- Understanding of distributed systems concepts (CAP theorem, eventual consistency)
- Familiarity with serialization formats (JSON, Avro, Protobuf)
- Basic knowledge of message queues and pub/sub patterns
- Experience with Python async programming or multithreading

### Implementation Example

```python
"""
Event-Driven Architecture Example using Kafka
Demonstrates producer, consumer, and event schema patterns
"""
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional, Callable, Any
from confluent_kafka import Producer, Consumer, KafkaError
from confluent_kafka.admin import AdminClient, NewTopic
import json
import uuid


# Event Schema Definition
@dataclass
class BaseEvent:
    """Base class for all events with common metadata"""
    event_id: str
    event_type: str
    timestamp: str
    source: str
    correlation_id: Optional[str] = None

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, json_str: str) -> 'BaseEvent':
        return cls(**json.loads(json_str))


@dataclass
class OrderCreatedEvent(BaseEvent):
    """Event emitted when a new order is created"""
    order_id: str
    customer_id: str
    total_amount: float
    items: list

    def __init__(self, order_id: str, customer_id: str,
                 total_amount: float, items: list,
                 correlation_id: Optional[str] = None):
        super().__init__(
            event_id=str(uuid.uuid4()),
            event_type="order.created",
            timestamp=datetime.utcnow().isoformat(),
            source="order-service",
            correlation_id=correlation_id
        )
        self.order_id = order_id
        self.customer_id = customer_id
        self.total_amount = total_amount
        self.items = items


class KafkaEventProducer:
    """
    Kafka producer with delivery guarantees and error handling
    """
    def __init__(self, bootstrap_servers: str, client_id: str):
        self.config = {
            'bootstrap.servers': bootstrap_servers,
            'client.id': client_id,
            'acks': 'all',  # Wait for all replicas
            'retries': 3,
            'retry.backoff.ms': 1000,
            'enable.idempotence': True,  # Exactly-once semantics
        }
        self.producer = Producer(self.config)

    def delivery_callback(self, err, msg):
        """Callback for delivery reports"""
        if err:
            print(f"Message delivery failed: {err}")
        else:
            print(f"Message delivered to {msg.topic()} "
                  f"[partition {msg.partition()}] @ offset {msg.offset()}")

    def produce_event(self, topic: str, event: BaseEvent,
                      key: Optional[str] = None):
        """
        Produce an event to Kafka with delivery guarantees

        Args:
            topic: Target Kafka topic
            event: Event object to serialize and send
            key: Optional partition key for ordering guarantees
        """
        try:
            self.producer.produce(
                topic=topic,
                key=key.encode('utf-8') if key else None,
                value=event.to_json().encode('utf-8'),
                callback=self.delivery_callback
            )
            # Trigger delivery reports
            self.producer.poll(0)
        except BufferError:
            print("Local producer queue is full, waiting...")
            self.producer.poll(1)
            self.produce_event(topic, event, key)

    def flush(self, timeout: float = 10.0):
        """Wait for all messages to be delivered"""
        self.producer.flush(timeout)


class KafkaEventConsumer:
    """
    Kafka consumer with at-least-once delivery semantics
    """
    def __init__(self, bootstrap_servers: str, group_id: str,
                 topics: list, auto_commit: bool = False):
        self.config = {
            'bootstrap.servers': bootstrap_servers,
            'group.id': group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': auto_commit,
            'max.poll.interval.ms': 300000,
        }
        self.consumer = Consumer(self.config)
        self.consumer.subscribe(topics)
        self.handlers: dict[str, Callable] = {}

    def register_handler(self, event_type: str,
                         handler: Callable[[dict], Any]):
        """Register a handler for a specific event type"""
        self.handlers[event_type] = handler

    def process_events(self, max_messages: Optional[int] = None):
        """
        Main event processing loop with manual commit

        Args:
            max_messages: Optional limit on messages to process
        """
        messages_processed = 0
        try:
            while max_messages is None or messages_processed < max_messages:
                msg = self.consumer.poll(timeout=1.0)

                if msg is None:
                    continue

                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        print(f"Reached end of partition {msg.partition()}")
                    else:
                        raise Exception(msg.error())
                    continue

                # Deserialize and route event
                try:
                    event_data = json.loads(msg.value().decode('utf-8'))
                    event_type = event_data.get('event_type')

                    if event_type in self.handlers:
                        self.handlers[event_type](event_data)
                        # Manual commit after successful processing
                        self.consumer.commit(msg)
                        messages_processed += 1
                    else:
                        print(f"No handler for event type: {event_type}")

                except json.JSONDecodeError as e:
                    print(f"Failed to deserialize message: {e}")
                    # Consider dead letter queue for invalid messages

        except KeyboardInterrupt:
            pass
        finally:
            self.consumer.close()


# Event Handler Example
def handle_order_created(event_data: dict):
    """
    Handler for OrderCreated events
    Could trigger downstream processing, update aggregates, etc.
    """
    print(f"Processing order: {event_data['order_id']}")
    print(f"  Customer: {event_data['customer_id']}")
    print(f"  Amount: ${event_data['total_amount']:.2f}")
    print(f"  Items: {len(event_data['items'])} items")

    # Example: Update real-time analytics
    # analytics_service.increment_order_count()
    # analytics_service.add_revenue(event_data['total_amount'])


# Usage Example
if __name__ == "__main__":
    # Producer example
    producer = KafkaEventProducer(
        bootstrap_servers="localhost:9092",
        client_id="order-producer"
    )

    # Create and publish event
    order_event = OrderCreatedEvent(
        order_id="ORD-12345",
        customer_id="CUST-789",
        total_amount=299.99,
        items=[
            {"sku": "PROD-001", "quantity": 2, "price": 99.99},
            {"sku": "PROD-002", "quantity": 1, "price": 100.01}
        ]
    )

    # Use customer_id as key for ordering guarantees per customer
    producer.produce_event(
        topic="orders",
        event=order_event,
        key=order_event.customer_id
    )
    producer.flush()

    # Consumer example
    consumer = KafkaEventConsumer(
        bootstrap_servers="localhost:9092",
        group_id="order-analytics-group",
        topics=["orders"]
    )
    consumer.register_handler("order.created", handle_order_created)
    consumer.process_events(max_messages=10)
```

### Real-world Application

**E-commerce Order Processing Pipeline**

A large e-commerce platform uses Kafka-based event-driven architecture to handle order processing:

1. **Order Service** publishes `OrderCreated` events when customers complete checkout
2. **Inventory Service** consumes these events to update stock levels and check availability
3. **Notification Service** sends confirmation emails and SMS updates
4. **Analytics Service** updates real-time dashboards and metrics
5. **Fraud Detection Service** analyzes patterns in real-time to flag suspicious activity
6. **Data Lake Ingestion** captures all events for historical analysis and ML training

This architecture allows each service to scale independently, evolve at its own pace, and remain resilient to failures in other components.

### Learning Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/) - Official comprehensive guide
- [Confluent Developer](https://developer.confluent.io/) - Tutorials, courses, and best practices
- [Designing Event-Driven Systems by Ben Stopford](https://www.confluent.io/designing-event-driven-systems/) - Free O'Reilly book
- [Google Cloud Pub/Sub Documentation](https://cloud.google.com/pubsub/docs) - Alternative pub/sub implementation
- [Martin Kleppmann - Designing Data-Intensive Applications](https://dataintensive.net/) - Deep dive into distributed data systems

### Difficulty Level

**Intermediate to Advanced**

Prerequisites include understanding of distributed systems, serialization, and asynchronous programming. Mastering production-grade implementations requires experience with partitioning strategies, consumer group management, and failure handling.

---

## 2. Data Contracts and Schema Evolution

### What is it?

Data contracts are formal agreements between data producers and consumers that define the structure, semantics, and quality expectations of data being exchanged. They serve as the interface specification for data, similar to how APIs define contracts between services.

A comprehensive data contract typically includes:

- **Schema Definition**: The structure of the data (fields, types, constraints)
- **Semantic Specification**: The meaning and business context of each field
- **Quality Rules**: Expectations for completeness, accuracy, and freshness
- **Service Level Agreements (SLAs)**: Latency, availability, and throughput guarantees
- **Ownership**: Who is responsible for producing and maintaining the data

**Schema Evolution** refers to the ability to modify schemas over time while maintaining compatibility with existing data and consumers. The three main compatibility modes are:

1. **Backward Compatible**: New schema can read old data (safe to upgrade consumers first)
2. **Forward Compatible**: Old schema can read new data (safe to upgrade producers first)
3. **Full Compatible**: Both backward and forward compatible

### Why it matters for Data Engineers

Data contracts and schema evolution are critical because:

1. **Breaking Change Prevention**: Explicit contracts prevent upstream changes from breaking downstream pipelines
2. **Self-Service Data**: Consumers can discover and understand data without direct communication
3. **Data Quality Assurance**: Automated validation ensures data meets expectations
4. **Team Independence**: Teams can evolve their systems without tight coordination
5. **Debugging and Root Cause Analysis**: Clear contracts make it easier to identify where things went wrong

### Prerequisites

- Understanding of serialization formats (JSON Schema, Avro, Protobuf)
- Familiarity with database schema concepts
- Basic understanding of semantic versioning
- Experience with data validation

### Implementation Example

```python
"""
Data Contracts and Schema Evolution Example
Demonstrates schema registry, validation, and evolution patterns
"""
from dataclasses import dataclass, field
from typing import Optional, Any, List
from enum import Enum
from datetime import datetime
import json
import hashlib


class SchemaCompatibility(Enum):
    """Schema compatibility modes"""
    BACKWARD = "backward"  # New schema can read old data
    FORWARD = "forward"    # Old schema can read new data
    FULL = "full"          # Both backward and forward
    NONE = "none"          # No compatibility guaranteed


class FieldType(Enum):
    """Supported field types"""
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"
    TIMESTAMP = "timestamp"


@dataclass
class FieldDefinition:
    """Definition of a single field in the schema"""
    name: str
    field_type: FieldType
    required: bool = True
    description: str = ""
    default: Optional[Any] = None
    constraints: dict = field(default_factory=dict)
    # Constraints can include: min, max, pattern, enum, etc.


@dataclass
class DataContract:
    """
    Complete data contract specification
    """
    name: str
    version: str
    owner: str
    description: str
    fields: List[FieldDefinition]
    compatibility: SchemaCompatibility = SchemaCompatibility.BACKWARD
    sla: dict = field(default_factory=dict)
    quality_rules: List[dict] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def schema_fingerprint(self) -> str:
        """Generate unique fingerprint for schema version"""
        schema_str = json.dumps(
            [(f.name, f.field_type.value, f.required) for f in self.fields],
            sort_keys=True
        )
        return hashlib.sha256(schema_str.encode()).hexdigest()[:16]

    def to_json_schema(self) -> dict:
        """Convert to JSON Schema format for validation"""
        properties = {}
        required_fields = []

        for field_def in self.fields:
            prop = {"description": field_def.description}

            # Map field types to JSON Schema types
            type_mapping = {
                FieldType.STRING: "string",
                FieldType.INTEGER: "integer",
                FieldType.FLOAT: "number",
                FieldType.BOOLEAN: "boolean",
                FieldType.ARRAY: "array",
                FieldType.OBJECT: "object",
                FieldType.TIMESTAMP: "string",
            }
            prop["type"] = type_mapping[field_def.field_type]

            # Add format for timestamps
            if field_def.field_type == FieldType.TIMESTAMP:
                prop["format"] = "date-time"

            # Add constraints
            if field_def.default is not None:
                prop["default"] = field_def.default
            if "min" in field_def.constraints:
                prop["minimum"] = field_def.constraints["min"]
            if "max" in field_def.constraints:
                prop["maximum"] = field_def.constraints["max"]
            if "pattern" in field_def.constraints:
                prop["pattern"] = field_def.constraints["pattern"]
            if "enum" in field_def.constraints:
                prop["enum"] = field_def.constraints["enum"]

            properties[field_def.name] = prop

            if field_def.required:
                required_fields.append(field_def.name)

        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": self.name,
            "description": self.description,
            "type": "object",
            "properties": properties,
            "required": required_fields,
            "additionalProperties": False
        }


class SchemaRegistry:
    """
    In-memory schema registry for managing data contracts
    Production systems would use Confluent Schema Registry or similar
    """
    def __init__(self):
        self.contracts: dict[str, dict[str, DataContract]] = {}
        # contracts[name][version] = DataContract

    def register(self, contract: DataContract) -> bool:
        """
        Register a new schema version with compatibility check

        Returns True if registration successful, False if incompatible
        """
        if contract.name not in self.contracts:
            self.contracts[contract.name] = {}
            self.contracts[contract.name][contract.version] = contract
            return True

        # Get latest version for compatibility check
        latest = self.get_latest(contract.name)

        if self._check_compatibility(latest, contract):
            self.contracts[contract.name][contract.version] = contract
            return True

        return False

    def _check_compatibility(self, old: DataContract,
                             new: DataContract) -> bool:
        """Check if new schema is compatible with old schema"""

        if new.compatibility == SchemaCompatibility.NONE:
            return True

        old_fields = {f.name: f for f in old.fields}
        new_fields = {f.name: f for f in new.fields}

        if new.compatibility in [SchemaCompatibility.BACKWARD,
                                  SchemaCompatibility.FULL]:
            # New consumers must be able to read old data
            # - Cannot add required fields without defaults
            # - Cannot remove fields
            # - Cannot change field types

            for name, new_field in new_fields.items():
                if name not in old_fields:
                    # New field - must have default or be optional
                    if new_field.required and new_field.default is None:
                        print(f"Backward incompatible: new required field "
                              f"'{name}' without default")
                        return False
                else:
                    old_field = old_fields[name]
                    if old_field.field_type != new_field.field_type:
                        print(f"Backward incompatible: field '{name}' "
                              f"type changed")
                        return False

        if new.compatibility in [SchemaCompatibility.FORWARD,
                                  SchemaCompatibility.FULL]:
            # Old consumers must be able to read new data
            # - Cannot remove required fields
            # - Cannot add required fields without default in old schema

            for name, old_field in old_fields.items():
                if name not in new_fields and old_field.required:
                    print(f"Forward incompatible: required field "
                          f"'{name}' removed")
                    return False

        return True

    def get_latest(self, name: str) -> Optional[DataContract]:
        """Get the latest version of a contract"""
        if name not in self.contracts:
            return None
        versions = sorted(self.contracts[name].keys())
        return self.contracts[name][versions[-1]]

    def get_version(self, name: str, version: str) -> Optional[DataContract]:
        """Get a specific version of a contract"""
        return self.contracts.get(name, {}).get(version)


class DataValidator:
    """
    Validates data against a data contract
    """
    def __init__(self, contract: DataContract):
        self.contract = contract
        self.json_schema = contract.to_json_schema()

    def validate(self, data: dict) -> tuple[bool, List[str]]:
        """
        Validate data against the contract

        Returns (is_valid, list_of_errors)
        """
        errors = []

        # Check required fields
        for field_def in self.contract.fields:
            if field_def.required and field_def.name not in data:
                if field_def.default is None:
                    errors.append(f"Missing required field: {field_def.name}")

        # Check field types and constraints
        for field_name, value in data.items():
            field_def = next(
                (f for f in self.contract.fields if f.name == field_name),
                None
            )

            if field_def is None:
                errors.append(f"Unknown field: {field_name}")
                continue

            # Type checking
            type_checks = {
                FieldType.STRING: lambda v: isinstance(v, str),
                FieldType.INTEGER: lambda v: isinstance(v, int) and not isinstance(v, bool),
                FieldType.FLOAT: lambda v: isinstance(v, (int, float)) and not isinstance(v, bool),
                FieldType.BOOLEAN: lambda v: isinstance(v, bool),
                FieldType.ARRAY: lambda v: isinstance(v, list),
                FieldType.OBJECT: lambda v: isinstance(v, dict),
                FieldType.TIMESTAMP: lambda v: isinstance(v, str),
            }

            if not type_checks[field_def.field_type](value):
                errors.append(
                    f"Field '{field_name}' has wrong type. "
                    f"Expected {field_def.field_type.value}, got {type(value).__name__}"
                )
                continue

            # Constraint checking
            if "min" in field_def.constraints and value < field_def.constraints["min"]:
                errors.append(
                    f"Field '{field_name}' value {value} below minimum "
                    f"{field_def.constraints['min']}"
                )
            if "max" in field_def.constraints and value > field_def.constraints["max"]:
                errors.append(
                    f"Field '{field_name}' value {value} above maximum "
                    f"{field_def.constraints['max']}"
                )
            if "enum" in field_def.constraints and value not in field_def.constraints["enum"]:
                errors.append(
                    f"Field '{field_name}' value '{value}' not in allowed values "
                    f"{field_def.constraints['enum']}"
                )

        return len(errors) == 0, errors


# Usage Example
if __name__ == "__main__":
    # Define initial contract (v1)
    order_contract_v1 = DataContract(
        name="orders",
        version="1.0.0",
        owner="order-team@company.com",
        description="Order events from the order management system",
        fields=[
            FieldDefinition(
                name="order_id",
                field_type=FieldType.STRING,
                required=True,
                description="Unique order identifier"
            ),
            FieldDefinition(
                name="customer_id",
                field_type=FieldType.STRING,
                required=True,
                description="Customer who placed the order"
            ),
            FieldDefinition(
                name="total_amount",
                field_type=FieldType.FLOAT,
                required=True,
                description="Total order amount in USD",
                constraints={"min": 0}
            ),
            FieldDefinition(
                name="status",
                field_type=FieldType.STRING,
                required=True,
                description="Current order status",
                constraints={"enum": ["pending", "confirmed", "shipped", "delivered"]}
            ),
        ],
        compatibility=SchemaCompatibility.BACKWARD,
        sla={"latency_ms": 100, "availability": 0.999},
        quality_rules=[
            {"rule": "total_amount > 0", "severity": "error"},
            {"rule": "order_id matches '^ORD-[0-9]+$'", "severity": "warning"}
        ]
    )

    # Register initial version
    registry = SchemaRegistry()
    registry.register(order_contract_v1)
    print(f"Registered contract: {order_contract_v1.name} v{order_contract_v1.version}")
    print(f"Schema fingerprint: {order_contract_v1.schema_fingerprint()}")

    # Evolve schema - add optional field (backward compatible)
    order_contract_v2 = DataContract(
        name="orders",
        version="2.0.0",
        owner="order-team@company.com",
        description="Order events from the order management system",
        fields=[
            *order_contract_v1.fields,  # Keep existing fields
            FieldDefinition(
                name="shipping_address",
                field_type=FieldType.OBJECT,
                required=False,  # Optional - backward compatible
                description="Shipping address details",
                default=None
            ),
        ],
        compatibility=SchemaCompatibility.BACKWARD,
    )

    success = registry.register(order_contract_v2)
    print(f"\nRegistered v2 (optional field): {success}")

    # Try incompatible change - add required field without default
    order_contract_v3_bad = DataContract(
        name="orders",
        version="3.0.0",
        owner="order-team@company.com",
        description="Order events from the order management system",
        fields=[
            *order_contract_v2.fields,
            FieldDefinition(
                name="payment_method",
                field_type=FieldType.STRING,
                required=True,  # Required without default - incompatible!
                description="Payment method used"
            ),
        ],
        compatibility=SchemaCompatibility.BACKWARD,
    )

    success = registry.register(order_contract_v3_bad)
    print(f"Registered v3 (required field, no default): {success}")

    # Validate data against contract
    validator = DataValidator(registry.get_latest("orders"))

    valid_order = {
        "order_id": "ORD-12345",
        "customer_id": "CUST-789",
        "total_amount": 99.99,
        "status": "confirmed"
    }

    invalid_order = {
        "order_id": "ORD-12345",
        "total_amount": -50.0,  # Negative amount
        "status": "invalid_status"  # Not in enum
    }

    print("\n--- Validation Results ---")
    is_valid, errors = validator.validate(valid_order)
    print(f"Valid order: {is_valid}, Errors: {errors}")

    is_valid, errors = validator.validate(invalid_order)
    print(f"Invalid order: {is_valid}, Errors: {errors}")
```

### Real-world Application

**Data Mesh Implementation at a Financial Services Company**

A financial services company implements data contracts to enable their data mesh architecture:

1. **Domain Teams as Data Producers**: Each domain team (payments, accounts, loans) defines contracts for their data products
2. **Central Schema Registry**: All contracts are registered in Confluent Schema Registry with FULL compatibility enforcement
3. **Automated Testing in CI/CD**: Pipeline changes are validated against consumer contracts before deployment
4. **Data Catalog Integration**: Contracts are automatically synchronized with the data catalog for discoverability
5. **Breaking Change Workflow**: Any incompatible changes require explicit consumer migration plans and approvals

This approach reduced production incidents from data schema issues by 90% and enabled teams to move faster with confidence.

### Learning Resources

- [Confluent Schema Registry Documentation](https://docs.confluent.io/platform/current/schema-registry/index.html) - Industry-standard schema registry
- [Data Contracts - PayPal Engineering Blog](https://medium.com/paypal-tech) - PayPal's approach to data contracts
- [Apache Avro Specification](https://avro.apache.org/docs/current/specification/) - Schema evolution best practices
- [Protocol Buffers Language Guide](https://protobuf.dev/programming-guides/proto3/) - Google's serialization format
- [Data Mesh by Zhamak Dehghani](https://www.oreilly.com/library/view/data-mesh/9781492092384/) - Data products and contracts in data mesh

### Difficulty Level

**Intermediate**

Requires understanding of serialization formats and basic software versioning concepts. The complexity increases when dealing with complex nested schemas and managing migrations across many consumers.

---

## 3. Advanced Orchestration Patterns (Beyond Basic DAGs)

### What is it?

While basic DAG (Directed Acyclic Graph) orchestration handles sequential and parallel task execution, advanced orchestration patterns address more complex scenarios that modern data platforms encounter:

**Dynamic DAGs**: Workflows that modify their structure based on runtime conditions, input data, or external state.

**Task Groups and SubDAGs**: Hierarchical organization of related tasks for better maintainability and reusability.

**Data-Aware Scheduling**: Triggering workflows based on data availability or quality rather than time-based schedules.

**Cross-DAG Dependencies**: Coordinating workflows across multiple DAGs, potentially managed by different teams.

**Branching and Conditional Execution**: Different execution paths based on task outcomes or data conditions.

**Backfill and Catchup Patterns**: Strategies for processing historical data without disrupting current operations.

**Resource-Aware Scheduling**: Intelligent allocation of compute resources based on task requirements and cluster capacity.

### Why it matters for Data Engineers

Advanced orchestration patterns are essential because:

1. **Complex Business Logic**: Real-world data workflows often require conditional paths, loops, and dynamic behavior
2. **Efficiency**: Data-aware scheduling prevents unnecessary processing and optimizes resource utilization
3. **Maintainability**: Proper organization with task groups and modular DAGs reduces technical debt
4. **Reliability**: Sophisticated retry, backfill, and recovery patterns ensure data consistency
5. **Scale**: Managing hundreds of interconnected pipelines requires advanced coordination mechanisms

### Prerequisites

- Experience with Apache Airflow or similar orchestration tools
- Understanding of DAG concepts and execution patterns
- Familiarity with Python decorators and functional programming
- Basic knowledge of distributed task execution

### Implementation Example

```python
"""
Advanced Orchestration Patterns Example
Demonstrates dynamic DAGs, branching, data-aware scheduling,
and cross-DAG dependencies using Airflow patterns
"""
from datetime import datetime, timedelta
from typing import Any, List, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import random


# Simplified Airflow-like abstractions for demonstration
class TaskState(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class TaskContext:
    """Context passed to task execution"""
    execution_date: datetime
    dag_id: str
    task_id: str
    params: dict = field(default_factory=dict)
    xcom: dict = field(default_factory=dict)  # Cross-communication storage


@dataclass
class Task:
    """Base task definition"""
    task_id: str
    python_callable: Callable
    retries: int = 3
    retry_delay: timedelta = timedelta(minutes=5)
    depends_on: List[str] = field(default_factory=list)
    trigger_rule: str = "all_success"  # all_success, one_success, all_done, etc.
    pool: str = "default"
    priority_weight: int = 1

    def execute(self, context: TaskContext) -> Any:
        """Execute the task with the given context"""
        return self.python_callable(context)


class BranchOperator(Task):
    """
    Task that returns the task_id(s) to execute next
    Enables conditional workflow execution
    """
    def __init__(self, task_id: str, branch_callable: Callable, **kwargs):
        super().__init__(
            task_id=task_id,
            python_callable=branch_callable,
            **kwargs
        )


@dataclass
class TaskGroup:
    """
    Group of related tasks for organization and reusability
    Similar to Airflow's TaskGroup
    """
    group_id: str
    tasks: List[Task] = field(default_factory=list)
    prefix_group_id: bool = True

    def add_task(self, task: Task):
        if self.prefix_group_id:
            task.task_id = f"{self.group_id}.{task.task_id}"
        self.tasks.append(task)

    def get_entry_task(self) -> Optional[Task]:
        """Get the first task in the group (no internal dependencies)"""
        task_ids = {t.task_id for t in self.tasks}
        for task in self.tasks:
            if not any(dep in task_ids for dep in task.depends_on):
                return task
        return None


class DynamicDAGGenerator:
    """
    Generates DAG structure dynamically based on runtime configuration
    """
    def __init__(self, dag_id: str, config_source: Callable):
        self.dag_id = dag_id
        self.config_source = config_source
        self.tasks: List[Task] = []

    def generate(self, execution_date: datetime) -> List[Task]:
        """
        Generate tasks based on configuration at execution time

        This enables:
        - Variable number of parallel tasks based on data partitions
        - Conditional task inclusion based on feature flags
        - Dynamic dependency graphs based on data relationships
        """
        config = self.config_source(execution_date)
        self.tasks = []

        # Example: Generate parallel tasks for each data partition
        partitions = config.get("partitions", [])

        for partition in partitions:
            task = Task(
                task_id=f"process_partition_{partition}",
                python_callable=lambda ctx, p=partition: process_partition(ctx, p),
                depends_on=["start"],
                pool=config.get("pool", "default")
            )
            self.tasks.append(task)

        # Add aggregation task that depends on all partition tasks
        if partitions:
            agg_task = Task(
                task_id="aggregate_results",
                python_callable=aggregate_results,
                depends_on=[f"process_partition_{p}" for p in partitions],
                trigger_rule="all_success"
            )
            self.tasks.append(agg_task)

        return self.tasks


class DataAwareScheduler:
    """
    Scheduler that triggers DAGs based on data availability
    rather than time-based schedules
    """
    def __init__(self):
        self.sensors: List[dict] = []
        self.triggered_runs: List[dict] = []

    def register_sensor(self, dag_id: str, dataset_id: str,
                        check_callable: Callable,
                        poke_interval: timedelta = timedelta(minutes=5)):
        """
        Register a data sensor that triggers a DAG when data is available
        """
        self.sensors.append({
            "dag_id": dag_id,
            "dataset_id": dataset_id,
            "check": check_callable,
            "poke_interval": poke_interval,
            "last_check": None
        })

    def check_and_trigger(self) -> List[str]:
        """
        Check all sensors and trigger DAGs where data is available
        Returns list of triggered DAG IDs
        """
        triggered = []

        for sensor in self.sensors:
            # Check if enough time has passed since last check
            now = datetime.utcnow()
            if (sensor["last_check"] and
                now - sensor["last_check"] < sensor["poke_interval"]):
                continue

            sensor["last_check"] = now

            # Check data availability
            data_info = sensor["check"](sensor["dataset_id"])

            if data_info.get("available", False):
                self.triggered_runs.append({
                    "dag_id": sensor["dag_id"],
                    "trigger_time": now,
                    "data_info": data_info
                })
                triggered.append(sensor["dag_id"])
                print(f"Triggered {sensor['dag_id']} - "
                      f"data available: {data_info}")

        return triggered


class CrossDAGDependencyManager:
    """
    Manages dependencies between different DAGs
    Enables coordination across team boundaries
    """
    def __init__(self):
        self.dependencies: dict[str, List[dict]] = {}
        self.dag_states: dict[str, dict] = {}

    def register_dependency(self, downstream_dag: str, upstream_dag: str,
                           execution_delta: timedelta = timedelta(0),
                           allowed_states: List[TaskState] = None):
        """
        Register that downstream_dag depends on upstream_dag

        Args:
            downstream_dag: DAG that waits
            upstream_dag: DAG that must complete first
            execution_delta: Time offset for execution date matching
            allowed_states: States of upstream that satisfy dependency
        """
        if downstream_dag not in self.dependencies:
            self.dependencies[downstream_dag] = []

        self.dependencies[downstream_dag].append({
            "upstream": upstream_dag,
            "delta": execution_delta,
            "allowed_states": allowed_states or [TaskState.SUCCESS]
        })

    def update_dag_state(self, dag_id: str, execution_date: datetime,
                         state: TaskState):
        """Update the state of a DAG run"""
        key = f"{dag_id}_{execution_date.isoformat()}"
        self.dag_states[key] = {
            "dag_id": dag_id,
            "execution_date": execution_date,
            "state": state,
            "updated_at": datetime.utcnow()
        }

    def check_dependencies_met(self, dag_id: str,
                               execution_date: datetime) -> tuple[bool, List[str]]:
        """
        Check if all dependencies are met for a DAG run

        Returns (all_met, list_of_unmet_dependencies)
        """
        if dag_id not in self.dependencies:
            return True, []

        unmet = []
        for dep in self.dependencies[dag_id]:
            upstream_exec_date = execution_date - dep["delta"]
            key = f"{dep['upstream']}_{upstream_exec_date.isoformat()}"

            if key not in self.dag_states:
                unmet.append(f"{dep['upstream']} (not found)")
            elif self.dag_states[key]["state"] not in dep["allowed_states"]:
                unmet.append(f"{dep['upstream']} (state: "
                           f"{self.dag_states[key]['state'].value})")

        return len(unmet) == 0, unmet


# Example task functions
def process_partition(context: TaskContext, partition: str) -> dict:
    """Process a single data partition"""
    print(f"Processing partition {partition} for {context.execution_date}")
    # Simulate processing
    records_processed = random.randint(1000, 10000)
    return {"partition": partition, "records": records_processed}


def aggregate_results(context: TaskContext) -> dict:
    """Aggregate results from all partitions"""
    print(f"Aggregating results for {context.execution_date}")
    # In real Airflow, would pull XCom from upstream tasks
    return {"status": "aggregated", "total_records": 50000}


def check_data_availability(dataset_id: str) -> dict:
    """Check if upstream data is available"""
    # In production, would check data lake, database, etc.
    return {
        "available": random.random() > 0.5,
        "dataset_id": dataset_id,
        "partition_count": 10,
        "last_modified": datetime.utcnow().isoformat()
    }


def branch_based_on_data_quality(context: TaskContext) -> str:
    """
    Branch execution based on data quality check
    Returns task_id to execute next
    """
    # Simulate quality check
    quality_score = random.uniform(0, 1)
    context.xcom["quality_score"] = quality_score

    if quality_score > 0.95:
        return "fast_path_processing"
    elif quality_score > 0.7:
        return "standard_processing"
    else:
        return "data_remediation"


# Backfill Manager for historical processing
class BackfillManager:
    """
    Manages backfill operations for historical data processing
    """
    def __init__(self, max_parallel: int = 5):
        self.max_parallel = max_parallel
        self.backfill_queue: List[dict] = []
        self.active_backfills: List[dict] = []

    def create_backfill(self, dag_id: str, start_date: datetime,
                        end_date: datetime,
                        reprocess_existing: bool = False) -> str:
        """
        Create a backfill job for a date range

        Args:
            dag_id: DAG to backfill
            start_date: Start of backfill range
            end_date: End of backfill range
            reprocess_existing: Whether to reprocess already-complete runs
        """
        backfill_id = f"backfill_{dag_id}_{start_date.date()}_{end_date.date()}"

        # Generate execution dates (assuming daily)
        current = start_date
        execution_dates = []
        while current <= end_date:
            execution_dates.append(current)
            current += timedelta(days=1)

        self.backfill_queue.append({
            "backfill_id": backfill_id,
            "dag_id": dag_id,
            "execution_dates": execution_dates,
            "completed": [],
            "failed": [],
            "reprocess_existing": reprocess_existing,
            "created_at": datetime.utcnow()
        })

        print(f"Created backfill {backfill_id} with "
              f"{len(execution_dates)} execution dates")

        return backfill_id

    def get_next_batch(self, backfill_id: str) -> List[datetime]:
        """Get next batch of dates to process"""
        backfill = next(
            (b for b in self.backfill_queue if b["backfill_id"] == backfill_id),
            None
        )
        if not backfill:
            return []

        remaining = [
            d for d in backfill["execution_dates"]
            if d not in backfill["completed"] and d not in backfill["failed"]
        ]

        return remaining[:self.max_parallel]


# Usage Example
if __name__ == "__main__":
    print("=== Dynamic DAG Generation ===")

    def get_config(execution_date: datetime) -> dict:
        """Dynamic configuration based on execution date"""
        # Could query metadata store, API, etc.
        return {
            "partitions": ["us-east", "us-west", "eu-west", "ap-south"],
            "pool": "high_memory"
        }

    dynamic_dag = DynamicDAGGenerator(
        dag_id="dynamic_etl",
        config_source=get_config
    )

    tasks = dynamic_dag.generate(datetime.utcnow())
    print(f"Generated {len(tasks)} tasks:")
    for task in tasks:
        print(f"  - {task.task_id} (depends on: {task.depends_on})")

    print("\n=== Data-Aware Scheduling ===")

    scheduler = DataAwareScheduler()
    scheduler.register_sensor(
        dag_id="downstream_processing",
        dataset_id="raw_events",
        check_callable=check_data_availability,
        poke_interval=timedelta(minutes=1)
    )

    triggered = scheduler.check_and_trigger()
    print(f"Triggered DAGs: {triggered}")

    print("\n=== Cross-DAG Dependencies ===")

    dep_manager = CrossDAGDependencyManager()
    dep_manager.register_dependency(
        downstream_dag="transform_dag",
        upstream_dag="ingest_dag",
        execution_delta=timedelta(0)
    )
    dep_manager.register_dependency(
        downstream_dag="transform_dag",
        upstream_dag="lookup_refresh_dag",
        execution_delta=timedelta(days=1)  # Yesterday's lookup data
    )

    exec_date = datetime(2024, 1, 15)

    # Simulate upstream completions
    dep_manager.update_dag_state("ingest_dag", exec_date, TaskState.SUCCESS)
    dep_manager.update_dag_state(
        "lookup_refresh_dag",
        exec_date - timedelta(days=1),
        TaskState.SUCCESS
    )

    met, unmet = dep_manager.check_dependencies_met("transform_dag", exec_date)
    print(f"Dependencies met: {met}")
    if unmet:
        print(f"Unmet dependencies: {unmet}")

    print("\n=== Branching Example ===")

    context = TaskContext(
        execution_date=datetime.utcnow(),
        dag_id="quality_branch_dag",
        task_id="quality_check"
    )

    next_task = branch_based_on_data_quality(context)
    print(f"Quality score: {context.xcom['quality_score']:.2f}")
    print(f"Next task to execute: {next_task}")

    print("\n=== Backfill Management ===")

    backfill_mgr = BackfillManager(max_parallel=3)
    backfill_id = backfill_mgr.create_backfill(
        dag_id="daily_aggregation",
        start_date=datetime(2024, 1, 1),
        end_date=datetime(2024, 1, 10),
        reprocess_existing=False
    )

    batch = backfill_mgr.get_next_batch(backfill_id)
    print(f"Next batch to process: {[d.date() for d in batch]}")
```

### Real-world Application

**Multi-Region Data Platform at a Streaming Service**

A global streaming service uses advanced orchestration patterns to manage their data platform:

1. **Dynamic DAGs**: Each content region generates different numbers of processing tasks based on catalog size and viewing patterns. A single DAG template dynamically creates tasks for 50+ regions.

2. **Data-Aware Scheduling**: Instead of running on fixed schedules, the recommendation model retraining DAG triggers automatically when sufficient new viewing data is available (checked via dataset sensors).

3. **Cross-DAG Dependencies**: The ML feature engineering DAG depends on both the user activity aggregation DAG and the content metadata refresh DAG, managed through ExternalTaskSensors.

4. **Branching**: A data quality branch determines whether data flows to production tables, quarantine for manual review, or triggers automatic remediation jobs.

5. **Intelligent Backfill**: When a bug is discovered in historical processing, the backfill manager processes 6 months of data with careful resource throttling to avoid impacting production workloads.

### Learning Resources

- [Apache Airflow Documentation](https://airflow.apache.org/docs/) - Official orchestration platform documentation
- [Dagster Documentation](https://docs.dagster.io/) - Modern alternative with data-aware orchestration
- [Prefect Documentation](https://docs.prefect.io/) - Python-native workflow orchestration
- [Astronomer Blog](https://www.astronomer.io/blog/) - Advanced Airflow patterns and best practices
- [Data Engineering Podcast](https://www.dataengineeringpodcast.com/) - Interviews with practitioners on orchestration challenges

### Difficulty Level

**Advanced**

Requires solid understanding of basic orchestration concepts, distributed systems, and production operations. Implementing these patterns at scale involves careful consideration of failure modes, resource management, and monitoring.

---

## 4. Microservices for Data Platforms

### What is it?

Microservices architecture applied to data platforms involves decomposing monolithic data systems into independently deployable services, each responsible for a specific data capability. This approach brings software engineering best practices to data infrastructure.

Key characteristics of data platform microservices:

- **Single Responsibility**: Each service handles one data function (ingestion, transformation, serving, etc.)
- **Independent Deployment**: Services can be updated without affecting others
- **Technology Diversity**: Different services can use optimal technologies for their specific needs
- **API-First Design**: Clear interfaces between services enable team autonomy
- **Isolated Failure**: Problems in one service don't cascade to others

Common data platform microservices include:

- **Ingestion Services**: Handle data capture from various sources (APIs, databases, streams)
- **Schema Services**: Manage data contracts and schema evolution
- **Transformation Services**: Execute data processing logic
- **Quality Services**: Validate and monitor data quality
- **Catalog Services**: Maintain metadata and data discovery
- **Serving Services**: Provide data access APIs for consumers
- **Governance Services**: Enforce access control and compliance

### Why it matters for Data Engineers

Microservices architecture benefits data platforms by:

1. **Scalability**: Scale individual components based on demand (e.g., scale ingestion during peak hours)
2. **Team Autonomy**: Different teams can own different services with clear boundaries
3. **Resilience**: Isolated failures prevent cascading outages
4. **Evolution**: Services can be rewritten or replaced independently
5. **Specialization**: Use the best tool for each job (Spark for batch, Flink for streaming, etc.)

### Prerequisites

- Understanding of RESTful API design
- Familiarity with containerization (Docker) and orchestration (Kubernetes)
- Knowledge of service communication patterns (sync, async)
- Experience with distributed systems concepts

### Implementation Example

```python
"""
Microservices for Data Platforms Example
Demonstrates data ingestion, transformation, and serving microservices
with proper separation of concerns and communication patterns
"""
from dataclasses import dataclass, field, asdict
from typing import Any, Optional, List, Dict, Callable
from datetime import datetime
from enum import Enum
from abc import ABC, abstractmethod
import json
import uuid
import hashlib
from collections import defaultdict


# Shared domain models
class DataFormat(Enum):
    JSON = "json"
    AVRO = "avro"
    PARQUET = "parquet"
    CSV = "csv"


@dataclass
class DataRecord:
    """Universal data record with metadata"""
    record_id: str
    source: str
    timestamp: str
    schema_version: str
    payload: dict
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ServiceResponse:
    """Standard response format for all services"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    metadata: dict = field(default_factory=dict)


# Event Bus for async communication between services
class EventBus:
    """
    Simple event bus for service communication
    In production, would use Kafka, RabbitMQ, etc.
    """
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = defaultdict(list)
        self.events: List[dict] = []

    def publish(self, topic: str, event: dict):
        """Publish event to a topic"""
        event_envelope = {
            "event_id": str(uuid.uuid4()),
            "topic": topic,
            "timestamp": datetime.utcnow().isoformat(),
            "payload": event
        }
        self.events.append(event_envelope)

        # Notify subscribers
        for handler in self.subscribers[topic]:
            handler(event_envelope)

    def subscribe(self, topic: str, handler: Callable):
        """Subscribe to a topic"""
        self.subscribers[topic].append(handler)


# Service Registry for service discovery
class ServiceRegistry:
    """
    Service registry for discovery and health monitoring
    In production, would use Consul, etcd, or Kubernetes service discovery
    """
    def __init__(self):
        self.services: Dict[str, dict] = {}

    def register(self, service_name: str, service_instance: 'BaseDataService'):
        """Register a service instance"""
        self.services[service_name] = {
            "instance": service_instance,
            "registered_at": datetime.utcnow().isoformat(),
            "health": "healthy"
        }

    def get_service(self, service_name: str) -> Optional['BaseDataService']:
        """Get a service instance by name"""
        if service_name in self.services:
            return self.services[service_name]["instance"]
        return None

    def health_check(self) -> dict:
        """Check health of all registered services"""
        return {
            name: info["instance"].health_check()
            for name, info in self.services.items()
        }


# Base class for all data services
class BaseDataService(ABC):
    """Base class for all data platform microservices"""

    def __init__(self, service_name: str, event_bus: EventBus):
        self.service_name = service_name
        self.event_bus = event_bus
        self.metrics: Dict[str, int] = defaultdict(int)
        self.started_at = datetime.utcnow()

    @abstractmethod
    def health_check(self) -> dict:
        """Return service health status"""
        pass

    def emit_metric(self, metric_name: str, value: int = 1):
        """Record a metric"""
        self.metrics[metric_name] += value

    def emit_event(self, event_type: str, payload: dict):
        """Emit an event to the event bus"""
        self.event_bus.publish(
            f"{self.service_name}.{event_type}",
            payload
        )


# Ingestion Service
class IngestionService(BaseDataService):
    """
    Handles data ingestion from various sources
    Responsibilities:
    - Source connection management
    - Data extraction and initial validation
    - Record standardization
    - Delivery to downstream services
    """

    def __init__(self, event_bus: EventBus):
        super().__init__("ingestion-service", event_bus)
        self.connectors: Dict[str, Callable] = {}
        self.buffer: List[DataRecord] = []
        self.buffer_size = 100

    def register_connector(self, source_type: str,
                          connector: Callable[[dict], List[dict]]):
        """Register a data source connector"""
        self.connectors[source_type] = connector

    def ingest(self, source_type: str, source_config: dict) -> ServiceResponse:
        """
        Ingest data from a source

        Args:
            source_type: Type of source (api, database, file, etc.)
            source_config: Connection and extraction configuration
        """
        if source_type not in self.connectors:
            return ServiceResponse(
                success=False,
                error=f"Unknown source type: {source_type}"
            )

        try:
            # Extract data using connector
            raw_records = self.connectors[source_type](source_config)
            self.emit_metric("records_extracted", len(raw_records))

            # Standardize records
            standardized = []
            for raw in raw_records:
                record = DataRecord(
                    record_id=str(uuid.uuid4()),
                    source=f"{source_type}:{source_config.get('name', 'unknown')}",
                    timestamp=datetime.utcnow().isoformat(),
                    schema_version=source_config.get("schema_version", "1.0.0"),
                    payload=raw,
                    metadata={
                        "ingestion_time": datetime.utcnow().isoformat(),
                        "source_type": source_type
                    }
                )
                standardized.append(record)

            # Buffer records
            self.buffer.extend(standardized)

            # Flush if buffer is full
            if len(self.buffer) >= self.buffer_size:
                self._flush_buffer()

            self.emit_metric("records_ingested", len(standardized))

            return ServiceResponse(
                success=True,
                data={"records_ingested": len(standardized)},
                metadata={"batch_id": str(uuid.uuid4())}
            )

        except Exception as e:
            self.emit_metric("ingestion_errors")
            return ServiceResponse(success=False, error=str(e))

    def _flush_buffer(self):
        """Flush buffered records to downstream"""
        if not self.buffer:
            return

        # Emit event for downstream services
        self.emit_event("batch_ready", {
            "record_count": len(self.buffer),
            "records": [r.to_dict() for r in self.buffer]
        })

        self.buffer = []

    def health_check(self) -> dict:
        return {
            "service": self.service_name,
            "status": "healthy",
            "uptime_seconds": (datetime.utcnow() - self.started_at).total_seconds(),
            "buffer_size": len(self.buffer),
            "metrics": dict(self.metrics)
        }


# Transformation Service
class TransformationService(BaseDataService):
    """
    Handles data transformation and enrichment
    Responsibilities:
    - Apply transformation logic
    - Data enrichment with lookup data
    - Schema conformance
    - Quality checks during transformation
    """

    def __init__(self, event_bus: EventBus):
        super().__init__("transformation-service", event_bus)
        self.transformations: Dict[str, Callable] = {}
        self.lookup_data: Dict[str, Dict] = {}

        # Subscribe to ingestion events
        event_bus.subscribe("ingestion-service.batch_ready",
                           self._handle_batch_ready)

    def register_transformation(self, name: str,
                               transform_fn: Callable[[dict], dict]):
        """Register a transformation function"""
        self.transformations[name] = transform_fn

    def load_lookup(self, lookup_name: str, data: Dict[str, Any]):
        """Load lookup data for enrichment"""
        self.lookup_data[lookup_name] = data

    def _handle_batch_ready(self, event: dict):
        """Handle incoming batch from ingestion service"""
        records = event["payload"]["records"]
        self.transform_batch(records)

    def transform_batch(self, records: List[dict]) -> ServiceResponse:
        """
        Transform a batch of records

        Applies all registered transformations in sequence
        """
        transformed = []
        errors = []

        for record_dict in records:
            try:
                result = record_dict.copy()

                # Apply each transformation
                for name, transform_fn in self.transformations.items():
                    result["payload"] = transform_fn(result["payload"])

                # Add transformation metadata
                result["metadata"]["transformed_at"] = datetime.utcnow().isoformat()
                result["metadata"]["transformations_applied"] = list(
                    self.transformations.keys()
                )

                transformed.append(result)
                self.emit_metric("records_transformed")

            except Exception as e:
                errors.append({
                    "record_id": record_dict.get("record_id"),
                    "error": str(e)
                })
                self.emit_metric("transformation_errors")

        # Emit transformed batch
        if transformed:
            self.emit_event("batch_transformed", {
                "record_count": len(transformed),
                "records": transformed
            })

        return ServiceResponse(
            success=len(errors) == 0,
            data={
                "transformed": len(transformed),
                "errors": len(errors)
            },
            metadata={"errors": errors} if errors else {}
        )

    def enrich(self, record: dict, lookup_name: str,
               key_field: str, target_field: str) -> dict:
        """Enrich a record with lookup data"""
        if lookup_name not in self.lookup_data:
            return record

        key = record["payload"].get(key_field)
        if key and key in self.lookup_data[lookup_name]:
            record["payload"][target_field] = self.lookup_data[lookup_name][key]

        return record

    def health_check(self) -> dict:
        return {
            "service": self.service_name,
            "status": "healthy",
            "uptime_seconds": (datetime.utcnow() - self.started_at).total_seconds(),
            "transformations_registered": list(self.transformations.keys()),
            "lookups_loaded": list(self.lookup_data.keys()),
            "metrics": dict(self.metrics)
        }


# Data Quality Service
class DataQualityService(BaseDataService):
    """
    Handles data quality validation and monitoring
    Responsibilities:
    - Apply quality rules
    - Track quality metrics over time
    - Alert on quality degradation
    - Quarantine bad records
    """

    def __init__(self, event_bus: EventBus):
        super().__init__("quality-service", event_bus)
        self.rules: Dict[str, Callable[[dict], bool]] = {}
        self.quality_history: List[dict] = []
        self.quarantine: List[dict] = []

        # Subscribe to transformation events
        event_bus.subscribe("transformation-service.batch_transformed",
                           self._handle_batch_transformed)

    def register_rule(self, rule_name: str,
                      rule_fn: Callable[[dict], bool],
                      severity: str = "error"):
        """Register a quality rule"""
        self.rules[rule_name] = {
            "check": rule_fn,
            "severity": severity
        }

    def _handle_batch_transformed(self, event: dict):
        """Handle incoming batch from transformation service"""
        records = event["payload"]["records"]
        self.validate_batch(records)

    def validate_batch(self, records: List[dict]) -> ServiceResponse:
        """
        Validate a batch of records against all rules
        """
        passed = []
        failed = []

        batch_quality = {
            "timestamp": datetime.utcnow().isoformat(),
            "total_records": len(records),
            "passed": 0,
            "failed": 0,
            "rule_results": {}
        }

        for record in records:
            record_valid = True
            violations = []

            for rule_name, rule_info in self.rules.items():
                try:
                    if not rule_info["check"](record["payload"]):
                        violations.append({
                            "rule": rule_name,
                            "severity": rule_info["severity"]
                        })
                        if rule_info["severity"] == "error":
                            record_valid = False

                        # Track per-rule metrics
                        if rule_name not in batch_quality["rule_results"]:
                            batch_quality["rule_results"][rule_name] = {
                                "passed": 0, "failed": 0
                            }
                        batch_quality["rule_results"][rule_name]["failed"] += 1
                    else:
                        if rule_name not in batch_quality["rule_results"]:
                            batch_quality["rule_results"][rule_name] = {
                                "passed": 0, "failed": 0
                            }
                        batch_quality["rule_results"][rule_name]["passed"] += 1

                except Exception as e:
                    violations.append({
                        "rule": rule_name,
                        "severity": "error",
                        "exception": str(e)
                    })
                    record_valid = False

            if record_valid:
                record["metadata"]["quality_validated"] = True
                passed.append(record)
                batch_quality["passed"] += 1
                self.emit_metric("records_passed_quality")
            else:
                record["metadata"]["quality_violations"] = violations
                self.quarantine.append(record)
                failed.append(record)
                batch_quality["failed"] += 1
                self.emit_metric("records_failed_quality")

        # Store quality metrics
        self.quality_history.append(batch_quality)

        # Emit events
        if passed:
            self.emit_event("batch_validated", {
                "record_count": len(passed),
                "records": passed
            })

        if failed:
            self.emit_event("records_quarantined", {
                "record_count": len(failed),
                "records": failed
            })

        # Calculate pass rate and alert if too low
        pass_rate = batch_quality["passed"] / batch_quality["total_records"]
        if pass_rate < 0.95:  # Alert threshold
            self.emit_event("quality_alert", {
                "pass_rate": pass_rate,
                "threshold": 0.95,
                "batch_quality": batch_quality
            })

        return ServiceResponse(
            success=True,
            data=batch_quality
        )

    def get_quality_trend(self, last_n_batches: int = 10) -> List[dict]:
        """Get quality metrics for recent batches"""
        return self.quality_history[-last_n_batches:]

    def health_check(self) -> dict:
        return {
            "service": self.service_name,
            "status": "healthy",
            "uptime_seconds": (datetime.utcnow() - self.started_at).total_seconds(),
            "rules_registered": list(self.rules.keys()),
            "quarantine_size": len(self.quarantine),
            "metrics": dict(self.metrics)
        }


# Serving Service
class ServingService(BaseDataService):
    """
    Handles data serving to consumers
    Responsibilities:
    - Store processed data
    - Provide query APIs
    - Manage access patterns
    - Cache frequently accessed data
    """

    def __init__(self, event_bus: EventBus):
        super().__init__("serving-service", event_bus)
        self.storage: Dict[str, dict] = {}  # Simple key-value store
        self.indices: Dict[str, Dict[str, List[str]]] = {}
        self.cache: Dict[str, dict] = {}
        self.cache_ttl = 300  # seconds

        # Subscribe to quality service events
        event_bus.subscribe("quality-service.batch_validated",
                           self._handle_batch_validated)

    def _handle_batch_validated(self, event: dict):
        """Handle incoming validated batch"""
        records = event["payload"]["records"]
        for record in records:
            self.store(record)

    def store(self, record: dict):
        """Store a record"""
        record_id = record["record_id"]
        self.storage[record_id] = record
        self.emit_metric("records_stored")

        # Update indices
        self._update_indices(record)

    def _update_indices(self, record: dict):
        """Update search indices"""
        # Index by source
        source = record.get("source", "unknown")
        if "source" not in self.indices:
            self.indices["source"] = {}
        if source not in self.indices["source"]:
            self.indices["source"][source] = []
        self.indices["source"][source].append(record["record_id"])

    def get_by_id(self, record_id: str) -> ServiceResponse:
        """Get a record by ID"""
        # Check cache first
        cache_key = f"id:{record_id}"
        if cache_key in self.cache:
            self.emit_metric("cache_hits")
            return ServiceResponse(
                success=True,
                data=self.cache[cache_key],
                metadata={"cache_hit": True}
            )

        self.emit_metric("cache_misses")

        if record_id in self.storage:
            record = self.storage[record_id]
            self.cache[cache_key] = record
            return ServiceResponse(
                success=True,
                data=record,
                metadata={"cache_hit": False}
            )

        return ServiceResponse(
            success=False,
            error=f"Record not found: {record_id}"
        )

    def query(self, filters: dict, limit: int = 100) -> ServiceResponse:
        """
        Query records with filters

        Args:
            filters: Dictionary of field -> value filters
            limit: Maximum records to return
        """
        results = []

        for record_id, record in self.storage.items():
            if len(results) >= limit:
                break

            matches = True
            for field, value in filters.items():
                if field == "source":
                    if record.get("source") != value:
                        matches = False
                        break
                elif field in record.get("payload", {}):
                    if record["payload"][field] != value:
                        matches = False
                        break

            if matches:
                results.append(record)

        self.emit_metric("queries_executed")

        return ServiceResponse(
            success=True,
            data=results,
            metadata={"total_results": len(results), "limit": limit}
        )

    def health_check(self) -> dict:
        return {
            "service": self.service_name,
            "status": "healthy",
            "uptime_seconds": (datetime.utcnow() - self.started_at).total_seconds(),
            "records_stored": len(self.storage),
            "cache_size": len(self.cache),
            "metrics": dict(self.metrics)
        }


# Usage Example - Putting it all together
if __name__ == "__main__":
    print("=== Data Platform Microservices Demo ===\n")

    # Initialize shared infrastructure
    event_bus = EventBus()
    registry = ServiceRegistry()

    # Initialize services
    ingestion_svc = IngestionService(event_bus)
    transform_svc = TransformationService(event_bus)
    quality_svc = DataQualityService(event_bus)
    serving_svc = ServingService(event_bus)

    # Register services
    registry.register("ingestion", ingestion_svc)
    registry.register("transformation", transform_svc)
    registry.register("quality", quality_svc)
    registry.register("serving", serving_svc)

    # Configure ingestion connector
    def api_connector(config: dict) -> List[dict]:
        """Simulated API connector"""
        return [
            {"user_id": "U001", "event": "purchase", "amount": 99.99},
            {"user_id": "U002", "event": "purchase", "amount": 149.99},
            {"user_id": "U003", "event": "purchase", "amount": -10.0},  # Invalid
        ]

    ingestion_svc.register_connector("api", api_connector)

    # Configure transformations
    def normalize_amount(payload: dict) -> dict:
        """Normalize amount to 2 decimal places"""
        if "amount" in payload:
            payload["amount"] = round(float(payload["amount"]), 2)
        return payload

    def add_timestamp(payload: dict) -> dict:
        """Add processing timestamp"""
        payload["processed_at"] = datetime.utcnow().isoformat()
        return payload

    transform_svc.register_transformation("normalize_amount", normalize_amount)
    transform_svc.register_transformation("add_timestamp", add_timestamp)

    # Configure quality rules
    quality_svc.register_rule(
        "positive_amount",
        lambda p: p.get("amount", 0) > 0,
        severity="error"
    )
    quality_svc.register_rule(
        "valid_event_type",
        lambda p: p.get("event") in ["purchase", "refund", "view"],
        severity="warning"
    )

    # Execute the pipeline
    print("1. Ingesting data...")
    result = ingestion_svc.ingest("api", {"name": "events-api", "schema_version": "1.0.0"})
    print(f"   Ingestion result: {result.data}")

    # Flush buffer to trigger downstream processing
    ingestion_svc._flush_buffer()

    print("\n2. Checking service health...")
    health = registry.health_check()
    for service, status in health.items():
        print(f"   {service}: {status['status']} "
              f"(metrics: {status.get('metrics', {})})")

    print("\n3. Querying served data...")
    query_result = serving_svc.query({"source": "api:events-api"})
    print(f"   Found {len(query_result.data)} records")

    print("\n4. Quality trend...")
    trend = quality_svc.get_quality_trend()
    for batch in trend:
        print(f"   Batch: {batch['passed']}/{batch['total_records']} passed")

    print("\n5. Event bus activity...")
    print(f"   Total events: {len(event_bus.events)}")
    for event in event_bus.events[:5]:
        print(f"   - {event['topic']}")
```

### Real-world Application

**Data Platform at a Fintech Company**

A fintech company rebuilt their data platform using microservices architecture:

**Services Implemented:**
1. **Ingestion Service**: Handles CDC from PostgreSQL, Kafka streams, and REST API pulls
2. **Schema Service**: Wraps Confluent Schema Registry with custom validation
3. **Transform Service**: Runs dbt models with proper isolation and versioning
4. **Quality Service**: Integrates Great Expectations with custom business rules
5. **Catalog Service**: Custom wrapper around Apache Atlas for metadata management
6. **Serving Service**: GraphQL API layer over the data lake

**Benefits Realized:**
- Deployment frequency increased from weekly to multiple times per day
- Mean time to recovery (MTTR) decreased by 70% due to isolated failures
- Teams could independently evolve their services
- Easy A/B testing of new transformation logic

### Learning Resources

- [Building Microservices by Sam Newman](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/) - Foundational microservices book
- [The Data Mesh by Zhamak Dehghani](https://www.oreilly.com/library/view/data-mesh/9781492092384/) - Data platform decentralization
- [Kubernetes Documentation](https://kubernetes.io/docs/home/) - Container orchestration for microservices
- [Netflix Tech Blog](https://netflixtechblog.com/) - Data platform architecture at scale
- [Uber Engineering Blog](https://www.uber.com/blog/engineering/) - Real-time data platform patterns

### Difficulty Level

**Advanced**

Requires understanding of distributed systems, API design, containerization, and operational concerns. Successfully implementing microservices for data platforms requires experience with both software engineering and data engineering practices.

---

## 5. Stream Processing Architectures

### What is it?

Stream processing is a data processing paradigm that handles continuous data flows in real-time or near-real-time, as opposed to batch processing that operates on bounded datasets. Stream processing architectures enable organizations to derive insights and take actions as events occur.

**Core Concepts:**

- **Event Time vs Processing Time**: When an event occurred vs when it's processed
- **Windows**: Bounded intervals for aggregating unbounded streams (tumbling, sliding, session)
- **Watermarks**: Mechanisms to handle late-arriving data
- **State Management**: Maintaining computation state across events
- **Exactly-Once Semantics**: Guaranteeing each event is processed exactly once

**Major Stream Processing Frameworks:**

- **Apache Kafka Streams**: Library for building streaming applications on Kafka
- **Apache Flink**: Distributed stream processing with advanced state management
- **Apache Spark Structured Streaming**: Unified batch and stream processing
- **Apache Beam**: Portable programming model across multiple runners

**Common Stream Processing Patterns:**

- **Filtering**: Remove events that don't match criteria
- **Mapping/Transformation**: Transform event structure or values
- **Aggregation**: Compute statistics over windows (count, sum, average)
- **Joining**: Combine streams based on keys and time windows
- **Pattern Detection**: Identify sequences of events matching patterns

### Why it matters for Data Engineers

Stream processing is essential for modern data platforms because:

1. **Latency**: Enables sub-second response times for time-sensitive applications
2. **Freshness**: Provides up-to-the-moment data for dashboards and ML models
3. **Volume**: Handles high-throughput data without storage bottlenecks
4. **Event-Driven Applications**: Powers real-time features and automation
5. **Kappa Architecture**: Simplifies architecture by treating batch as a special case of streaming

### Prerequisites

- Understanding of event-driven architectures and Kafka
- Familiarity with distributed systems concepts
- Knowledge of time series data concepts
- Experience with functional programming paradigms

### Implementation Example

```python
"""
Stream Processing Architecture Example
Demonstrates windowing, state management, and exactly-once semantics
using a simplified streaming framework inspired by Flink/Kafka Streams
"""
from dataclasses import dataclass, field
from typing import Any, Optional, List, Dict, Callable, Generic, TypeVar
from datetime import datetime, timedelta
from collections import defaultdict
from enum import Enum
from abc import ABC, abstractmethod
import heapq
import json
import time
import threading
from queue import Queue


T = TypeVar('T')
K = TypeVar('K')
V = TypeVar('V')


# Time handling
@dataclass
class Timestamp:
    """Represents event or processing time"""
    value: datetime

    @classmethod
    def now(cls) -> 'Timestamp':
        return cls(datetime.utcnow())

    @classmethod
    def from_epoch_ms(cls, ms: int) -> 'Timestamp':
        return cls(datetime.utcfromtimestamp(ms / 1000))

    def to_epoch_ms(self) -> int:
        return int(self.value.timestamp() * 1000)


@dataclass
class StreamRecord(Generic[T]):
    """A record in the stream with metadata"""
    key: Optional[str]
    value: T
    timestamp: Timestamp
    headers: Dict[str, str] = field(default_factory=dict)


# Windowing
class WindowType(Enum):
    TUMBLING = "tumbling"  # Fixed, non-overlapping windows
    SLIDING = "sliding"    # Fixed, overlapping windows
    SESSION = "session"    # Dynamic, gap-based windows


@dataclass
class Window:
    """Represents a time window"""
    start: Timestamp
    end: Timestamp
    window_type: WindowType

    def contains(self, timestamp: Timestamp) -> bool:
        return self.start.value <= timestamp.value < self.end.value

    def __hash__(self):
        return hash((self.start.to_epoch_ms(), self.end.to_epoch_ms()))


class WindowAssigner:
    """Assigns events to windows"""

    @staticmethod
    def tumbling(size: timedelta) -> Callable[[Timestamp], List[Window]]:
        """Create tumbling window assigner"""
        def assign(timestamp: Timestamp) -> List[Window]:
            size_ms = int(size.total_seconds() * 1000)
            ts_ms = timestamp.to_epoch_ms()
            window_start_ms = (ts_ms // size_ms) * size_ms
            return [Window(
                start=Timestamp.from_epoch_ms(window_start_ms),
                end=Timestamp.from_epoch_ms(window_start_ms + size_ms),
                window_type=WindowType.TUMBLING
            )]
        return assign

    @staticmethod
    def sliding(size: timedelta, slide: timedelta) -> Callable[[Timestamp], List[Window]]:
        """Create sliding window assigner"""
        def assign(timestamp: Timestamp) -> List[Window]:
            size_ms = int(size.total_seconds() * 1000)
            slide_ms = int(slide.total_seconds() * 1000)
            ts_ms = timestamp.to_epoch_ms()

            windows = []
            # Find all windows that contain this timestamp
            last_start = (ts_ms // slide_ms) * slide_ms
            first_start = last_start - size_ms + slide_ms

            current_start = first_start
            while current_start <= last_start:
                if current_start + size_ms > ts_ms:
                    windows.append(Window(
                        start=Timestamp.from_epoch_ms(current_start),
                        end=Timestamp.from_epoch_ms(current_start + size_ms),
                        window_type=WindowType.SLIDING
                    ))
                current_start += slide_ms

            return windows
        return assign


# State Management
class StateBackend(ABC):
    """Abstract state backend for stream processing"""

    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        pass

    @abstractmethod
    def put(self, key: str, value: Any):
        pass

    @abstractmethod
    def delete(self, key: str):
        pass


class InMemoryStateBackend(StateBackend):
    """In-memory state backend (for demonstration)"""

    def __init__(self):
        self.state: Dict[str, Any] = {}
        self.checkpoints: List[Dict[str, Any]] = []

    def get(self, key: str) -> Optional[Any]:
        return self.state.get(key)

    def put(self, key: str, value: Any):
        self.state[key] = value

    def delete(self, key: str):
        if key in self.state:
            del self.state[key]

    def checkpoint(self) -> int:
        """Create a checkpoint and return checkpoint ID"""
        checkpoint_id = len(self.checkpoints)
        self.checkpoints.append(self.state.copy())
        return checkpoint_id

    def restore(self, checkpoint_id: int):
        """Restore state from a checkpoint"""
        if checkpoint_id < len(self.checkpoints):
            self.state = self.checkpoints[checkpoint_id].copy()


# Watermark handling for late data
@dataclass
class Watermark:
    """
    Watermark indicates that no events with timestamp <= watermark
    will arrive in the future
    """
    timestamp: Timestamp

    def is_late(self, event_time: Timestamp) -> bool:
        return event_time.value < self.timestamp.value


class WatermarkGenerator:
    """Generates watermarks based on observed event times"""

    def __init__(self, max_out_of_orderness: timedelta):
        self.max_out_of_orderness = max_out_of_orderness
        self.max_timestamp = Timestamp(datetime.min)

    def observe(self, timestamp: Timestamp):
        """Observe an event timestamp"""
        if timestamp.value > self.max_timestamp.value:
            self.max_timestamp = timestamp

    def current_watermark(self) -> Watermark:
        """Get current watermark"""
        watermark_time = self.max_timestamp.value - self.max_out_of_orderness
        return Watermark(Timestamp(watermark_time))


# Stream Processing Operators
class StreamOperator(ABC, Generic[T]):
    """Base class for stream operators"""

    def __init__(self, state_backend: StateBackend):
        self.state = state_backend
        self.downstream: List['StreamOperator'] = []
        self.metrics = defaultdict(int)

    def add_downstream(self, operator: 'StreamOperator'):
        self.downstream.append(operator)

    @abstractmethod
    def process(self, record: StreamRecord[T]):
        pass

    def emit(self, record: StreamRecord):
        """Emit record to downstream operators"""
        for operator in self.downstream:
            operator.process(record)


class MapOperator(StreamOperator[T]):
    """Transforms each record"""

    def __init__(self, map_fn: Callable[[T], Any], state_backend: StateBackend):
        super().__init__(state_backend)
        self.map_fn = map_fn

    def process(self, record: StreamRecord[T]):
        result = self.map_fn(record.value)
        self.emit(StreamRecord(
            key=record.key,
            value=result,
            timestamp=record.timestamp,
            headers=record.headers
        ))
        self.metrics["records_processed"] += 1


class FilterOperator(StreamOperator[T]):
    """Filters records based on predicate"""

    def __init__(self, predicate: Callable[[T], bool], state_backend: StateBackend):
        super().__init__(state_backend)
        self.predicate = predicate

    def process(self, record: StreamRecord[T]):
        if self.predicate(record.value):
            self.emit(record)
            self.metrics["records_passed"] += 1
        else:
            self.metrics["records_filtered"] += 1


class KeyByOperator(StreamOperator[T]):
    """Partitions stream by key"""

    def __init__(self, key_selector: Callable[[T], str], state_backend: StateBackend):
        super().__init__(state_backend)
        self.key_selector = key_selector

    def process(self, record: StreamRecord[T]):
        key = self.key_selector(record.value)
        self.emit(StreamRecord(
            key=key,
            value=record.value,
            timestamp=record.timestamp,
            headers=record.headers
        ))


class WindowedAggregateOperator(StreamOperator[T]):
    """
    Aggregates records within windows
    Supports late data handling and watermarks
    """

    def __init__(self,
                 window_assigner: Callable[[Timestamp], List[Window]],
                 aggregate_fn: Callable[[Any, T], Any],
                 initial_value: Any,
                 state_backend: StateBackend,
                 allowed_lateness: timedelta = timedelta(0)):
        super().__init__(state_backend)
        self.window_assigner = window_assigner
        self.aggregate_fn = aggregate_fn
        self.initial_value = initial_value
        self.allowed_lateness = allowed_lateness
        self.watermark_generator = WatermarkGenerator(timedelta(seconds=10))

        # Window state: window -> key -> accumulated value
        self.window_state: Dict[Window, Dict[str, Any]] = defaultdict(
            lambda: defaultdict(lambda: self.initial_value)
        )
        # Fired windows for deduplication
        self.fired_windows: set = set()

    def process(self, record: StreamRecord[T]):
        # Update watermark
        self.watermark_generator.observe(record.timestamp)
        current_watermark = self.watermark_generator.current_watermark()

        # Assign to windows
        windows = self.window_assigner(record.timestamp)

        for window in windows:
            # Check if within allowed lateness
            lateness_deadline = window.end.value + self.allowed_lateness
            if record.timestamp.value <= lateness_deadline:
                # Aggregate into window
                key = record.key or "__default__"
                current_value = self.window_state[window][key]
                new_value = self.aggregate_fn(current_value, record.value)
                self.window_state[window][key] = new_value
                self.metrics["records_aggregated"] += 1
            else:
                self.metrics["records_dropped_late"] += 1

        # Fire windows that are complete (watermark passed window end)
        self._fire_complete_windows(current_watermark)

    def _fire_complete_windows(self, watermark: Watermark):
        """Emit results for windows that are complete"""
        windows_to_fire = []

        for window in self.window_state:
            window_key = (window.start.to_epoch_ms(), window.end.to_epoch_ms())
            if (window.end.value <= watermark.timestamp.value and
                window_key not in self.fired_windows):
                windows_to_fire.append(window)

        for window in windows_to_fire:
            window_key = (window.start.to_epoch_ms(), window.end.to_epoch_ms())

            for key, value in self.window_state[window].items():
                self.emit(StreamRecord(
                    key=key,
                    value={
                        "window_start": window.start.value.isoformat(),
                        "window_end": window.end.value.isoformat(),
                        "key": key,
                        "result": value
                    },
                    timestamp=window.end,
                    headers={"window_type": window.window_type.value}
                ))

            self.fired_windows.add(window_key)
            self.metrics["windows_fired"] += 1


class JoinOperator(StreamOperator[T]):
    """
    Joins two streams on key within a time window
    Implements interval join semantics
    """

    def __init__(self,
                 state_backend: StateBackend,
                 join_window: timedelta):
        super().__init__(state_backend)
        self.join_window = join_window
        # Buffered records: key -> [(timestamp, value)]
        self.left_buffer: Dict[str, List[tuple]] = defaultdict(list)
        self.right_buffer: Dict[str, List[tuple]] = defaultdict(list)

    def process_left(self, record: StreamRecord[T]):
        """Process record from left stream"""
        key = record.key
        ts = record.timestamp.to_epoch_ms()

        # Store in buffer
        self.left_buffer[key].append((ts, record.value))

        # Try to join with right buffer
        self._try_join(key, ts, record.value, is_left=True)

        # Clean old records
        self._clean_buffer(self.left_buffer[key], ts)

    def process_right(self, record: StreamRecord[T]):
        """Process record from right stream"""
        key = record.key
        ts = record.timestamp.to_epoch_ms()

        self.right_buffer[key].append((ts, record.value))
        self._try_join(key, ts, record.value, is_left=False)
        self._clean_buffer(self.right_buffer[key], ts)

    def process(self, record: StreamRecord[T]):
        # Default: process as left stream
        self.process_left(record)

    def _try_join(self, key: str, ts: int, value: Any, is_left: bool):
        """Try to join with records from the other stream"""
        other_buffer = self.right_buffer[key] if is_left else self.left_buffer[key]
        window_ms = int(self.join_window.total_seconds() * 1000)

        for other_ts, other_value in other_buffer:
            if abs(ts - other_ts) <= window_ms:
                # Found a match
                left_value = value if is_left else other_value
                right_value = other_value if is_left else value

                self.emit(StreamRecord(
                    key=key,
                    value={
                        "left": left_value,
                        "right": right_value,
                        "join_time_diff_ms": abs(ts - other_ts)
                    },
                    timestamp=Timestamp.from_epoch_ms(max(ts, other_ts)),
                    headers={}
                ))
                self.metrics["successful_joins"] += 1

    def _clean_buffer(self, buffer: List[tuple], current_ts: int):
        """Remove records outside the join window"""
        window_ms = int(self.join_window.total_seconds() * 1000)
        buffer[:] = [(ts, v) for ts, v in buffer if current_ts - ts <= window_ms * 2]


class SinkOperator(StreamOperator[T]):
    """Terminal operator that outputs results"""

    def __init__(self, sink_fn: Callable[[StreamRecord], None],
                 state_backend: StateBackend):
        super().__init__(state_backend)
        self.sink_fn = sink_fn

    def process(self, record: StreamRecord[T]):
        self.sink_fn(record)
        self.metrics["records_output"] += 1


# Stream Processing Application
class StreamingApplication:
    """
    Assembles and runs a streaming application
    """

    def __init__(self, app_name: str):
        self.app_name = app_name
        self.state_backend = InMemoryStateBackend()
        self.source_operators: List[StreamOperator] = []
        self.all_operators: List[StreamOperator] = []
        self.running = False
        self.checkpoint_interval = timedelta(seconds=60)

    def source(self, source_fn: Callable[[], StreamRecord]) -> StreamOperator:
        """Create a source operator"""
        class SourceOperator(StreamOperator):
            def __init__(self, source_fn, state_backend):
                super().__init__(state_backend)
                self.source_fn = source_fn

            def process(self, record):
                pass  # Sources don't receive input

            def produce(self) -> Optional[StreamRecord]:
                return self.source_fn()

        op = SourceOperator(source_fn, self.state_backend)
        self.source_operators.append(op)
        self.all_operators.append(op)
        return op

    def get_metrics(self) -> Dict[str, Dict[str, int]]:
        """Get metrics from all operators"""
        return {
            f"operator_{i}": dict(op.metrics)
            for i, op in enumerate(self.all_operators)
        }

    def checkpoint(self):
        """Create a checkpoint of all state"""
        checkpoint_id = self.state_backend.checkpoint()
        print(f"Checkpoint {checkpoint_id} created")
        return checkpoint_id


# Usage Example
if __name__ == "__main__":
    print("=== Stream Processing Architecture Demo ===\n")

    # Create application
    app = StreamingApplication("click-analytics")

    # Simulated click events
    click_events = [
        {"user_id": "U001", "page": "/home", "timestamp": 1000},
        {"user_id": "U001", "page": "/products", "timestamp": 2000},
        {"user_id": "U002", "page": "/home", "timestamp": 1500},
        {"user_id": "U001", "page": "/checkout", "timestamp": 5000},
        {"user_id": "U002", "page": "/products", "timestamp": 3000},
        {"user_id": "U003", "page": "/home", "timestamp": 8000},
        {"user_id": "U001", "page": "/confirmation", "timestamp": 6000},
    ]

    event_iter = iter(click_events)

    def click_source() -> Optional[StreamRecord]:
        try:
            event = next(event_iter)
            return StreamRecord(
                key=event["user_id"],
                value=event,
                timestamp=Timestamp.from_epoch_ms(event["timestamp"])
            )
        except StopIteration:
            return None

    # Build processing pipeline
    state = InMemoryStateBackend()

    # 1. Key by user
    key_by = KeyByOperator(lambda e: e["user_id"], state)

    # 2. Window aggregate: count clicks per user per 5-second tumbling window
    windowed_count = WindowedAggregateOperator(
        window_assigner=WindowAssigner.tumbling(timedelta(seconds=5)),
        aggregate_fn=lambda acc, e: acc + 1,
        initial_value=0,
        state_backend=state,
        allowed_lateness=timedelta(seconds=2)
    )

    # 3. Sink to print results
    results = []
    def collect_result(record: StreamRecord):
        results.append(record.value)
        print(f"Window Result: {record.value}")

    sink = SinkOperator(collect_result, state)

    # Connect operators
    key_by.add_downstream(windowed_count)
    windowed_count.add_downstream(sink)

    print("Processing click events...\n")

    # Process events
    while True:
        record = click_source()
        if record is None:
            break
        print(f"Processing: {record.value}")
        key_by.process(record)

    # Force fire remaining windows with a late watermark
    late_watermark = Watermark(Timestamp.from_epoch_ms(100000))
    windowed_count._fire_complete_windows(late_watermark)

    print(f"\n--- Results Summary ---")
    print(f"Total windows fired: {windowed_count.metrics['windows_fired']}")
    print(f"Records aggregated: {windowed_count.metrics['records_aggregated']}")

    # Demonstrate sliding windows
    print("\n=== Sliding Window Example ===\n")

    sliding_state = InMemoryStateBackend()
    sliding_window = WindowedAggregateOperator(
        window_assigner=WindowAssigner.sliding(
            size=timedelta(seconds=10),
            slide=timedelta(seconds=5)
        ),
        aggregate_fn=lambda acc, e: acc + e.get("amount", 0),
        initial_value=0.0,
        state_backend=sliding_state
    )

    sliding_results = []
    sliding_sink = SinkOperator(
        lambda r: sliding_results.append(r.value),
        sliding_state
    )
    sliding_window.add_downstream(sliding_sink)

    # Transaction events
    transactions = [
        {"amount": 100, "timestamp": 1000},
        {"amount": 200, "timestamp": 3000},
        {"amount": 150, "timestamp": 7000},
        {"amount": 300, "timestamp": 12000},
    ]

    for txn in transactions:
        record = StreamRecord(
            key="total",
            value=txn,
            timestamp=Timestamp.from_epoch_ms(txn["timestamp"])
        )
        sliding_window.process(record)

    # Fire windows
    sliding_window._fire_complete_windows(
        Watermark(Timestamp.from_epoch_ms(50000))
    )

    print("Sliding window results (overlapping windows):")
    for result in sliding_results:
        print(f"  Window [{result['window_start']} - {result['window_end']}]: "
              f"sum = {result['result']}")

    # Demonstrate stream join
    print("\n=== Stream Join Example ===\n")

    join_state = InMemoryStateBackend()
    join_op = JoinOperator(join_state, join_window=timedelta(seconds=5))

    join_results = []
    join_sink = SinkOperator(
        lambda r: join_results.append(r.value),
        join_state
    )
    join_op.add_downstream(join_sink)

    # Order stream (left)
    orders = [
        {"order_id": "O1", "product": "Widget", "timestamp": 1000},
        {"order_id": "O2", "product": "Gadget", "timestamp": 3000},
    ]

    # Shipment stream (right)
    shipments = [
        {"order_id": "O1", "carrier": "FedEx", "timestamp": 2000},
        {"order_id": "O2", "carrier": "UPS", "timestamp": 8000},  # Outside window
    ]

    for order in orders:
        record = StreamRecord(
            key=order["order_id"],
            value=order,
            timestamp=Timestamp.from_epoch_ms(order["timestamp"])
        )
        join_op.process_left(record)

    for shipment in shipments:
        record = StreamRecord(
            key=shipment["order_id"],
            value=shipment,
            timestamp=Timestamp.from_epoch_ms(shipment["timestamp"])
        )
        join_op.process_right(record)

    print("Join results:")
    for result in join_results:
        print(f"  Joined: {result['left']['product']} shipped via "
              f"{result['right']['carrier']} "
              f"(time diff: {result['join_time_diff_ms']}ms)")

    print(f"\nSuccessful joins: {join_op.metrics['successful_joins']}")
    print("Note: O2 shipment didn't join (outside 5-second window)")
```

### Real-world Application

**Real-Time Fraud Detection at a Payment Processor**

A payment processor uses stream processing to detect fraudulent transactions in real-time:

**Architecture:**
1. **Ingestion Layer**: Kafka receives transaction events from all payment channels
2. **Feature Extraction**: Flink job computes real-time features (transaction velocity, amount patterns, location changes)
3. **Windowed Aggregation**: Rolling 1-hour and 24-hour aggregates per user using sliding windows
4. **Pattern Detection**: CEP (Complex Event Processing) identifies suspicious sequences
5. **ML Scoring**: Real-time model inference adds fraud probability score
6. **Decision Engine**: Rules engine + ML score determines transaction disposition

**Key Patterns Used:**
- Session windows for detecting rapid transaction bursts
- Interval joins between transaction and device fingerprint streams
- Watermarks with 30-second allowed lateness for mobile transactions
- Exactly-once semantics via Flink checkpointing

**Results:**
- Fraud detection latency: < 100ms
- False positive rate reduced by 40% vs batch system
- $50M+ in prevented fraud annually

### Learning Resources

- [Apache Flink Documentation](https://flink.apache.org/docs/stable/) - Production-grade stream processing
- [Kafka Streams Documentation](https://kafka.apache.org/documentation/streams/) - Library-based stream processing
- [Streaming Systems by Tyler Akidau](https://www.oreilly.com/library/view/streaming-systems/9781491983867/) - Definitive guide to stream processing
- [Apache Beam Programming Guide](https://beam.apache.org/documentation/programming-guide/) - Unified batch and streaming
- [Confluent Blog](https://www.confluent.io/blog/) - Stream processing patterns and best practices

### Difficulty Level

**Advanced**

Stream processing requires understanding of distributed systems, time semantics, state management, and failure handling. Building production-grade streaming applications demands expertise in both the conceptual foundations and operational concerns like backpressure, checkpointing, and exactly-once guarantees.

---

## Summary

This document covered five essential architectural patterns for modern data engineering:

1. **Event-Driven Architectures**: Enable real-time data processing through loosely coupled producers and consumers, with Kafka as the predominant event streaming platform.

2. **Data Contracts and Schema Evolution**: Provide formal agreements between data producers and consumers, enabling safe schema changes while maintaining backward/forward compatibility.

3. **Advanced Orchestration Patterns**: Go beyond basic DAGs to handle dynamic workflows, data-aware scheduling, cross-DAG dependencies, and sophisticated backfill operations.

4. **Microservices for Data Platforms**: Apply software engineering best practices to data infrastructure, enabling independent deployment, scaling, and evolution of data capabilities.

5. **Stream Processing Architectures**: Handle unbounded data streams with windowing, state management, and exactly-once semantics for real-time analytics and event-driven applications.

These patterns are not mutually exclusive - modern data platforms typically combine multiple patterns. For example, a streaming pipeline (pattern 5) might use Kafka for event transport (pattern 1), validate data against contracts (pattern 2), be orchestrated with data-aware triggers (pattern 3), and be deployed as independent microservices (pattern 4).

**Key Takeaways:**

- Start with clear interfaces and contracts before building complex integrations
- Design for failure - assume components will fail and plan recovery strategies
- Choose the right tool for each job - not everything needs to be real-time
- Invest in observability - monitoring and debugging distributed systems requires comprehensive instrumentation
- Evolution over revolution - incrementally adopt these patterns based on actual needs

---

## References

### Books

1. Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly Media.
2. Stopford, B. (2018). *Designing Event-Driven Systems*. O'Reilly Media.
3. Akidau, T., Chernyak, S., & Lax, R. (2018). *Streaming Systems*. O'Reilly Media.
4. Newman, S. (2021). *Building Microservices, 2nd Edition*. O'Reilly Media.
5. Dehghani, Z. (2022). *Data Mesh*. O'Reilly Media.

### Documentation

- Apache Kafka: https://kafka.apache.org/documentation/
- Apache Flink: https://flink.apache.org/docs/stable/
- Apache Airflow: https://airflow.apache.org/docs/
- Confluent Platform: https://docs.confluent.io/
- Apache Avro: https://avro.apache.org/docs/current/

### Engineering Blogs

- Netflix Tech Blog: https://netflixtechblog.com/
- Uber Engineering: https://www.uber.com/blog/engineering/
- LinkedIn Engineering: https://engineering.linkedin.com/blog
- Airbnb Engineering: https://medium.com/airbnb-engineering
- Spotify Engineering: https://engineering.atspotify.com/

### Specifications and Standards

- CloudEvents Specification: https://cloudevents.io/
- AsyncAPI: https://www.asyncapi.com/
- OpenAPI: https://www.openapis.org/
- JSON Schema: https://json-schema.org/

### Tools and Frameworks

- Confluent Schema Registry: https://docs.confluent.io/platform/current/schema-registry/
- Great Expectations (Data Quality): https://greatexpectations.io/
- dbt (Data Build Tool): https://docs.getdbt.com/
- Dagster: https://docs.dagster.io/
- Prefect: https://docs.prefect.io/
