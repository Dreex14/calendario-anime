param([Parameter(Mandatory=$true)][string]$Origen,[Parameter(Mandatory=$true)][string]$Destino)

Add-Type -AssemblyName PresentationCore,PresentationFramework,WindowsBase
$vector = [Windows.Markup.XamlReader]::Parse([IO.File]::ReadAllText($Origen))
$vector.Measure([Windows.Size]::new(64, 64))
$vector.Arrange([Windows.Rect]::new(0, 0, 64, 64))
$tamanos = 16, 20, 24, 32, 40, 48, 64, 128, 256
$imagenes = foreach ($tamano in $tamanos) {
    $visual = [Windows.Media.DrawingVisual]::new()
    $dibujo = $visual.RenderOpen()
    $dibujo.DrawRectangle([Windows.Media.VisualBrush]::new($vector), $null, [Windows.Rect]::new(0, 0, $tamano, $tamano))
    $dibujo.Close()
    $bitmap = [Windows.Media.Imaging.RenderTargetBitmap]::new($tamano, $tamano, 96, 96, [Windows.Media.PixelFormats]::Pbgra32)
    $bitmap.Render($visual)
    $png = [Windows.Media.Imaging.PngBitmapEncoder]::new()
    $png.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
    $memoria = [IO.MemoryStream]::new()
    try {
        $png.Save($memoria)
        [PSCustomObject]@{ Tamano = $tamano; Datos = $memoria.ToArray() }
    } finally { $memoria.Dispose() }
}
$archivo = [IO.BinaryWriter]::new([IO.File]::Create($Destino))
try {
    $archivo.Write([uint16]0)
    $archivo.Write([uint16]1)
    $archivo.Write([uint16]$imagenes.Count)
    $offset = 6 + 16 * $imagenes.Count
    foreach ($imagen in $imagenes) {
        $archivo.Write([byte]($imagen.Tamano % 256))
        $archivo.Write([byte]($imagen.Tamano % 256))
        $archivo.Write([uint16]0)
        $archivo.Write([uint16]1)
        $archivo.Write([uint16]32)
        $archivo.Write([uint32]$imagen.Datos.Length)
        $archivo.Write([uint32]$offset)
        $offset += $imagen.Datos.Length
    }
    foreach ($imagen in $imagenes) { $archivo.Write([byte[]]$imagen.Datos) }
} finally { $archivo.Dispose() }
