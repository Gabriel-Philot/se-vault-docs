# MLOps Fundamentals

## Introduction

MLOps (Machine Learning Operations) bridges the gap between data science experimentation and production-grade ML systems. For data engineers with a solid foundation in OOP, memory management, and design patterns, MLOps represents a natural extension of software engineering principles into the machine learning domain.

This guide focuses on five critical MLOps pillars:
1. **Model Versioning** - Tracking model artifacts and their evolution
2. **Experiment Tracking** - Recording and comparing ML experiments systematically
3. **Feature Stores** - Centralizing feature engineering and serving
4. **Data Versioning** - Managing dataset evolution alongside code
5. **CI/CD for ML** - Automating testing, validation, and deployment of ML systems

Unlike traditional software where code is the primary artifact, ML systems have a **three-way dependency**: code, data, and model artifacts. Your understanding of design patterns (particularly Repository, Factory, and Observer patterns) will help you grasp how these MLOps tools abstract complexity.

---

## 1. Model Versioning

### What is it?

Model versioning is the systematic practice of tracking, storing, and managing different versions of trained machine learning models. It encompasses:

- **Artifact Storage**: Persisting model weights, hyperparameters, and metadata
- **Version Control**: Maintaining a history of model iterations
- **Model Registry**: Cataloging models with lifecycle stages (staging, production, archived)
- **Lineage Tracking**: Recording the data, code, and parameters that produced each model

Two dominant tools in this space are **MLflow** and **DVC (Data Version Control)**.

### Why it matters for Data Engineers

As a data engineer, you likely manage data pipelines that feed ML models. Model versioning matters because:

1. **Reproducibility**: You can recreate any model version given the same inputs
2. **Rollback Capability**: Production issues can be mitigated by reverting to previous versions
3. **Audit Compliance**: Regulated industries require model lineage for compliance
4. **Collaboration**: Teams can work on different model versions simultaneously
5. **A/B Testing**: Deploy multiple versions for comparison in production

Think of it like Git for your compiled binaries, but with rich metadata about the "build environment" (training data, hyperparameters, metrics).

### Prerequisites

- Python 3.8+
- Understanding of serialization (pickle, joblib, ONNX)
- Familiarity with object storage concepts (S3, GCS, Azure Blob)
- Basic SQL knowledge (for metadata stores)

### Implementation Example

#### MLflow Model Registry

```python
"""
MLflow Model Versioning Example
Demonstrates model registration, versioning, and stage transitions.
"""
import mlflow
from mlflow.tracking import MlflowClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
import numpy as np

# Configure MLflow tracking server
# For local development, uses ./mlruns directory
# For production, point to a remote tracking server
mlflow.set_tracking_uri("sqlite:///mlflow.db")
mlflow.set_experiment("iris-classification")

# Prepare data
X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train and log model with MLflow
with mlflow.start_run(run_name="rf-baseline") as run:
    # Log hyperparameters
    params = {
        "n_estimators": 100,
        "max_depth": 5,
        "random_state": 42
    }
    mlflow.log_params(params)

    # Train model
    model = RandomForestClassifier(**params)
    model.fit(X_train, y_train)

    # Log metrics
    train_accuracy = model.score(X_train, y_train)
    test_accuracy = model.score(X_test, y_test)
    mlflow.log_metrics({
        "train_accuracy": train_accuracy,
        "test_accuracy": test_accuracy
    })

    # Log model with signature inference
    from mlflow.models import infer_signature
    signature = infer_signature(X_train, model.predict(X_train))

    model_info = mlflow.sklearn.log_model(
        sk_model=model,
        artifact_path="model",
        signature=signature,
        registered_model_name="IrisClassifier"  # Auto-registers to Model Registry
    )

    print(f"Model URI: {model_info.model_uri}")
    print(f"Run ID: {run.info.run_id}")

# Model Registry Operations
client = MlflowClient()

# Get the latest version
latest_version = client.get_latest_versions("IrisClassifier", stages=["None"])[0]
print(f"Latest Version: {latest_version.version}")

# Transition model to staging
client.transition_model_version_stage(
    name="IrisClassifier",
    version=latest_version.version,
    stage="Staging"
)

# Add model description and tags
client.update_model_version(
    name="IrisClassifier",
    version=latest_version.version,
    description="Baseline RF model for iris classification"
)

client.set_model_version_tag(
    name="IrisClassifier",
    version=latest_version.version,
    key="validation_status",
    value="passed"
)

# Load model for inference (by stage)
staging_model = mlflow.sklearn.load_model("models:/IrisClassifier/Staging")
predictions = staging_model.predict(X_test[:5])
print(f"Predictions: {predictions}")
```

#### DVC Model Versioning

```python
"""
DVC Model Versioning Example
Uses DVC to version control large model files alongside Git.
"""
import os
import pickle
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

# Step 1: Initialize DVC in your Git repository
# Run these commands in terminal:
# $ git init
# $ dvc init
# $ dvc remote add -d myremote s3://my-bucket/dvc-store

# Train model
X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = GradientBoostingClassifier(n_estimators=100, max_depth=3)
model.fit(X_train, y_train)

# Save model locally
os.makedirs("models", exist_ok=True)
model_path = "models/gb_classifier.pkl"

with open(model_path, "wb") as f:
    pickle.dump(model, f)

# Save model metadata
metadata = {
    "accuracy": model.score(X_test, y_test),
    "n_estimators": 100,
    "max_depth": 3,
    "training_samples": len(X_train)
}

import json
with open("models/metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"Model saved to {model_path}")
print(f"Test Accuracy: {metadata['accuracy']:.4f}")

# Step 2: Track with DVC (run in terminal)
# $ dvc add models/gb_classifier.pkl
# $ git add models/gb_classifier.pkl.dvc models/.gitignore
# $ git commit -m "Add v1 gradient boosting model"
# $ dvc push

# Step 3: Create a Git tag for this version
# $ git tag -a v1.0.0 -m "Initial model release"

# Step 4: To retrieve a specific version later:
# $ git checkout v1.0.0
# $ dvc checkout
```

#### DVC Pipeline Definition (dvc.yaml)

```yaml
# dvc.yaml - Defines reproducible ML pipeline stages
stages:
  prepare:
    cmd: python src/prepare_data.py
    deps:
      - src/prepare_data.py
      - data/raw/
    outs:
      - data/processed/train.csv
      - data/processed/test.csv

  train:
    cmd: python src/train.py
    deps:
      - src/train.py
      - data/processed/train.csv
    params:
      - train.n_estimators
      - train.max_depth
    outs:
      - models/model.pkl
    metrics:
      - metrics/scores.json:
          cache: false

  evaluate:
    cmd: python src/evaluate.py
    deps:
      - src/evaluate.py
      - models/model.pkl
      - data/processed/test.csv
    metrics:
      - metrics/evaluation.json:
          cache: false
    plots:
      - metrics/confusion_matrix.csv:
          x: predicted
          y: actual
```

### Real-world Application

**Scenario**: A fintech company deploys fraud detection models that must be audited quarterly. Using MLflow Model Registry:

1. Data engineers register each trained model with full lineage
2. Models progress through stages: `None` -> `Staging` -> `Production` -> `Archived`
3. Compliance team can query any production model's training data version
4. A/B tests compare new model versions against production baseline
5. Automatic rollback triggers if new model performance degrades

**Architecture Pattern**:
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Training    │────>│ Model        │────>│ Model Serving   │
│ Pipeline    │     │ Registry     │     │ (Staging/Prod)  │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                   │                      │
       v                   v                      v
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Experiment  │     │ Artifact     │     │ Monitoring      │
│ Tracking    │     │ Store (S3)   │     │ & Alerting      │
└─────────────┘     └──────────────┘     └─────────────────┘
```

### Learning Resources

| Resource | Type | URL |
|----------|------|-----|
| MLflow Model Registry Docs | Official Docs | https://mlflow.org/docs/latest/model-registry.html |
| DVC Get Started Guide | Official Docs | https://dvc.org/doc/start |
| ML Model Management at Scale (Uber) | Engineering Blog | https://www.uber.com/blog/scaling-michelangelo/ |
| MLflow at Databricks | Case Study | https://www.databricks.com/product/mlflow |
| Thoughtworks MLOps Radar | Industry Analysis | https://www.thoughtworks.com/radar/techniques |

### Difficulty Level

**Intermediate** - Requires understanding of:
- Object serialization and deserialization
- Distributed storage systems
- Git workflows (for DVC)
- Database concepts (for MLflow backend stores)

---

## 2. Experiment Tracking

### What is it?

Experiment tracking is the systematic recording of all inputs, outputs, and metadata from ML experiments. It captures:

- **Parameters**: Hyperparameters, configuration settings
- **Metrics**: Training/validation loss, accuracy, custom metrics over time
- **Artifacts**: Models, plots, data samples, configuration files
- **Environment**: Python version, dependencies, hardware specs
- **Code Version**: Git commit hash, branch information
- **Tags**: Custom labels for organization and filtering

### Why it matters for Data Engineers

1. **Pipeline Debugging**: Trace exactly what data and parameters produced anomalous results
2. **Resource Optimization**: Compare compute costs across different configurations
3. **Knowledge Preservation**: Capture institutional knowledge when team members leave
4. **Automated Decisions**: Build pipelines that auto-select best models based on tracked metrics
5. **Collaboration**: Share experiment results without reproducing runs

For data engineers, experiment tracking integrates with your orchestration tools (Airflow, Prefect, Dagster) to create end-to-end observable ML pipelines.

### Prerequisites

- Understanding of logging and observability concepts
- Familiarity with time-series data
- Basic SQL for querying experiment databases
- REST API concepts (for programmatic access)

### Implementation Example

#### Comprehensive MLflow Tracking

```python
"""
MLflow Experiment Tracking - Comprehensive Example
Demonstrates logging parameters, metrics, artifacts, and custom tracking.
"""
import mlflow
import mlflow.sklearn
from mlflow.models import infer_signature
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)
import json
import tempfile
import os

