@ECHO OFF

for /f "tokens=1,* delims= " %%a in ("%*") do set ALL_BUT_FIRST=%%b

set SCRIPT_PATH=%~dp0scripts
set SCRIPT=%SCRIPT_PATH%\%1.ts

if exist %SCRIPT% (
    %~dp0node_modules\.bin\ts-node %SCRIPT% %ALL_BUT_FIRST%
) else (
    echo No such script found. Try one of these:
    for %%i in (%SCRIPT_PATH%\*.ts) do echo - %%~ni
)
