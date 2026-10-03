import {admin,configureRuntime} from './server.ts';
// Only service_role can read this scoped Vault configuration. Never returned to a browser.
export async function loadInstagramRuntime(){
 const result=await admin().rpc('analytics_instagram_runtime');
 if(result.error){console.error('Instagram runtime unavailable',result.error.code||'unknown');throw new Error('configuration_missing');}
 const runtime=result.data;
 if(!runtime)throw new Error('configuration_missing');
 for(const name of ['TUNA_TEAM_ID','META_GRAPH_VERSION','INSTAGRAM_TOKEN_ENCRYPTION_KEY','INSTAGRAM_CRON_SECRET','TUNA_RATE_SECRET','TUNA_PANEL_URL']){
  if(typeof runtime[name]!=='string'||!runtime[name])throw new Error('configuration_missing');
 }
 // Edge runtimes may prohibit mutating environment variables. Keep scoped values in memory.
 configureRuntime(runtime);
}
