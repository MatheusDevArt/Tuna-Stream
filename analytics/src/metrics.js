const fields=['sources','regions','devices','durations','sections','scroll','packages','posts','webVitals','media','browsers','operatingSystems','pages','buttonClicks','countries','cities'];
export function normalizeMetrics(value){
 const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const result={...source};
 for(const field of fields)result[field]=Array.isArray(source[field])?source[field]:[];
 result.dailyVisits=Array.isArray(source.dailyVisits)&&source.dailyVisits.length===7&&source.dailyVisits.every(value=>value===null||Number.isFinite(value))?source.dailyVisits:null;
 return result;
}
