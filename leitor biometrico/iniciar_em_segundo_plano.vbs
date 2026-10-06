' Script para executar o ConsoleApp1.exe de forma oculta/minimizada (sem janela preta de prompt)
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
exePath = currentDir & "\PontoBiometricoService\ConsoleApp1\bin\Release\net8.0-windows\ConsoleApp1.exe"
workDir = currentDir & "\PontoBiometricoService\ConsoleApp1\bin\Release\net8.0-windows"

WshShell.CurrentDirectory = workDir
' 0 = Oculto, 7 = Minimizado na barra de tarefas
WshShell.Run """" & exePath & """", 0, False
