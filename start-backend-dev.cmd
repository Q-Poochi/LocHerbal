@echo off
cd /d c:\Project\LocHerbal\LocProject
set DOTENV_CONFIG_PATH=.env.local
node -r dotenv/config dist/main > ..\backend.log 2>&1