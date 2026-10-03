export const channels = [
 { id:'feed',label:'Feed' }, { id:'reels',label:'Reels' }, { id:'stories',label:'Stories' },
];

export function classifyChannel(media) {
 const product = String(media.media_product_type || media.channel || '').toUpperCase();
 if (product === 'STORY' || product === 'STORIES') return 'stories';
 if (product === 'REELS') return 'reels';
 return 'feed';
}

export function engagement(media) {
 if (!(media.reach > 0)) return null;
 const fields = [media.likes,media.comments,media.saves,media.shares];
 if (fields.some(value => !Number.isFinite(value))) return null;
 return fields.reduce((sum,value) => sum + value,0) / media.reach * 100;
}

export function sortContent(items, criterion = 'reach') {
 const score = item => criterion === 'engagement' ? engagement(item) : item[criterion];
 return [...items].sort((a,b) => (score(b) ?? -Infinity) - (score(a) ?? -Infinity));
}

export function isInstagramContentUrl(value) {
 try {
   const url = new URL(value);
   return url.protocol === 'https:' && !url.port && !url.username && !url.password && ['instagram.com','www.instagram.com'].includes(url.hostname) && /^\/(p|reel|reels|stories)\/[a-zA-Z0-9_.-]+\/?/.test(url.pathname);
 } catch { return false; }
}

export function getDemoMedia(snapshot) {
 const thumbnails = ['demo-sung.webp','demo-esquenta.webp','demo-setup.webp'].map(name=>(import.meta.env?.BASE_URL||'/')+'media/'+name);
 const feed = snapshot.current.posts.filter(post => post.format !== 'Reel').map((post,index) => ({...post,channel:'feed',thumbnail:thumbnails[index % 3],demo:true,permalink:null}));
 feed.push({id:'demo-more',title:'Ajustes para uma live melhor',format:'Carrossel',channel:'feed',thumbnail:thumbnails[2],reach:1400,likes:81,comments:6,saves:32,shares:12,demo:true,permalink:null});
 const reels = snapshot.current.posts.filter(post => post.format === 'Reel').map((post,index) => ({...post,channel:'reels',thumbnail:thumbnails[(index+1)%3],demo:true,permalink:null}));
 reels.push({id:'demo-reel-2',title:'Seu overlay em movimento',format:'Reel',channel:'reels',thumbnail:thumbnails[0],reach:2100,likes:132,comments:9,saves:27,shares:35,demo:true,permalink:null});
 const stories = [
 {id:'demo-story-1',title:'Bastidores do próximo projeto',format:'Story',channel:'stories',thumbnail:thumbnails[1],reach:840,likes:36,comments:null,saves:null,shares:14,linkTaps:24,replies:11,demo:true,permalink:null,expired:false},
 {id:'demo-story-2',title:'Qual estilo combina com sua live?',format:'Story',channel:'stories',thumbnail:thumbnails[2],reach:680,likes:29,comments:null,saves:null,shares:9,linkTaps:18,replies:8,demo:true,permalink:null,expired:false},
 {id:'demo-story-3',title:'Agenda da semana',format:'Story',channel:'stories',thumbnail:null,reach:590,likes:21,comments:null,saves:null,shares:6,linkTaps:12,replies:5,demo:true,permalink:null,expired:true},
 ];
 return [...feed,...reels,...stories];
}
