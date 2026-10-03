import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/mathe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const evidence=new URL('../design/local-revision/',import.meta.url);await mkdir(evidence,{recursive:true});
const browser=await chromium.launch({headless:true});let checks=0;
function check(value){assert.ok(value);checks++;}
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4183/');await page.getByRole('heading',{name:'Visão geral',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
  check(await page.locator('.team-cover').count()===1);check(await page.locator('.team-cover h2,.team-cover p,.team-cover button').count()===0);
  check(await page.locator('.team-cover img').evaluate(img=>img.complete&&img.naturalWidth>0));
  await page.screenshot({path:fileURLToPath(new URL(`overview-${width}.png`,evidence)),fullPage:true});
  async function navigate(name){if(width<600)await page.getByRole('button',{name:'Abrir menu'}).click();await page.locator('nav').getByRole('button',{name,exact:true}).click();await page.getByRole('heading',{name,exact:true}).first().waitFor();}
  await navigate('Site');check(await page.locator('.distribution').count()===2);check(await page.locator('.column-chart').count()===3);
  await page.screenshot({path:fileURLToPath(new URL(`website-${width}.png`,evidence)),fullPage:true});
  await navigate('Instagram');await page.getByRole('tab',{name:'Reels',exact:true}).click();check(await page.getByRole('tab',{name:'Reels',exact:true}).getAttribute('aria-selected')==='true');
  await navigate('WhatsApp');check(await page.locator('.sales-column').count()===5);
  const first=page.locator('.deal-card').filter({hasText:'TS-LIVE-'}).first();await first.getByLabel(/Etapa da oportunidade/).selectOption('won');
  check(await page.locator('.stage-won .deal-card').filter({hasText:'TS-LIVE-'}).count()===1);
  await page.locator('.stage-won .deal-card').filter({hasText:'TS-LIVE-'}).getByLabel(/Pacote da oportunidade/).selectOption('CUSTOM');
  check(await page.locator('.stage-won .deal-card').filter({hasText:'TS-LIVE-'}).getByLabel(/Pacote da oportunidade/).inputValue()==='CUSTOM');
  await page.screenshot({path:fileURLToPath(new URL(`sales-${width}.png`,evidence)),fullPage:true});
  await navigate('Acesso da equipe');check(await page.locator('.person-profile').count()===2);
  await page.locator('.person-profile img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  check(await page.locator('.person-profile img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0)));
  await page.screenshot({path:fileURLToPath(new URL(`profiles-${width}.png`,evidence)),fullPage:true});
  await navigate('Integrações');await page.getByRole('button',{name:'Conectar com Instagram',exact:true}).click();check((await page.getByRole('status').allTextContents()).join(' ').includes('Prévia local'));
  await navigate('Relatórios');await page.getByRole('button',{name:'Ver imagens e baixar PNG'}).click();await page.getByRole('dialog').waitFor();
  for(const name of ['Site + contatos','Instagram']){await page.getByRole('dialog').getByRole('button',{name,exact:true}).click();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar imagem PNG'}).click();const item=await download;check(item.suggestedFilename().endsWith('.png'));}
  await page.getByRole('button',{name:'Fechar relatório'}).click();
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));check(errors.length===0);
  await page.goto('http://127.0.0.1:4183/?confirm=TS-CUSTOM-'+ 'A'.repeat(32));await page.getByRole('heading',{name:'Esta mensagem chegou no WhatsApp?'}).waitFor();
  check(await page.locator('.arrival-confirmation code').textContent()==='TS-CUSTOM-'+ 'A'.repeat(32));
  await page.getByRole('button',{name:'Sim, recebi esta mensagem'}).click();await page.getByRole('button',{name:'Recebimento confirmado'}).waitFor();check(!new URL(page.url()).searchParams.has('confirm'));
  check(await page.locator('.stage-new .deal-card').filter({hasText:'TS-CUSTOM-'+ 'A'.repeat(32)}).count()===1);
  await context.close();
 }
 await writeFile(new URL('results.json',evidence),JSON.stringify({checks,passed:true,scope:'Local demonstration only; no production changes, email delivery or provider authorization.'},null,2));
 console.log(JSON.stringify({checks,passed:true}));
}finally{await browser.close();}
