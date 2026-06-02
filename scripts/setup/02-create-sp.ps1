<#
.SYNOPSIS
    Create the service principal used for Fabric CI/CD and configure GitHub OIDC
    federated credentials.

.PARAMETER DisplayName
    SP display name. Default: sp-fabric-cicd.

.PARAMETER GitHubRepo
    GitHub repo as "owner/name". Required.

.PARAMETER Environments
    GitHub environments that should be allowed to federate. Default: test, prod.

.PARAMETER SecurityGroupObjectId
    Optional Entra security group object ID. If supplied, the SP is added as a
    member. Use this group in the tenant setting "Service principals can use
    Fabric APIs".

.OUTPUTS
    Writes ./sp-info.json with appId, objectId, tenantId.

.EXAMPLE
    ./02-create-sp.ps1 -GitHubRepo myorg/cicd-github-fabric-workspace-demo

.NOTES
    Caller needs Application Developer (or higher) in Entra ID. If you also pass
    -SecurityGroupObjectId, you need permission to manage that group's members.
#>
[CmdletBinding()]
param(
    [string]$DisplayName = "sp-fabric-cicd",
    [Parameter(Mandatory)][string]$GitHubRepo,
    [string[]]$Environments = @('test','prod'),
    [string]$SecurityGroupObjectId
)

. "$PSScriptRoot\_common.ps1"
$acct = Assert-AzCli
$tenantId = $acct.tenantId

Write-Step "Ensure app registration '$DisplayName'"
$app = az ad app list --display-name $DisplayName --query "[0]" -o json | ConvertFrom-Json
if (-not $app) {
    $app = az ad app create --display-name $DisplayName --sign-in-audience AzureADMyOrg | ConvertFrom-Json
    Write-Ok "app created: $($app.appId)"
} else {
    Write-Ok "app exists: $($app.appId)"
}
$appId = $app.appId

Write-Step "Ensure service principal for app"
$sp = az ad sp list --filter "appId eq '$appId'" --query "[0]" -o json | ConvertFrom-Json
if (-not $sp) {
    $sp = az ad sp create --id $appId | ConvertFrom-Json
    Write-Ok "sp created: $($sp.id)"
} else {
    Write-Ok "sp exists: $($sp.id)"
}
$spObjectId = $sp.id

Write-Step "Configure federated credentials for repo '$GitHubRepo'"
$existingCreds = az ad app federated-credential list --id $appId -o json | ConvertFrom-Json
$desired = @()
foreach ($envName in $Environments) {
    $desired += [pscustomobject]@{
        Name    = "github-$envName"
        Subject = "repo:${GitHubRepo}:environment:${envName}"
    }
}
# Also allow direct branch pushes (deploy-test runs on push to 'test' branch)
$desired += [pscustomobject]@{ Name = "github-ref-test"; Subject = "repo:${GitHubRepo}:ref:refs/heads/test" }
$desired += [pscustomobject]@{ Name = "github-ref-main"; Subject = "repo:${GitHubRepo}:ref:refs/heads/main" }
$desired += [pscustomobject]@{ Name = "github-pr";       Subject = "repo:${GitHubRepo}:pull_request" }

foreach ($c in $desired) {
    if ($existingCreds | Where-Object { $_.subject -eq $c.Subject }) {
        Write-Ok "federated credential exists: $($c.Subject)"
        continue
    }
    $payload = @{
        name      = $c.Name
        issuer    = "https://token.actions.githubusercontent.com"
        subject   = $c.Subject
        audiences = @("api://AzureADTokenExchange")
    } | ConvertTo-Json -Compress

    $tmp = New-TemporaryFile
    Set-Content -Path $tmp -Value $payload -Encoding UTF8
    az ad app federated-credential create --id $appId --parameters "@$tmp" 1>$null
    Remove-Item $tmp -Force
    Write-Ok "federated credential created: $($c.Subject)"
}

if ($SecurityGroupObjectId) {
    Write-Step "Add SP to security group $SecurityGroupObjectId"
    try {
        az ad group member add --group $SecurityGroupObjectId --member-id $spObjectId 2>$null
        Write-Ok "added to group"
    } catch {
        Write-Warn2 "group add: $($_.Exception.Message)"
    }
}

$out = [ordered]@{
    appId    = $appId
    objectId = $spObjectId
    tenantId = $tenantId
}
$outFile = Join-Path $PSScriptRoot 'sp-info.json'
($out | ConvertTo-Json) | Set-Content -Path $outFile -Encoding UTF8
Write-Step "Saved SP info to $outFile"
$out | Format-Table -AutoSize

Write-Warn2 "Tenant admin must enable 'Service principals can use Fabric APIs' (scope a group). Tenant ID: $tenantId"
