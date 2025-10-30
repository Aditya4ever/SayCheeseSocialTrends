# PowerShell script to fix duplicate languageFilter declaration

$filePath = "c:\Users\arc4e\source\repos\SayCheese\public\script-v2.js"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Remove the duplicate languageFilter declaration
$pattern = '(const languageFilter = document\.getElementById\(''languageFilter''\);\s*if \(languageFilter\) \{\s*languageFilter\.addEventListener\(''change'', \(\) => this\.applyFilters\(\)\);\s*\}\s*)'
$replacement = '$1'

# Use regex to remove duplicate occurrences
$lines = $content -split "`n"
$newLines = @()
$foundFirst = $false

foreach ($line in $lines) {
    if ($line -match "const languageFilter = document\.getElementById") {
        if (-not $foundFirst) {
            $newLines += $line
            $foundFirst = $true
        }
        # Skip the duplicate
    } else {
        $newLines += $line
    }
}

$newContent = $newLines -join "`n"

# Write the fixed content back
$newContent | Out-File $filePath -Encoding UTF8 -NoNewline
Write-Host "Fixed duplicate languageFilter declaration!"
