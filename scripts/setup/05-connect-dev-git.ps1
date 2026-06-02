<#
.SYNOPSIS
    Connect the Dev Fabric workspace to a GitHub branch (Git integration).

.DESCRIPTION
    Calls Fabric REST:
        POST /workspaces/{id}/git/connect
        POST /workspaces/{id}/git/initializeConnection
        POST /workspaces/{id}/git/updateFromGit  (initial sync if remote has items)

.PARAMETER GitHubRepo
    "owner/name" of the repo.

.PARAMETER Branch
    Git branch to connect (default: dev).

.PARAMETER DirectoryName
    Sub-folder in the repo where Fabric items live (default: /workspace).

.PARAMETER WorkspaceIdsFile
    Defaults to ./workspace-ids.json from script 01.

.PARAMETER Environment
    Which env in the workspace-ids.json to connect (default: dev).

.NOTES
    Requires the calling user (you) to be Admin on the Fabric workspace AND on
    the GitHub repo. Fabric uses the signed-in user's GitHub identity through
    its built-in GitHub provider (no PAT required for the public github.com
    provider in this flow).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$GitHubRepo,        # e.g. myorg/cicd-github-fabric-workspace-demo
    [string]$Branch = 'dev',
    [string]$DirectoryName = '/workspace',
    [string]$WorkspaceIdsFile = (Join-Path $PSScriptRoot 'workspace-ids.json'),
    [string]$Environment = 'dev'
)

. "$PSScriptRoot\_common.ps1"
$null = Assert-AzCli

$wsIds = Get-Content $WorkspaceIdsFile -Raw | ConvertFrom-Json
$wsId  = $wsIds.$Environment
if (-not $wsId) { throw "No workspace ID found for environment '$Environment' in $WorkspaceIdsFile" }

$ownerName, $repoName = $GitHubRepo -split '/', 2
if (-not $repoName) { throw "GitHubRepo must be in 'owner/name' form." }

Write-Step "Connect workspace '$Environment' ($wsId) to $GitHubRepo @ $Branch"
$connectBody = @{
    gitProviderDetails = @{
        gitProviderType = 'GitHub'
        ownerName       = $ownerName
        repositoryName  = $repoName
        branchName      = $Branch
        directoryName   = $DirectoryName
    }
}
try {
    Invoke-FabricApi -Method POST -Path "/workspaces/$wsId/git/connect" -Body $connectBody | Out-Null
    Write-Ok "git/connect succeeded"
} catch {
    Write-Warn2 "git/connect: $($_.Exception.Message) (continuing — workspace may already be connected)"
}

Write-Step "Initialize git connection"
$init = Invoke-FabricLro -Method POST -Path "/workspaces/$wsId/git/initializeConnection" -Body @{}
$reqAction = $init.result.requiredAction
Write-Ok "initializeConnection -> requiredAction=$reqAction"

switch ($reqAction) {
    'UpdateFromGit' {
        Write-Step "Pull items from Git into workspace"
        $body = @{
            remoteCommitHash       = $init.result.remoteCommitHash
            workspaceHead          = $init.result.workspaceHead
            conflictResolution     = @{ conflictResolutionType = 'Workspace'; conflictResolutionPolicy = 'PreferRemote' }
            options                = @{ allowOverrideItems = $true }
        }
        Invoke-FabricLro -Method POST -Path "/workspaces/$wsId/git/updateFromGit" -Body $body | Out-Null
        Write-Ok "updateFromGit complete"
    }
    'CommitToGit' {
        Write-Warn2 "Workspace has uncommitted items. Commit manually from Fabric UI or call /git/commitToGit."
    }
    default {
        Write-Ok "no further action required"
    }
}
