import { contextBridge } from "electron";
import { createBridge } from "./bridge";

contextBridge.exposeInMainWorld("gentle", createBridge());
