"""
Post-deploy smoke test: invoke the Sales notebook in the target workspace via
the Fabric REST API and wait for it to succeed.

Auth: DefaultAzureCredential picks up the OIDC token populated by azure/login.
"""

from __future__ import annotations

import os
import sys
import time

import requests
from azure.identity import DefaultAzureCredential

FABRIC_API = "https://api.fabric.microsoft.com/v1"
SCOPE = "https://api.fabric.microsoft.com/.default"
NOTEBOOK_DISPLAY_NAME = "Sales"  # matches workspace/Sales.Notebook
TIMEOUT_S = 600


def _token() -> str:
    return DefaultAzureCredential().get_token(SCOPE).token


def _headers() -> dict:
    return {"Authorization": f"Bearer {_token()}", "Content-Type": "application/json"}


def find_notebook_id(workspace_id: str, display_name: str) -> str:
    r = requests.get(f"{FABRIC_API}/workspaces/{workspace_id}/notebooks", headers=_headers(), timeout=30)
    r.raise_for_status()
    for nb in r.json().get("value", []):
        if nb.get("displayName") == display_name:
            return nb["id"]
    raise RuntimeError(f"Notebook '{display_name}' not found in workspace {workspace_id}")


def run_notebook(workspace_id: str, notebook_id: str) -> str:
    url = f"{FABRIC_API}/workspaces/{workspace_id}/items/{notebook_id}/jobs/instances?jobType=RunNotebook"
    r = requests.post(url, headers=_headers(), timeout=30)
    r.raise_for_status()
    location = r.headers.get("Location")
    if not location:
        raise RuntimeError(f"No Location header from job submit: {r.status_code}")
    return location


def wait(location: str) -> None:
    deadline = time.time() + TIMEOUT_S
    while time.time() < deadline:
        r = requests.get(location, headers=_headers(), timeout=30)
        r.raise_for_status()
        status = r.json().get("status")
        print(f"[smoke] status={status}")
        if status in {"Completed"}:
            return
        if status in {"Failed", "Cancelled", "Deduped"}:
            raise RuntimeError(f"Smoke test ended with status={status}")
        time.sleep(10)
    raise TimeoutError("Smoke test timed out")


def main() -> int:
    workspace_id = os.environ["FABRIC_WORKSPACE_ID"]
    print(f"[smoke] workspace_id={workspace_id}")
    nb_id = find_notebook_id(workspace_id, NOTEBOOK_DISPLAY_NAME)
    print(f"[smoke] notebook_id={nb_id}")
    loc = run_notebook(workspace_id, nb_id)
    wait(loc)
    print("[smoke] OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
