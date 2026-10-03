export function extractReference(text){return typeof text==='string'?(text.match(/\bTS-(?:START|LIVE|STREAMER|COMBOS|CUSTOM|GENERAL)-[A-F0-9]{32}\b/)?.[0]||null):null;}
export function inboundMessages(payload,phoneId){
 const messages=[];
 const supported=new Set(['text','image','video','audio','document','sticker','contacts','location','interactive','button','order','unsupported']);
 for(const entry of payload?.entry||[])for(const change of entry.changes||[]){
  const value=change.value;if(change.field!=='messages'||value?.metadata?.phone_number_id!==phoneId)continue;
  for(const message of value.messages||[])if(message.id&&message.from&&supported.has(message.type))messages.push(message);
 }
 return messages;
}
export async function verifySignature(bytes,signature,secret){
 if(!/^sha256=[a-f0-9]{64}$/.test(signature||''))return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const digest=new Uint8Array(signature.slice(7).match(/.{2}/g).map(byte=>parseInt(byte,16)));
 return crypto.subtle.verify('HMAC',key,digest,bytes);
}
