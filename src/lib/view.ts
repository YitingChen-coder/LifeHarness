import type { DashboardData } from './store';
import { chicagoDate } from './dates';
export function dailyView(data:DashboardData) {
 const completedIds=new Set([...(data.plan?.priorities??[]),...(data.plan?.blocks??[])].filter(t=>t.status==='completed').map(t=>t.sourceId));
 const update=<T extends {id:string;status:string}>(task:T):T=>({...task,status:completedIds.has(task.id)?'completed':task.status});
 const academicTasks=(data.academic?.tasks??[]).map(update).sort((a,b)=>Date.parse(a.due)-Date.parse(b.due));
 const careerTasks=(data.jobs?.tasks??[]).map(update).sort((a,b)=>Date.parse(a.due)-Date.parse(b.due));
 const events=[...(data.academic?.events??[]),...(data.jobs?.interviews??[])].filter(e=>chicagoDate(new Date(e.start))===data.date).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
 const conflicts:string[]=[];
 for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length;j++)if(Date.parse(events[i].end)>Date.parse(events[j].start))conflicts.push(`${events[i].title} overlaps ${events[j].title}. Ask to reschedule; source events stay fixed.`);
 const apps=data.jobs?.applications??[];
 return {academicTasks,careerTasks,events,conflicts,completed:[...academicTasks,...careerTasks].filter(t=>t.status==='completed').length,pending:[...academicTasks,...careerTasks].filter(t=>t.status==='pending').length,applications:{total:apps.length,active:apps.filter(a=>!['rejected','offer'].includes(a.status)).length,interviewing:apps.filter(a=>a.status==='interviewing').length,screening:apps.filter(a=>a.status==='screening').length,applied:apps.filter(a=>a.status==='applied').length}};
}
