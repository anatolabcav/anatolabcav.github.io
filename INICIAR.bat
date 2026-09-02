@echo off
chcp 65001 >nul
title Anatomia Interativa - servidor do jogo (nao feche esta janela)
cd /d "%~dp0"

echo.
echo   Anatomia Interativa - iniciando...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [ERRO] O Node.js nao esta instalado neste computador.
  echo.
  echo   Baixe em https://nodejs.org (versao LTS^), instale, e rode este
  echo   arquivo de novo. E preciso internet so uma vez, para instalar.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\express" (
  echo   Primeira vez neste computador: instalando as pecas do jogo.
  echo   Isto exige internet, e acontece uma unica vez.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   [ERRO] A instalacao falhou. Confira a conexao e tente de novo.
    pause
    exit /b 1
  )
)

start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

node server.js

echo.
echo   O servidor parou. Se foi sem querer, rode este arquivo de novo.
pause
