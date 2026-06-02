# Fabric notebook source — REPLACE THIS with the real notebook committed
# from the Dev workspace UI. Kept here so the repo structure is complete
# before Git integration is wired up.

# Demo config cell — values get rebound per environment via parameter.yml
config = {
    "environment": "dev",
    "lakehouse_id": "00000000-0000-0000-0000-000000000DEV",
    "lake_path": "abfss://dev@contosolakedev.dfs.core.windows.net",
}

print(f"Hello from Sales notebook, env={config['environment']}")
