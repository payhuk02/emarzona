# Download template placeholder images
# Usage: .\download-images.ps1

Write-Host "Downloading template images..." -ForegroundColor Cyan

# Create directory
$dir = "public\templates\physical"
New-Item -ItemType Directory -Path $dir -Force | Out-Null

# Download images
$images = @(
    @{ Url = "https://placehold.co/1280x720/0051BA/FFDB00/jpg?text=Fashion+Template"; File = "fashion-apparel-thumb.jpg" },
    @{ Url = "https://placehold.co/1280x720/000000/FFFFFF/jpg?text=Electronics+Template"; File = "electronics-thumb.jpg" },
    @{ Url = "https://placehold.co/1280x720/1a1a1a/d4af37/jpg?text=Jewelry+Template"; File = "jewelry-thumb.jpg" },
    @{ Url = "https://placehold.co/1280x720/0051BA/FFDB00/jpg?text=Home+Garden+Template"; File = "home-garden-thumb.jpg" },
    @{ Url = "https://placehold.co/1280x720/0066cc/00a86b/jpg?text=Health+Wellness+Template"; File = "health-wellness-thumb.jpg" }
)

$count = 0
foreach ($img in $images) {
    $path = Join-Path $dir $img.File
    try {
        Write-Host "Downloading $($img.File)..." -NoNewline
        Invoke-WebRequest -Uri $img.Url -OutFile $path -UseBasicParsing
        Write-Host " OK" -ForegroundColor Green
        $count++
    }
    catch {
        Write-Host " FAILED" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 300
}

Write-Host "`nDone! Downloaded $count/$($images.Count) images" -ForegroundColor Green
Write-Host "Location: $dir" -ForegroundColor Gray

