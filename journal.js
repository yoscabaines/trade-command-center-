export async function freezeSnapshot(env,snapshot){
  const key=`journal:snapshot:${snapshot.date}:${snapshot.symbol}:${snapshot.setupType}`;
  if(!(await env.CACHE.get(key))) await env.CACHE.put(key,JSON.stringify(snapshot));
  return key;
}
export async function appendEvent(env,snapshotKey,event){
  const key=`journal:event:${snapshotKey.replaceAll(':','_')}:${Date.now()}`; await env.CACHE.put(key,JSON.stringify({snapshotKey,...event,timestamp:new Date().toISOString()})); return key;
}