# Configuration
mlflow.set_tracking_uri("sqlite:///experiments.db")
experiment = mlflow.set_experiment("fraud-detection-experiments")

# Generate synthetic fraud dataset
X, y = make_classification(
    n_samples=10000,
    n_features=20,
    n_informative=15,
    n_redundant=5,
    weights=[0.95, 0.05],  # Imbalanced like real fraud data
    random_state=42
)
feature_names = [f"feature_{i}" for i in range(20)]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# Hyperparameter configurations to try
configs = [
    {"n_estimators": 50, "max_depth": 5, "class_weight": None},
    {"n_estimators": 100, "max_depth": 10, "class_weight": "balanced"},
    {"n_estimators": 200, "max_depth": 15, "class_weight": "balanced_subsample"},
]

def log_experiment(config: dict, run_name: str):
    """Execute and log a single experiment run."""

    with mlflow.start_run(run_name=run_name) as run:
        # 1. Log Parameters
        mlflow.log_params(config)
        mlflow.log_param("train_size", len(X_train))
        mlflow.log_param("test_size", len(X_test))
        mlflow.log_param("positive_ratio", y_train.mean())

        # 2. Log Tags for organization
        mlflow.set_tags({
            "model_type": "RandomForest",
            "dataset": "synthetic_fraud",
            "engineer": "data_team",
            "purpose": "baseline_comparison"
        })

        # 3. Train Model
        model = RandomForestClassifier(**config, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)

        # 4. Log Metrics - Point metrics
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1": f1_score(y_test, y_pred),
        }
        mlflow.log_metrics(metrics)

        # 5. Log Metrics - Training curves (step metrics)
        # Simulate epoch-based logging for illustration
        cv_scores = cross_val_score(model, X_train, y_train, cv=5)
        for i, score in enumerate(cv_scores):
            mlflow.log_metric("cv_accuracy", score, step=i)

        # 6. Log Feature Importance as artifact
        importance_df = pd.DataFrame({
            "feature": feature_names,
            "importance": model.feature_importances_
        }).sort_values("importance", ascending=False)

        with tempfile.TemporaryDirectory() as tmp_dir:
            # Save feature importance CSV
            importance_path = os.path.join(tmp_dir, "feature_importance.csv")
            importance_df.to_csv(importance_path, index=False)
            mlflow.log_artifact(importance_path, "analysis")

            # Save confusion matrix plot
            fig, ax = plt.subplots(figsize=(8, 6))
            cm = confusion_matrix(y_test, y_pred)
            im = ax.imshow(cm, cmap='Blues')
            ax.set_xlabel('Predicted')
            ax.set_ylabel('Actual')
            ax.set_title('Confusion Matrix')
            for i in range(2):
                for j in range(2):
                    ax.text(j, i, cm[i, j], ha='center', va='center')
            plt.colorbar(im)

            plot_path = os.path.join(tmp_dir, "confusion_matrix.png")
            plt.savefig(plot_path, dpi=150, bbox_inches='tight')
            plt.close()
            mlflow.log_artifact(plot_path, "plots")

            # Save classification report
            report = classification_report(y_test, y_pred, output_dict=True)
            report_path = os.path.join(tmp_dir, "classification_report.json")
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=2)
            mlflow.log_artifact(report_path, "analysis")

        # 7. Log Model with signature
        signature = infer_signature(X_train, model.predict(X_train))
        mlflow.sklearn.log_model(
            model,
            "model",
            signature=signature,
            input_example=X_train[:5]
        )

        # 8. Log Dataset info (MLflow 2.x+)
        mlflow.log_input(
            mlflow.data.from_numpy(X_train, targets=y_train),
            context="training"
        )

        print(f"Run {run_name}: F1={metrics['f1']:.4f}, Recall={metrics['recall']:.4f}")
        return run.info.run_id, metrics

# Run experiments
results = []
for i, config in enumerate(configs):
    run_id, metrics = log_experiment(config, f"config_{i+1}")
    results.append({"run_id": run_id, **config, **metrics})

# Query and compare experiments
print("\n" + "="*60)
print("Experiment Comparison")
print("="*60)

from mlflow.tracking import MlflowClient
client = MlflowClient()

# Find best run by F1 score
runs = client.search_runs(
    experiment_ids=[experiment.experiment_id],
    filter_string="metrics.f1 > 0",
    order_by=["metrics.f1 DESC"],
    max_results=5
)

print(f"\nTop runs by F1 score:")
for run in runs:
    print(f"  Run: {run.info.run_name}")
    print(f"    F1: {run.data.metrics['f1']:.4f}")
    print(f"    Recall: {run.data.metrics['recall']:.4f}")
    print(f"    Params: n_estimators={run.data.params['n_estimators']}, "
          f"max_depth={run.data.params['max_depth']}")
    print()
```

#### Weights & Biases Integration (Alternative)

```python
"""
Weights & Biases Experiment Tracking
Alternative to MLflow with rich visualization capabilities.
"""
import wandb
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
import numpy as np

# Initialize W&B
wandb.init(
    project="fraud-detection",
    name="gb-experiment-1",
    config={
        "n_estimators": 100,
        "max_depth": 5,
        "learning_rate": 0.1,
        "architecture": "GradientBoosting",
        "dataset": "synthetic_fraud"
    }
)

# Access config through wandb
config = wandb.config

# Generate data
X, y = make_classification(
    n_samples=5000, n_features=20,
    n_informative=15, weights=[0.95, 0.05],
    random_state=42
)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train with logging
model = GradientBoostingClassifier(
    n_estimators=config.n_estimators,
    max_depth=config.max_depth,
    learning_rate=config.learning_rate
)

# Log training progress
for i in range(config.n_estimators):
    model.n_estimators = i + 1
    model.fit(X_train, y_train)

    train_acc = accuracy_score(y_train, model.predict(X_train))
    val_acc = accuracy_score(y_test, model.predict(X_test))

    # Log metrics at each step
    wandb.log({
        "train_accuracy": train_acc,
        "val_accuracy": val_acc,
        "n_trees": i + 1
    })

# Log final metrics
final_preds = model.predict(X_test)
wandb.log({
    "final_accuracy": accuracy_score(y_test, final_preds),
    "final_f1": f1_score(y_test, final_preds)
})

# Log feature importance as a bar chart
feature_importance = model.feature_importances_
wandb.log({
    "feature_importance": wandb.plot.bar(
        wandb.Table(
            data=[[f"f_{i}", imp] for i, imp in enumerate(feature_importance)],
            columns=["feature", "importance"]
        ),
        "feature", "importance", title="Feature Importance"
    )
})

# Log model artifact
wandb.save("model.pkl")

wandb.finish()
```

### Real-world Application

**Scenario**: An e-commerce company runs hundreds of experiments weekly for recommendation models. Their experiment tracking setup:

1. **Centralized Tracking Server**: MLflow deployed on Kubernetes with PostgreSQL backend
2. **Automated Logging**: Every training job auto-logs via a custom wrapper
3. **Experiment Governance**: Tags enforce metadata standards (owner, purpose, dataset_version)
4. **Automated Reports**: Nightly jobs compare experiments and surface top performers
5. **Integration**: Slack alerts when a model beats production baseline

**Pipeline Integration with Airflow**:

```python
"""
Airflow DAG with MLflow Experiment Tracking Integration
"""
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import mlflow

