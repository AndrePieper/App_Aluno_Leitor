@echo off
REM Define o caminho do seu projeto
set PROJECT_DIR=C:\Users\andre\OneDrive\Área de Trabalho\teste 2

:retry
cd /d "%PROJECT_DIR%"
echo Iniciando Expo com tunnel no diretório: %PROJECT_DIR%
call npx expo start --tunnel
echo Expo falhou ou foi fechado. Tentando novamente em 5 segundos...
timeout /t 5
goto retry
