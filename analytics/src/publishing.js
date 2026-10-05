import {periodDays,addDays} from './periods.js';
export function summarizePublishing(media,period,now=new Date()){
 const start=new Date(period.start+'T00:00:00-03:00'),end=new Date(period.end+'T23:59:59-03:00'),limit=new Date(Math.min(end.getTime(),now.getTime())),days=Math.max(1,Math.ceil((limit-start)/86400000));
 const dated=media.filter(m=>m.publishedAt&&new Date(m.publishedAt)>=start&&new Date(m.publishedAt)<=limit);
 const length=periodDays(period),posts=dated.filter(m=>m.channel!=='stories'),byDay=Array.from({length},(_,i)=>{const day=new Date(addDays(period.start,i)+'T00:00:00-03:00');return [day.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',...(length>7?{day:'2-digit',month:'2-digit'}:{weekday:'short'})}),day>now?null:0];});
 for(const post of posts){const i=Math.floor((new Date(post.publishedAt)-start)/86400000);if(i>=0&&i<length)byDay[i][1]++;}
 const last=posts.map(m=>m.publishedAt).sort().at(-1)||null;
 return {feed:posts.filter(m=>m.channel==='feed').length,reels:posts.filter(m=>m.channel==='reels').length,stories:dated.filter(m=>m.channel==='stories').length,total:posts.length,activeDays:byDay.filter(([,n])=>n>0).length,days,perDay:posts.length/days,byDay,last,daysSinceLast:last?Math.floor((now-new Date(last))/86400000):null};
}
