import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/mathe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin=process.env.TUNA_QA_ORIGIN||'https://id-preview--61800de5-dce3-4499-91d0-8d8e1837cd2c.lovable.app';
const browser=await chromium.launch({headless:true,args:['--disable-http2','--disable-quic']});
const evidence=new URL('../design/implementation-validation/',import.meta.url);await mkdir(evidence,{recursive:true});
const publicUrl='https://ossjmwppaobdjjzvfzwn.supabase.co',publicKey='sb_publishable_zHMiyLAIEBF1dF2CCm-phw_fOS29gG_';
let checks=0;const verify=condition=>{assert.ok(condition);checks++;};
try{
 const anon=await browser.newContext();
 const denied=await anon.request.get(publicUrl+'/rest/v1/analytics_snapshots?select=team_id',{headers:{apikey:publicKey}});
 verify([401,403].includes(denied.status()));await anon.close();
 const contexts=[];
 for(const [nick,key,width]of [['Matheus P','TUNA_QA_MATHEUS_PASSWORD',1440],['Adriana S','TUNA_QA_ADRIANA_PASSWORD',390]]){
  assert.ok(process.env[key],'Credential must be supplied only in environment');
  const context=await browser.newContext({viewport:{width,height:950},acceptDownloads:true});contexts.push(context);
  const page=await context.newPage(),errors=[],responses=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',response=>{if(response.url().includes('/api/public/tuna-login'))responses.push(response.status());});
  await page.goto(origin+'/painel/index.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.getByRole('heading',{name:'Acesso da equipe',exact:true}).waitFor({timeout:45000});
  verify(await page.getByText('Modo demonstração',{exact:true}).count()===0);
  await page.getByLabel('Nome de usuário').fill(nick);
  await page.getByLabel('Senha',{exact:true}).fill(process.env[key]);
  await page.getByRole('button',{name:'Entrar no painel'}).click();
  await page.getByRole('heading',{name:'Visão geral',exact:true}).waitFor({timeout:45000});
  verify(responses.includes(200));
  await page.getByRole('button',{name:'Ver relatório',exact:true}).waitFor({timeout:45000});
  await page.getByRole('button',{name:'Ver relatório',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByRole('heading',{name:'Duas imagens, uma visão da semana'}).waitFor();
  verify(await dialog.getByText('Demonstração com exemplos.',{exact:false}).count()===0);
  await dialog.getByRole('button',{name:'Fechar relatório'}).click();
  verify(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  verify(errors.length===0);
  await page.screenshot({path:fileURLToPath(new URL('live-'+width+'.png',evidence)),fullPage:true});
  if(width<600)await page.getByRole('button',{name:'Abrir menu'}).click();
  await page.locator('nav').getByRole('button',{name:'Acesso da equipe',exact:true}).click();
  verify(await page.getByText(nick,{exact:true}).count()>0);
  if(width===1440){
   const result=await page.evaluate(async()=>{const session=Object.entries(localStorage).find(([k])=>k.includes('auth-token'));const data=JSON.parse(session?.[1]||'{}'),token=data.access_token;if(!token)return {failed:true};const response=await fetch('/api/public/tuna-team',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({action:'confirm',reference:'TS-LIVE-'+'C'.repeat(32),phone:'21999999999',receivedAt:new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()).replace(' ','T'),quote:true})});return {status:response.status,error:(await response.json()).error};});
   verify(result.status===400&&result.error==='invalid_input');
  }
 }
 for(const context of contexts)await context.close();
 const result={checks,status:'passed',scope:'real nick login for both accounts, protected snapshots, anonymous denial, invalid contact rejection; no fabricated contact saved',origin};
 await writeFile(new URL('live-results.json',evidence),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
