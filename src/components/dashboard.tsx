'use client';
import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowDownRight, ArrowRight, BookOpen, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, ChevronRight, Circle, Clock3, Code2, Command, GraduationCap, LayoutDashboard, Leaf, ListChecks, LockKeyhole, MapPin, Sparkles, Sun, Terminal, TriangleAlert, X } from 'lucide-react';
import { chicagoDate, dateLabel, timeLabel, validDate } from '@/lib/dates';
import { dailyView } from '@/lib/view';
import { useDashboard } from './use-dashboard';
import type { Plan } from '@/lib/schema';
const DEMO_DATE='2026-11-10';
function Due({date,selected}:{date:string;selected:string}) {
 const due=chicagoDate(new Date(date));
 const label=due===selected?'Due today':due<selected?'Overdue':new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric'}).format(new Date(date));
 return <span className={`due ${due<=selected?'urgent':''}`}>{label}</span>;
}
export default function Dashboard(){
 const [date,setDate]=useState(chicagoDate());
 const [help,setHelp]=useState(false);
 const [allAcademic,setAllAcademic]=useState(false);
 const [allCareer,setAllCareer]=useState(false);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const helpOpener=useRef<HTMLElement|null>(null);
 function openHelp(){helpOpener.current=document.activeElement as HTMLElement;setHelp(true);}
 const {data,error,loading}=useDashboard(date);
 useEffect(()=>{const param=new URLSearchParams(window.location.search).get('date');if(param&&validDate(param))setDate(param);},[]);
 useEffect(()=>{if(!help)return;dialogRef.current?.showModal();return()=>helpOpener.current?.focus();},[help]);
 const view=data?dailyView(data):null;
 const plan=data?.plan;
 const nextInterview=data?.jobs?.interviews.filter(e=>chicagoDate(new Date(e.start))>=date).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start))[0];
 const demo=date===DEMO_DATE && date!==chicagoDate();
 function selectDate(next:string){if(!validDate(next))return;setDate(next);const url=new URL(window.location.href);if(next===chicagoDate())url.searchParams.delete('date');else url.searchParams.set('date',next);window.history.replaceState({},'',url);}
 const timeline:Plan['blocks']=plan?.blocks.length? [...plan.blocks].sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)):(view?.events??[]).map(e=>({id:e.id,sourceId:e.id,title:e.title,start:e.start,end:e.end,kind:e.kind,status:'pending'}));
 return <div className="workspace">
  <a className="skip-link" href="#main">Skip to your day</a>
  <aside className="sidebar">
   <a href="#main" className="brand"><span className="brand-icon"><Activity size={23}/></span>LifeHarness<span className="brand-dot">.</span></a>
   <div className="workspace-label">PERSONAL WORKSPACE</div>
   <nav aria-label="Main navigation">
    <a className="nav-item active" href="#main"><LayoutDashboard size={18}/>Overview<span className="nav-dot"/></a>
    <a className="nav-item" href="#schedule"><CalendarDays size={18}/>My schedule</a>
    <a className="nav-item" href="#academics"><GraduationCap size={19}/>Academics</a>
    <a className="nav-item" href="#career"><BriefcaseBusiness size={18}/>Career</a>
   </nav>
   <div className="sidebar-note"><div className="little-icon"><Leaf size={18}/></div><h3>A plan, not more pressure.</h3><p>Make space for focused work. And for everything else.</p><span className="local-tag"><span/>Local-first, always</span></div>
   <div className="sidebar-bottom"><div className="avatar">M</div><div><strong>MPCS student</strong><span>Your personal workspace</span></div><LockKeyhole size={15}/></div>
  </aside>
  <div className="app-body">
   <header className="topbar"><div className="breadcrumb">Workspace<ChevronRight size={14}/><strong>Overview</strong></div><div className="topbar-right"><span className="connection"><span/>Runs on your computer</span><button className="icon-button" aria-label="How to check in" onClick={openHelp}><Terminal size={19}/></button><div className="avatar small">M</div></div></header>
   <main id="main" className="main-content">
    <div className="page-heading"><div><p className="eyebrow"><Sun size={15}/>{dateLabel(date)}</p><h1>Your day, in focus<span>.</span></h1><p className="subtitle">A little structure for the things that matter.</p></div><button className="primary-button" onClick={openHelp}><Sparkles size={16}/>Morning check-in<ArrowRight size={16}/></button></div>
    <div className="date-toolbar"><div className="segmented"><button aria-pressed={date===chicagoDate()} className={date===chicagoDate()?'selected':''} onClick={()=>selectDate(chicagoDate())}>Today</button><button aria-pressed={demo} className={demo?'selected':''} onClick={()=>selectDate(DEMO_DATE)}>Sample day<span className="tiny-badge">DEMO</span></button></div><label className="date-picker"><CalendarDays size={15}/><input type="date" aria-label="Planning date" value={date} onChange={e=>selectDate(e.target.value)}/></label><span className="timezone">America/Chicago</span><span className="live-indicator"><span className={error?'amber-dot':''}/>{error?'Reconnecting':'Live view'}</span></div>
    {demo&&<div className="demo-banner"><BookOpen size={16}/><span>Sample week · November 9–15, 2026. Start Claude with <code>npm run planner:demo</code> to plan this date.</span></div>}
    {error&&<div className="warning" role="status"><TriangleAlert size={17}/>{error}</div>}
    {data?.warnings.map(w=><div className="warning" role="status" key={w}><TriangleAlert size={17}/>{w}</div>)}
    {view?.conflicts.map(c=><div className="warning" role="status" key={c}><TriangleAlert size={17}/>{c}</div>)}
    {loading&&!data?<div className="loading-state" role="status"><Activity size={24}/><h2>Bringing your day together…</h2><p>Reading your local calendar and career tracker.</p></div>:!data?<div className="card empty-page"><TriangleAlert/><h2>Your workspace is temporarily unavailable</h2><p>Keep the local server running. This page retries automatically.</p></div>:<>
    <section className="stats-grid" aria-label="Day at a glance">
     <article className="stat-card"><div className="stat-icon blue"><CalendarDays size={19}/></div><span>On the calendar</span><div className="stat-value">{view!.events.length}<small>fixed events</small></div><p>Classes & interviews</p></article>
     <article className="stat-card"><div className="stat-icon purple"><BookOpen size={19}/></div><span>Academic deadlines</span><div className="stat-value">{view!.academicTasks.filter(t=>t.status==='pending'&&chicagoDate(new Date(t.due))<=date).length}<small>due or overdue</small></div><p>{data.academic?.courses.length??0} courses in your calendar</p></article>
     <article className="stat-card"><div className="stat-icon teal"><BriefcaseBusiness size={19}/></div><span>Career momentum</span><div className="stat-value">{view!.applications.active}<small>active applications</small></div><p>{view!.applications.interviewing} in technical interviews</p></article>
     <article className="stat-card"><div className="stat-icon green"><CheckCircle2 size={19}/></div><span>Tasks completed</span><div className="stat-value">{view!.completed}<small>of {view!.completed+view!.pending} tracked tasks</small></div><div className="progress-track"><span style={{width:`${view!.completed/Math.max(1,view!.completed+view!.pending)*100}%`}}/></div></article>
    </section>
    <div className="primary-grid">
     <section id="schedule" className="card schedule-card"><div className="card-heading"><div><h2><CalendarDays size={18}/>Your schedule</h2><p>{plan?'Your confirmed plan, with room to breathe.':'Fixed events from your calendar.'}</p></div><span className="soft-tag">{timeline.length} blocks</span></div>
      {!plan&&<div className="schedule-prompt"><span className="prompt-icon"><Sparkles size={17}/></span><div><strong>Your day starts with a conversation.</strong><p>Check in with Claude to turn your tasks into a plan.</p></div><button aria-label="Open check-in instructions" onClick={openHelp}><ArrowRight size={18}/></button></div>}
      <div className="timeline">{timeline.length?timeline.map(block=><div key={block.id} className={`timeline-row ${block.kind} ${block.status==='completed'?'is-complete':''}`}><div className="timeline-time">{timeLabel(block.start)}<span>{timeLabel(block.end)}</span></div><div className="timeline-marker"><span/></div><div className="timeline-event"><div className="event-top"><span className={`category ${block.kind}`}>{block.kind==='class'?'CLASS':block.kind==='interview'?'INTERVIEW':block.kind==='break'?'PERSONAL':'FOCUS TIME'}</span>{block.status==='completed'&&<CheckCircle2 size={14}/>}</div><h3>{block.title}</h3><p><Clock3 size={12}/>{Math.round((Date.parse(block.end)-Date.parse(block.start))/60000)} min{(block.kind==='class'||block.kind==='interview')&&<><span className="event-divider">·</span><MapPin size={12}/>{block.kind==='class'?'On campus':'Video call'}</>}</p></div></div>):<div className="quiet-empty"><Sun size={26}/><h3>A little breathing room.</h3><p>No fixed events on this date. Ask Claude to help shape your day.</p></div>}</div>
      <div className="card-footer"><LockKeyhole size={13}/>{plan?'Confirmed plan · source calendar stays protected':'Your calendar is read-only. You make the changes.'}</div>
     </section>
     <div className="right-column"><section className="card priority-card"><div className="card-heading"><div><h2><Sparkles size={18}/>Your priorities</h2><p>A clear place to start.</p></div><span className="ai-tag">CLAUDE</span></div>
      {plan?<><p className="plan-summary">{plan.summary}</p><ol className="priorities">{plan.priorities.map((p,i)=><li key={p.id}><span className={`priority-number ${p.status==='completed'?'done':''}`}>{p.status==='completed'?<Check size={14}/>:String(i+1).padStart(2,'0')}</span><div><h3 className={p.status==='completed'?'strike':''}>{p.title}</h3><p>{p.reason}</p></div></li>)}</ol></>:<div className="priority-empty"><div className="sparkle-orbit"><Sparkles size={25}/></div><h3>Less guessing. <br/>More intention.</h3><p>Your priorities appear here after you confirm a plan with Claude.</p><button className="text-button" onClick={openHelp}>Start your first check-in<ArrowRight size={14}/></button></div>}
      <div className="checkin-status"><span className={plan?'status-dot':'status-dot muted'}/><span>{plan?`Last check-in · ${new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(plan.confirmedAt))}`:'No confirmed check-in for this date'}</span></div>
     </section><div className="focus-note"><div><Leaf size={18}/><span>MAKE SPACE</span></div><p>A realistic plan leaves room<br/>for being human.</p><span>Lunch stays yours. 12–1 PM.</span></div></div>
    </div>
    <div className="secondary-grid">
     <section id="academics" className="card"><div className="card-heading"><div><h2><GraduationCap size={20}/>Academic deadlines</h2><p>The next steps in your coursework.</p></div><span className="soft-tag">{view!.academicTasks.filter(t=>t.status==='pending').length} pending</span></div>
      <div className="task-list">{view!.academicTasks.slice(0,allAcademic?undefined:5).map(task=><div className="task-row" key={task.id}><span className={`task-status ${task.status==='completed'?'complete':''}`} aria-label={task.status}>{task.status==='completed'?<CheckCircle2 size={17}/>:<Circle size={17}/>}</span><div className="task-copy"><h3 className={task.status==='completed'?'strike':''}>{task.title}</h3><p>{data.academic?.courses.find(c=>c.id===task.courseId)?.code}<span>·</span>{task.durationMinutes} min</p></div><Due date={task.due} selected={date}/></div>)}{!view!.academicTasks.length&&<p className="small-empty">No academic tasks available.</p>}</div><div className="card-footer"><BookOpen size={13}/>Coursework, study sessions & practice{view!.academicTasks.length>5&&<button className="text-button expand-button" onClick={()=>setAllAcademic(!allAcademic)}>{allAcademic?'Show fewer':`Show all ${view!.academicTasks.length} academic tasks`}</button>}</div>
     </section>
     <section id="career" className="card"><div className="card-heading"><div><h2><Code2 size={19}/>Career & interview prep</h2><p>Small steps toward your next chapter.</p></div><span className="soft-tag">SWE</span></div>
      <div className="pipeline"><div><strong>{view!.applications.applied}</strong><span>Applied</span></div><ChevronRight size={14}/><div><strong>{view!.applications.screening}</strong><span>Screening</span></div><ChevronRight size={14}/><div><strong>{view!.applications.interviewing}</strong><span>Interviewing</span></div></div>
      {nextInterview&&<div className="next-interview"><BriefcaseBusiness size={14}/><div><strong>{nextInterview.title}</strong><span>{dateLabel(chicagoDate(new Date(nextInterview.start)))} · {timeLabel(nextInterview.start)}</span></div></div>}
      <div className="career-tasks">{view!.careerTasks.slice(0,allCareer?undefined:3).map(task=><div className="task-row" key={task.id}><span className={`task-status ${task.status==='completed'?'complete':''}`}>{task.status==='completed'?<CheckCircle2 size={17}/>:<Circle size={17}/>}</span><div className="task-copy"><h3 className={task.status==='completed'?'strike':''}>{task.title}</h3><p>{data.jobs?.applications.find(a=>a.id===task.applicationId)?.company}<span>·</span>{task.durationMinutes} min</p></div><Due date={task.due} selected={date}/></div>)}{!view!.careerTasks.length&&<p className="small-empty">No career tasks available.</p>}</div>
      {view!.careerTasks.length>3&&<button className="list-expand text-button" onClick={()=>setAllCareer(!allCareer)}>{allCareer?'Show fewer':`Show all ${view!.careerTasks.length} career tasks`}</button>}
      <details className="application-details"><summary>View all {view!.applications.total} applications<ArrowDownRight size={14}/></summary><ul>{data.jobs?.applications.map(app=><li key={app.id}><div><strong>{app.company}</strong><span>{app.role}</span></div><span className={`application-status ${app.status}`}>{app.status}</span></li>)}</ul></details>
     </section>
    </div>
    <footer className="page-footer"><span><Leaf size={13}/>A calmer day starts here.</span><span><LockKeyhole size={12}/>Private by design<span className="footer-dot">·</span>Synthetic sample data<span className="footer-dot">·</span>Updates every 3 seconds</span></footer>
    </>}
   </main>
  </div>
  {help&&<dialog ref={dialogRef} className="modal-overlay" aria-labelledby="checkin-title" onKeyDown={e=>{if(e.key!=='Tab')return;const buttons=e.currentTarget.querySelectorAll<HTMLButtonElement>('button');const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}} onCancel={e=>{e.preventDefault();setHelp(false);}} onClick={()=>setHelp(false)}><section className="checkin-modal" onClick={e=>e.stopPropagation()}><button autoFocus className="modal-close icon-button" aria-label="Close check-in instructions" onClick={()=>setHelp(false)}><X size={20}/></button><span className="modal-icon"><Terminal size={24}/></span><p className="eyebrow">YOUR MORNING RITUAL</p><h2 id="checkin-title">Start with “Good morning”.</h2><p>Open a terminal in the LifeHarness folder and start your planner:</p><pre><code>{date===chicagoDate()?'npm run planner':`npm run planner -- --date ${date}`}</code></pre><ol><li><span>1</span>Say <strong>“Good morning”</strong> or <strong>“Plan my day”.</strong></li><li><span>2</span>Answer a question or two. Shape a plan together.</li><li><span>3</span>Confirm the plan. Your dashboard updates automatically.</li></ol><div className="modal-footnote"><LockKeyhole size={15}/>Claude can suggest. Your original data stays protected.</div><button className="primary-button" onClick={()=>setHelp(false)}>Got it<Check size={16}/></button></section></dialog>}
 </div>;
}
