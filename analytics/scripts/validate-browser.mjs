import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {getDemoSnapshot} from '../src/data.js';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/mathe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true});
const evidence=new URL('../design/implementation-validation/',import.meta.url);await mkdir(evidence,{recursive:true});
let checks=0;const verify=(truth)=>{assert.ok(truth);checks++;};
const pages=['Visão geral','Site','Instagram','WhatsApp','Relatórios','Integrações','Acesso da equipe'];
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:950},acceptDownloads:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4180/');
  await page.getByRole('heading',{name:'Visão geral',exact:true}).waitFor();
  for(const name of pages){
   if(width<600)await page.getByRole('button',{name:'Abrir menu'}).click();
   await page.locator('nav').getByRole('button',{name,exact:true}).click();
   await page.getByRole('heading',{name,exact:true}).first().waitFor();
   verify(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
  }
  await page.getByRole('button',{name:'Ver relatório',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByRole('heading',{name:'Duas imagens, uma visão da semana'}).waitFor();
  for(const label of ['Site + contatos','Instagram']){
   await dialog.getByRole('button',{name:label,exact:true}).click();
   const preview=dialog.locator('img');await preview.evaluate(image=>image.decode());
   verify(await preview.evaluate(image=>image.naturalWidth===1080&&image.naturalHeight===2160));
   const download=page.waitForEvent('download');
   await dialog.getByRole('button',{name:'Baixar imagem PNG'}).click();
   const file=await download,path=await file.path(),png=await readFile(path);
   verify(png.subarray(1,4).toString()==='PNG'&&png.readUInt32BE(16)===1080&&png.readUInt32BE(20)===2160);
  }
  await dialog.getByRole('button',{name:'Fechar relatório'}).click();
  if(width<600)await page.getByRole('button',{name:'Abrir menu'}).click();
  await page.locator('nav').getByRole('button',{name:'Visão geral',exact:true}).click();
  await page.screenshot({path:fileURLToPath(new URL('demo-'+width+'.png',evidence)),fullPage:true});
  verify(errors.length===0);await context.close();
 }
 const context=await browser.newContext({viewport:{width:1440,height:950}});
 const page=await context.newPage(),requests=[];
 const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',user_metadata:{display_name:'Equipe QA'}};
 const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
 const access=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})+'.test';
 let loginFailed=true;
 await page.route('http://127.0.0.1:4183/**',async route=>{
  const request=route.request(),url=new URL(request.url()),payload=request.postDataJSON?.();
  let result=null,status=200;
  if(url.pathname.endsWith('/tuna-login')){
   if(loginFailed){status=401;result={error:'invalid_credentials'};}
   else result={access_token:access,refresh_token:'test-refresh-token'};
  }else if(url.pathname.endsWith('/user'))result=user;
  else if(url.pathname.includes('/team_members'))result={team_id:'8764e489-d6d6-4378-a646-4d93ced7a75c'};
  else if(url.pathname.includes('/analytics_snapshots')){
   const fixture=getDemoSnapshot('last-week');result={current_metrics:{...fixture.current,dailyVisits:[1,2,null,null,null,null,null],sourceUpdatedAt:{website:new Date().toISOString(),instagram:null,whatsapp:null}},previous_metrics:{},updated_at:new Date().toISOString()};
  }else if(url.pathname.includes('/report_preferences'))result={weekday:1,send_time:'09:00',enabled:false};
  else if(url.pathname.includes('/analytics_integrations'))result=[{source:'whatsapp',mode:'manual',status:'ready'}];
  else if(url.pathname.endsWith('/tuna-report'))result={configured:false,deliveries:[]};
  else if(url.pathname.endsWith('/tuna-team')){requests.push(payload);result={saved:true};}
  else result=[];
  await route.fulfill({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'http://127.0.0.1:4181','Access-Control-Allow-Headers':'*'},body:JSON.stringify(result)});
 });
 await page.goto('http://127.0.0.1:4181/');
 await page.getByRole('heading',{name:'Acesso da equipe'}).waitFor();
 verify(await page.locator('input[type=email]').count()===0);
 await page.getByLabel('Nome de usuário').fill('Equipe QA');await page.getByLabel('Senha',{exact:true}).fill('test-password');
 await page.getByRole('button',{name:'Entrar no painel'}).click();await page.getByRole('alert').waitFor();
 verify(await page.getByLabel('Senha',{exact:true}).inputValue()==='');
 loginFailed=false;await page.getByLabel('Senha',{exact:true}).fill('test-password');
 await page.getByRole('button',{name:'Entrar no painel'}).click();
 await page.getByRole('heading',{name:'Visão geral',exact:true}).waitFor();
 verify(await page.getByText('Modo demonstração',{exact:true}).count()===0);
 verify(await page.locator('svg [points*="NaN"],svg [cy="NaN"]').count()===0);
 await page.locator('nav').getByRole('button',{name:'WhatsApp',exact:true}).click();
 await page.getByLabel('Referência recebida').fill('TS-LIVE-'+'A'.repeat(32));
 await page.getByLabel('Telefone de quem enviou').fill('21999999999');
 await page.getByLabel('A pessoa pediu orçamento na conversa').check();
 await page.getByRole('button',{name:'Confirmar contato do site'}).click();
 await page.getByText('Contato confirmado e compartilhado com a equipe.',{exact:true}).waitFor();
 verify(requests.length===1&&requests[0].quote===true&&requests[0].reference.length===40);
 verify(await page.getByLabel('Telefone de quem enviou').inputValue()==='');
 await page.locator('nav').getByRole('button',{name:'Relatórios',exact:true}).click();
 verify(await page.getByRole('button',{name:/Enviar.*imagens/}).isDisabled());
 await page.screenshot({path:fileURLToPath(new URL('connected-manual.png',evidence)),fullPage:true});
 await context.close();
 console.log(JSON.stringify({checks,status:'passed',scope:'isolated demo and simulated HTTP; live Auth not covered'}));
 await writeFile(new URL('browser-results.json',evidence),JSON.stringify({checks,status:'passed',scope:'isolated demo and simulated HTTP; live Auth not covered'},null,2));
}finally{await browser.close();}
