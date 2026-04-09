@echo off
echo Starting SCADA System...

:: Start Node-RED in a new visible window
start "Node-RED Server" cmd /k "node-red"

:: Wait 3 seconds to let Node-RED initialize
timeout /t 3 /nobreak > NUL

:: Start the Python Flask backend in a new visible window
start "SCADA Flask Backend" cmd /k "cd /d C:\Users\SANDIP.MORE01\Scada && py app.py"

echo Startup commands issued successfully!
exit