default_args = {
    'owner': 'data-engineering',
    'depends_on_past': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def train_model(**context):
    """Training task with experiment tracking."""
    mlflow.set_tracking_uri("http://mlflow-server:5000")
    mlflow.set_experiment("airflow-training-pipeline")

    run_date = context['ds']

    with mlflow.start_run(run_name=f"scheduled-{run_date}"):
        mlflow.set_tag("triggered_by", "airflow")
        mlflow.set_tag("execution_date", run_date)
        mlflow.set_tag("dag_id", context['dag'].dag_id)

        # Training logic here...
        mlflow.log_metric("accuracy", 0.95)

        # Push run_id to XCom for downstream tasks
        context['ti'].xcom_push(key='mlflow_run_id', value=mlflow.active_run().info.run_id)

def evaluate_and_register(**context):
    """Evaluate model and register if it beats threshold."""
    run_id = context['ti'].xcom_pull(key='mlflow_run_id')

    client = mlflow.tracking.MlflowClient()
    run = client.get_run(run_id)

    accuracy = run.data.metrics['accuracy']
    if accuracy > 0.90:  # Registration threshold
        mlflow.register_model(
            f"runs:/{run_id}/model",
            "ProductionRecommender"
        )

with DAG(
    'ml_training_pipeline',
    default_args=default_args,
    schedule_interval='@daily',
    start_date=datetime(2025, 1, 1),
    catchup=False,
) as dag:

    train = PythonOperator(
        task_id='train_model',
        python_callable=train_model,
    )

    evaluate = PythonOperator(
        task_id='evaluate_and_register',
        python_callable=evaluate_and_register,
    )

    train >> evaluate
```

### Learning Resources

| Resource | Type | URL |
|----------|------|-----|
| MLflow Tracking Documentation | Official Docs | https://mlflow.org/docs/latest/tracking.html |
| Weights & Biases Docs | Official Docs | https://docs.wandb.ai/ |
| Neptune.ai Experiment Tracking Guide | Tutorial | https://neptune.ai/blog/ml-experiment-tracking |
| Google ML Best Practices | Industry Guide | https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning |
| Spotify's ML Platform | Engineering Blog | https://engineering.atspotify.com/ |

### Difficulty Level

**Beginner to Intermediate** - Core concepts are straightforward; complexity increases with:
- Distributed training scenarios
- Custom metric types
- Integration with orchestration tools
- Multi-tenant deployments

---

## 3. Feature Stores

### What is it?

A feature store is a centralized repository for storing, managing, and serving machine learning features. It solves the "feature engineering once, use everywhere" problem by providing:

- **Feature Registry**: Catalog of all features with metadata, ownership, and documentation
- **Offline Store**: Historical feature values for training (batch retrieval)
- **Online Store**: Low-latency feature serving for real-time inference
- **Feature Transformation**: Declarative or programmatic feature computation pipelines
- **Point-in-Time Correctness**: Prevent data leakage by retrieving features as of a specific timestamp
- **Feature Sharing**: Reuse features across teams and models

Popular feature stores include **Feast** (open-source), **Tecton** (managed), **Databricks Feature Store**, and **Amazon SageMaker Feature Store**.

### Why it matters for Data Engineers

Feature stores sit at the intersection of data engineering and ML engineering:

1. **Eliminate Duplicate Work**: Compute features once, serve to multiple models
2. **Training-Serving Consistency**: Same feature computation logic for training and inference
3. **Data Quality**: Centralized validation and monitoring for feature data
4. **Reduced Latency**: Optimized online stores for sub-millisecond serving
5. **Governance**: Track feature lineage, ownership, and access patterns

Your skills in building data pipelines directly transfer to feature engineering pipelines. The Repository pattern you know from OOP is essentially what a feature store implements at scale.

### Prerequisites

- Understanding of batch vs. streaming data processing
- Knowledge of key-value stores (Redis, DynamoDB)
- Familiarity with columnar storage (Parquet, Delta Lake)
- SQL for feature definitions
- Time-series data concepts

### Implementation Example

#### Feast Feature Store

```python
"""
Feast Feature Store - Complete Example
Demonstrates feature definition, materialization, and serving.
"""

# ============================================
# Step 1: Define Feature Repository Structure
# ============================================

# File: feature_repo/feature_store.yaml
"""
project: fraud_detection
registry: data/registry.db
provider: local
online_store:
  type: sqlite
  path: data/online_store.db
offline_store:
  type: file
entity_key_serialization_version: 2
"""

# File: feature_repo/entities.py
from feast import Entity

# Define the primary entity - what we're computing features for
customer = Entity(
    name="customer",
    join_keys=["customer_id"],
    description="A customer who makes transactions"
)

transaction = Entity(
    name="transaction",
    join_keys=["transaction_id"],
    description="A financial transaction"
)

# File: feature_repo/features.py
from feast import FeatureView, Field, FileSource, PushSource
from feast.types import Float32, Int64, String
from datetime import timedelta

# Define data sources
customer_stats_source = FileSource(
    name="customer_stats_source",
    path="data/customer_stats.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created_timestamp"
)

# Define Feature View - a group of related features
customer_features = FeatureView(
    name="customer_features",
    entities=[customer],
    ttl=timedelta(days=365),  # How long features are valid
    schema=[
        Field(name="total_transactions", dtype=Int64),
        Field(name="avg_transaction_amount", dtype=Float32),
        Field(name="transaction_count_7d", dtype=Int64),
        Field(name="transaction_count_30d", dtype=Int64),
        Field(name="avg_amount_7d", dtype=Float32),
        Field(name="max_amount_30d", dtype=Float32),
        Field(name="account_age_days", dtype=Int64),
        Field(name="preferred_channel", dtype=String),
    ],
    online=True,  # Enable online serving
    source=customer_stats_source,
    tags={"team": "fraud", "tier": "critical"}
)

# Real-time features via Push Source (for streaming)
realtime_source = PushSource(
    name="realtime_transaction_source",
    batch_source=customer_stats_source  # Fallback for historical
)

realtime_features = FeatureView(
    name="realtime_customer_features",
    entities=[customer],
    ttl=timedelta(hours=1),
    schema=[
        Field(name="transactions_last_hour", dtype=Int64),
        Field(name="amount_last_hour", dtype=Float32),
    ],
    online=True,
    source=realtime_source,
)

# ============================================
# Step 2: Generate Training Data
# ============================================

# File: training_pipeline.py
from feast import FeatureStore
import pandas as pd
from datetime import datetime, timedelta
import numpy as np

# Initialize Feature Store
store = FeatureStore(repo_path="feature_repo")

# Create entity dataframe (what we want features for)
# This represents historical training examples with timestamps
entity_df = pd.DataFrame({
    "customer_id": ["C001", "C002", "C003", "C001", "C002"],
    "event_timestamp": [
        datetime(2025, 1, 1, 10, 0),
        datetime(2025, 1, 1, 11, 0),
        datetime(2025, 1, 1, 12, 0),
        datetime(2025, 1, 2, 10, 0),  # Same customer, different time
        datetime(2025, 1, 2, 11, 0),
    ],
    "label": [0, 1, 0, 0, 1]  # Fraud labels
})

# Get historical features (point-in-time correct!)
training_df = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "customer_features:total_transactions",
        "customer_features:avg_transaction_amount",
        "customer_features:transaction_count_7d",
        "customer_features:transaction_count_30d",
        "customer_features:account_age_days",
    ]
).to_df()

print("Training DataFrame:")
print(training_df.head())

# ============================================
# Step 3: Materialize Features to Online Store
# ============================================

from datetime import datetime

# Materialize features from offline to online store
store.materialize(
    start_date=datetime(2025, 1, 1),
    end_date=datetime.now()
)

# Or materialize incrementally (for production)
store.materialize_incremental(end_date=datetime.now())

# ============================================
# Step 4: Online Feature Retrieval (Inference)
# ============================================

def get_features_for_inference(customer_ids: list) -> dict:
    """Retrieve features for real-time inference."""

    entity_rows = [{"customer_id": cid} for cid in customer_ids]

    feature_vector = store.get_online_features(
        features=[
            "customer_features:total_transactions",
            "customer_features:avg_transaction_amount",
            "customer_features:transaction_count_7d",
            "customer_features:account_age_days",
        ],
        entity_rows=entity_rows
    ).to_dict()

    return feature_vector

# Simulate real-time inference
features = get_features_for_inference(["C001", "C002"])
print("\nOnline Features for Inference:")
for key, values in features.items():
    print(f"  {key}: {values}")

# ============================================
# Step 5: Push Real-time Features (Streaming)
# ============================================

def push_realtime_features(customer_id: str, transactions: int, amount: float):
    """Push real-time computed features to online store."""

    store.push(
        push_source_name="realtime_transaction_source",
        df=pd.DataFrame({
            "customer_id": [customer_id],
            "transactions_last_hour": [transactions],
            "amount_last_hour": [amount],
            "event_timestamp": [datetime.now()]
        })
    )

