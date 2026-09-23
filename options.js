import {getOptions} from './data.js';
export async function selectContracts(env,symbol,bias,underlying){
  const data=await getOptions(env,symbol); const snaps=data.snapshots||{}; const items=[];
  for(const [symbolKey,s] of Object.entries(snaps)){
    const c=s.latestTrade?.p; const q=s.latestQuote||{}; const bid=q.bp,ask=q.ap; const contract=s.symbol||symbolKey;
    if(!Number.isFinite(c)||!Number.isFinite(bid)||!Number.isFinite(ask))continue;
    if(ask<=bid || (ask-bid)/Math.max(ask,.01)>.25)continue;
    const m=contract.match(/^(.*?)(\d{6})([CP])(\d{8})$/); if(!m)continue;
    const strike=Number(m[4])/1000; const type=m[3]; if((bias==='bullish'&&type!=='C')||(bias==='bearish'&&type!=='P'))continue;
    const delta=s.greeks?.delta; if(Number.isFinite(delta)&&Math.abs(delta)<.20)continue;
    items.push({contract,strike,type,expiration:`20${m[2].slice(0,2)}-${m[2].slice(2,4)}-${m[2].slice(4,6)}`,distance:Math.abs(strike-underlying),delta});
  }
  items.sort((a,b)=>a.distance-b.distance); return {best:items[0]||null,second:items[1]||null,source:'alpaca-indicative'};
}
