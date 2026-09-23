const json=async r=>{if(!r.ok) throw new Error(`${r.status} ${await r.text()}`); return r.json()};
export async function alpaca(env,path,params={}){
  const u=new URL(`https://data.alpaca.markets${path}`); Object.entries(params).forEach(([k,v])=>v!=null&&u.searchParams.set(k,v));
  const r=await fetch(u,{headers:{'APCA-API-KEY-ID':env.ALPACA_KEY,'APCA-API-SECRET-KEY':env.ALPACA_SECRET}}); return json(r);
}
export async function getBars(env,symbol,start,end,timeframe='5Min'){
  const x=await alpaca(env,'/v2/stocks/bars',{symbols:symbol,start,end,timeframe,feed:'iex',adjustment:'raw',limit:1000});
  return (x.bars?.[symbol]||[]).map(b=>({t:b.t,o:b.o,h:b.h,l:b.l,c:b.c,v:b.v}));
}
export async function getQuote(env,symbol){
  const x=await alpaca(env,`/v2/stocks/${encodeURIComponent(symbol)}/quotes/latest`,{feed:'iex'}); return x.quote||{};
}
export async function getOptions(env,symbol){
  const u=new URL(`https://data.alpaca.markets/v1beta1/options/snapshots/${encodeURIComponent(symbol)}`); u.searchParams.set('feed','indicative');
  const r=await fetch(u,{headers:{'APCA-API-KEY-ID':env.ALPACA_KEY,'APCA-API-SECRET-KEY':env.ALPACA_SECRET}}); return r.ok?r.json():{snapshots:{}};
}
export async function getMovers(env){
  if(!env.FMP_KEY) return [];
  const u=`https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${encodeURIComponent(env.FMP_KEY)}`;
  const r=await fetch(u); if(!r.ok)return []; return (await r.json()).slice(0,100);
}
export async function getLosers(env){
  if(!env.FMP_KEY) return [];
  const u=`https://financialmodelingprep.com/api/v3/stock_market/losers?apikey=${encodeURIComponent(env.FMP_KEY)}`;
  const r=await fetch(u); if(!r.ok)return []; return (await r.json()).slice(0,100);
}
export async function getActive(env){
  if(!env.FMP_KEY) return [];
  const u=`https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${encodeURIComponent(env.FMP_KEY)}`;
  const r=await fetch(u); if(!r.ok)return []; return (await r.json()).slice(0,100);
}
export async function getUniverse(env){
  const cached=await env.CACHE.get('universe',{type:'json'}); if(cached?.length)return cached;
  if(!env.UNIVERSE_URL) return [];
  const r=await fetch(env.UNIVERSE_URL); if(!r.ok) return [];
  const text=await r.text(); const rows=text.trim().split(/\r?\n/).slice(1);
  const syms=rows.map(x=>x.split(',')[0]?.replaceAll('"','').trim()).filter(Boolean);
  await env.CACHE.put('universe',JSON.stringify(syms),{expirationTtl:86400}); return syms;
}
