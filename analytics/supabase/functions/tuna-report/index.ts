import {body,check,cors,endpoint,json,member} from '../_shared/server.ts';
import {reportConfigured,sendReports} from '../_shared/delivery.ts';
export default endpoint(async req=>{
 const headers=cors(req);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 const {db,teamId}=await member(req),input=await body(req,1000);
 if(input.action==='status')return json({configured:reportConfigured(),deliveries:check(await db.from('email_report_deliveries').select('period_start,kind,status,updated_at').eq('team_id',teamId).order('period_start',{ascending:false}).limit(20))},200,headers);
 if(input.action==='send')return json({results:await sendReports()},200,headers);
 throw new Error('invalid_input');
});
