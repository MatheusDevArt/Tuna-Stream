const quoteStages = new Set(['quote_requested','quote_sent','won']);
export const leadStages = [
 {id:'new',label:'Nova conversa'},{id:'quote_requested',label:'Solicitou orçamento'},
 {id:'quote_sent',label:'Orçamento enviado'},{id:'won',label:'Fechado'},{id:'lost',label:'Não avançou'},
];
export function trackingReference(text) {
 return typeof text==='string' ? (text.match(/\bTS-(START|LIVE|STREAMER|COMBOS)-([A-Z0-9]{8,24})\b/)?.[0]||null) : null;
}
export function summarizeInbound(messages) {
 const supportedTypes=new Set(['text','image','video','audio','document','sticker','contacts','location','interactive','button','order','unsupported']);
 const ids = new Set(),contacts = new Set();
 let count=0;
 for(const message of messages){
  if(message.direction!=='inbound'||!supportedTypes.has(message.type)||!message.id||!message.contactHash||ids.has(message.id))continue;
  ids.add(message.id);contacts.add(message.contactHash);count++;
 }
 return {messages:count,contacts:contacts.size};
}
export function countQuoteRequests(events) {
 return new Set(events.filter(event=>event.stage==='quote_requested').map(event=>event.contactHash).filter(Boolean)).size;
}
export function isQuoteStage(stage){return quoteStages.has(stage);}
export function demoLeads(){
 return [
 {id:'demo-contact-1',reference:'TS-LIVE-A7K9P2Z4',package:'Live',stage:'new',source:'Site · Instagram',received:'Quinta, 19:24'},
 {id:'demo-contact-2',reference:'TS-STREAMER-B4N8Q1R5',package:'Streamer',stage:'quote_requested',source:'Site · direto',received:'Quinta, 18:42'},
 {id:'demo-contact-3',reference:'TS-START-C9D2V6H3',package:'Start',stage:'quote_sent',source:'Site · Instagram',received:'Quarta, 20:16'},
 {id:'demo-contact-4',reference:'TS-COMBOS-D5J3K7L1',package:'Combos',stage:'won',source:'Site · WhatsApp',received:'Quarta, 17:10'},
 ];
}
