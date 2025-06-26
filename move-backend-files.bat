REM Copy backend folders
xcopy controllers backend\controllers /E /I /Y
xcopy models backend\models /E /I /Y
xcopy routes backend\routes /E /I /Y
xcopy middleware backend\middleware /E /I /Y
xcopy lib backend\lib /E /I /Y
xcopy uploads backend\uploads /E /I /Y
xcopy scripts backend\scripts /E /I /Y

REM Copy backend files
copy server.js backend\server.js /Y
copy package.json backend\package.json /Y
copy package-lock.json backend\package-lock.json /Y

REM Copy .env if you have one
if exist .env copy .env backend\.env /Y