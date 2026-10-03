// Isolated transaction/RLS checks. No hosted writes or provider calls.
import {PGlite} from '../.qa/node_modules/@electric-sql/pglite/dist/index.js';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=await PGlite.create(),dir=new URL('../supabase/migrations/',import.meta.url);
const tenant='44444444-4444-4444-8444-444444444444';let checks=0;
const check=value=>{assert.ok(value);checks++;},q=(sql,args=[])=>db.query(sql,args);
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 // Stub only Vault's SQL interface; these tests do not claim to verify Vault encryption.
 await db.exec(`create schema vault;create table vault.secrets(id uuid primary key default gen_random_uuid(),name text unique,secret text);
 create view vault.decrypted_secrets as select id,name,secret as decrypted_secret from vault.secrets;
 create function vault.create_secret(value text,label text,description text) returns uuid language sql as $$insert into vault.secrets(name,secret) values(label,value) returning id$$;
 create function vault.update_secret(secret_id uuid,value text) returns void language sql as $$update vault.secrets set secret=value where id=secret_id$$;`);
 // Hosted pg_cron/pg_net are checked on the dedicated cloud project, not emulated here.
 for(const name of (await readdir(dir)).filter(name=>name.endsWith('.sql')&&!name.includes('secure_schedule')&&!name.includes('cloud_schedule')).sort())await db.exec(await readFile(new URL(name,dir),'utf8'));
 // Emulate only scheduling interfaces: no network calls, actual cron or encryption here.
 await db.exec(`create schema cron;create table cron.job(jobid bigserial primary key,jobname text unique,schedule text,command text,active boolean default true);
 create function cron.schedule(label text,expression text,sql_command text) returns bigint language sql as $$insert into cron.job(jobname,schedule,command) values(label,expression,sql_command) on conflict(jobname) do update set schedule=excluded.schedule,command=excluded.command,active=true returning jobid$$;
 create schema net;create table net.requests(id bigserial primary key,url text,headers jsonb,timeout_ms integer);
 create function net.http_post(url text,body jsonb,headers jsonb,timeout_milliseconds integer) returns bigint language sql as $$insert into net.requests(url,headers,timeout_ms) values(url,headers,timeout_milliseconds) returning id$$;`);
 const scheduleName=(await readdir(dir)).find(name=>name.includes('cloud_schedule'));
 await db.exec((await readFile(new URL(scheduleName,dir),'utf8')).replace(/^create extension.*$/gm,''));
 await q("insert into teams(id,name) values($1,'Isolated Instagram QA')",[tenant]);
 const stamp=new Date().toISOString(),day=stamp.slice(0,10);
 await q("insert into instagram_daily(team_id,day,metrics) values($1,$2,'{\"viewsObserved\":417}')",[tenant,day]);
 await db.exec('set role service_role');
 const runtime={TUNA_TEAM_ID:tenant,META_GRAPH_VERSION:'v26.0',INSTAGRAM_TOKEN_ENCRYPTION_KEY:'a'.repeat(64),INSTAGRAM_CRON_SECRET:'b'.repeat(64),TUNA_RATE_SECRET:'c'.repeat(64),TUNA_PANEL_URL:'http://127.0.0.1:4183/'};
 await q('select analytics_set_instagram_runtime($1)',[runtime]);
 check((await q('select analytics_instagram_runtime() as runtime')).rows[0].runtime.TUNA_TEAM_ID===tenant);
 check((await q('select analytics_instagram_schedule_status() as active')).rows[0].active===false);
 await assert.rejects(()=>q('select analytics_activate_instagram_schedule()'));checks++;
 for(const invalid of [{...runtime,INSTAGRAM_CRON_SECRET:null},{...runtime,extra:'invalid'},Object.fromEntries(Object.entries(runtime).filter(([key])=>key!=='META_GRAPH_VERSION'))]){await assert.rejects(()=>q('select analytics_set_instagram_runtime($1)',[invalid]));checks++;}
 const newRun=async()=> (await q("insert into analytics_collection_runs(team_id,source,provider,status) values($1,'instagram','meta','running') returning id",[tenant])).rows[0].id;
 const batch={handle:'tuna.stream',day,collectedAt:stamp,daily:{followersTotal:15},periods:[{start:day,end:day,metrics:{instagramReach:108,instagramSource:{provider:'meta'}}}],media:[{id:'1',published_at:stamp,metrics:{reach:40}}],coverage:'partial',requests:2};
 const run=await newRun();
 const commit=(id,payload)=>q('select analytics_commit_instagram($1,$2,$3) as committed',[tenant,id,payload]);
 check((await commit(run,batch)).rows[0].committed);
 const daily=(await q('select metrics from instagram_daily where team_id=$1',[tenant])).rows[0].metrics;
 check(daily.viewsObserved===417&&daily.followersTotal===15);
 const integration=(await q('select * from analytics_integrations where team_id=$1',[tenant])).rows[0];
 check(integration.mode==='api'&&integration.status==='ready'&&new Date(integration.last_success_at).getTime()===Date.parse(stamp));
 check((await q('select status from analytics_collection_runs where id=$1',[run])).rows[0].status==='partial');
 const failing=await newRun(),broken={...batch,collectedAt:new Date(Date.now()+1000).toISOString(),daily:{followersTotal:999},media:[{id:'2',published_at:'INVALID_DATE',metrics:{reach:999}}]};
 await assert.rejects(()=>commit(failing,broken));checks++;
 check((await q('select metrics from instagram_daily where team_id=$1',[tenant])).rows[0].metrics.followersTotal===15);
 check((await q('select count(*)::integer as n from instagram_media')).rows[0].n===1);
 check(new Date((await q('select last_success_at from analytics_integrations where team_id=$1',[tenant])).rows[0].last_success_at).getTime()===Date.parse(stamp));
 const older=await newRun();check(!(await commit(older,{...batch,collectedAt:new Date(Date.parse(stamp)-60000).toISOString()})).rows[0].committed);
 await assert.rejects(()=>commit(run,{...batch,handle:'another.account'}));checks++;
 await db.exec('reset role');
 await q("select vault.create_secret('https://isolated.supabase.co','tuna_instagram_project_url','Test-only URL; no networking')");
 await db.exec('set role service_role');
 await assert.rejects(()=>q('select analytics_activate_instagram_schedule()'));checks++;
 await q("insert into provider_credentials(team_id,provider,account_id,encrypted_token,expires_at) values($1,'instagram','1','TEST_FIXTURE_NOT_A_TOKEN',now()+interval '1 hour')",[tenant]);
 check((await q('select analytics_activate_instagram_schedule() as active')).rows[0].active===true);
 check((await q('select analytics_instagram_schedule_status() as active')).rows[0].active===true);
 check((await q('select analytics_queue_instagram_collection() as request')).rows[0].request===1);
 await db.exec('reset role');
 const cron=(await q('select * from cron.job')).rows[0],request=(await q('select * from net.requests')).rows[0];
 check(cron.schedule==='*/15 * * * *'&&!cron.command.includes(runtime.INSTAGRAM_CRON_SECRET));
 check(request.url==='https://isolated.supabase.co/functions/v1/tuna-instagram-sync'&&request.timeout_ms===120000);
 check(request.headers.Authorization==='Bearer '+runtime.INSTAGRAM_CRON_SECRET);
 for(const role of ['anon','authenticated']){
  await db.exec('set role '+role);await assert.rejects(()=>commit(run,batch));checks++;
  await assert.rejects(()=>q('select analytics_instagram_runtime()'));checks++;
  await assert.rejects(()=>q('select analytics_set_instagram_runtime($1)',[runtime]));checks++;
  for(const name of ['analytics_instagram_schedule_status','analytics_activate_instagram_schedule','analytics_queue_instagram_collection']){await assert.rejects(()=>q('select '+name+'()'));checks++;}
  if(role==='anon'){await assert.rejects(()=>q('select * from analytics_collection_runs'));checks++;}
  else{check((await q('select * from analytics_collection_runs')).rows.length===0);await assert.rejects(()=>newRun());checks++;}
  await db.exec('reset role');
 }
 await writeFile(new URL('../.qa/instagram-database-results.json',import.meta.url),JSON.stringify({checks,passed:true,scope:'Isolated PostgreSQL transactions and access controls. No live Instagram collection.'},null,2));
 console.log(JSON.stringify({checks,passed:true}));
}finally{await db.close();}
