# PowerShell script to update the applyFilters function

$filePath = "c:\Users\arc4e\source\repos\SayCheese\public\script-v2.js"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Define the updated applyFilters function
$oldApplyFilters = @"
    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const priorityFilter = document.getElementById('priorityFilter');
        if (!categoryFilter || !priorityFilter) {
            console.log('Filter elements not found yet');
            return;
        }
        this.filteredChannels = this.channels.filter(channel => {
            let matchesCategory = true;
            let matchesPriority = true;
            if (categoryFilter.value && categoryFilter.value !== 'all') {
                matchesCategory = channel.category === categoryFilter.value;
            }
            if (priorityFilter.value && priorityFilter.value !== 'all') {
                matchesPriority = channel.priority === priorityFilter.value;
            }
            return matchesCategory && matchesPriority;
        });
        this.renderChannels();
        this.updateStats();
    }
"@

$newApplyFilters = @"
    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const priorityFilter = document.getElementById('priorityFilter');
        const languageFilter = document.getElementById('languageFilter');
        
        if (!categoryFilter || !priorityFilter || !languageFilter) {
            console.log('Filter elements not found yet');
            return;
        }
        
        this.filteredChannels = this.channels.filter(channel => {
            let matchesCategory = true;
            let matchesPriority = true;
            let matchesLanguage = true;
            
            if (categoryFilter.value && categoryFilter.value !== 'all') {
                matchesCategory = channel.category === categoryFilter.value;
            }
            
            if (priorityFilter.value && priorityFilter.value !== 'all') {
                matchesPriority = channel.priority === priorityFilter.value;
            }
            
            if (languageFilter.value && languageFilter.value !== 'all') {
                matchesLanguage = channel.language === languageFilter.value;
            }
            
            return matchesCategory && matchesPriority && matchesLanguage;
        });
        
        this.renderChannels();
        this.updateStats();
    }
"@

# Replace the function
$updatedContent = $content -replace [regex]::Escape($oldApplyFilters), $newApplyFilters

# Write back to file
$updatedContent | Out-File $filePath -Encoding UTF8 -NoNewline
Write-Host "Updated applyFilters function with language filtering!"
