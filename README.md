# Fabric CI/CD from GitHub — Demo

End-to-end demo of best-practice CI/CD for **Microsoft Fabric** driven from **GitHub**, across **Dev / Test / Prod** workspaces, for a 2-engineer team.

![Architecture](docs/architecture.png)

## Architecture

| Workspace | Git-connected? | How it gets updated |
|-----------|----------------|---------------------|
| **Dev**   | ✅ Yes (`dev` branch) | Devs commit/update from the Fabric workspace UI |
| **Test**  | ❌ No  | GitHub Actions runs [`fabric-cicd`](https://microsoft.github.io/fabric-cicd/) on merge to `test` |
| **Prod**  | ❌ No  | GitHub Actions runs `fabric-cicd` on merge to `main` (gated by manual approval) |

- **Capacity**: single shared F-SKU capacity, 3 workspaces.
- **Auth**: workload identity (federated credential on a Service Principal) → GitHub OIDC. SP is **Workspace Admin** on Test + Prod.
- **Per-developer isolation** (demo shows both):
  - **A.** 2 devs share Dev workspace, work on feature branches → PR to `dev`.
  - **B.** Each dev has their own private feature workspace, Git-connected to a feature branch → PR to `dev`.

## Branch & promotion flow

```
feature/*  --PR-->  dev  --PR-->  test  --PR-->  main
                    |             |              |
              Dev workspace   Test workspace  Prod workspace
              (Git-connected) (fabric-cicd)   (fabric-cicd, gated)
```

## Repo layout

```
.github/
  workflows/
    pr-validate.yml       # lint + dry-run on PRs
    deploy-test.yml       # on push to test → Test workspace
    deploy-prod.yml       # on push to main → Prod workspace (manual approval)
  CODEOWNERS              # require review from the other engineer
workspace/                # Fabric items as folders (Git-connected format)
  Sales.Notebook/
  Ingest.DataPipeline/
  Bronze.Lakehouse/
  Silver.Warehouse/
  Sales.SemanticModel/
  Sales.Report/
  Telemetry.Eventhouse/
  CleanCustomers.Dataflow/
config/
  parameter.yml           # fabric-cicd parameter file (per-env values)
scripts/
  deploy.py               # thin wrapper around fabric_cicd.FabricWorkspace
requirements.txt
```

## Demo agenda (60 min, engineer audience)

| # | Phase                                       | Time |
|---|---------------------------------------------|------|
| 0 | Pre-built setup tour                        | 5 m  |
| 1 | Repo & workspace tour                       | 5 m  |
| 2 | Inner loop — Approach A (shared Dev ws)     | 10 m |
| 3 | Inner loop — Approach B (per-dev ws)        | 10 m |
| 4 | Promote Dev → Test (auto on PR merge)       | 10 m |
| 5 | Promote Test → Prod (gated, 4-eyes)         | 10 m |
| 6 | Failure & rollback (revert merge)           | 5 m  |
| 7 | Best-practice recap / Q&A                   | 5 m  |

## Best-practice checklist (the takeaway slide)

1. Only Dev workspace is Git-connected; Test/Prod via code (`fabric-cicd`).
2. Trunk-based: short-lived feature branches → `dev` → `test` → `main`.
3. Branch protection + CODEOWNERS → enforce 4-eyes review (critical with 2 devs).
4. GitHub Environments for `test`/`prod` with required reviewers + deployment history.
5. Workload identity (OIDC federated credential), **no client secrets**.
6. SP is Workspace Admin on Test/Prod; tenant setting *"Service principals can use Fabric APIs"* enabled for a security group.
7. Parameterize everything env-specific in `parameter.yml` — connection IDs, lakehouse refs, capacity IDs.
8. Use `fabric-cicd` `unpublish_orphaned_items=True` to prevent drift.
9. Code/schema in Git; data is **not** in Git — seeded by pipelines.
10. Pin `fabric-cicd` version; Dependabot for upgrades.
11. Post-deploy smoke test via Fabric REST.
12. Rollback = revert merge commit on `main` → pipeline re-runs and restores prior state.

## Caveats to call out live

- Some item types have partial Git support (Eventhouse/KQL, Dataflow Gen2 — verify support matrix at demo time).
- DirectLake semantic models: rebind connections via `parameter.yml`.
- "Update from Git" can conflict if 2 devs edit the same item in shared Dev → motivates Approach B.

## Setup checklist (one-time, before the demo)

> **Most of this is automated** — see [`scripts/setup/README.md`](scripts/setup/README.md).
> Run `scripts/setup/run-all.ps1` after step 1 (the only manual, tenant-admin step).

1. **Fabric tenant settings** — enable *"Service principals can use Fabric APIs"* and *"Users can create Fabric items"* (scoped to a security group).
2. **Create workspaces** — `ws-fabric-dev`, `ws-fabric-test`, `ws-fabric-prod`. Assign all to the shared capacity. *(Automated by `01-create-workspaces.ps1`.)*
3. **Service Principal** — create app registration `sp-fabric-cicd`. Add to the security group above. Add SP as **Admin** on all 3 workspaces.
4. **OIDC federated credential** — on `sp-fabric-cicd`, add federated credentials for:
   - `repo:<org>/cicd-github-fabric-workspace-demo:ref:refs/heads/test`
   - `repo:<org>/cicd-github-fabric-workspace-demo:environment:test`
   - `repo:<org>/cicd-github-fabric-workspace-demo:environment:prod`
5. **GitHub repo settings**
   - Branches: `main` (default), `test`, `dev`.
   - Branch protection on `main`/`test`/`dev`: require PR + 1 review + status checks.
   - Environments: `test` (no approval), `prod` (required reviewer = the *other* engineer).
   - Repo variables: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `FABRIC_CAPACITY_ID`, `WORKSPACE_ID_TEST`, `WORKSPACE_ID_PROD`.
6. **Connect Dev workspace to Git** — Workspace settings → Git integration → this repo, `dev` branch, folder `/workspace`.
7. **Seed `/workspace`** — create the items (Notebook, Pipeline, Lakehouse, Warehouse, Semantic Model, Report, Eventhouse, Dataflow) in the Dev workspace UI, then commit to Git.
8. **Rehearse** the full flow twice end-to-end before the live demo.

## Rehearsal verification

- [ ] 3 workspaces exist; capacity assigned; SP Admin on all three.
- [ ] Dev workspace Git-connected; items visible in repo `/workspace`.
- [ ] `pr-validate.yml` green on a no-op PR.
- [ ] `deploy-test.yml` succeeds end-to-end on a real change.
- [ ] `deploy-prod.yml` blocks on manual approval; succeeds after approve.
- [ ] Revert PR on `main` rolls Prod back cleanly.
- [ ] Full run-through fits 55 min with 5 min buffer.

## Out of scope (state explicitly)

- Data seeding strategy.
- Notebook testing frameworks (Great Expectations / NUnit-style).
- Multi-region / multi-tenant.
- Capacity cost governance.