# Example: Push features from streaming pipeline
push_realtime_features("C001", transactions=5, amount=1500.00)
```

#### Tecton Feature Engineering Patterns

```python
"""
Tecton-Style Feature Engineering Patterns
Demonstrates declarative feature definitions used in managed feature stores.
"""

# Tecton uses a declarative approach similar to this pattern:

from dataclasses import dataclass
from typing import List, Optional
from datetime import timedelta
from abc import ABC, abstractmethod

@dataclass
class FeatureConfig:
    """Configuration for a feature definition."""
    name: str
    description: str
    entity: str
    dtype: str
    aggregation: Optional[str] = None
    window: Optional[timedelta] = None
    freshness: timedelta = timedelta(hours=1)
    tags: dict = None

class FeatureTransformation(ABC):
    """Base class for feature transformations."""

    @abstractmethod
    def compute(self, df):
        pass

    @abstractmethod
    def get_schema(self) -> List[FeatureConfig]:
        pass

class CustomerTransactionFeatures(FeatureTransformation):
    """
    Tecton-style feature group for customer transaction metrics.

    In Tecton, this would be defined declaratively:

    @batch_feature_view(
        sources=[transactions_batch_source],
        entities=[customer_entity],
        mode="spark_sql",
        online=True,
        offline=True,
        feature_start_time=datetime(2020, 1, 1),
        batch_schedule=timedelta(days=1),
    )
    def customer_transaction_features(transactions):
        return f'''
            SELECT
                customer_id,
                COUNT(*) as transaction_count_30d,
                AVG(amount) as avg_transaction_amount_30d,
                MAX(amount) as max_transaction_amount_30d,
                SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) as fraud_count_30d
            FROM {transactions}
            WHERE timestamp >= current_date - INTERVAL 30 DAYS
            GROUP BY customer_id
        '''
    """

    def __init__(self, windows: List[timedelta]):
        self.windows = windows

    def compute(self, df):
        """Compute features using pandas (simplified from Spark)."""
        import pandas as pd

        results = []
        for window in self.windows:
            window_days = window.days

            # Filter to window
            cutoff = pd.Timestamp.now() - window
            window_df = df[df['timestamp'] >= cutoff]

            # Aggregate
            agg = window_df.groupby('customer_id').agg({
                'amount': ['count', 'mean', 'max', 'sum'],
                'is_fraud': 'sum'
            }).reset_index()

            # Flatten columns
            agg.columns = [
                'customer_id',
                f'transaction_count_{window_days}d',
                f'avg_amount_{window_days}d',
                f'max_amount_{window_days}d',
                f'total_amount_{window_days}d',
                f'fraud_count_{window_days}d'
            ]
            results.append(agg)

        # Merge all windows
        from functools import reduce
        final_df = reduce(
            lambda left, right: pd.merge(left, right, on='customer_id', how='outer'),
            results
        )
        return final_df

    def get_schema(self) -> List[FeatureConfig]:
        configs = []
        for window in self.windows:
            days = window.days
            configs.extend([
                FeatureConfig(
                    name=f"transaction_count_{days}d",
                    description=f"Number of transactions in last {days} days",
                    entity="customer",
                    dtype="int64",
                    aggregation="count",
                    window=window
                ),
                FeatureConfig(
                    name=f"avg_amount_{days}d",
                    description=f"Average transaction amount in last {days} days",
                    entity="customer",
                    dtype="float64",
                    aggregation="mean",
                    window=window
                ),
            ])
        return configs

# Usage Pattern
import pandas as pd
import numpy as np
from datetime import datetime

# Sample transaction data
transactions = pd.DataFrame({
    'customer_id': np.random.choice(['C001', 'C002', 'C003'], 1000),
    'amount': np.random.exponential(100, 1000),
    'timestamp': pd.date_range(end=datetime.now(), periods=1000, freq='H'),
    'is_fraud': np.random.choice([0, 1], 1000, p=[0.98, 0.02])
})

# Compute features
feature_transformer = CustomerTransactionFeatures(
    windows=[timedelta(days=7), timedelta(days=30), timedelta(days=90)]
)

feature_df = feature_transformer.compute(transactions)
print("Computed Features:")
print(feature_df.head())

# Get feature schema for documentation
print("\nFeature Schema:")
for config in feature_transformer.get_schema():
    print(f"  {config.name}: {config.dtype} ({config.description})")
```

### Real-world Application

**Scenario**: A ride-sharing company needs real-time driver and rider features for matching and pricing.

**Architecture**:
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Event Streams   │────>│ Stream          │────>│ Online Store    │
│ (Kafka)         │     │ Processing      │     │ (Redis)         │
└─────────────────┘     │ (Flink/Spark)   │     └────────┬────────┘
                        └────────┬────────┘              │
                                 │                       │
                                 v                       v
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Data Lake       │────>│ Batch           │────>│ ML Inference    │
│ (S3/Delta)      │     │ Feature Compute │     │ Service         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                 │
                                 v
                        ┌─────────────────┐
                        │ Offline Store   │
                        │ (Parquet)       │
                        └─────────────────┘
```

**Feature Groups**:
1. **Driver Features**: Rating, acceptance rate, trips completed, current location
2. **Rider Features**: Rating, trip frequency, preferred payment, surge tolerance
3. **Contextual Features**: Time of day, weather, local events, traffic conditions

**Benefits Achieved**:
- Training-serving skew reduced from 15% to < 1%
- Feature computation cost reduced by 60% through reuse
- New model iteration time reduced from 2 weeks to 2 days

### Learning Resources

| Resource | Type | URL |
|----------|------|-----|
| Feast Documentation | Official Docs | https://docs.feast.dev/ |
| Tecton Documentation | Official Docs | https://docs.tecton.ai/ |
| Feature Store Summit Talks | Conference | https://www.featurestoresummit.com/ |
| Uber Michelangelo | Engineering Blog | https://www.uber.com/blog/michelangelo-machine-learning-platform/ |
| Building a Feature Store (Chip Huyen) | Technical Article | https://huyenchip.com/2022/01/02/real-time-machine-learning-challenges-and-solutions.html |

### Difficulty Level

**Intermediate to Advanced** - Requires understanding of:
- Distributed data processing (Spark, Flink)
- Low-latency data stores
- Point-in-time correctness concepts
- Data modeling for ML

---

## 4. Data Versioning Strategies

### What is it?

Data versioning extends version control principles to datasets, enabling:

- **Reproducibility**: Recreate any historical dataset state
- **Lineage Tracking**: Understand how data transforms through pipelines
- **Rollback**: Revert to previous data versions when issues arise
- **Branching**: Create data variants for experimentation
- **Collaboration**: Multiple team members work on data without conflicts

Key approaches include:
1. **File-based versioning** (DVC, LakeFS)
2. **Table format versioning** (Delta Lake, Apache Iceberg, Apache Hudi)
3. **Database-level versioning** (Git-like semantics for databases)

### Why it matters for Data Engineers

1. **Debug Production Issues**: Trace model degradation to specific data changes
2. **Regulatory Compliance**: Maintain audit trails for data used in decision-making
3. **Safe Experimentation**: Test data transformations without affecting production
4. **Disaster Recovery**: Quickly restore to known-good data states
5. **CI/CD Integration**: Version data alongside code and models

Your experience with Git workflows directly maps to data versioning concepts. The main difference is handling large binary files and maintaining query performance.

### Prerequisites

- Strong Git proficiency
- Understanding of storage systems (object stores, HDFS)
- Familiarity with columnar file formats (Parquet, ORC)
- Basic understanding of transaction logs and ACID properties

### Implementation Example

#### Delta Lake Data Versioning

