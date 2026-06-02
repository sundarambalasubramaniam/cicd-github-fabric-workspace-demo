<#
.SYNOPSIS
    Bootstrap the GitHub repo for the Fabric CI/CD demo:
      - create repo (if missing)
      - push current local repo to it
      - create branches: dev, test, main
      - apply branch protection (PR + 1 review + status checks) on all three
      - create Environments: test (no approvers), prod (required reviewers)
      - set Repository Variables consumed by the workflows

.PARAMETER GitHubRepo
    "owner/name" of the repo. If owner/repo doesn't exist, it will be created.

.PARAMETER WorkspaceIdsFile
.PARAMETER SpInfoFile
    Outputs from previous setup scripts.

.PARAMETER FabricCapacityId
    Capacity GUID, exposed to workflows for parameter rebinding if needed.

.PARAMETER ProdReviewers
    GitHub usernames (NOT including yourself if you are the actor) who must
    approve before a Prod deploy runs. Comma- or array-form.

.PARAMETER DefaultBranch
    Repo default branch. Default: main.

.PARAMETER Visibility
    'private' | 'internal' | 'public'. Default: private.

.NOTES
    Requires the GitHub CLI (gh) authenticated with `gh auth login` (scopes:
    repo, workflow, admin:repo_hook). For branch protection on a free private
    repo you need GitHub Pro/Team or a public repo.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$GitHubRepo,
    [string]$WorkspaceIdsFile = (Join-Path $PSScriptRoot 'workspace-ids.json'),
    [string]$SpInfoFile       = (Join-Path $PSScriptRoot 'sp-info.json'),
    [Parameter(Mandatory)][string]$FabricCapacityId,
    [string[]]$ProdReviewers = @(),
    [string]$DefaultBranch = 'main',
    [ValidateSet('private','internal','public')][string]$Visibility = 'private'
)

. "$PSScriptRoot\_common.ps1"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI ('gh') not found. Install from https://cli.github.com and run 'gh auth login'."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..' '..') | Select-Object -ExpandProperty Path
Push-Location $repoRoot
try {
    $wsIds = Get-Content $WorkspaceIdsFile -Raw | ConvertFrom-Json
    $sp    = Get-Content $SpInfoFile       -Raw | ConvertFrom-Json

    Write-Step "Ensure GitHub repo '$GitHubRepo' exists"
    $exists = gh repo view $GitHubRepo --json name 2>$null
    if (-not $exists) {
        if (-not (Test-Path .git)) {
            git init -b $DefaultBranch | Out-Null
        }
        gh repo create $GitHubRepo --$Visibility --source . --remote origin --push | Out-Null
        Write-Ok "repo created and pushed"
    } else {
        Write-Ok "repo exists"
        # Make sure origin points to it
        $remote = git remote get-url origin 2>$null
        if (-not $remote) {
            git remote add origin "https://github.com/$GitHubRepo.git"
        }
        # Stage + commit + push if there are changes
        git add -A | Out-Null
        if ((git status --porcelain).Length -gt 0) {
            git commit -m "scaffold fabric ci/cd demo" | Out-Null
        }
        git branch -M $DefaultBranch
        git push -u origin $DefaultBranch 2>$null | Out-Null
    }

    Write-Step "Ensure branches dev, test, $DefaultBranch"
    foreach ($b in @($DefaultBranch, 'test', 'dev')) {
        git fetch origin $b 2>$null | Out-Null
        $exists = git ls-remote --heads origin $b
        if (-not $exists) {
            git checkout -B $b
            git push -u origin $b | Out-Null
            Write-Ok "branch '$b' created"
        } else {
            Write-Ok "branch '$b' exists"
        }
    }
    git checkout $DefaultBranch | Out-Null

    Write-Step "Apply branch protection (PR + 1 review)"
    foreach ($b in @($DefaultBranch, 'test', 'dev')) {
        $protBody = @{
            required_status_checks         = $null
            enforce_admins                 = $false
            required_pull_request_reviews  = @{
                required_approving_review_count = 1
                dismiss_stale_reviews           = $true
                require_code_owner_reviews      = $true
            }
            restrictions                   = $null
            allow_force_pushes             = $false
            allow_deletions                = $false
            required_linear_history        = $true
        }
        $tmp = New-TemporaryFile
        ($protBody | ConvertTo-Json -Depth 6) | Set-Content $tmp -Encoding UTF8
        try {
            gh api -X PUT "repos/$GitHubRepo/branches/$b/protection" --input $tmp 1>$null
            Write-Ok "protection set on '$b'"
        } catch {
            Write-Warn2 "branch protection on '$b' failed (free private repos can't set protection): $($_.Exception.Message)"
        }
        Remove-Item $tmp -Force
    }

    Write-Step "Create environments: test, prod"
    # test: no approvers
    gh api -X PUT "repos/$GitHubRepo/environments/test" -f wait_timer=0 1>$null
    Write-Ok "env 'test' ready"

    # prod: required reviewers
    $prodReviewerObjs = @()
    foreach ($u in $ProdReviewers) {
        $userJson = gh api "users/$u" 2>$null | ConvertFrom-Json
        if ($userJson.id) { $prodReviewerObjs += @{ type = 'User'; id = $userJson.id } }
    }
    $prodBody = @{
        wait_timer = 0
        reviewers  = $prodReviewerObjs
        deployment_branch_policy = @{
            protected_branches      = $true
            custom_branch_policies  = $false
        }
    }
    $tmp = New-TemporaryFile
    ($prodBody | ConvertTo-Json -Depth 6) | Set-Content $tmp -Encoding UTF8
    gh api -X PUT "repos/$GitHubRepo/environments/prod" --input $tmp 1>$null
    Remove-Item $tmp -Force
    Write-Ok "env 'prod' ready (reviewers: $($ProdReviewers -join ', '))"

    Write-Step "Set repository variables"
    $vars = @{
        AZURE_TENANT_ID    = $sp.tenantId
        AZURE_CLIENT_ID    = $sp.appId
        WORKSPACE_ID_DEV   = $wsIds.dev
        WORKSPACE_ID_TEST  = $wsIds.test
        WORKSPACE_ID_PROD  = $wsIds.prod
        FABRIC_CAPACITY_ID = $FabricCapacityId
    }
    foreach ($k in $vars.Keys) {
        gh variable set $k --repo $GitHubRepo --body $vars[$k] 1>$null
        Write-Ok "var $k set"
    }
}
finally {
    Pop-Location
}
