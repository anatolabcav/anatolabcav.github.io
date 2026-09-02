@echo off
chcp 65001 >nul
title Site do Laboratorio de Anatomia - pre-visualizacao (nao feche esta janela)
cd /d "%~dp0"

echo.
echo   Site do Laboratorio de Anatomia - abrindo...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   [ERRO] O Node.js nao esta instalado neste computador.
  echo.
  echo   Baixe em https://nodejs.org (versao LTS^), instale, e rode este
  echo   arquivo de novo.
  echo.
  pause
  exit /b 1
)

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:4173"

node ferramentas/servir-site.js

echo.
echo   O servidor parou. Se foi sem querer, rode este arquivo de novo.
pause
