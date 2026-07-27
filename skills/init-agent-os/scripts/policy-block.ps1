# Manages the AGENT OS block in global instruction files.
# Source of truth: policy.md at the plugin root (two levels up from this script).
#
# Semantics (locked in the agent-os plan, M3):
#   - No block in target      -> append exactly one block, preserve everything else.
#   - Empty target file       -> treated as "no block"; the block becomes the whole file.
#   - Exactly one well-formed -> replace only the content between the markers.
#   - Duplicated, crossed, or half-open markers -> abort without mutation, exit 2.
#   - -Check                  -> read-only; exit 0 in sync, exit 1 on drift/missing, never writes.
#   - Text outside the block is never touched or normalized.

[CmdletBinding()]
param(
    [switch]$Check,
    [string[]]$Targets = @(
        (Join-Path $HOME '.claude\CLAUDE.md'),
        (Join-Path $HOME '.codex\AGENTS.md')
    )
)

$ErrorActionPreference = 'Stop'
$BeginMarker = '<!-- BEGIN AGENT OS -->'
$EndMarker   = '<!-- END AGENT OS -->'

$policyPath = Join-Path $PSScriptRoot '..\..\..\policy.md' | Resolve-Path
$policy = (Get-Content -Raw -Path $policyPath).TrimEnd()
$block = "$BeginMarker`n$policy`n$EndMarker"

$exit = 0

foreach ($target in $Targets) {
    $label = $target
    if (-not (Test-Path $target)) {
        if ($Check) {
            Write-Output "DRIFT  $label : file missing"
            $exit = 1
        } else {
            $dir = Split-Path $target
            if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
            Set-Content -NoNewline -Path $target -Value ($block + "`n")
            Write-Output "ADDED  $label : created file with managed block"
        }
        continue
    }

    # An empty file returns $null from -Raw, which would throw in Matches below.
    $content = Get-Content -Raw -Path $target
    if ($null -eq $content) { $content = '' }
    $beginCount = ([regex]::Matches($content, [regex]::Escape($BeginMarker))).Count
    $endCount   = ([regex]::Matches($content, [regex]::Escape($EndMarker))).Count

    if ($beginCount -eq 0 -and $endCount -eq 0) {
        if ($Check) {
            Write-Output "DRIFT  $label : managed block missing"
            $exit = 1
        } else {
            $sep = if ($content.Length -eq 0) { '' } elseif ($content.EndsWith("`n")) { "`n" } else { "`n`n" }
            Set-Content -NoNewline -Path $target -Value ($content + $sep + $block + "`n")
            Write-Output "ADDED  $label : appended managed block"
        }
        continue
    }

    $wellFormed = ($beginCount -eq 1 -and $endCount -eq 1 -and
                   $content.IndexOf($BeginMarker) -lt $content.IndexOf($EndMarker))
    if (-not $wellFormed) {
        Write-Output "ERROR  $label : malformed markers (begin=$beginCount end=$endCount) - no mutation"
        exit 2
    }

    $start = $content.IndexOf($BeginMarker)
    $end = $content.IndexOf($EndMarker) + $EndMarker.Length
    $current = $content.Substring($start, $end - $start)

    if ($current -eq $block) {
        Write-Output "OK     $label : in sync"
    } elseif ($Check) {
        Write-Output "DRIFT  $label : block differs from policy.md"
        $exit = 1
    } else {
        $updated = $content.Substring(0, $start) + $block + $content.Substring($end)
        Set-Content -NoNewline -Path $target -Value $updated
        Write-Output "UPDATED $label : block replaced from policy.md"
    }
}

exit $exit
