import {getBars} from './data.js';
export function avg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
export async function buildLevels(env,symbol){
  const end=new Date(); const start=new Date(end-35*86400000);
  const bars=await getBars(env,symbol,start.toISOString(),end.toISOString(),'1Day');
  if(!bars.length)return {bars:[],levels:{}};
  const prior=bars.at(-2), recent=bars.slice(-6), week=bars.slice(-5);
  const levels={pdh:prior?.h,pdl:prior?.l,previousClose:prior?.c,weeklyHigh:Math.max(...week.map(x=>x.h)),weeklyLow:Math.min(...week.map(x=>x.l)),support:Math.min(...recent.map(x=>x.l)),resistance:Math.max(...recent.map(x=>x.h))};
  return {bars,levels};
}
