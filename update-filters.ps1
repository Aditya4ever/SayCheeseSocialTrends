# PowerShell script to update the dashboard filters

$filePath = "c:\Users\arc4e\source\repos\SayCheese\public\script-v2.js"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Define the new filter HTML
$newFilters = @"
                    <label>Category:
                        <select id="categoryFilter">
                            <option value="all">🎯 All Categories</option>
                            <option value="business">💼 Business</option>
                            <option value="cinema">🎬 Cinema</option>
                            <option value="comedy">😂 Comedy</option>
                            <option value="education">📚 Education</option>
                            <option value="entertainment">🎪 Entertainment</option>
                            <option value="finance">💰 Finance</option>
                            <option value="food">🍽️ Food</option>
                            <option value="gaming">🎮 Gaming</option>
                            <option value="health">⚕️ Health</option>
                            <option value="kids">👶 Kids</option>
                            <option value="lifestyle">🌟 Lifestyle</option>
                            <option value="music">🎵 Music</option>
                            <option value="news">📰 News</option>
                            <option value="politics">🏛️ Politics</option>
                            <option value="tech">💻 Tech</option>
                        </select>
                    </label>
                    <label style="margin-left: 20px;">Language:
                        <select id="languageFilter">
                            <option value="all">🌐 All Languages</option>
                            <option value="bengali">🇧🇩 Bengali</option>
                            <option value="english">🇺🇸 English</option>
                            <option value="gujarati">Gujarat Gujarati</option>
                            <option value="hindi">🇮🇳 Hindi</option>
                            <option value="kannada">Karnataka Kannada</option>
                            <option value="malayalam">Kerala Malayalam</option>
                            <option value="marathi">Maharashtra Marathi</option>
                            <option value="punjabi">Punjab Punjabi</option>
                            <option value="tamil">🇮🇳 Tamil</option>
                            <option value="telugu">🇮🇳 Telugu</option>
                        </select>
                    </label>
"@

# Find and replace the category filter section
$oldPattern = '<select id="categoryFilter">.*?</select>'
$newCategorySelect = @"
<select id="categoryFilter">
                            <option value="all">🎯 All Categories</option>
                            <option value="business">💼 Business</option>
                            <option value="cinema">🎬 Cinema</option>
                            <option value="comedy">😂 Comedy</option>
                            <option value="education">📚 Education</option>
                            <option value="entertainment">🎪 Entertainment</option>
                            <option value="finance">💰 Finance</option>
                            <option value="food">🍽️ Food</option>
                            <option value="gaming">🎮 Gaming</option>
                            <option value="health">⚕️ Health</option>
                            <option value="kids">👶 Kids</option>
                            <option value="lifestyle">🌟 Lifestyle</option>
                            <option value="music">🎵 Music</option>
                            <option value="news">📰 News</option>
                            <option value="politics">🏛️ Politics</option>
                            <option value="tech">💻 Tech</option>
                        </select>
"@

$updatedContent = $content -replace $oldPattern, $newCategorySelect

# Add language filter after priority filter
$priorityPattern = '(<label[^>]*>Priority:.*?</label>)'
$languageFilter = @"
`$1
                    <label style="margin-left: 20px;">Language:
                        <select id="languageFilter">
                            <option value="all">🌐 All Languages</option>
                            <option value="bengali">🇧🇩 Bengali</option>
                            <option value="english">🇺🇸 English</option>
                            <option value="gujarati">Gujarat Gujarati</option>
                            <option value="hindi">🇮🇳 Hindi</option>
                            <option value="kannada">Karnataka Kannada</option>
                            <option value="malayalam">Kerala Malayalam</option>
                            <option value="marathi">Maharashtra Marathi</option>
                            <option value="punjabi">Punjab Punjabi</option>
                            <option value="tamil">🇮🇳 Tamil</option>
                            <option value="telugu">🇮🇳 Telugu</option>
                        </select>
                    </label>
"@

$finalContent = $updatedContent -replace $priorityPattern, $languageFilter

# Write the updated content back to the file
$finalContent | Out-File $filePath -Encoding UTF8
Write-Host "Filters updated successfully!"
