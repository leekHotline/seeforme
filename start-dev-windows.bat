@echo off
setlocal

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "WORKSPACE=%ROOT%\seeforme-dev.code-workspace"

if not exist "%WORKSPACE%" (
  echo [ERROR] Missing workspace file: %WORKSPACE%
  pause
  exit /b 1
)

where code >nul 2>&1
if errorlevel 1 (
  echo [ERROR] VS Code CLI ^(code^) not found in PATH.
  echo Open VS Code, then run: Ctrl+Shift+P -^> Shell Command: Install 'code' command in PATH
  pause
  exit /b 1
)

start "" code -r "%WORKSPACE%"
echo VS Code workspace opened. Frontend/backend tasks should auto-start in integrated terminals.
exit /b 0