```python
"""
Delta Lake Data Versioning Example
Demonstrates time travel, schema evolution, and data lineage.
"""
from delta import *
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lit, current_timestamp
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType
import pandas as pd

# Initialize Spark with Delta Lake
spark = SparkSession.builder \
    .appName("DeltaLakeVersioning") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .config("spark.jars.packages", "io.delta:delta-core_2.12:2.4.0") \
    .getOrCreate()

# Define schema
schema = StructType([
    StructField("customer_id", StringType(), False),
    StructField("name", StringType(), True),
    StructField("email", StringType(), True),
    StructField("total_spend", DoubleType(), True),
    StructField("updated_at", TimestampType(), True)
])

# Create initial dataset
initial_data = [
    ("C001", "Alice Johnson", "alice@example.com", 1500.00),
    ("C002", "Bob Smith", "bob@example.com", 2300.00),
    ("C003", "Carol White", "carol@example.com", 890.00),
]

df_v1 = spark.createDataFrame(initial_data, ["customer_id", "name", "email", "total_spend"])
df_v1 = df_v1.withColumn("updated_at", current_timestamp())

# Write initial version
delta_path = "/tmp/delta/customers"
df_v1.write.format("delta").mode("overwrite").save(delta_path)

print("Version 1 written:")
spark.read.format("delta").load(delta_path).show()

# ============================================
# Version 2: Update existing records
# ============================================

from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, delta_path)

# Update using merge (upsert pattern)
updates = spark.createDataFrame([
    ("C001", "Alice Johnson", "alice.j@newmail.com", 1750.00),  # Updated email and spend
    ("C004", "David Brown", "david@example.com", 450.00),       # New customer
], ["customer_id", "name", "email", "total_spend"])
updates = updates.withColumn("updated_at", current_timestamp())

delta_table.alias("target").merge(
    updates.alias("source"),
    "target.customer_id = source.customer_id"
).whenMatchedUpdate(set={
    "email": "source.email",
    "total_spend": "source.total_spend",
    "updated_at": "source.updated_at"
}).whenNotMatchedInsertAll().execute()

print("\nVersion 2 (after merge):")
spark.read.format("delta").load(delta_path).show()

# ============================================
# Version 3: Delete a record
# ============================================

delta_table.delete("customer_id = 'C003'")

print("\nVersion 3 (after delete):")
spark.read.format("delta").load(delta_path).show()

# ============================================
# Time Travel: Access Historical Versions
# ============================================

print("\n" + "="*60)
print("TIME TRAVEL QUERIES")
print("="*60)

# Read version 0 (initial load)
print("\nVersion 0 (initial data):")
spark.read.format("delta").option("versionAsOf", 0).load(delta_path).show()

# Read version 1 (after merge)
print("\nVersion 1 (after merge):")
spark.read.format("delta").option("versionAsOf", 1).load(delta_path).show()

# Read by timestamp
# df_at_time = spark.read.format("delta") \
#     .option("timestampAsOf", "2025-01-15 10:00:00") \
#     .load(delta_path)

# ============================================
# View Table History
# ============================================

print("\nTable History:")
delta_table.history().select(
    "version", "timestamp", "operation", "operationParameters"
).show(truncate=False)

# ============================================
# Restore to Previous Version
# ============================================

print("\nRestoring to version 0...")
delta_table.restoreToVersion(0)

print("\nData after restore:")
spark.read.format("delta").load(delta_path).show()

# ============================================
# Schema Evolution
# ============================================

# Add new column (schema evolution)
df_with_segment = spark.read.format("delta").load(delta_path) \
    .withColumn("customer_segment", lit("standard"))

df_with_segment.write.format("delta") \
    .mode("overwrite") \
    .option("mergeSchema", "true") \
    .save(delta_path)

print("\nSchema after evolution:")
spark.read.format("delta").load(delta_path).printSchema()
```

#### DVC Data Versioning with Pipelines

```python
"""
DVC Data Versioning - Complete Workflow
Version control for large datasets alongside Git.
"""
import os
import pandas as pd
import numpy as np
from datetime import datetime
import json

# ============================================
# Project Structure
# ============================================
"""
my_ml_project/
├── .git/
├── .dvc/
├── data/
│   ├── raw/                 # DVC tracked
│   │   ├── transactions.csv.dvc
│   │   └── customers.csv.dvc
│   └── processed/           # DVC tracked
│       ├── features.parquet.dvc
│       └── train_test_split.dvc
├── models/                  # DVC tracked
│   └── model.pkl.dvc
├── src/
│   ├── prepare_data.py
│   ├── feature_engineering.py
│   ├── train.py
│   └── evaluate.py
├── dvc.yaml                 # Pipeline definition
├── dvc.lock                 # Pipeline state
└── params.yaml              # Parameters
"""

# ============================================
# Step 1: Data Preparation Script
# ============================================

# File: src/prepare_data.py
def prepare_data():
    """Load and clean raw data."""
    import yaml

    # Load parameters
    with open('params.yaml', 'r') as f:
        params = yaml.safe_load(f)

    # Load raw data
    transactions = pd.read_csv('data/raw/transactions.csv')
    customers = pd.read_csv('data/raw/customers.csv')

    # Basic cleaning
    transactions = transactions.dropna(subset=['customer_id', 'amount'])
    transactions['timestamp'] = pd.to_datetime(transactions['timestamp'])

    # Filter by date range from params
    start_date = pd.to_datetime(params['data']['start_date'])
    end_date = pd.to_datetime(params['data']['end_date'])
    transactions = transactions[
        (transactions['timestamp'] >= start_date) &
        (transactions['timestamp'] <= end_date)
    ]

    # Merge with customers
    merged = transactions.merge(customers, on='customer_id', how='left')

    # Save processed data
    os.makedirs('data/processed', exist_ok=True)
    merged.to_parquet('data/processed/cleaned_data.parquet', index=False)

    # Log statistics
    stats = {
        'n_transactions': len(merged),
        'n_customers': merged['customer_id'].nunique(),
        'date_range': f"{start_date.date()} to {end_date.date()}",
        'processed_at': datetime.now().isoformat()
    }
    with open('data/processed/stats.json', 'w') as f:
        json.dump(stats, f, indent=2)

    print(f"Prepared {stats['n_transactions']} transactions")

# ============================================
# Step 2: DVC Pipeline Definition
# ============================================

# File: dvc.yaml
dvc_yaml = """
stages:
  prepare:
    cmd: python src/prepare_data.py
    deps:
      - src/prepare_data.py
      - data/raw/transactions.csv
      - data/raw/customers.csv
    params:
      - data.start_date
      - data.end_date
    outs:
      - data/processed/cleaned_data.parquet
    metrics:
      - data/processed/stats.json:
          cache: false

  featurize:
    cmd: python src/feature_engineering.py
    deps:
      - src/feature_engineering.py
      - data/processed/cleaned_data.parquet
    params:
      - features.windows
      - features.aggregations
    outs:
      - data/processed/features.parquet

  split:
    cmd: python src/split_data.py
    deps:
      - src/split_data.py
      - data/processed/features.parquet
    params:
      - split.test_size
      - split.random_state
    outs:
      - data/processed/train.parquet
      - data/processed/test.parquet

  train:
    cmd: python src/train.py
    deps:
      - src/train.py
      - data/processed/train.parquet
    params:
      - model.n_estimators
      - model.max_depth
      - model.learning_rate
    outs:
      - models/model.pkl
    metrics:
      - metrics/train_metrics.json:
          cache: false

  evaluate:
    cmd: python src/evaluate.py
    deps:
      - src/evaluate.py
      - models/model.pkl
      - data/processed/test.parquet
    metrics:
      - metrics/eval_metrics.json:
          cache: false
    plots:
      - metrics/roc_curve.csv:
          x: fpr
          y: tpr
      - metrics/precision_recall.csv:
          x: recall
          y: precision
"""

# File: params.yaml
params_yaml = """
data:
  start_date: '2024-01-01'
  end_date: '2024-12-31'

features:
  windows: [7, 30, 90]
  aggregations: ['count', 'sum', 'mean', 'max']

split:
  test_size: 0.2
  random_state: 42

model:
  n_estimators: 100
  max_depth: 10
  learning_rate: 0.1
"""

# ============================================
# Step 3: DVC Commands Workflow
# ============================================

dvc_commands = """
# Initialize DVC in a Git repository
git init
dvc init

# Configure remote storage (S3 example)
dvc remote add -d myremote s3://my-bucket/dvc-store
dvc remote modify myremote access_key_id ${AWS_ACCESS_KEY_ID}
dvc remote modify myremote secret_access_key ${AWS_SECRET_ACCESS_KEY}

# Track large data files
dvc add data/raw/transactions.csv
dvc add data/raw/customers.csv
git add data/raw/*.dvc data/raw/.gitignore
git commit -m "Add raw data tracking"

# Push data to remote
dvc push

# Run the pipeline
dvc repro

# View pipeline DAG
dvc dag

# Compare metrics between versions
dvc metrics show
dvc metrics diff

# Compare parameters
dvc params diff

# Create experiment branch
git checkout -b experiment/new-features
# Modify params.yaml...
dvc repro
dvc metrics show

# Switch back and compare
git checkout main
dvc checkout
dvc metrics diff experiment/new-features

# View plots
dvc plots show metrics/roc_curve.csv

# Tag a release
git tag -a v1.0.0 -m "Production model v1"
dvc push

# Retrieve specific version
git checkout v1.0.0
dvc checkout
"""

print("DVC Pipeline Configuration:")
print(dvc_yaml)
print("\nParameters:")
print(params_yaml)
print("\nWorkflow Commands:")
print(dvc_commands)
```

#### LakeFS Git-like Data Versioning

