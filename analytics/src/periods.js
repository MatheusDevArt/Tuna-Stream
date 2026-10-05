export const localDay=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export function addDays(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export const periodDays=period=>Math.round((new Date(period.end+'T12:00:00Z')-new Date(period.start+'T12:00:00Z'))/86400000)+1;
export function windows(now=new Date()){
 const today=localDay(now),offset=(new Date(today+'T12:00:00Z').getUTCDay()+6)%7,start=addDays(today,-offset);
 return [{start,end:addDays(start,6)},{start:addDays(start,-7),end:addDays(start,-1)},{start:addDays(start,-14),end:addDays(start,-8)}];
}
export function analysisWindows(now=new Date()){const today=localDay(now);return [{start:addDays(today,-29),end:today},...windows(now)];}
export const previousWindow=period=>{const days=periodDays(period);return {start:addDays(period.start,-days),end:addDays(period.end,-days)};};
export function analysisOptions(now=new Date()){
 return analysisWindows(now).map((period,i)=>({...period,id:['last-30-days','current-week','last-week','previous-week'][i],label:i===0?'Últimos 30 dias':i===1?'Esta semana · em andamento':period.start.split('-').reverse().join('/')+' a '+period.end.split('-').reverse().join('/')}));
}
