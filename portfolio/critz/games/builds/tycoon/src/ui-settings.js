import {normalizeZoom} from './world-space.js';
export const UI_SETTINGS_KEY='critz-tycoon.ui.v1';
export const FRAME_STYLES=['leaf','ocean','sunset'];
export function readSettings(storage,reduced=false){let value={};try{value=JSON.parse(storage.getItem(UI_SETTINGS_KEY)||'{}')||{};}catch{}return {frame:FRAME_STYLES.includes(value.frame)?value.frame:'leaf',calm:typeof value.calm==='boolean'?value.calm:reduced,worldZoom:normalizeZoom(value.worldZoom)};}
export function writeSettings(storage,settings){try{storage.setItem(UI_SETTINGS_KEY,JSON.stringify({frame:settings.frame,calm:settings.calm,worldZoom:normalizeZoom(settings.worldZoom)}));return true;}catch{return false;}}
