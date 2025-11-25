# Workflow Management Component (WMC) - Phase 1

Multi-tenant SaaS platform with workflow-level customization capabilities.

## Phase 1: Workflow Triggering & Execution

### Architecture Overview

- **Product Service** (Port 3001): SaaS product API with order management
- **Tenant Manager** (Port 3002): Tenant registration and workflow registry
- **API Gateway** (Port 3000): Request routing with authentication
- **WMC Controller** (Port 3003): Workflow orchestrator
- **Execution Service** (Port 3004): Workflow runtime engine
- **Integration Service** (Port 3005): External API orchestration

### Prerequisites

- Docker Desktop with Kubernetes enabled
- Node.js 18+ (for local development)
- PostgreSQL 15
- Redis 7

### Quick Start

1. **Clone and setup**
   ```bash
   cd c:\Users\sachi\Desktop\WMC2
   cp .env.example .env

   ```
