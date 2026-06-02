<#
.SYNOPSIS
    Common helpers for the Fabric CI/CD setup scripts.
.DESCRIPTION
    Provides token acquisition for the Fabric REST API + Microsoft Graph,
    plus a thin Invoke-FabricApi wrapper with paging and error handling.
    Source this file from other scripts:
        . "$PSScriptRoot\_common.ps1"
#>

$script:FabricApi = "https://api.fabric.microsoft.com/v1"
$script:FabricResource = "https://api.fabric.microsoft.com"
$script:GraphResource  = "https://graph.microsoft.com"

function Assert-AzCli {
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        throw "Azure CLI ('az') not found. Install from https://aka.ms/azurecli."
    }
    $acct = az account show 2>$null | ConvertFrom-Json
    if (-not $acct) {
        throw "Not logged in to az. Run: az login"
    }
    return $acct
}

function Get-FabricToken {
    az account get-access-token --resource $script:FabricResource --query accessToken -o tsv
}

function Get-GraphToken {
    az account get-access-token --resource $script:GraphResource --query accessToken -o tsv
}

function Invoke-FabricApi {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][ValidateSet('GET','POST','PATCH','PUT','DELETE')][string]$Method,
        [Parameter(Mandatory)][string]$Path,                # e.g. /workspaces
        [object]$Body,
        [switch]$AllPages
    )
    $token = Get-FabricToken
    $headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
    $url = if ($Path -match '^https?://') { $Path } else { "$script:FabricApi$Path" }

    $jsonBody = $null
    if ($PSBoundParameters.ContainsKey('Body') -and $null -ne $Body) {
        $jsonBody = ($Body | ConvertTo-Json -Depth 12 -Compress)
    }

    if (-not $AllPages) {
        return Invoke-RestMethod -Method $Method -Uri $url -Headers $headers -Body $jsonBody
    }

    $items = @()
    $next = $url
    while ($next) {
        $resp = Invoke-RestMethod -Method $Method -Uri $next -Headers $headers -Body $jsonBody
        if ($resp.value) { $items += $resp.value } else { $items += $resp }
        $next = $resp.continuationUri
    }
    return $items
}

function Invoke-FabricLro {
    <#
        Submits a Fabric API call that returns 202 Accepted with a Location header,
        then polls the operation until it succeeds or fails.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][ValidateSet('POST','PATCH','PUT','DELETE')][string]$Method,
        [Parameter(Mandatory)][string]$Path,
        [object]$Body,
        [int]$TimeoutSeconds = 600
    )
    $token = Get-FabricToken
    $headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
    $url = "$script:FabricApi$Path"
    $jsonBody = if ($Body) { $Body | ConvertTo-Json -Depth 12 -Compress } else { $null }

    $resp = Invoke-WebRequest -Method $Method -Uri $url -Headers $headers -Body $jsonBody -SkipHttpErrorCheck
    if ($resp.StatusCode -in 200,201,204) {
        if ($resp.Content) { return ($resp.Content | ConvertFrom-Json) } else { return $null }
    }
    if ($resp.StatusCode -ne 202) {
        throw "Fabric API failed ($($resp.StatusCode)): $($resp.Content)"
    }
    $opLocation = $resp.Headers['Location']
    if ($opLocation -is [array]) { $opLocation = $opLocation[0] }
    if (-not $opLocation) { return $null }

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 5
        $token = Get-FabricToken
        $h = @{ Authorization = "Bearer $token" }
        $op = Invoke-RestMethod -Method GET -Uri $opLocation -Headers $h
        switch ($op.status) {
            'Succeeded' { return $op }
            'Failed'    { throw "Fabric LRO failed: $($op.error | ConvertTo-Json -Depth 5)" }
            'Cancelled' { throw "Fabric LRO cancelled." }
        }
    }
    throw "Fabric LRO timed out after $TimeoutSeconds seconds."
}

function Write-Step {
    param([string]$Message)
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "    OK: $Message" -ForegroundColor Green
}

function Write-Warn2 {
    param([string]$Message)
    Write-Host "    WARN: $Message" -ForegroundColor Yellow
}
