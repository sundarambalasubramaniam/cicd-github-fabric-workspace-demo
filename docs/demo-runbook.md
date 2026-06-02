# Demo runbook — Fabric CI/CD from GitHub (60 min)

Speaker notes for the live demo. Times are cumulative.

---

## 0:00 — Phase 0: Pre-built setup tour (5 min)

**Show, don't build.** Open in this order:

1. GitHub repo home → README architecture diagram.
2. Fabric portal → 3 workspaces (`ws-fabric-dev`, `ws-fabric-test`, `ws-fabric-prod`).
3. Capacity admin → all 3 on the same shared capacity.
4. Dev workspace settings → **Git integration** tab (connected to `dev`).
5. Entra → `sp-fabric-cicd` app reg → **Federated credentials** (no client secret!).
6. GitHub repo → Settings → Environments → `prod` shows required reviewer.

**Talking point**: "Test and Prod are *not* Git-connected — they're code-deployed. This is the recommended Fabric pattern."

---

## 0:05 — Phase 1: Repo & workspace tour (5 min)

- `workspace/` — Fabric items as folders.
- `workspace/parameter.yml` — env-specific rebinds (lives next to items so fabric-cicd auto-loads it).
- `.github/workflows/` — three pipelines.
- `.github/CODEOWNERS` — enforces 4-eyes.

---

## 0:10 — Phase 2: Inner loop A — shared Dev workspace (10 min)

Acting as **Dev1**:

```bash
git checkout dev && git pull
git checkout -b feature/add-sales-kpi
```

In Fabric Dev workspace UI:
1. **Manage connection** → switch to branch `feature/add-sales-kpi`.
2. Add a new cell to `Sales` notebook computing a KPI. Save.
3. Add a parameter to `Ingest` pipeline.
4. Workspace toolbar → **Source control** → review changes → **Commit**.

In GitHub:
1. Push branch, open PR `feature/add-sales-kpi → dev`.
2. **Dev2** reviews. CODEOWNERS forces this. Approve, merge.

Back in Dev workspace: switch connection to `dev`, click **Update from Git** → see merged change appear.

**Talking point**: "Both devs working on the same workspace risks UI conflicts — that's why Approach B exists."

---

## 0:20 — Phase 3: Inner loop B — per-dev workspace (10 min)

Acting as **Dev2 (Alice)**:

- Show pre-created workspace `ws-fabric-dev-alice` Git-connected to `feature/alice-*`.
- Edit a notebook → commit → PR to `dev`.
- No collision with Dev1 because workspace is isolated.

**Talking point**: tradeoff is extra capacity overhead vs isolation. Pick A for tiny teams; B for >1 active dev.

---

## 0:30 — Phase 4: Promote Dev → Test (10 min)

```bash
git checkout test && git pull
git merge --no-ff dev
git push    # opens PR via branch protection? — actually open via UI
```

Open PR `dev → test`:
- Show `pr-validate.yml` running: lint + parameter schema check + `fabric-cicd` dry-run.
- Merge PR.

`deploy-test.yml` triggers:
- OIDC token from GitHub → Azure → Fabric.
- `fabric-cicd` publishes items, parameters rebind to Test values.
- `unpublish_orphaned_items` removes anything deleted upstream.
- Smoke test runs `Sales` notebook in Test workspace.

Show Test workspace updated. Open the notebook → KPI cell present.

---

## 0:40 — Phase 5: Promote Test → Prod, gated (10 min)

Open PR `test → main`. Merge.

`deploy-prod.yml` starts → **pauses on environment approval**.
- The *other* engineer approves (4-eyes).
- Pipeline resumes, deploys to Prod, runs smoke test, tags release.

Show Prod workspace updated. Show the new git tag in the repo.

---

## 0:50 — Phase 6: Failure & rollback (5 min)

Two scenarios:

**A. CI catches a bad change**
- Push a syntax error to a feature branch → open PR → `pr-validate` red → cannot merge.

**B. Roll Prod back**
- `git revert <merge-sha>` on `main` → push → `deploy-prod.yml` runs again with the previous state → Prod restored.

**Talking point**: data is *not* in Git. If the change involved schema migration, you also need a forward-fix migration; "revert the code" only handles code/schema definitions.

---

## 0:55 — Phase 7: Recap & Q&A (5 min)

Show the **Best-practice checklist** slide from `README.md` (12 items). Ask for questions.

---

## Common questions & answers

- **Why not Git-connect Test and Prod too?** Because higher environments must only change via reviewed PRs. Direct workspace edits would bypass the gate and cause drift.
- **What about deployment pipelines (the built-in Fabric feature)?** Useful for click-ops promotion; doesn't give you PR review, branch protection, environment approvals, or audit trail. `fabric-cicd` from GitHub does.
- **How do we handle long-running data migrations?** Out of scope for this demo — handled by versioned pipeline activities, not by the deployment tool.
- **Secrets in connections?** Fabric stores them; we only rebind connection IDs via `parameter.yml`. No secret material lives in Git.
