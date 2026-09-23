import {getMovers,getLosers,getActive,getQuote,getBars} from './data.js';
import {buildLevels} from './levels.js';
import {detectSetups} from './setups.js';
import {selectContracts} from './options.js';
import {loadQueue,saveQueue,mergeQueue,nextBatch,score} from './queue.js';
import {freezeSnapshot} from './journal.js';

function nowET(){return new Date(new Date().toLocaleString('en-US',{timeZone:'America/New_York'}));}
function isPremarket(){const d=nowET(); const m=d.getHours()*60+d.getMinutes(); return m>=480&&m<570;}
function priority(x){return Math.min(110,Math.abs(x.change||0)*2+(x.volume||0?10:0));}
function tps(price,levels,atr){const base=Number(atr)||Math.max(price*.006,.25); const candidates=[levels.resistance,levels.weeklyHigh,price+base,price+base*2,price+base*3,price+base*4].filter(Number.isFinite).sort((a,b)=>a-b); return [...new Set(candidates.filter(x=>x>price))].slice(0,4).map(x=>Number(x.toFixed(2)));}
export async function runScan(env){
  const movers=[...(await getMovers(env)),...(await getLosers(env)),...(await getActive(env))];
  const unique=[...new Map(movers.filter(x=>x.symbol).map(x=>[x.symbol,x])).values()];
  let q=await loadQueue(env); q=mergeQueue(q,unique.map(x=>({symbol:x.symbol,priority:priority(x),change:x.changesPercentage,waitCycles:q[x.symbol]?.waitCycles||0}))); 
  const batch=nextBatch(q,Number(env.INTRADAY_BATCH||25)); const results=[]; const pre=isPremarket();
  for(const item of batch){
    try{
      const quote=await getQuote(env,item.symbol); const price=quote.ap||quote.bp||quote.p;
      const {bars,levels}=await buildLevels(env,item.symbol);
      const end=new Date(); const start=new Date(end-6*3600000);
      const intraday=pre?[]:await getBars(env,item.symbol,start.toISOString(),end.toISOString(),'5Min');
      let pmh=null,pml=null;
      if(env.PMH_SOURCE_URL){/* reserved for future full-premarket source; never fabricate */}
      const setups=detectSetups({daily:bars,intraday,levels,premarketHL:pmh,session:pre?'premarket':'regular',price});
      for(const s of setups.filter(x=>x.relevance==='high')){
        const atr=avgTR(intraday.length?intraday:bars.slice(-15)); const targets=tps(price,levels,atr);
        const contracts=await selectContracts(env,item.symbol,s.bias,Number(price));
        const status=pre?'Potential':s.invalidated?'Invalidated':s.confirmed?'Confirmed':'Awaiting confirmation';
        if(status==='Potential'||status==='Confirmed'||status==='Awaiting confirmation'){
          const card={symbol:item.symbol,bias:s.bias,setup:s.setupType,status,entry:s.entryDescription,keyLevels:{PDH:levels.pdh,PDL:levels.pdl,PMH:pmh?.high,PML:pmh?.low,Support:levels.support,Resistance:levels.resistance},bestStrike:contracts.best?.strike??null,secondStrike:contracts.second?.strike??null,expiration:contracts.best?.expiration??null,TPs:targets,catalyst:null,dataSource:'alpaca-iex',updatedAt:new Date().toISOString()};
          results.push(card); await freezeSnapshot(env,{date:new Date().toISOString().slice(0,10),symbol:item.symbol,setupType:s.setupType,bias:s.bias,trigger:s.entryDescription,invalidation:s.invalidation,TPs:targets,createdAt:new Date().toISOString()});
        }
      }
      delete q[item.symbol];
    }catch(e){q[item.symbol]={...item,waitCycles:(item.waitCycles||0)+1,lastError:String(e)};}
  }
  for(const [s,c] of Object.entries(q)){c.waitCycles=(c.waitCycles||0)+1; if(c.waitCycles>24)delete q[s];}
  await saveQueue(env,q); await env.CACHE.put('last_scan',JSON.stringify({at:new Date().toISOString(),count:results.length,queueSize:Object.keys(q).length}));
  return results;
}
function avgTR(b){if(!b.length)return 0; return avg(b.map((x,i)=>i?Math.max(x.h-x.l,Math.abs(x.h-b[i-1].c),Math.abs(x.l-b[i-1].c)):x.h-x.l));}
function avg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
