@echo off
setlocal
if not defined OPEN_CAVAS_COMMAND set "OPEN_CAVAS_COMMAND=%~f0"
"%~dp0node.exe" "%~dp0..\scripts\installed.mjs" %*
exit /b %ERRORLEVEL%
