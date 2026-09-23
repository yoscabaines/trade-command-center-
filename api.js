export async function api(env,request){
  const u=new URL(request.url);
  if(u.pathname==='/api/setups')return Response.json((await env.CACHE.get('current_setups',{type:'json'}))||[]);
  if(u.pathname==='/api/status')return Response.json({marketTime:new Date().toISOString(),lastScan:await env.CACHE.get('last_scan',{type:'json'}),queueSize:Object.keys((await env.CACHE.get('priority_queue',{type:'json'}))||{}).length});
  return new Response('Not found',{status:404});
}
