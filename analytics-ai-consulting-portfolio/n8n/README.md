# n8n workflows

Import the two supplied workflow JSON files into n8n.

1. Install/start MySQL 8.0 and execute the relevant schema and analytical query scripts.
2. Configure a MySQL credential in n8n. Select it on the MySQL query node.
3. Start Ollama locally and pull qwen2.5:3b.
4. Confirm the Ollama API is reachable at http://localhost:11434/api/generate. If n8n runs in Docker, use http://host.docker.internal:11434/api/generate or the correct host address.
5. Run the workflow manually first. Inspect the generated summary.
6. Only enable the schedule after verifying credentials, endpoint, output and data boundaries.

The workflow sends department- or sector-level aggregates only to the local model. No emails, HR decisions or investment approvals are triggered. Human review remains required. Workflow files are templates and may require minor n8n version/credential adjustments.
