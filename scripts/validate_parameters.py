"""Lightweight schema check for workspace/parameter.yml.

Runs in PR validation. Verifies the file parses as YAML and contains only the
keys understood by fabric-cicd (`find_replace`, `key_value_replace`) with the
required sub-fields. Intentionally minimal — fabric-cicd itself does deeper
validation at publish time.
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml

ALLOWED_TOP = {"find_replace", "key_value_replace"}
FIND_REPLACE_REQUIRED = {"find_value", "replace_value"}
KV_REPLACE_REQUIRED = {"find_key", "replace_value"}


def fail(path: str, msg: str) -> None:
    print(f"::error file={path}::{msg}")
    sys.exit(1)


def main(path: str) -> None:
    p = Path(path)
    if not p.exists():
        fail(path, f"{path} does not exist")

    data = yaml.safe_load(p.read_text()) or {}
    if not isinstance(data, dict):
        fail(path, "Top-level document must be a mapping")

    extra = set(data) - ALLOWED_TOP
    if extra:
        fail(path, f"Unknown top-level keys: {sorted(extra)}")

    for entry in data.get("find_replace", []) or []:
        missing = FIND_REPLACE_REQUIRED - set(entry)
        if missing:
            fail(path, f"find_replace entry missing keys: {sorted(missing)} in {entry}")
        if not isinstance(entry["replace_value"], dict):
            fail(path, f"find_replace.replace_value must be a mapping per env: {entry}")

    for entry in data.get("key_value_replace", []) or []:
        missing = KV_REPLACE_REQUIRED - set(entry)
        if missing:
            fail(path, f"key_value_replace entry missing keys: {sorted(missing)} in {entry}")

    print(f"OK: {path}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "workspace/parameter.yml")
