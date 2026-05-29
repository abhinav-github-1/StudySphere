@echo off
setlocal enabledelayedexpansion

set "MAVEN_VERSION=3.9.6"
set "MAVEN_DIR=%~dp0.maven"
set "MAVEN_HOME=%MAVEN_DIR%\apache-maven-%MAVEN_VERSION%"
set "MAVEN_ZIP=%MAVEN_DIR%\maven.zip"
set "MAVEN_URL=https://archive.apache.org/dist/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip"

if not exist "%MAVEN_HOME%" (
    echo [mvnw] Maven wrapper directory not found. Bootstrapping Maven %MAVEN_VERSION%...
    if not exist "%MAVEN_DIR%" mkdir "%MAVEN_DIR%"
    
    echo [mvnw] Downloading Maven from %MAVEN_URL%...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%MAVEN_URL%' -OutFile '%MAVEN_ZIP%'"
    
    echo [mvnw] Extracting Maven zip...
    powershell -Command "Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%MAVEN_DIR%'"
    
    echo [mvnw] Cleaning up installation zip...
    del "%MAVEN_ZIP%"
    echo [mvnw] Maven bootstrapped successfully.
)

set "MVN_CMD=%MAVEN_HOME%\bin\mvn.cmd"
if not exist "%MVN_CMD%" (
    echo [Error] Maven command not found at %MVN_CMD%
    exit /b 1
)

echo [mvnw] Executing: %MVN_CMD% %*
"%MVN_CMD%" %*
