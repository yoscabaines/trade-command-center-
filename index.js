import {runScan} from './pipeline.js';
import {api} from './api.js';
export default {
 async fetch(request,env){return api(env,request)},
 async scheduled(event,env,ctx){ctx.waitUntil(runScan(env).then(x=>env.CACHE.put('current_setups',JSON.stringify(x))));}
};
