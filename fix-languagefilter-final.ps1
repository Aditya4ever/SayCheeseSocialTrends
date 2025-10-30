# PowerShell script to properly fix the languageFilter issue

$filePath = "c:\Users\arc4e\source\repos\SayCheese\public\script-v2.js"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Replace the problematic section
$oldSection = @"
        if (languageFilter) {
            languageFilter.addEventListener('change', () => this.applyFilters());    
        }
        // Sort controls
"@

$newSection = @"
        // Sort controls
"@

$fixedContent = $content -replace [regex]::Escape($oldSection), $newSection

# Write the fixed content back
$fixedContent | Out-File $filePath -Encoding UTF8 -NoNewline
Write-Host "Fixed languageFilter duplication issue!"
