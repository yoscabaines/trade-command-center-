const KEY='priority_queue';
export async function loadQueue(env){return (await env.CACHE.get(KEY,{type:'json'}))||{};}
export async function saveQueue(env,q){await env.CACHE.put(KEY,JSON.stringify(q));}
export function mergeQueue(q,candidates){for(const c of candidates){const old=q[c.symbol]; q[c.symbol]={...(old||{}),...c,waitCycles:old?.waitCycles||0};}return q;}
export function score(c){return (c.priority||0)+(c.waitCycles||0)*15;}
export function nextBatch(q,n=25){return Object.values(q).sort((a,b)=>score(b)-score(a)).slice(0,n);}
