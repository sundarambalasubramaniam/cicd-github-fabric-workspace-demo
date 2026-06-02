<#
.SYNOPSIS
    Add the SP (and optional human users) as Admin on Dev / Test / Prod workspaces.

.PARAMETER WorkspaceIdsFile
    Path to JSON file produced by 01-create-workspaces.ps1.
    Default: ./workspace-ids.json

.PARAMETER SpInfoFile
    Path to JSON file produced by 02-create-sp.ps1.
    Default: ./sp-info.json

.PARAMETER ExtraAdminUserIds
    Optional extra Entra user object IDs to add as workspace Admins
    (e.g. the two Fabric engineers). Applied to all 3 workspaces.

.NOTES
    Caller must already be Admin on the workspaces (you are, since you created them).
#>
[CmdletBinding()]
param(
    [string]$WorkspaceIdsFile = (Join-Path $PSScriptRoot 'workspace-ids.json'),
    [string]$SpInfoFile       = (Join-Path $PSScriptRoot 'sp-info.json'),
    [string[]]$ExtraAdminUserIds = @()
)

. "$PSScriptRoot\_common.ps1"
$null = Assert-AzCli

$wsIds = Get-Content $WorkspaceIdsFile -Raw | ConvertFrom-Json
$sp    = Get-Content $SpInfoFile       -Raw | ConvertFrom-Json

function Add-WorkspaceRole {
    param(
        [string]$WorkspaceId,
        [string]$PrincipalId,
        [ValidateSet('User','Group','ServicePrincipal')][string]$PrincipalType,
        [ValidateSet('Admin','Member','Contributor','Viewer')][string]$Role = 'Admin'
    )
    $body = @{
        principal = @{ id = $PrincipalId; type = $PrincipalType }
        role      = $Role
    }
    try {
        Invoke-FabricApi -Method POST -Path "/workspaces/$WorkspaceId/roleAssignments" -Body $body | Out-Null
        Write-Ok "added $PrincipalType $PrincipalId as $Role"
    } catch {
        # Already-exists comes back as 409
        if ($_.Exception.Message -match '409|already') {
            Write-Ok "$PrincipalType $PrincipalId already has role"
        } else {
            Write-Warn2 "role-assign failed: $($_.Exception.Message)"
        }
    }
}

foreach ($prop in $wsIds.PSObject.Properties) {
    $envName = $prop.Name
    $wsId    = $prop.Value
    Write-Step "Workspace '$envName' ($wsId)"

    Add-WorkspaceRole -WorkspaceId $wsId -PrincipalId $sp.objectId -PrincipalType ServicePrincipal -Role Admin
    foreach ($uid in $ExtraAdminUserIds) {
        Add-WorkspaceRole -WorkspaceId $wsId -PrincipalId $uid -PrincipalType User -Role Admin
    }
}
