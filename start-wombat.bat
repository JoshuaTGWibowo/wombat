@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Determine repository root relative to this script
set "REPO_ROOT=%~dp0"

REM Remove trailing backslash if present
if "%REPO_ROOT:~-1%"=="\" set "REPO_ROOT=%REPO_ROOT:~0,-1%"

set "BACKEND_DIR=%REPO_ROOT%\src\3d-bioprinting-slicer\src\convex-slicing"
set "FRONTEND_DIR=%REPO_ROOT%\src\3d-bioprinting-slicer"

if not exist "%BACKEND_DIR%" (
    echo [ERROR] Could not locate backend directory at %BACKEND_DIR%.
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo [ERROR] Could not locate frontend directory at %FRONTEND_DIR%.
    exit /b 1
)

echo [INFO] Backend directory: %BACKEND_DIR%
echo [INFO] Launching Convex Slicing API server window...
start "Convex Slicing API" cmd /k ^
    "pushd ^"%BACKEND_DIR%^" ^&^& ^
    if not exist .venv\Scripts\python.exe ( ^
        echo Creating Python virtual environment... ^&^& ^
        python -m venv .venv ^
    ) ^&^& ^
    call .venv\Scripts\activate ^&^& ^
    python -m pip install --upgrade pip ^&^& ^
    pip install -r requirements.txt ^&^& ^
    pip install python-multipart uvicorn fastapi ^&^& ^
    uvicorn api:app --reload --host 0.0.0.0 --port 8000"

echo [INFO] Frontend directory: %FRONTEND_DIR%
echo [INFO] Launching frontend dev server window...
start "3D Bioprinting Frontend" cmd /k ^
    "pushd ^"%FRONTEND_DIR%^" ^&^& ^
    if not exist .env.local ( ^
        echo Creating default .env.local... ^&^& ^
        echo BACKEND_URL=http://localhost:8000>.env.local ^&^& ^
        echo VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3Jvd2luZy1wb2xsaXdvZy04Ni5jbGVyay5hY2NvdW50cy5kZXYk>>.env.local ^
    ) ^&^& ^
    if exist package-lock.json (npm ci) else (npm install) ^&^& ^
    npm run dev"

REM Give the frontend a moment to boot before opening the browser
choice /t 5 /d y /n >nul

set "APP_URL=http://localhost:5173/"
echo [INFO] Opening %APP_URL% in your default browser...
start "" "%APP_URL%"

echo [INFO] All services have been launched in separate windows.
endlocal
