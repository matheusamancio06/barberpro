@echo off
echo ====================================
echo   BarberPro - Sistema de Barbearia
echo ====================================
echo.
echo Iniciando Backend (porta 3001)...
start "BarberPro Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo Aguardando backend iniciar...
timeout /t 3 /nobreak > nul

echo Iniciando Frontend (porta 5173)...
start "BarberPro Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo ====================================
echo  Sistema iniciado com sucesso!
echo.
echo  Acesse: http://localhost:5173
echo  Login:  admin@barbearia.com
echo  Senha:  admin123
echo ====================================
echo.
start http://localhost:5173
