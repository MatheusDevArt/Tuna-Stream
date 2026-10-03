// Private, local import of an authenticated Metricool connector response.
import {readFile} from 'node:fs/promises';
import {loadEnvFile} from 'node:process';
import {fileURLToPath} from 'node:url';
import {createClient} from '@supabase/supabase-js';
import {metricoolData} from './metricool-data.mjs';
import {windows} from '../supabase/functions/_shared/aggregation.js';
const root=fileURLToPath(new URL('../',import.meta.url));
loadEnvFile(root+'.env.server.local');
if(process.env.SUPABASE_URL!=='https://fundfokaxkmgvdrpwyot.supabase.co'||!process.env.SUPABASE_SERVICE_ROLE_KEY||!process.env.TUNA_TEAM_ID)throw new Error('wrong_database');
const payload=JSON.parse(await readFile(process.argv[2]||root+'.qa/metricool-instagram.json','utf8'));
const converted=metricoolData(payload,windows(new Date(payload.collectedAt)));
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),teamId=process.env.TUNA_TEAM_ID;
async function checked(query){const result=await query;if(result.error)throw new Error('metricool_database_write_failed');return result.data;}
if(!(await checked(db.from('teams').select('id').eq('id',teamId).maybeSingle())))throw new Error('team_missing');
if(converted.media.length)await checked(db.from('instagram_media').upsert(converted.media.map(row=>({...row,team_id:teamId})),{onConflict:'team_id,id'}));
if(converted.daily.length)await checked(db.from('instagram_daily').upsert(converted.daily.map(row=>({...row,team_id:teamId,collected_at:converted.collectedAt})),{onConflict:'team_id,day'}));
await checked(db.from('instagram_periods').upsert(converted.periods.map(({start,end,...row})=>({...row,team_id:teamId,period_start:start,period_end:end})),{onConflict:'team_id,period_start,period_end'}));
await checked(db.from('analytics_integrations').upsert({team_id:teamId,source:'instagram',status:'ready',mode:'manual',last_success_at:converted.collectedAt,error_code:null},{onConflict:'team_id,source'}));
globalThis.Deno={env:{get:name=>process.env[name]}};
const {publishSnapshots}=await import('./.generated/initialize.js');await publishSnapshots();
const saved=await checked(db.from('instagram_media').select('id').eq('team_id',teamId));
console.log(JSON.stringify({account:'tuna.stream',provider:'metricool',mode:'manual',media:saved.length,periods:converted.periods.length,days:converted.daily.length,collectedAt:converted.collectedAt}));
