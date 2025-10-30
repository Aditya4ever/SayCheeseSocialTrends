# PowerShell script to add language filter event listener

$filePath = "c:\Users\arc4e\source\repos\SayCheese\public\script-v2.js"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Find and add language filter event listener
$oldEventListeners = @"
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => this.applyFilters());
        }
"@

$newEventListeners = @"
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => this.applyFilters());
        }
        
        const languageFilter = document.getElementById('languageFilter');
        if (languageFilter) {
            languageFilter.addEventListener('change', () => this.applyFilters());
        }
"@

$updatedContent = $content -replace [regex]::Escape($oldEventListeners), $newEventListeners

# Write the updated content back to the file
$updatedContent | Out-File $filePath -Encoding UTF8
Write-Host "Language filter event listener added successfully!"
