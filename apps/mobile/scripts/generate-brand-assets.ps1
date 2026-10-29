# Render the existing GYNECAIRE heart/mother vector direction into launcher assets.
# Uses Windows' built-in drawing library; no downloaded artwork or packages.
Add-Type -AssemblyName System.Drawing
$assetDirectory = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../assets/images'))

function Write-CareMark([string]$FileName, [int]$Size, [bool]$Transparent, [bool]$Monochrome, [single]$Inset) {
    $bitmap = New-Object Drawing.Bitmap($Size, $Size)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $background = if ($Transparent) { [Drawing.Color]::Transparent } else { [Drawing.ColorTranslator]::FromHtml('#FFF3F8') }
    $graphics.Clear($background)
    $scale = [single]($Size / 64.0)
    $graphics.ScaleTransform($scale, $scale)
    $graphics.TranslateTransform($Inset, $Inset)
    $graphics.ScaleTransform([single]((64 - 2 * $Inset) / 64.0), [single]((64 - 2 * $Inset) / 64.0))
    $rose = if ($Monochrome) { [Drawing.Color]::Black } else { [Drawing.ColorTranslator]::FromHtml('#D67B9F') }
    $plum = if ($Monochrome) { [Drawing.Color]::Black } else { [Drawing.ColorTranslator]::FromHtml('#8D315F') }
    $pen = New-Object Drawing.Pen($rose, 3)
    $pen.StartCap = [Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [Drawing.Drawing2D.LineCap]::Round
    $brush = New-Object Drawing.SolidBrush($plum)
    $heart = New-Object Drawing.Drawing2D.GraphicsPath
    $heart.AddBezier(32,53,20,46,8,35,8,23)
    $heart.AddBezier(8,23,8,9,26,7,32,20)
    $heart.AddBezier(32,20,38,7,56,9,56,23)
    $heart.AddBezier(56,23,56,35,44,46,32,53)
    $graphics.DrawPath($pen,$heart)
    $graphics.FillEllipse($brush,24,18,10,10)
    $mother = New-Object Drawing.Drawing2D.GraphicsPath
    $mother.AddBezier(26,31,18,39,27,45,33,48)
    $mother.AddBezier(33,48,31,38,36,36,41,33)
    $mother.AddBezier(41,33,31,37,29,35,26,31)
    $mother.CloseFigure()
    $graphics.FillPath($brush,$mother)
    $bitmap.Save((Join-Path $assetDirectory $FileName),[Drawing.Imaging.ImageFormat]::Png)
    $mother.Dispose(); $heart.Dispose(); $brush.Dispose(); $pen.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

Write-CareMark 'gynecaire-icon.png' 1024 $false $false 3
Write-CareMark 'gynecaire-foreground.png' 1024 $true $false 10
Write-CareMark 'gynecaire-monochrome.png' 1024 $true $true 10
Write-CareMark 'gynecaire-mark.png' 512 $true $false 3
Write-CareMark 'gynecaire-favicon.png' 64 $false $false 3
