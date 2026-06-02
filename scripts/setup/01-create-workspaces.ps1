<#
.SYNOPSIS
    Create the Dev / Test / Prod Fabric workspaces and assign them to a capacity.

.PARAMETER Prefix
    Workspace name prefix. Final names: "<prefix>-dev", "<prefix>-test", "<prefix>-prod".

.PARAMETER CapacityId
    Fabric capacity GUID (F-SKU or trial). Required.

.PARAMETER Description
    Optional description applied to all 3 workspaces.

.OUTPUTS
    Writes a JSON map of {dev,test,prod} -> workspace IDs to ./workspace-ids.json
    in the same folder, and prints them.

.EXAMPLE
    ./01-create-workspaces.ps1 -Prefix ws-fabric -CapacityId 11111111-2222-3333-4444-555555555555

.NOTES
    Caller must be signed in to az (`az login`) and have rights to create
    Fabric workspaces and assign them to the target capacity (Capacity Admin
    or Contributor on the capacity, plus tenant setting "Users can create
    Fabric items" enabled for them).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Prefix,
    [Parameter(Mandatory)][string]$CapacityId,
    [string]$Description = "Fabric CI/CD demo workspace"
)

. "$PSScriptRoot\_common.ps1"
$null = Assert-AzCli

$envs = @('dev','test','prod')
$result = [ordered]@{}

foreach ($e in $envs) {
    $name = "$Prefix-$e"
    Write-Step "Ensure workspace '$name'"

    # Look up by display name first (idempotent)
    $existing = (Invoke-FabricApi -Method GET -Path "/workspaces" -AllPages) |
        Where-Object { $_.displayName -eq $name } | Select-Object -First 1

    if ($existing) {
        Write-Ok "exists -> $($existing.id)"
        $wsId = $existing.id
    } else {
        $body = @{
            displayName = $name
            description = "$Description ($e)"
            capacityId  = $CapacityId
        }
        $created = Invoke-FabricApi -Method POST -Path "/workspaces" -Body $body
        $wsId = $created.id
        Write-Ok "created -> $wsId"
    }

    # Ensure capacity assignment (in case workspace existed without capacity)
    Write-Step "Assign capacity to '$name'"
    try {
        Invoke-FabricApi -Method POST -Path "/workspaces/$wsId/assignToCapacity" -Body @{ capacityId = $CapacityId } | Out-Null
        Write-Ok "capacity assigned"
    } catch {
        # 400 if already assigned to same capacity
        Write-Warn2 "assignToCapacity returned: $($_.Exception.Message)"
    }

    $result[$e] = $wsId
}

$outFile = Join-Path $PSScriptRoot 'workspace-ids.json'
($result | ConvertTo-Json) | Set-Content -Path $outFile -Encoding UTF8
Write-Step "Saved workspace IDs to $outFile"
$result | Format-Table -AutoSize
