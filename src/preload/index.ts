import { contextBridge, ipcRenderer } from "electron";
import { createBridge } from "./bridge";

contextBridge.exposeInMainWorld("gentle", createBridge(ipcRenderer));