```python
"""
LakeFS - Git-like Version Control for Data Lakes
Demonstrates branching, committing, and merging data.
"""
import lakefs_client
from lakefs_client import Configuration, ApiClient
from lakefs_client.api import repositories_api, branches_api, objects_api, commits_api
from lakefs_client.model import *
import pandas as pd
import io

# Configure LakeFS client
configuration = Configuration(
    host="http://localhost:8000/api/v1",
    username="AKIAIOSFODNN7EXAMPLE",
    password="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
)

client = ApiClient(configuration)
repos_api = repositories_api.RepositoriesApi(client)
branches_api = branches_api.BranchesApi(client)
objects_api = objects_api.ObjectsApi(client)
commits_api = commits_api.CommitsApi(client)

# ============================================
# Repository and Branch Operations
# ============================================

REPO_NAME = "ml-datasets"
MAIN_BRANCH = "main"

# Create repository (if not exists)
try:
    repos_api.create_repository(
        RepositoryCreation(
            name=REPO_NAME,
            storage_namespace="s3://my-bucket/lakefs/ml-datasets",
            default_branch=MAIN_BRANCH
        )
    )
    print(f"Created repository: {REPO_NAME}")
except Exception as e:
    print(f"Repository exists: {REPO_NAME}")

# Create a feature branch
FEATURE_BRANCH = "feature/new-customer-data"
try:
    branches_api.create_branch(
        repository=REPO_NAME,
        branch_creation=BranchCreation(
            name=FEATURE_BRANCH,
            source=MAIN_BRANCH
        )
    )
    print(f"Created branch: {FEATURE_BRANCH}")
except Exception as e:
    print(f"Branch exists: {FEATURE_BRANCH}")

# ============================================
# Upload Data to Branch
# ============================================

def upload_dataframe(df: pd.DataFrame, path: str, branch: str):
    """Upload a pandas DataFrame as Parquet to LakeFS."""
    buffer = io.BytesIO()
    df.to_parquet(buffer, index=False)
    buffer.seek(0)

    objects_api.upload_object(
        repository=REPO_NAME,
        branch=branch,
        path=path,
        content=buffer
    )
    print(f"Uploaded {path} to {branch}")

# Create sample customer data
customers_v1 = pd.DataFrame({
    'customer_id': ['C001', 'C002', 'C003'],
    'name': ['Alice', 'Bob', 'Carol'],
    'segment': ['premium', 'standard', 'premium']
})

# Upload to main branch
upload_dataframe(customers_v1, "customers/data.parquet", MAIN_BRANCH)

# Commit the change
commits_api.commit(
    repository=REPO_NAME,
    branch=MAIN_BRANCH,
    commit_creation=CommitCreation(
        message="Initial customer data upload",
        metadata={"author": "data-engineer", "ticket": "DATA-123"}
    )
)
print("Committed to main")

# ============================================
# Make Changes on Feature Branch
# ============================================

# New data on feature branch
customers_v2 = pd.DataFrame({
    'customer_id': ['C001', 'C002', 'C003', 'C004'],
    'name': ['Alice', 'Bob', 'Carol', 'David'],
    'segment': ['premium', 'premium', 'premium', 'standard'],  # Bob upgraded
    'lifetime_value': [5000, 3000, 4500, 500]  # New column
})

upload_dataframe(customers_v2, "customers/data.parquet", FEATURE_BRANCH)

commits_api.commit(
    repository=REPO_NAME,
    branch=FEATURE_BRANCH,
    commit_creation=CommitCreation(
        message="Add lifetime_value column and new customer",
        metadata={"author": "data-engineer", "ticket": "DATA-124"}
    )
)
print("Committed to feature branch")

# ============================================
# Compare Branches (Diff)
# ============================================

diff = branches_api.diff_branch(
    repository=REPO_NAME,
    branch=FEATURE_BRANCH
)

print("\nChanges on feature branch:")
for result in diff.results:
    print(f"  {result.type}: {result.path}")

# ============================================
# Merge Feature Branch to Main
# ============================================

# First, validate data quality (simplified)
def validate_data(branch: str) -> bool:
    """Validate data on a branch before merging."""
    # In practice, run data quality checks here
    print(f"Validating data on {branch}...")
    return True

if validate_data(FEATURE_BRANCH):
    merge_result = branches_api.merge_into_branch(
        repository=REPO_NAME,
        source_ref=FEATURE_BRANCH,
        destination_branch=MAIN_BRANCH,
        merge=Merge(message="Merge customer data updates")
    )
    print(f"Merged {FEATURE_BRANCH} into {MAIN_BRANCH}")
    print(f"Merge commit: {merge_result.reference}")

# ============================================
# View Commit History
# ============================================

commits = commits_api.log_commits(
    repository=REPO_NAME,
    ref=MAIN_BRANCH
)

print("\nCommit History:")
for commit in commits.results[:5]:
    print(f"  {commit.id[:8]} - {commit.message}")
    print(f"    Author: {commit.committer}")
    print(f"    Date: {commit.creation_date}")
```

### Real-world Application

**Scenario**: A healthcare analytics company must maintain strict data lineage for regulatory compliance (HIPAA).

**Implementation**:
1. **Delta Lake** for core data tables with automatic versioning
2. **DVC** for ML dataset snapshots and model artifacts
3. **LakeFS** for experimentation branches without data duplication

**Workflow**:
```
1. Data arrives in raw zone (immutable)
           │
           v
2. Processing creates versioned Delta tables
   ├── Version 1: Initial load
   ├── Version 2: Schema migration
   └── Version 3: Data correction
           │
           v
3. ML features extracted, tracked with DVC
   ├── features_v1.parquet.dvc (hash: abc123)
   └── features_v2.parquet.dvc (hash: def456)
           │
           v
4. Model trained, audited with full lineage
   └── model.pkl trained on features_v2 (data version: Delta v3)
```

### Learning Resources

| Resource | Type | URL |
|----------|------|-----|
| Delta Lake Documentation | Official Docs | https://docs.delta.io/ |
| DVC Documentation | Official Docs | https://dvc.org/doc |
| LakeFS Documentation | Official Docs | https://docs.lakefs.io/ |
| Apache Iceberg | Official Docs | https://iceberg.apache.org/ |
| Data Version Control at Netflix | Engineering Blog | https://netflixtechblog.com/ |

### Difficulty Level

**Intermediate** - Concepts are accessible, but implementation requires:
- Understanding of storage layer optimization
- Transaction log mechanics
- Distributed systems considerations

---

## 5. CI/CD for ML Pipelines

### What is it?

CI/CD (Continuous Integration/Continuous Deployment) for ML extends traditional software CI/CD to handle:

- **Code Changes**: Standard software testing and deployment
- **Data Changes**: Validation when training data evolves
- **Model Changes**: Performance testing when models are retrained
- **Configuration Changes**: Impact of hyperparameter modifications

Key components:
1. **Continuous Integration**: Automated testing of code, data, and models
2. **Continuous Training**: Automated model retraining on schedule or trigger
3. **Continuous Deployment**: Safe model rollout with monitoring
4. **Continuous Monitoring**: Post-deployment performance tracking

### Why it matters for Data Engineers

1. **Pipeline Reliability**: Catch breaking changes before they reach production
2. **Automation**: Reduce manual intervention in model updates
3. **Quality Gates**: Enforce data and model quality standards
4. **Faster Iteration**: Safely deploy improvements more frequently
5. **Observability**: Track system health across code, data, and models

Your experience with traditional CI/CD (Jenkins, GitHub Actions, GitLab CI) provides the foundation. ML CI/CD adds specialized testing for data validation, model performance, and training pipeline integrity.

### Prerequisites

- Experience with at least one CI/CD platform
- Understanding of containerization (Docker)
- Familiarity with infrastructure as code concepts
- Basic knowledge of model serving patterns

### Implementation Example

#### GitHub Actions ML Pipeline

