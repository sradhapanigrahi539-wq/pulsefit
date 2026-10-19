@echo off
title PulseFit Pro Launcher
echo Starting PulseFit Pro...
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py server.py
) else (
    where python >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        python server.py
    ) else (
        echo Python not found in PATH, opening directly in your default browser...
        start index.html
    )
)
pause
