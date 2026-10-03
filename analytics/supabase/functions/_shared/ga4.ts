import {admin,check,env,team} from './server.ts';
const states:Record<string,string>={'acre':'AC','alagoas':'AL','amapa':'AP','amazonas':'AM','bahia':'BA','ceara':'CE','distrito federal':'DF','espirito santo':'ES','goias':'GO','maranhao':'MA','mato grosso':'MT','mato grosso do sul':'MS','minas gerais':'MG','para':'PA','paraiba':'PB','parana':'PR','pernambuco':'PE','piaui':'PI','rio de janeiro':'RJ','rio grande do norte':'RN','rio grande do sul':'RS','rondonia':'RO','roraima':'RR','santa catarina':'SC','sao paulo':'SP','sergipe':'SE','tocantins':'TO'};
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^state of /,'').trim();
const base64url=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
let cached:{token:string,expires:number}|null=null;
async function token(){
 if(cached&&cached.expires>Date.now())return cached.token;
 const account=JSON.parse(env('GOOGLE_SERVICE_ACCOUNT_JSON')),enc=new TextEncoder(),now=Math.floor(Date.now()/1000);
 const header=base64url(enc.encode(JSON.stringify({alg:'RS256',typ:'JWT'}))),claims=base64url(enc.encode(JSON.stringify({iss:account.client_email,scope:'https://www.googleapis.com/auth/analytics.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})));
 const pem=account.private_key.replace(/-----[^-]+-----|\s/g,''),key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const signed=base64url(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,enc.encode(header+'.'+claims))));
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:header+'.'+claims+'.'+signed}),signal:AbortSignal.timeout(15000)}),data=await response.json();
 if(!response.ok||!data.access_token)throw new Error('google_auth_failed');cached={token:data.access_token,expires:Date.now()+3300000};return cached.token;
}
export async function geoMetrics(period:any){
 if(!env('GA4_PROPERTY_ID',false)||!env('GOOGLE_SERVICE_ACCOUNT_JSON',false))return null;
 const db=admin(),tenant=team(),cachedRow=check(await db.from('analytics_geo_cache').select('metrics,updated_at').eq('team_id',tenant).eq('period_start',period.start).eq('period_end',period.end).maybeSingle());
 if(cachedRow&&Date.now()-new Date(cachedRow.updated_at).getTime()<4*3600000)return cachedRow.metrics;
 const property=env('GA4_PROPERTY_ID');if(!/^\d+$/.test(property))throw new Error('configuration_missing');
 async function query(dimensions:any[],filter=true){
  const response=await fetch('https://analyticsdata.googleapis.com/v1beta/properties/'+property+':runReport',{method:'POST',headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json'},body:JSON.stringify({dateRanges:[{startDate:period.start,endDate:period.end}],dimensions,metrics:[{name:'totalUsers'}],...(filter?{dimensionFilter:{filter:{fieldName:'countryId',stringFilter:{matchType:'EXACT',value:'BR'}}}}:{}),orderBys:[{metric:{metricName:'totalUsers'},desc:true}],limit:1000}),signal:AbortSignal.timeout(15000)});
  const data=await response.json();if(!response.ok||data.error)throw new Error('google_report_failed');return data;
 }
 const [byState,total,countries,cities]=await Promise.all([query([{name:'region'}]),query([]),query([{name:'country'}],false),query([{name:'city'},{name:'region'}])]);
 const thresholded=Boolean(byState.metadata?.subjectToThresholding||total.metadata?.subjectToThresholding),stateVisitors:Record<string,number>=thresholded?{}:Object.fromEntries(Object.values(states).map(s=>[s,0]));
 for(const row of byState.rows||[]){const state=states[normalize(row.dimensionValues[0].value)];if(state)stateVisitors[state]=Number(row.metricValues[0].value);}
 const metrics={stateVisitors,geoUniqueVisitors:total.rows?.[0]?Number(total.rows[0].metricValues[0].value):thresholded?null:0,geoThresholded:thresholded,geographySource:'Google Analytics 4',geoUpdatedAt:new Date().toISOString(),topRegion:Object.entries(stateVisitors).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1])[0]?.[0]||null,countries:(countries.rows||[]).slice(0,20).map((r:any)=>[r.dimensionValues[0].value,Number(r.metricValues[0].value)]),cities:(cities.rows||[]).filter((r:any)=>r.dimensionValues[0].value!=='(not set)').slice(0,20).map((r:any)=>[r.dimensionValues[0].value+' · '+r.dimensionValues[1].value,Number(r.metricValues[0].value)])};
 check(await db.from('analytics_geo_cache').upsert({team_id:tenant,period_start:period.start,period_end:period.end,metrics,updated_at:new Date().toISOString()}));
 return metrics;
}
