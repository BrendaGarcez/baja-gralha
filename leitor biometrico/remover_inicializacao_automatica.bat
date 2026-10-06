@echo off
chcp 65001 > nul
title Remover Inicialização Automática - Baja Gralha

echo ========================================================
echo   REMOVER INICIALIZAÇÃO AUTOMÁTICA - BAJA GRALHA
echo ========================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\ServicoBiometricoBaja.lnk"

if exist "%SHORTCUT_PATH%" (
    del /f /q "%SHORTCUT_PATH%"
    echo [SUCESSO] O atalho do Serviço Biométrico foi removido da inicialização do Windows!
) else (
    echo [INFO] O atalho não estava presente na pasta de inicialização.
)

echo.
pause
