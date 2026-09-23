export const SETUP_TYPES = [
  'Break & Retest','Support Bounce','Resistance Rejection','Breakout','Breakdown',
  'Bull Flag','Bear Flag','Consolidation Breakout','Consolidation Breakdown',
  'Premarket High Break','Premarket Low Break','Previous-Day High Break','Previous-Day Low Break',
  'Double Bottom','Double Top'
];

const near = (p,l,t=.004) => Number.isFinite(p)&&Number.isFinite(l)&&Math.abs(p-l)/Math.max(Math.abs(l),1)<=t;
const last = bars => bars?.at(-1);
const closes = bars => bars.map(b=>b.c);
const highs = bars => bars.map(b=>b.h);
const lows = bars => bars.map(b=>b.l);
const maxN=(a,n)=>Math.max(...a.slice(-n)); const minN=(a,n)=>Math.min(...a.slice(-n));
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const mk=(setupType,bias,relevance,keyLevel,entryDescription,invalidation,confirmed=false,invalidated=false,extra={})=>({setupType,bias,relevance,keyLevel,entryDescription,invalidation,confirmed,invalidated,...extra});

export function detectSetups({daily=[],intraday=[],levels={},premarketHL=null,session='regular',price}){
  const p=Number(price??last(intraday)?.c??last(daily)?.c); const d=last(daily); const ib=intraday;
  const out=[];
  const {pdh,pdl,weeklyHigh,weeklyLow,support,resistance,previousClose}=levels;
  if(pdh!=null){
    const confirmed=p>pdh*1.002; const invalidated=p<pdh*.998;
    out.push(mk('Previous-Day High Break','bullish',near(p,pdh,.02)?'high':'normal',pdh,`Reclaim/hold above $${pdh.toFixed(2)} + confirmation`,`Lose $${pdh.toFixed(2)}`,confirmed,invalidated));
  }
  if(pdl!=null){
    const confirmed=p<pdl*.998; const invalidated=p>pdl*1.002;
    out.push(mk('Previous-Day Low Break','bearish',near(p,pdl,.02)?'high':'normal',pdl,`Break/hold below $${pdl.toFixed(2)} + confirmation`,`Reclaim $${pdl.toFixed(2)}`,confirmed,invalidated));
  }
  if(weeklyHigh!=null){
    const confirmed=p>weeklyHigh; const invalidated=p<weeklyHigh*.998;
    out.push(mk('Breakout','bullish',near(p,weeklyHigh,.015)?'high':'normal',weeklyHigh,`Accept above $${weeklyHigh.toFixed(2)}`,`Return below $${weeklyHigh.toFixed(2)}`,confirmed,invalidated));
  }
  if(weeklyLow!=null){
    const confirmed=p<weeklyLow; const invalidated=p>weeklyLow*1.002;
    out.push(mk('Breakdown','bearish',near(p,weeklyLow,.015)?'high':'normal',weeklyLow,`Accept below $${weeklyLow.toFixed(2)}`,`Reclaim $${weeklyLow.toFixed(2)}`,confirmed,invalidated));
  }
  if(support!=null && near(p,support,.02)){
    const rejection=p>support*1.005; const invalidated=p<support*.995;
    out.push(mk('Support Bounce','bullish','high',support,`Hold/reclaim $${support.toFixed(2)} after rejection`,`Break below $${support.toFixed(2)}`,rejection,invalidated));
  }
  if(resistance!=null && near(p,resistance,.02)){
    const rejection=p<resistance*.995; const invalidated=p>resistance*1.005;
    out.push(mk('Resistance Rejection','bearish','high',resistance,`Reject $${resistance.toFixed(2)} and confirm lower`,`Break above $${resistance.toFixed(2)}`,rejection,invalidated));
  }
  if(ib.length>=12){
    const c=closes(ib), h=highs(ib), l=lows(ib), vols=ib.map(x=>x.v||0);
    const priorH=maxN(h,12), priorL=minN(l,12), recentH=maxN(h,5), recentL=minN(l,5);
    const atr=avg(ib.slice(-14).map((x,i,a)=>i?Math.max(x.h-x.l,Math.abs(x.h-a[i-1].c),Math.abs(x.l-a[i-1].c)):x.h-x.l));
    const range=recentH-recentL;
    const avgVol=avg(vols.slice(-12)); const rv=avgVol?((vols.at(-1)||0)/avgVol):1;
    const breakoutUp=p>priorH; const breakdownDn=p<priorL;
    out.push(mk('Break & Retest','bullish','high',pdh??priorH,`Break $${(pdh??priorH).toFixed(2)}, pull back, hold, then reclaim`,`Lose $${(pdh??priorH).toFixed(2)}`,false,p<(pdh??priorH)*.992,{intraday:true}));
    if(pdh!=null){
      const broke=ib.some(x=>x.h>pdh*1.001); const retest=ib.slice(-5).some(x=>x.l<=pdh*1.002&&x.c>=pdh*.999);
      out.at(-1).confirmed=broke&&retest&&p>pdh*1.002;
    }
    const pole=Math.max(...c.slice(-12))-Math.min(...c.slice(-12));
    const consRange=Math.max(...h.slice(-6))-Math.min(...l.slice(-6));
    const flag= pole>Math.max(consRange*2,atr*3);
    out.push(mk('Bull Flag','bullish',flag?'high':'normal',recentH,`Break flag high $${recentH.toFixed(2)} with volume confirmation`,`Break flag low $${recentL.toFixed(2)}`,flag&&p>recentH, p<recentL,{intraday:true,relativeVolume:rv}));
    out.push(mk('Bear Flag','bearish',flag?'high':'normal',recentL,`Break flag low $${recentL.toFixed(2)} with volume confirmation`,`Break flag high $${recentH.toFixed(2)}`,flag&&p<recentL,p>recentH,{intraday:true,relativeVolume:rv}));
    const tight=range<=Math.max(atr*2, p*.012);
    out.push(mk('Consolidation Breakout','bullish',tight?'high':'normal',recentH,`Accept above $${recentH.toFixed(2)}`,`Re-enter range below $${recentH.toFixed(2)}`,tight&&p>recentH,p<recentL,{intraday:true}));
    out.push(mk('Consolidation Breakdown','bearish',tight?'high':'normal',recentL,`Accept below $${recentL.toFixed(2)}`,`Re-enter range above $${recentL.toFixed(2)}`,tight&&p<recentL,p>recentH,{intraday:true}));
    const sep=Math.max(3,Math.floor(ib.length/3));
    const leftL=minN(l.slice(0,sep),sep), rightL=minN(l.slice(-sep),sep), midH=maxN(h.slice(sep,-sep),Math.max(1,ib.length-2*sep));
    const db=Math.abs(leftL-rightL)/Math.max(Math.abs(leftL),1)<=.012;
    const dt=Math.abs(maxN(h.slice(0,sep),sep)-maxN(h.slice(-sep),sep))/Math.max(Math.abs(maxN(h.slice(0,sep),sep)),1)<=.012;
    out.push(mk('Double Bottom','bullish',db?'high':'normal',midH,`Reclaim neckline $${midH.toFixed(2)}`,`Break below double-bottom low`,db&&p>midH,p<Math.min(leftL,rightL),{intraday:true}));
    const midL=minN(l.slice(sep,-sep),Math.max(1,ib.length-2*sep));
    out.push(mk('Double Top','bearish',dt?'high':'normal',midL,`Break neckline $${midL.toFixed(2)}`,`Break above double-top high`,dt&&p<midL,p>Math.max(maxN(h.slice(0,sep),sep),maxN(h.slice(-sep),sep)),{intraday:true}));
  }
  if(premarketHL?.high!=null){
    out.push(mk('Premarket High Break','bullish','high',premarketHL.high,`Clear PMH $${premarketHL.high.toFixed(2)} and hold after open`,`Fall back below PMH`,false,p<premarketHL.high*.995,{intraday:true,premarket:true,coverage:premarketHL.coverage}));
  }
  if(premarketHL?.low!=null){
    out.push(mk('Premarket Low Break','bearish','high',premarketHL.low,`Clear PML $${premarketHL.low.toFixed(2)} and hold after open`,`Reclaim above PML`,false,p>premarketHL.low*1.005,{intraday:true,premarket:true,coverage:premarketHL.coverage}));
  }
  return out;
}
