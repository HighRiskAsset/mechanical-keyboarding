# Tiny static file server for local development (no Node/Python needed).
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
param([int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 8123 }))

$root = $PSScriptRoot
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)

  # CORS: allow the asset-pipeline page (Midjourney tab) to POST images here.
  $ctx.Response.Headers.Add('Access-Control-Allow-Origin', '*')
  $ctx.Response.Headers.Add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  $ctx.Response.Headers.Add('Access-Control-Allow-Headers', 'Content-Type')
  if ($ctx.Request.HttpMethod -eq 'OPTIONS') {
    $ctx.Response.StatusCode = 204
    $ctx.Response.Close()
    continue
  }

  # POST /upload?name=<file> — save request body into assets/inbox/
  if ($ctx.Request.HttpMethod -eq 'POST' -and $path -eq '/upload') {
    try {
      $name = $ctx.Request.QueryString['name']
      if ($name -and $name -match '^[A-Za-z0-9_.-]+$') {
        $inbox = Join-Path $root 'assets\inbox'
        if (-not (Test-Path $inbox)) { New-Item -ItemType Directory -Force $inbox | Out-Null }
        $ms = New-Object System.IO.MemoryStream
        $ctx.Request.InputStream.CopyTo($ms)
        [IO.File]::WriteAllBytes((Join-Path $inbox $name), $ms.ToArray())
        $ok = [Text.Encoding]::UTF8.GetBytes('saved ' + $name + ' (' + $ms.Length + ' bytes)')
        $ctx.Response.OutputStream.Write($ok, 0, $ok.Length)
      } else {
        $ctx.Response.StatusCode = 400
      }
    } catch {
      $ctx.Response.StatusCode = 500
    }
    $ctx.Response.Close()
    continue
  }

  if ($path -eq '/') { $path = '/index.html' }
  $file = Join-Path $root ($path -replace '/', '\')
  try {
    $full = [IO.Path]::GetFullPath($file)
    if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($full)
      $ext = [IO.Path]::GetExtension($full).ToLower()
      $ctx.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $ctx.Response.Headers.Add('Cache-Control', 'no-store')
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch {
    $ctx.Response.StatusCode = 500
  }
  $ctx.Response.Close()
}
