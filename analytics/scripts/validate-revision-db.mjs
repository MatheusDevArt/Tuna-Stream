// Optional isolated PostgreSQL validation: npm install --prefix .qa --no-save
// --package-lock=false @electric-sql/pglite. Never uses the hosted database.
import {PGlite} from '../.qa/node_modules/@electric-sql/pglite/dist/index.js';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=await PGlite.create(),migrationDir=new URL('../supabase/migrations/',import.meta.url);
let checks=0;const check=value=>{assert.ok(value);checks++;};
const user='11111111-1111-4111-8111-111111111111',partner='22222222-2222-4222-8222-222222222222',outsider='33333333-3333-4333-8333-333333333333',tenant='44444444-4444-4444-8444-444444444444';
const reference='TS-LIVE-'+ 'A'.repeat(32),query=(sql,args=[])=>db.query(sql,args);
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 const files=(await readdir(migrationDir)).filter(name=>name.endsWith('.sql')).sort();
 for(const name of files.filter(name=>name.startsWith('20261002')&&!name.includes('secure_schedule')))await db.exec(await readFile(new URL(name,migrationDir),'utf8'));
 await query('insert into auth.users(id) values($1),($2),($3)',[user,partner,outsider]);
 await query('insert into teams(id,name) values($1,$2)',[tenant,'Isolated QA']);
 for(const [id,nick]of [[user,'matheus p'],[partner,'adriana s']]){await query('insert into team_members(team_id,user_id) values($1,$2)',[tenant,id]);await query('insert into analytics_users(username,user_id,team_id) values($1,$2,$3)',[nick,id,tenant]);}
 await db.exec(await readFile(new URL('202610030001_profiles_and_confirmation.sql',migrationDir),'utf8'));
 check((await query('select * from member_profiles')).rows.length===2);
 await query('insert into whatsapp_intents(reference,team_id,package,source) values($1,$2,$3,$4)',[reference,tenant,'LIVE','Instagram']);
 const confirm=async(actor,ref=reference,quote=false)=>query('select analytics_confirm_link($1,$2,$3,$4,$5) as id',[ref,tenant,actor,'reference-hash:'+ref,quote]);
 const first=(await confirm(user)).rows[0].id,second=(await confirm(partner,reference,true)).rows[0].id;
 check(first===second);check((await query('select * from site_opportunities')).rows.length===1);
 let row=(await query('select * from site_opportunities')).rows[0];check(row.identity_method==='reference');check(row.requested_at!==null);check(row.confirmed_by===user);
 await assert.rejects(()=>confirm(outsider));checks++;
 await assert.rejects(()=>confirm(user,'TS-CUSTOM-'+ 'B'.repeat(32)));checks++;
 const expired='TS-START-'+ 'C'.repeat(32);await query("insert into whatsapp_intents(reference,team_id,package,source,expires_at) values($1,$2,'START','Direto',now()-interval '1 minute')",[expired,tenant]);
 await assert.rejects(()=>confirm(user,expired));checks++;
 const enriched=await query('select analytics_attach_contact($1,$2,$3,$4,now()) as attached',[reference,tenant,partner,'phone-hash']);check(enriched.rows[0].attached);
 await query('select analytics_receive($1,$2,$3,now(),$4)',[reference,'phone-hash','detailed-receipt',tenant]);
 row=(await query('select * from site_opportunities where id=$1',[first])).rows[0];check(row.identity_method==='phone'&&row.contact_hash==='phone-hash'&&row.attributed);check((await query('select count(*)::integer as n from site_opportunities')).rows[0].n===1);
 await query('select analytics_change_stage($1,$2,$3,$4)',[first,tenant,user,'won']);await query('select analytics_change_stage($1,$2,$3,$4)',[first,tenant,partner,'lost']);
 row=(await query('select * from site_opportunities where id=$1',[first])).rows[0];check(row.stage==='lost'&&row.won_at!==null&&row.requested_at!==null);
 await query("update site_opportunities set selected_package='CUSTOM' where id=$1",[first]);row=(await query('select * from site_opportunities where id=$1',[first])).rows[0];check(row.package==='LIVE'&&row.selected_package==='CUSTOM');
 await query("insert into account_requests(token_hash,user_id,team_id,kind) values('test-token',$1,$2,'username')",[user,tenant]);
 check((await query("select * from analytics_consume_request('test-token','username',$1)",[partner])).rows.length===0);
 check((await query("select * from analytics_consume_request('test-token','password',$1)",[user])).rows.length===0);
 check((await query("select * from analytics_consume_request('test-token','username',$1)",[user])).rows.length===1);
 check((await query("select * from analytics_consume_request('test-token','username',$1)",[user])).rows.length===0);
 await query("select analytics_confirm_username($1,$2,'matheus novo','Matheus Novo')",[user,tenant]);
 check((await query('select username from analytics_users where user_id=$1',[user])).rows[0].username==='matheus novo');
 check((await query('select display_name from member_profiles where user_id=$1',[user])).rows[0].display_name==='Matheus Novo');
 await db.exec(await readFile(new URL('202610030002_client_sales.sql',migrationDir),'utf8'));
 const details={clientLabel:'Cliente de teste',package:'CUSTOM',customPackageName:'Setup completo',service:'both',state:'RJ',city:'Rio de Janeiro'};
 await query('select analytics_save_client($1,$2,$3,$4,null)',[first,tenant,user,details]);
 row=(await query('select * from site_opportunities where id=$1',[first])).rows[0];
 check(row.client_id!==null&&row.service_category==='both'&&row.customer_state==='RJ'&&row.custom_package_name==='Setup completo');
 check(row.package==='LIVE');
 await assert.rejects(()=>query('select analytics_save_client($1,$2,$3,$4,null)',[first,tenant,outsider,details]));checks++;
 await assert.rejects(()=>query('select analytics_save_client($1,$2,$3,$4,null)',[first,tenant,user,{...details,state:'ZZ'}]));checks++;
 await assert.rejects(()=>query('select analytics_save_client($1,$2,$3,$4,null)',[first,tenant,user,{...details,customPackageName:''}]));checks++;
 const linked=[];
 for(const letter of ['E','F']){
  const ref='TS-START-'+letter.repeat(32);await query("insert into whatsapp_intents(reference,team_id,package,source) values($1,$2,'START','Direto')",[ref,tenant]);
  const id=(await confirm(user,ref)).rows[0].id;
  await query('select analytics_save_client($1,$2,$3,$4,$5)',[id,tenant,user,{...details,package:'START',customPackageName:''},'d'.repeat(64)]);
  linked.push((await query('select * from site_opportunities where id=$1',[id])).rows[0]);
 }
 check(linked[0].client_id===linked[1].client_id);check(linked.every(item=>item.identity_method==='phone'));
 await assert.rejects(()=>query('select analytics_save_client($1,$2,$3,$4,$5)',[linked[0].id,tenant,user,details,'c'.repeat(64)]));checks++;
 for(const role of ['anon','authenticated']){
  await db.exec('set role '+role);
  for(const table of ['member_profiles','account_requests','provider_credentials','site_clients']){await assert.rejects(()=>query('select * from '+table));checks++;}
  await assert.rejects(()=>query('select analytics_save_client($1,$2,$3,$4,null)',[first,tenant,user,details]));checks++;
  await assert.rejects(()=>confirm(user));checks++;
  await db.exec('reset role');
 }
 const evidence=new URL('../design/local-revision/',import.meta.url);await mkdir(evidence,{recursive:true});
 await writeFile(new URL('database-results.json',evidence),JSON.stringify({checks,passed:true,engine:'Local in-memory PostgreSQL / PGlite',scope:'Six historical data migrations, profiles/confirmation and clients/sales; cron and hosted services excluded. This test makes no hosted database changes.'},null,2));
 console.log(JSON.stringify({checks,passed:true}));
}finally{await db.close();}
