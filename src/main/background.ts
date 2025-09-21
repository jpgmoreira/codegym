import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import { loadStartupData } from './data/startup';
import { Channels } from '@common/types/channels';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      spellcheck: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  Menu.setApplicationMenu(null);

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // wait until the window is ready to show, send initial data to it, and show.
  mainWindow.once('ready-to-show', async () => {
    const startupData = await loadStartupData();
    mainWindow.webContents.send(Channels.loadStartupData, startupData);
    mainWindow.show();
  });

  // Install vue devtools:
  installExtension(VUEJS_DEVTOOLS)
    .then((ext) => console.log(`Added Extension:  ${ext.name}`))
    .catch((err) => console.log('An error occurred: ', err));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// Additional security config.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event, _webPreferences, _params) => {
    event.preventDefault();
  });
  contents.on('will-navigate', (event, _navigationUrl) => {
    event.preventDefault();
  });
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
