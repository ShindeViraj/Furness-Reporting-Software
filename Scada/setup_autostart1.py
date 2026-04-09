import os
import subprocess

def setup_new_pc_autostart():
    # The new path for this specific machine
    base_dir = r"C:\Users\SANDIP.MORE01\Scada"
    vbs_runner_path = os.path.join(base_dir, "start_scada_hidden.vbs")
    
    # Locate the Windows Startup folder
    appdata = os.environ.get('APPDATA')
    startup_folder = os.path.join(appdata, r"Microsoft\Windows\Start Menu\Programs\Startup")
    shortcut_path = os.path.join(startup_folder, "Run_SCADA_Hidden.lnk")

    print("Configuring Invisible Auto-Start for the new PC...")

    # 1. Create/Update the master hidden VBScript for the new path
    # FIX APPLIED HERE: Changed to 'npx node-red' so Windows can find it in the background
    vbs_runner_content = f"""Set WshShell = CreateObject("WScript.Shell")

' Start Node-RED silently using npx so Windows finds the path
WshShell.Run "cmd.exe /c npx node-red", 0, False

' Wait 3 seconds to allow Node-RED to initialize
WScript.Sleep 3000

' Start Python Flask silently
WshShell.Run "cmd.exe /c cd /d ""{base_dir}"" && py app.py", 0, False
"""
    with open(vbs_runner_path, 'w', encoding='utf-8') as f:
        f.write(vbs_runner_content)
    print(f"  --> Verified script at: {vbs_runner_path}")

    # 2. Create a temporary script to build the Windows Shortcut
    vbs_shortcut_creator = os.path.join(base_dir, "create_shortcut.vbs")
    vbs_shortcut_content = f"""Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "{shortcut_path}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "wscript.exe"
oLink.Arguments = Chr(34) & "{vbs_runner_path}" & Chr(34)
oLink.WorkingDirectory = "{base_dir}"
oLink.Description = "Starts Node-RED and the SCADA Python Backend Silently"
oLink.Save
"""
    with open(vbs_shortcut_creator, 'w', encoding='utf-8') as f:
        f.write(vbs_shortcut_content)
        
    # 3. Execute to place it in the Startup folder, then clean up
    subprocess.call(['cscript.exe', '//Nologo', vbs_shortcut_creator])
    os.remove(vbs_shortcut_creator)
    print(f"  --> Installed Startup Shortcut at: {shortcut_path}")
    
    print("\n✅ Invisible Auto-Start configured successfully!")
    print("Node-RED and Flask will now launch automatically in the background.")

if __name__ == "__main__":
    setup_new_pc_autostart()

' Start Python Flask silently
WshShell.Run "cmd.exe /c cd /d ""{base_dir}"" && py app.py", 0, False
"""
    with open(vbs_runner_path, 'w', encoding='utf-8') as f:
        f.write(vbs_runner_content)
    print(f"  --> Verified script at: {vbs_runner_path}")

    # 2. Create a temporary script to build the Windows Shortcut
    vbs_shortcut_creator = os.path.join(base_dir, "create_shortcut.vbs")
    vbs_shortcut_content = f"""Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "{shortcut_path}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "wscript.exe"
oLink.Arguments = Chr(34) & "{vbs_runner_path}" & Chr(34)
oLink.WorkingDirectory = "{base_dir}"
oLink.Description = "Starts Node-RED and the SCADA Python Backend Silently"
oLink.Save
"""
    with open(vbs_shortcut_creator, 'w', encoding='utf-8') as f:
        f.write(vbs_shortcut_content)
        
    # 3. Execute to place it in the Startup folder, then clean up
    subprocess.call(['cscript.exe', '//Nologo', vbs_shortcut_creator])
    os.remove(vbs_shortcut_creator)
    print(f"  --> Installed Startup Shortcut at: {shortcut_path}")
    
    print("\n✅ Invisible Auto-Start configured successfully!")
    print("Whenever this PC is rebooted, the system will launch automatically in the background.")

if __name__ == "__main__":
    setup_new_pc_autostart()