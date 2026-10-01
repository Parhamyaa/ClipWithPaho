const { app, BrowserWindow, globalShortcut, ipcMain, Notification, desktopCapturer } = require('electron');
const path = require('path');

let win;
let registered = 'CommandOrControl+Shift+X';

function createWindow(){
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1000,
    minHeight: 650,
    backgroundColor: '#000000',
    title: 'ClipWithPaho',
    autoHideMenuBar: true,
    webPreferences:{
      preload:path.join(__dirname,'preload.js'),
      contextIsolation:true,
      nodeIntegration:false
    }
  });
  win.loadFile(path.join(__dirname,'index.html'));
}

function setHotkey(acc){
  if(registered) globalShortcut.unregister(registered);
  const ok=globalShortcut.register(acc,()=>{
    if(win && !win.isDestroyed()) win.webContents.send('clip-hotkey');
  });
  if(ok) registered=acc;
  return ok;
}

app.whenReady().then(()=>{
  createWindow();

  ipcMain.handle('set-hotkey',(_,acc)=>setHotkey(acc));

  ipcMain.handle('sources',async()=>{
    const sources=await desktopCapturer.getSources({
      types:['screen','window'],
      thumbnailSize:{width:420,height:236},
      fetchWindowIcons:false
    });
    return sources.map(s=>({id:s.id,name:s.name,thumbnail:s.thumbnail.toDataURL()}));
  });

  ipcMain.handle('notify',(_,body)=>{
    if(Notification.isSupported()) new Notification({title:'ClipWithPaho',body}).show();
  });

  ipcMain.handle('quit',()=>app.quit());

  setHotkey(registered);
});

app.on('will-quit',()=>globalShortcut.unregisterAll());
