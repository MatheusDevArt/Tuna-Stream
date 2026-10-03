export const packageLabels={START:'Start',LIVE:'Live',STREAMER:'Streamer',COMBOS:'Combos',CUSTOM:'Personalizado',AVULSO:'Serviço avulso',GENERAL:'A definir'};
export function parseSaleAmount(value){
 if(value==null||String(value).trim()==='')return null;
 const text=String(value).trim();
 if(!/^\d+(?:[,.]\d{1,2})?$/.test(text))throw new Error('Informe o valor com até duas casas decimais. Ex.: 250,00.');
 const amount=Number(text.replace(',','.'));
 if(!Number.isFinite(amount)||amount<0||amount>9999999999.99)throw new Error('O valor informado é inválido.');
 return amount;
}
export const formatSaleAmount=value=>value==null?'Não informado':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
export const serviceLabels={unknown:'A definir',configuration:'Configuração',personalization:'Personalização',both:'Configuração e personalização'};
export const stateLabels={AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins'};
export const brazilRegions={Norte:['AC','AP','AM','PA','RO','RR','TO'],Nordeste:['AL','BA','CE','MA','PB','PE','PI','RN','SE'],'Centro-Oeste':['DF','GO','MT','MS'],Sudeste:['ES','MG','RJ','SP'],Sul:['PR','RS','SC']};
export function summarizeSalesPeriod(leads,period){
 const start=new Date(period.start+'T00:00:00-03:00').getTime(),end=new Date(period.end+'T00:00:00-03:00').getTime()+86400000;
 const inside=value=>{const date=new Date(value).getTime();return date>=start&&date<end;};
 leads=leads.filter(lead=>!lead.archived_at);
 const received=leads.filter(lead=>inside(lead.received_at)),closed=leads.filter(lead=>lead.stage==='won'&&inside(lead.won_at));
 const pipeline=summarizeSales(leads),sales=summarizeSales(closed),cohort=summarizeSales(received);
 return {...sales,opportunities:cohort.opportunities,clients:cohort.clients,unidentified:cohort.unidentified,open:pipeline.open,lost:pipeline.lost,registeredClients:pipeline.clients,period,byClosingDate:true};
}
export function summarizeSales(leads=[]){
 leads=leads.filter(lead=>!lead.archived_at);
 const won=leads.filter(lead=>lead.stage==='won'),identified=leads.filter(lead=>lead.client_id),clients=new Set(identified.map(lead=>lead.client_id)),buyers=new Set(won.filter(lead=>lead.client_id).map(lead=>lead.client_id));
 const grouped=(items,key)=>Object.entries(items.reduce((groups,row)=>{const name=key(row);groups[name]=(groups[name]||0)+1;return groups;},{})).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR'));
 const pack=lead=>lead.selected_package||String(lead.package).toUpperCase();
 const known=won.filter(lead=>stateLabels[lead.customer_state]);
 return {opportunities:leads.length,clients:clients.size,buyers:buyers.size,won:won.length,lost:leads.filter(lead=>lead.stage==='lost').length,open:leads.filter(lead=>!['won','lost'].includes(lead.stage)).length,unidentified:leads.filter(lead=>!lead.client_id).length,unidentifiedWon:won.filter(lead=>!lead.client_id).length,unknownState:won.length-known.length,
  salesByService:grouped(won,lead=>serviceLabels[lead.service_category]||serviceLabels.unknown),
  salesByState:grouped(known,lead=>lead.customer_state),
  salesByRegion:grouped(known,lead=>Object.entries(brazilRegions).find(([,states])=>states.includes(lead.customer_state))?.[0]||'Não informada'),
  salesByCity:grouped(known.filter(lead=>lead.customer_city),lead=>lead.customer_city+' · '+lead.customer_state),
  salesByPackage:Object.keys(packageLabels).map(value=>{const rows=leads.filter(lead=>pack(lead)===value);return {package:value,open:rows.filter(lead=>!['won','lost'].includes(lead.stage)).length,won:rows.filter(lead=>lead.stage==='won').length,lost:rows.filter(lead=>lead.stage==='lost').length};}),
  customPackages:grouped(won.filter(lead=>pack(lead)==='CUSTOM'),lead=>lead.custom_package_name||'Personalizado sem nome')};
}