```yaml
# File: .github/workflows/ml-pipeline.yml
# Complete CI/CD pipeline for ML projects

name: ML Pipeline CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'src/**'
      - 'data/**'
      - 'models/**'
      - 'tests/**'
      - 'requirements.txt'
      - 'dvc.yaml'
  pull_request:
    branches: [main]
  schedule:
    # Retrain weekly on Sunday at midnight
    - cron: '0 0 * * 0'
  workflow_dispatch:
    inputs:
      force_retrain:
        description: 'Force model retraining'
        required: false
        default: 'false'

env:
  PYTHON_VERSION: '3.10'
  MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

jobs:
  # ============================================
  # Stage 1: Code Quality & Unit Tests
  # ============================================
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Lint with ruff
        run: ruff check src/ tests/

      - name: Type check with mypy
        run: mypy src/ --ignore-missing-imports

      - name: Run unit tests
        run: pytest tests/unit/ -v --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.xml

  # ============================================
  # Stage 2: Data Validation
  # ============================================
  data-validation:
    runs-on: ubuntu-latest
    needs: code-quality
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Setup DVC
        uses: iterative/setup-dvc@v1

      - name: Pull data from remote
        run: dvc pull data/

      - name: Validate data schema
        run: python scripts/validate_schema.py

      - name: Run data quality checks
        run: |
          python -c "
          import great_expectations as gx
          context = gx.get_context()
          checkpoint = context.get_checkpoint('data_quality_checkpoint')
          result = checkpoint.run()
          if not result.success:
              raise ValueError('Data quality checks failed')
          "

      - name: Check for data drift
        run: python scripts/detect_drift.py --threshold 0.1

  # ============================================
  # Stage 3: Model Training & Validation
  # ============================================
  train-model:
    runs-on: ubuntu-latest
    needs: data-validation
    if: |
      github.event_name == 'schedule' ||
      github.event.inputs.force_retrain == 'true' ||
      contains(github.event.head_commit.message, '[retrain]')

    outputs:
      model_version: ${{ steps.train.outputs.model_version }}
      should_deploy: ${{ steps.evaluate.outputs.should_deploy }}

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Setup DVC
        uses: iterative/setup-dvc@v1

      - name: Pull data
        run: dvc pull

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Train model
        id: train
        run: |
          python src/train.py
          echo "model_version=$(cat outputs/model_version.txt)" >> $GITHUB_OUTPUT

      - name: Run integration tests
        run: pytest tests/integration/ -v

      - name: Evaluate model performance
        id: evaluate
        run: |
          python scripts/evaluate_model.py \
            --new-model outputs/model.pkl \
            --production-model models:/ProductionModel/Production \
            --threshold 0.02

          if [ -f outputs/deploy_flag.txt ]; then
            echo "should_deploy=true" >> $GITHUB_OUTPUT
          else
            echo "should_deploy=false" >> $GITHUB_OUTPUT
          fi

      - name: Upload model artifacts
        uses: actions/upload-artifact@v4
        with:
          name: model-artifacts
          path: outputs/

  # ============================================
  # Stage 4: Model Deployment
  # ============================================
  deploy-staging:
    runs-on: ubuntu-latest
    needs: train-model
    if: needs.train-model.outputs.should_deploy == 'true'
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Download model artifacts
        uses: actions/download-artifact@v4
        with:
          name: model-artifacts
          path: outputs/

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Build and push Docker image
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker build -t ml-model:${{ needs.train-model.outputs.model_version }} .
          docker push $ECR_REGISTRY/ml-model:${{ needs.train-model.outputs.model_version }}

      - name: Deploy to staging
        run: |
          kubectl set image deployment/ml-model \
            ml-model=$ECR_REGISTRY/ml-model:${{ needs.train-model.outputs.model_version }} \
            -n staging

      - name: Run smoke tests
        run: |
          sleep 30  # Wait for deployment
          python scripts/smoke_tests.py --endpoint $STAGING_ENDPOINT

  deploy-production:
    runs-on: ubuntu-latest
    needs: [train-model, deploy-staging]
    if: needs.train-model.outputs.should_deploy == 'true'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy with canary
        run: |
          # Deploy to 10% of traffic initially
          kubectl apply -f k8s/canary-deployment.yaml

      - name: Monitor canary metrics
        run: |
          python scripts/monitor_canary.py \
            --duration 300 \
            --error-threshold 0.01 \
            --latency-threshold 200

      - name: Promote to full deployment
        run: |
          kubectl apply -f k8s/full-deployment.yaml

      - name: Update MLflow model stage
        run: |
          python -c "
          import mlflow
          client = mlflow.tracking.MlflowClient()
          client.transition_model_version_stage(
              name='ProductionModel',
              version='${{ needs.train-model.outputs.model_version }}',
              stage='Production',
              archive_existing_versions=True
          )
          "
```

#### Supporting Scripts

```python
"""
scripts/validate_schema.py
Validates data schema against expected structure.
"""
import pandas as pd
import json
import sys
from pathlib import Path

def validate_schema():
    """Validate that data matches expected schema."""

    # Load expected schema
    with open('schemas/transactions_schema.json', 'r') as f:
        expected_schema = json.load(f)

    # Load data
    df = pd.read_parquet('data/processed/transactions.parquet')

    errors = []

    # Check required columns
    for col_name, col_spec in expected_schema['columns'].items():
        if col_name not in df.columns:
            errors.append(f"Missing required column: {col_name}")
            continue

        # Check dtype
        actual_dtype = str(df[col_name].dtype)
        expected_dtype = col_spec['dtype']
        if actual_dtype != expected_dtype:
            errors.append(
                f"Column {col_name}: expected {expected_dtype}, got {actual_dtype}"
            )

        # Check nullability
        if not col_spec.get('nullable', True) and df[col_name].isnull().any():
            errors.append(f"Column {col_name} contains nulls but is non-nullable")

    # Check for unexpected columns
    expected_cols = set(expected_schema['columns'].keys())
    actual_cols = set(df.columns)
    unexpected = actual_cols - expected_cols
    if unexpected:
        print(f"Warning: Unexpected columns found: {unexpected}")

    if errors:
        print("Schema validation FAILED:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)

    print("Schema validation PASSED")
    print(f"  Rows: {len(df):,}")
    print(f"  Columns: {len(df.columns)}")

if __name__ == "__main__":
    validate_schema()
```

```python
"""
scripts/detect_drift.py
Detects data drift between training and production data.
"""
import pandas as pd
import numpy as np
from scipy import stats
import argparse
import sys

def calculate_psi(expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
    """
    Calculate Population Stability Index (PSI).
    PSI < 0.1: No significant change
    PSI 0.1-0.2: Moderate change
    PSI > 0.2: Significant change
    """
    # Bin the data
    breakpoints = np.percentile(expected, np.linspace(0, 100, bins + 1))
    breakpoints[0] = -np.inf
    breakpoints[-1] = np.inf

    expected_counts = np.histogram(expected, breakpoints)[0]
    actual_counts = np.histogram(actual, breakpoints)[0]

    # Calculate percentages
    expected_pct = expected_counts / len(expected)
    actual_pct = actual_counts / len(actual)

    # Avoid division by zero
    expected_pct = np.where(expected_pct == 0, 0.0001, expected_pct)
    actual_pct = np.where(actual_pct == 0, 0.0001, actual_pct)

    # Calculate PSI
    psi = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return psi

def detect_drift(threshold: float = 0.1):
    """Detect drift between reference and current data."""

    # Load reference (training) data
    reference = pd.read_parquet('data/reference/features.parquet')

    # Load current (production) data
    current = pd.read_parquet('data/current/features.parquet')

    results = []
    drift_detected = False

    # Check numerical features
    numerical_cols = reference.select_dtypes(include=[np.number]).columns

    print("Drift Detection Report")
    print("=" * 60)

    for col in numerical_cols:
        psi = calculate_psi(
            reference[col].dropna().values,
            current[col].dropna().values
        )

        # Also run KS test
        ks_stat, ks_pvalue = stats.ks_2samp(
            reference[col].dropna(),
            current[col].dropna()
        )

        status = "DRIFT" if psi > threshold else "OK"
        if psi > threshold:
            drift_detected = True

        results.append({
            'column': col,
            'psi': psi,
            'ks_statistic': ks_stat,
            'ks_pvalue': ks_pvalue,
            'status': status
        })

        print(f"{col:30} PSI: {psi:.4f}  KS p-value: {ks_pvalue:.4f}  [{status}]")

    print("=" * 60)

    if drift_detected:
        print(f"\nDRIFT DETECTED: Some features exceed PSI threshold of {threshold}")
        print("Consider retraining the model.")
        sys.exit(1)
    else:
        print(f"\nNo significant drift detected (threshold: {threshold})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--threshold', type=float, default=0.1)
    args = parser.parse_args()
    detect_drift(args.threshold)
```

