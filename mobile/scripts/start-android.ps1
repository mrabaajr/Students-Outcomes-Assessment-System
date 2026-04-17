$ErrorActionPreference = 'Stop'

function Get-RunningEmulatorId {
    $lines = adb devices
    foreach ($line in $lines) {
        if ($line -match '^(emulator-\d+)\s+device$') {
            return $matches[1]
        }
    }
    return $null
}

function Stop-ListenerOnPort {
    param(
        [int]$Port
    )

    $connections = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $connections) {
        return
    }

    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $processIds) {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
        if (-not $process) {
            continue
        }

        if ($process.CommandLine -match 'expo\\bin\\cli|metro|node') {
            Write-Host "Stopping existing listener on port $Port (PID $processId)"
            Stop-Process -Id $processId -Force
        }
    }
}

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    Write-Error "Android platform-tools (adb) not found in PATH."
    exit 1
}

Stop-ListenerOnPort -Port 8082
Stop-ListenerOnPort -Port 8083

$emulatorId = Get-RunningEmulatorId

if (-not $emulatorId) {
    if (-not (Get-Command emulator -ErrorAction SilentlyContinue)) {
        Write-Error "Android emulator binary not found in PATH."
        exit 1
    }

    $avds = emulator -list-avds
    if (-not $avds -or $avds.Count -eq 0) {
        Write-Error "No Android Virtual Device (AVD) found. Create one in Android Studio Device Manager first."
        exit 1
    }

    $targetAvd = $avds[0].Trim()
    Write-Host "Starting emulator: $targetAvd"
    Start-Process emulator -ArgumentList @('-avd', $targetAvd)

    Write-Host "Waiting for emulator to connect..."
    adb wait-for-device | Out-Null

    $deadline = (Get-Date).AddMinutes(3)
    do {
        Start-Sleep -Seconds 2
        $emulatorId = Get-RunningEmulatorId
        if ($emulatorId) {
            $bootCompleted = (adb -s $emulatorId shell getprop sys.boot_completed 2>$null).Trim()
        }
    } while (($bootCompleted -ne '1') -and ((Get-Date) -lt $deadline))

    if (-not $emulatorId) {
        Write-Error "Emulator did not register as a running device."
        exit 1
    }
}

Write-Host "Launching Expo for Android on running emulator ($emulatorId)..."
npx expo start --localhost --port 8082 --android
