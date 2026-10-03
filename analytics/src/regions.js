const weights = {RJ:396,SP:235,MG:113,BA:32,PR:28,SC:24,RS:22,DF:18,PE:17,CE:16,GO:14,ES:12,RN:5,AM:4,PA:3,AL:2,PB:1};
export function distributeRegions(total) {
 if (!Number.isInteger(total) || total < 0) throw new Error('Expected a nonnegative visitor total');
 const raw = Object.entries(weights).map(([abbr,weight]) => ({abbr,exact:total*weight/942}));
 const result = raw.map(item => ({abbr:item.abbr,count:Math.floor(item.exact),remainder:item.exact%1}));
 const remaining = total - result.reduce((sum,item)=>sum+item.count,0);
 [...result].sort((a,b)=>b.remainder-a.remainder).slice(0,remaining).forEach(item=>item.count++);
 return {...Object.fromEntries(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(abbr=>[abbr,0])),...Object.fromEntries(result.map(({abbr,count})=>[abbr,count]))};
}