```python
"""
scripts/evaluate_model.py
Compares new model against production baseline.
"""
import mlflow
import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import argparse
import pickle
from pathlib import Path

def load_test_data():
    """Load test dataset."""
    return pd.read_parquet('data/processed/test.parquet')

def evaluate_model(model, X, y):
    """Calculate comprehensive metrics for a model."""
    predictions = model.predict(X)
    probabilities = model.predict_proba(X)[:, 1] if hasattr(model, 'predict_proba') else None

    metrics = {
        'accuracy': accuracy_score(y, predictions),
        'precision': precision_score(y, predictions, zero_division=0),
        'recall': recall_score(y, predictions, zero_division=0),
        'f1': f1_score(y, predictions, zero_division=0),
    }

    if probabilities is not None:
        metrics['roc_auc'] = roc_auc_score(y, probabilities)

    return metrics

def compare_models(new_model_path: str, production_model_uri: str, threshold: float):
    """Compare new model against production baseline."""

    # Load test data
    test_data = load_test_data()
    feature_cols = [c for c in test_data.columns if c not in ['label', 'customer_id', 'timestamp']]
    X_test = test_data[feature_cols]
    y_test = test_data['label']

    # Load new model
    with open(new_model_path, 'rb') as f:
        new_model = pickle.load(f)

    # Load production model
    try:
        production_model = mlflow.sklearn.load_model(production_model_uri)
        has_production = True
    except Exception as e:
        print(f"No production model found: {e}")
        has_production = False

    # Evaluate new model
    new_metrics = evaluate_model(new_model, X_test, y_test)

    print("Model Evaluation Report")
    print("=" * 60)
    print(f"\nNew Model Metrics:")
    for metric, value in new_metrics.items():
        print(f"  {metric}: {value:.4f}")

    # Compare with production if available
    should_deploy = True
    if has_production:
        prod_metrics = evaluate_model(production_model, X_test, y_test)

        print(f"\nProduction Model Metrics:")
        for metric, value in prod_metrics.items():
            print(f"  {metric}: {value:.4f}")

        print(f"\nComparison (threshold: {threshold}):")
        primary_metric = 'f1'  # Use F1 as primary metric
        improvement = new_metrics[primary_metric] - prod_metrics[primary_metric]

        print(f"  {primary_metric} improvement: {improvement:+.4f}")

        if improvement < -threshold:
            print(f"\n  Model WORSE than production by more than {threshold}")
            should_deploy = False
        elif improvement < 0:
            print(f"\n  Model slightly worse but within tolerance")
            should_deploy = True
        else:
            print(f"\n  Model BETTER than production")
            should_deploy = True

    print("=" * 60)

    # Write deployment flag
    if should_deploy:
        print("\nDecision: DEPLOY")
        Path('outputs/deploy_flag.txt').write_text('true')
    else:
        print("\nDecision: DO NOT DEPLOY")

    return should_deploy

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--new-model', required=True)
    parser.add_argument('--production-model', required=True)
    parser.add_argument('--threshold', type=float, default=0.02)
    args = parser.parse_args()

    compare_models(args.new_model, args.production_model, args.threshold)
```

### Real-world Application

**Scenario**: A fintech company deploys fraud detection models with strict latency and accuracy requirements.

**CI/CD Pipeline Architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONTINUOUS INTEGRATION                    │
├─────────────────────────────────────────────────────────────────┤
│  Code Push  ──>  Lint/Test  ──>  Data Validation  ──>  Build   │
│                       │                │                         │
│                       v                v                         │
│               Unit Tests        Schema Checks                    │
│               Type Checks       Quality Gates                    │
│               Coverage          Drift Detection                  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    v
┌─────────────────────────────────────────────────────────────────┐
│                      CONTINUOUS TRAINING                         │
├─────────────────────────────────────────────────────────────────┤
│  Trigger  ──>  Train Model  ──>  Evaluate  ──>  Register        │
│  (Schedule/                         │                            │
│   Data Change/                      v                            │
│   Manual)              Compare vs Production                     │
│                        Performance Threshold                     │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    v
┌─────────────────────────────────────────────────────────────────┐
│                      CONTINUOUS DEPLOYMENT                       │
├─────────────────────────────────────────────────────────────────┤
│  Stage  ──>  Smoke Test  ──>  Canary (10%)  ──>  Full Deploy   │
│                                    │                             │
│                                    v                             │
│                            Monitor Metrics                       │
│                            Auto-Rollback if                      │
│                            errors > threshold                    │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    v
┌─────────────────────────────────────────────────────────────────┐
│                      CONTINUOUS MONITORING                       │
├─────────────────────────────────────────────────────────────────┤
│  Latency  ──>  Error Rate  ──>  Model Drift  ──>  Alerts       │
│                                                                  │
│  If degradation detected:                                        │
│    - Auto-rollback to previous version                          │
│    - Trigger retraining pipeline                                │
│    - Notify on-call engineer                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Key Metrics Tracked**:
- **Latency**: P50, P95, P99 inference latency
- **Error Rate**: Prediction failures, timeouts
- **Model Performance**: Precision, recall (sampled with delayed labels)
- **Data Quality**: Feature availability, drift scores
- **Business Metrics**: Fraud catch rate, false positive rate

### Learning Resources

| Resource | Type | URL |
|----------|------|-----|
| MLOps: Continuous Delivery (Google) | Reference Architecture | https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning |
| GitHub Actions for ML | Official Docs | https://docs.github.com/en/actions |
| Continuous Delivery for ML (CD4ML) | Thoughtworks | https://martinfowler.com/articles/cd4ml.html |
| MLOps Principles | Community Resource | https://ml-ops.org/ |
| Kubeflow Pipelines | Official Docs | https://www.kubeflow.org/docs/components/pipelines/ |

### Difficulty Level

**Intermediate to Advanced** - Requires:
- Strong CI/CD fundamentals
- Container orchestration knowledge (Kubernetes)
- Understanding of monitoring and observability
- Experience with infrastructure as code

---

## Summary

This guide covered five essential MLOps pillars for data engineers transitioning into ML infrastructure:

| Topic | Key Tools | Core Concept |
|-------|-----------|--------------|
| **Model Versioning** | MLflow, DVC | Track model artifacts with full lineage |
| **Experiment Tracking** | MLflow, W&B | Record all experiment metadata systematically |
| **Feature Stores** | Feast, Tecton | Centralize feature engineering and serving |
| **Data Versioning** | Delta Lake, DVC, LakeFS | Apply Git-like versioning to datasets |
| **CI/CD for ML** | GitHub Actions, Jenkins | Automate testing and deployment of ML systems |

### Key Takeaways

1. **ML systems have three-way dependencies**: code, data, and models must all be versioned together

2. **Training-serving consistency is critical**: Feature stores ensure the same feature computation in training and inference

3. **Automation reduces risk**: CI/CD pipelines catch regressions before they reach production

4. **Observability is essential**: Track experiments, monitor deployments, detect drift continuously

5. **Start simple, iterate**: Begin with basic tracking (MLflow), add complexity (feature stores, advanced CI/CD) as needed

### Learning Path Recommendation

```
Week 1-2: MLflow basics (tracking + model registry)
    │
    v
Week 3-4: DVC for data/model versioning
    │
    v
Week 5-6: Experiment tracking best practices
    │
    v
Week 7-8: Feature store concepts (Feast)
    │
    v
Week 9-10: CI/CD pipelines for ML
    │
    v
Week 11-12: Integration project combining all concepts
```

---

## References

### Official Documentation
- [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
- [DVC Documentation](https://dvc.org/doc)
- [Feast Documentation](https://docs.feast.dev/)
- [Tecton Documentation](https://docs.tecton.ai/)
- [Delta Lake Documentation](https://docs.delta.io/)
- [LakeFS Documentation](https://docs.lakefs.io/)
- [Great Expectations](https://docs.greatexpectations.io/)

### Engineering Blogs
- [Uber Engineering - Michelangelo](https://www.uber.com/blog/michelangelo-machine-learning-platform/)
- [Netflix Tech Blog](https://netflixtechblog.com/)
- [Spotify Engineering](https://engineering.atspotify.com/)
- [Airbnb Engineering](https://medium.com/airbnb-engineering)
- [LinkedIn Engineering](https://engineering.linkedin.com/blog)
- [DoorDash Engineering](https://doordash.engineering/)

### Books and Courses
- "Designing Machine Learning Systems" by Chip Huyen (O'Reilly, 2022)
- "Machine Learning Engineering" by Andriy Burkov
- "Building Machine Learning Pipelines" by Hannes Hapke & Catherine Nelson
- [Made With ML](https://madewithml.com/) - MLOps Course
- [Full Stack Deep Learning](https://fullstackdeeplearning.com/)

### Community Resources
- [MLOps Community](https://mlops.community/)
- [ML-Ops.org](https://ml-ops.org/)
- [Awesome MLOps](https://github.com/visenger/awesome-mlops)
- [Feature Store Summit](https://www.featurestoresummit.com/)

### Research Papers
- "Hidden Technical Debt in Machine Learning Systems" (Google, NeurIPS 2015)
- "Challenges in Deploying Machine Learning" (Paleyes et al., 2020)
- "MLOps: Continuous Delivery and Automation Pipelines in Machine Learning" (Google Cloud, 2020)

---

*Last updated: January 2025*

*This document is intended for educational purposes. Tool versions and best practices evolve rapidly in the MLOps space - always consult official documentation for the most current information.*
