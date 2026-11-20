# Compila dist\CalendarioAnime.exe con el compilador de C# incluido en Windows (.NET Framework 4.8).
# -Desarrollo genera dist\CalendarioAnime-desarrollo.exe, que carga la interfaz desde la carpeta de CALENDARIO_WEB.
param([switch]$Desarrollo)
$ErrorActionPreference = 'Stop'
$framework = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319'
$csc = Join-Path $framework 'csc.exe'
if (!(Test-Path -LiteralPath $csc)) { throw 'Se necesita .NET Framework 4.8 de 64 bits, incluido en Windows 11.' }

$raiz = $PSScriptRoot
$referencias = 'System.dll', 'System.Core.dll', 'System.Drawing.dll', 'System.Windows.Forms.dll', 'System.Net.Http.dll', 'System.Web.Extensions.dll' |
    ForEach-Object { '/reference:' + (Join-Path $framework $_) }
$referencias += '/reference:' + (Join-Path $raiz 'lib\Microsoft.Web.WebView2.Core.dll')
$referencias += '/reference:' + (Join-Path $raiz 'lib\Microsoft.Web.WebView2.WinForms.dll')

$recursos = @("/resource:$(Join-Path $raiz 'recursos\calendario.ico'),calendario.ico")
Get-ChildItem -LiteralPath (Join-Path $raiz 'lib') -Filter '*.dll' | ForEach-Object { $recursos += "/resource:$($_.FullName),lib/$($_.Name)" }
Get-ChildItem -LiteralPath (Join-Path $raiz 'web') -File | ForEach-Object { $recursos += "/resource:$($_.FullName),web/$($_.Name)" }

$dist = Join-Path $raiz 'dist'
New-Item -ItemType Directory -Path $dist -Force | Out-Null
$exe = Join-Path $dist $(if ($Desarrollo) { 'CalendarioAnime-desarrollo.exe' } else { 'CalendarioAnime.exe' })
$simbolos = @(if ($Desarrollo) { '/define:DESARROLLO' })
$fuentes = @(Get-ChildItem -LiteralPath (Join-Path $raiz 'src') -Filter '*.cs' | ForEach-Object FullName)
& $csc /nologo /codepage:65001 /optimize+ /platform:x64 /target:winexe "/out:$exe" @simbolos "/win32icon:$(Join-Path $raiz 'recursos\calendario.ico')" @referencias @recursos @fuentes
if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar la aplicación.' }
Write-Host "Ejecutable: $exe"
