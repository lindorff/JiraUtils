@ECHO OFF

for /f "tokens=1,* delims= " %%a in ("%*") do set ALL_BUT_FIRST=%%b

if exist .\scripts\%1.ts (
    %~dp0node_modules\.bin\ts-node scripts\%1.ts %ALL_BUT_FIRST%
) else (
    echo No such script found. Try one of these:
    for %%i in (.\scripts\*.ts) do echo - %%~ni
)
