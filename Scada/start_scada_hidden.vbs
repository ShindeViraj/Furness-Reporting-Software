Set WshShell = CreateObject("WScript.Shell")

' Start Node-RED silently
WshShell.Run "cmd.exe /c node-red", 0, False

' Wait 3 seconds to allow Node-RED to initialize
WScript.Sleep 3000

' Start Python Flask silently
WshShell.Run "cmd.exe /c cd /d ""C:\Users\SANDIP.MORE01\Scada"" && py app.py", 0, False
