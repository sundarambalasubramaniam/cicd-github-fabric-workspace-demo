# Programmatic setup

These scripts replace steps 3–11 of the one-time setup checklist in the root
[`README.md`](../../README.md) and **also** create the Fabric workspaces (so the
workspace-creation script is reusable for future demos).

## Files

| Script | What it does |
|---|---|
| `_common.ps1` | Shared helpers (token, REST wrappers). Sourced by others. |
| `01-create-workspaces.ps1` | Creates `<prefix>-dev/test/prod` workspaces and assigns the capacity. Idempotent. Outputs `workspace-ids.json`. |
| `02-create-sp.ps1` | Creates SP `sp-fabric-cicd`, configures GitHub OIDC federated credentials for `test` / `prod` environments + `test`/`main` branch + PR. Outputs `sp-info.json`. |
| `03-assign-workspace-admin.ps1` | Adds the SP (and any extra users) as Admin on all 3 workspaces. |
| `04-setup-github-repo.ps1` | Creates the GitHub repo, pushes scaffold, creates `dev` / `test` / `main` branches + protection, creates `test` & `prod` environments, sets repo Variables. |
| `05-connect-dev-git.ps1` | Connects the Dev workspace to the `dev` branch via Fabric Git integration. |
| `run-all.ps1` | One-shot orchestrator: runs 01 → 05 and updates CODEOWNERS. |

Outputs (`workspace-ids.json`, `sp-info.json`) are written next to the scripts
and are git-ignored — they hold no secrets but are environment-specific.

## Prerequisites

1. **Azure CLI** signed in: `az login`
2. **GitHub CLI** authenticated: `gh auth login` (scopes: `repo`, `workflow`, `admin:repo_hook`)
3. **PowerShell 7+** (`pwsh`). Run from this folder.
4. Identity must have:
   * Application Administrator (or higher) in Entra ID — to create the SP.
   * Capacity Admin / Contributor on the target Fabric capacity.
   * Permission to create repos in the target GitHub org.
5. **Tenant admin (cannot be scripted):**
   * Fabric admin portal → Tenant settings → enable
     *“Service principals can use Fabric APIs”* and scope it to a security
     group containing the new SP.

## Quick start

```powershell
cd scripts\setup

./run-all.ps1 `
    -Prefix       ws-fabric `
    -CapacityId   <fabric-capacity-guid> `
    -GitHubRepo   <owner>/<repo> `
    -GitHubUser   <your-github-handle> `
    -ProdReviewers @('teammate-handle')           # optional, recommended
    # -SecurityGroupObjectId <entra-group-guid>   # optional, if you scope the tenant setting
    # -ExtraAdminUserIds @('<entra-user-oid>')    # optional, e.g. the 2nd engineer
```

## Running steps individually

```powershell
./01-create-workspaces.ps1     -Prefix ws-fabric -CapacityId <guid>
./02-create-sp.ps1             -GitHubRepo <owner>/<repo>
./03-assign-workspace-admin.ps1
./04-setup-github-repo.ps1     -GitHubRepo <owner>/<repo> -FabricCapacityId <guid> -ProdReviewers @('teammate')
./05-connect-dev-git.ps1       -GitHubRepo <owner>/<repo> -Branch dev
```

## Reusing for future demos

`01-create-workspaces.ps1` is standalone — to spin up a new set of workspaces
later, just rerun it with a different `-Prefix`. It's idempotent and writes
`workspace-ids.json` for downstream automation.

## Tear-down (manual)

The scripts intentionally do **not** include destructive operations. To clean up:

```powershell
# Workspaces
Invoke-RestMethod -Method DELETE -Uri "https://api.fabric.microsoft.com/v1/workspaces/<id>" `
    -Headers @{ Authorization = "Bearer $(az account get-access-token --resource https://api.fabric.microsoft.com --query accessToken -o tsv)" }

# SP
az ad app delete --id <appId>

# GitHub repo
gh repo delete <owner>/<repo> --yes
```
