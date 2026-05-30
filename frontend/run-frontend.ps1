# Run a simple static HTTP server for the CodeDiffer dashboard
# This script tries to start a local server using whatever tool is available:
#   1. Python (built‑in http.server)
#   2. Node.js with the "http-server" package (installed via npx)
#   3. If neither is present, it opens the index.html directly in the default browser.

$port = 8000
$dir = (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Start-PythonServer {
    try {
        python -c "import http.server, socketserver, os; os.chdir(r'$dir'); socketserver.TCPServer(('', $port), http.server.SimpleHTTPRequestHandler).serve_forever()" &
        Write-Host "Python HTTP server started at http://localhost:$port"
        return $true
    } catch {
        return $false
    }
}

function Start-NodeServer {
    try {
        npx http-server "$dir" -p $port &
        Write-Host "Node http-server started at http://localhost:$port"
        return $true
    } catch {
        return $false
    }
}

function Open-FileDirectly {
    $index = Join-Path $dir 'index.html'
    if (Test-Path $index) {
        Start-Process $index
        Write-Host "Opened index.html directly in the default browser."
    } else {
        Write-Host "index.html not found in $dir"
    }
}

# Try Python first
if (Get-Command python -ErrorAction SilentlyContinue) {
    if (Start-PythonServer) { exit }
}
# Fallback to Node.js
if (Get-Command npx -ErrorAction SilentlyContinue) {
    if (Start-NodeServer) { exit }
}
# Last resort: open the file directly
Open-FileDirectly