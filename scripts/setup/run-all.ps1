<#
.SYNOPSIS
    End-to-end orchestrator for the Fabric CI/CD demo setup.
    Runs scripts 01..05 in order and updates CODEOWNERS with your handle.

.PARAMETER Prefix
    Workspace name prefix. Default: ws-fabric.

.PARAMETER CapacityId
    Fabric capacity GUID. REQUIRED.

.PARAMETER GitHubRepo
    GitHub repo "owner/name". REQUIRED.

.PARAMETER GitHubUser
    Your GitHub username. Used for CODEOWNERS and as the default Prod reviewer
    if -ProdReviewers is empty.

.PARAMETER ProdReviewers
    GitHub usernames who must approve Prod deploys. If empty, falls back to
    -GitHubUser (note: GitHub will not let an actor approve their own deployment;
    add a teammate before doing a real prod deploy).

.PARAMETER SecurityGroupObjectId
    Optional Entra group used for the "Service principals can use Fabric APIs"
    tenant setting. SP will be added as a member.

.PARAMETER ExtraAdminUserIds
    Optional Entra user object IDs to add as workspace Admins.

.PARAMETER SkipGitConnect
    Skip step 5 (Dev workspace Git connect).

.EXAMPLE
    ./run-all.ps1 `
        -Prefix ws-fabric `
        -CapacityId 11111111-2222-3333-4444-555555555555 `
        -GitHubRepo myorg/cicd-github-fabric-workspace-demo `
        -GitHubUser myhandle
#>
[CmdletBinding()]
param(
    [string]$Prefix = 'ws-fabric',
    [Parameter(Mandatory)][string]$CapacityId,
    [Parameter(Mandatory)][string]$GitHubRepo,
    [Parameter(Mandatory)][string]$GitHubUser,
    [string[]]$ProdReviewers = @(),
    [string]$SecurityGroupObjectId,
    [string[]]$ExtraAdminUserIds = @(),
    [switch]$SkipGitConnect
)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\_common.ps1"

if (-not $ProdReviewers -or $ProdReviewers.Count -eq 0) {
    Write-Warn2 "No -ProdReviewers given; using $GitHubUser. GitHub blocks self-approval, so add a teammate before a real prod deploy."
    $ProdReviewers = @($GitHubUser)
}

Write-Step "Step 1/6 Create workspaces"
& "$PSScriptRoot\01-create-workspaces.ps1" -Prefix $Prefix -CapacityId $CapacityId

Write-Step "Step 2/6 Create SP + federated credentials"
$spArgs = @{ DisplayName = 'sp-fabric-cicd'; GitHubRepo = $GitHubRepo }
if ($SecurityGroupObjectId) { $spArgs.SecurityGroupObjectId = $SecurityGroupObjectId }
& "$PSScriptRoot\02-create-sp.ps1" @spArgs

Write-Step "Step 3/6 Assign workspace admin roles"
& "$PSScriptRoot\03-assign-workspace-admin.ps1" -ExtraAdminUserIds $ExtraAdminUserIds

Write-Step "Step 4/6 Configure GitHub repo / branches / envs / vars"
& "$PSScriptRoot\04-setup-github-repo.ps1" `
    -GitHubRepo $GitHubRepo `
    -FabricCapacityId $CapacityId `
    -ProdReviewers $ProdReviewers

Write-Step "Step 5/6 Update CODEOWNERS with @$GitHubUser"
$co = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..' '..')) '.github\CODEOWNERS'
if (Test-Path $co) {
    $content = "* @$GitHubUser`n"
    Set-Content -Path $co -Value $content -Encoding UTF8
    Write-Ok "CODEOWNERS updated"
}

if ($SkipGitConnect) {
    Write-Warn2 "Skipping Dev workspace Git connect"
} else {
    Write-Step "Step 6/6 Connect Dev workspace to Git"
    & "$PSScriptRoot\05-connect-dev-git.ps1" -GitHubRepo $GitHubRepo -Branch dev
}

Write-Step "All done."
Write-Host @"

Next manual steps (cannot be automated without tenant admin):
  * Tenant setting: Admin portal -> Tenant settings ->
      'Service principals can use Fabric APIs' = Enabled
      (scope to a security group containing the new SP).
  * Tenant setting: 'Users can create Fabric items' must include the SP/group.
  * If you didn't pass -ProdReviewers, add a teammate as a required reviewer
    on the 'prod' environment before doing a real prod deploy.

"@ -ForegroundColor Yellow
