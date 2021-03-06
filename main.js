const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');
const fs = require('fs');
const stream = require('stream');
const path = require('path');

const TITLE = '⚡ Pluto.jl ⚡';
const basePath = path.resolve(__dirname, isDev ? '.' : '../..');


function init() {
    app.whenReady().then(() => {
        createWindow();
    });
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 620,
        title: TITLE,
        icon: __dirname + '/src/favicon.png',
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "preload.js")
        }
    });
    win.setMenuBarVisibility(false);
    win.setAlwaysOnTop(true, 'screen');

    // win.webContents.openDevTools()
    win.loadFile('src/index.html').then(() => {
        if(!fs.existsSync('installation')) {
            fs.mkdirSync('installation');
            win.setAlwaysOnTop(true, 'screen');
            const installStream = install(() => {
                runPluto(win);
            });
            installStream.on('data', (data) => process.stdout.write(data.toString()));
            installStream.on('data', (data) => win.webContents.send('installation-updates', data.toString()));
        }
        else {
            runPluto(win);
        }
    });
}

function runPluto(win) {
    const plutoServer = spawn('julia', ['--project=.', '-e', 'import Pluto; Pluto.run(; launch_browser=false)'], {
        cwd: path.join(basePath, '/installation/PlutoRunner')
    });
    let secret = null;
    plutoServer.stdout.on('data', (data) => {
        if(secret === null) {
            const plutoLog = data.toString();
            if(plutoLog.includes('?secret=')) {
                const match = plutoLog.match(/secret=\S+/g);
                secret = match[0].split('=').reverse()[0];

                const urlMatch = plutoLog.match(/http\S+/g);
                const entryUrl = urlMatch[0];

                openPluto(entryUrl);
                win.close();
            }
        }
    });
    plutoServer.stderr.on('data', x => console.log(x.toString()));
    plutoServer.on('close', () => {
        win.loadFile('src/pluto_closed.html');
    });
}

function openPluto(entryUrl) {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: TITLE,
        icon: __dirname + '/src/favicon.png',
    });
    win.setMenuBarVisibility(false);
    win.maximize();
    win.loadURL(entryUrl).then(x => {

    });
    win.show();
}

function install(callback=()=>{}) {
    const installationStream = new stream.Readable();
    installationStream._read = () => {};

    const writeToInstallationStream = writeToStream(installationStream);
    if(!fs.existsSync(path.join(basePath, 'installation/Pluto.jl'))) {
        installing = true;
        const plutoInstall = spawn('git', ['clone', 'https://github.com/fonsp/Pluto.jl'], {
            cwd: path.join(basePath, 'installation')
        });
        plutoInstall.stdout.on('data', writeToInstallationStream);
        plutoInstall.stderr.on('data', writeToInstallationStream);
        plutoInstall.on('close', () => {
            const runnerPath = path.join(basePath, 'installation/PlutoRunner');
            if(!fs.existsSync(runnerPath)) {
                fs.mkdirSync(runnerPath);
                const runnerInstall = spawn('julia', ['-e', 'import Pkg; Pkg.add(; path="../Pluto.jl")'], {
                    cwd: path.join(basePath, '/installation/PlutoRunner')
                });
                runnerInstall.stdout.on('data', writeToInstallationStream);
                runnerInstall.stderr.on('data', writeToInstallationStream);
                runnerInstall.on('close', () => {
                    installing = false;
                    writeToInstallationStream('Installation complete!');
                    callback();
                });
            }
        });
    }

    return installationStream;
}


function writeToStream(stream) {
    return (data) => {
        stream.push(data);
    };
}

init();
