@echo off
chcp 65001 > nul
title Configurar Inicialização Automática - Baja Gralha

echo ========================================================
echo   CONFIGURADOR DE INICIALIZAÇÃO AUTOMÁTICA - BAJA GRALHA
echo ========================================================
echo.
echo Adicionando o Serviço Biométrico C# para iniciar automaticamente
echo com o Windows na pasta Startup do usuário...
echo.

set "TARGET_DIR=%~dp0PontoBiometricoService\ConsoleApp1\bin\Release\net8.0-windows"
set "TARGET_EXE=%TARGET_DIR%\ConsoleApp1.exe"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\ServicoBiometricoBaja.lnk"

if not exist "%TARGET_EXE%" (
    echo [ERRO] O executável não foi encontrado em:
    echo "%TARGET_EXE%"
    echo.
    echo Por favor, compile o projeto antes ou verifique a pasta.
    pause
    exit /b 1
)

:: Cria atalho usando PowerShell apontando diretamente para o executável com a pasta de trabalho correta
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_EXE%'; $s.WorkingDirectory = '%TARGET_DIR%'; $s.Description = 'Serviço do Leitor Biométrico Baja Gralha'; $s.Save()"

if %ERRORLEVEL% EQU 0 (
    echo [SUCESSO] Atalho criado na pasta de inicialização do Windows!
    echo.
    echo Local: "%SHORTCUT_PATH%"
    echo Executável: "%TARGET_EXE%"
    echo.
    echo Sempre que o computador for iniciado ou o usuário fizer login,
    echo o serviço biométrico começará a rodar automaticamente na porta 5000.
    echo.
) else (
    echo [ERRO] Falha ao criar o atalho de inicialização.
)

echo Pressione qualquer tecla para sair...
pause > nul
