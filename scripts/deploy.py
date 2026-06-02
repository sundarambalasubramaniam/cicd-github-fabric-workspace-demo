"""
Thin wrapper around fabric-cicd's FabricWorkspace.

Driven by env vars set by the GitHub Actions workflows:
  FABRIC_WORKSPACE_ID  — target workspace (Test or Prod)
  FABRIC_ENVIRONMENT   — 'test' | 'prod' (selects values from parameter.yml)
  DRY_RUN              — 'true' to validate without publishing

Auth: relies on `azure/login@v2` with OIDC having already populated the
DefaultAzureCredential chain (AZURE_CLIENT_ID / AZURE_TENANT_ID / federated token).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from fabric_cicd import FabricWorkspace, publish_all_items, unpublish_all_orphan_items

REPO_ROOT = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = REPO_ROOT / "workspace"
PARAMETER_FILE = REPO_ROOT / "config" / "parameter.yml"

# Item types we manage in this demo. Keep in sync with /workspace folders.
ITEM_TYPES = [
    "Notebook",
    "DataPipeline",
    "Lakehouse",
    "Warehouse",
    "SemanticModel",
    "Report",
    "Eventhouse",
    "KQLDatabase",
    "Dataflow",
]


def main() -> int:
    workspace_id = os.environ["FABRIC_WORKSPACE_ID"]
    environment = os.environ["FABRIC_ENVIRONMENT"]
    dry_run = os.environ.get("DRY_RUN", "false").lower() == "true"

    print(f"[deploy] workspace_id={workspace_id} env={environment} dry_run={dry_run}")
    print(f"[deploy] repository_directory={WORKSPACE_DIR}")
    print(f"[deploy] parameter_file={PARAMETER_FILE}")

    ws = FabricWorkspace(
        workspace_id=workspace_id,
        environment=environment,
        repository_directory=str(WORKSPACE_DIR),
        item_type_in_scope=ITEM_TYPES,
        parameter_file_name=str(PARAMETER_FILE.name),
    )

    if dry_run:
        # fabric-cicd performs validation when constructed; explicit dry-run
        # path simply skips publish/unpublish.
        print("[deploy] DRY_RUN=true — skipping publish & unpublish.")
        return 0

    publish_all_items(ws)
    unpublish_all_orphan_items(ws)
    print("[deploy] done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
