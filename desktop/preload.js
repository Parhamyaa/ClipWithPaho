const {contextBridge,ipcRenderer}=require('electron');

contextBridge.exposeInMainWorld('paho',{
  setHotkey:(acc)=>ipcRenderer.invoke('set-hotkey',acc),
  sources:()=>ipcRenderer.invoke('sources'),
  notify:(text)=>ipcRenderer.invoke('notify',text),
  quit:()=>ipcRenderer.invoke('quit'),
  onClip:(cb)=>ipcRenderer.on('clip-hotkey',cb)
});
