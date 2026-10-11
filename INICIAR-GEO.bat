@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Preparando o Geo...
  call npm.cmd ci
  if errorlevel 1 (
    echo Nao foi possivel preparar o jogo. Verifique a instalacao do Node.js.
    pause
    exit /b 1
  )
)
echo Abrindo o Geo. Mantenha esta janela aberta enquanto joga.
call npm.cmd run dev -- --open
pause
