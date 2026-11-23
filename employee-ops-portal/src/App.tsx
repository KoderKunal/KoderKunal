import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, AlarmClock, ArrowUpRight, BarChart3, BriefcaseBusiness, CalendarCheck,
  CheckCircle2, CircleAlert, ClipboardList, Clock3, FileCheck2, FileText,
  LayoutDashboard, LogOut, Plus, RefreshCw, ShieldCheck, Users, XCircle
} from "lucide-react";
import { supabase, supabaseConfigured } from "./supabase";
import { runDailyReportingAgent } from "./reportingAgent";

type Profile = { id:string; organization_id:string; full_name:string; email:string; role:"employee"|"manager"|"admin"; timezone:string; active:boolean };
type Project = { id:string; name:string; client_name:string; status:string; description?:string };
type Task = { id:string; project_id:string; title:string; description:string; assigned_to:string; status:string; percent_complete:number; priority:string; due_date:string|null; blocker:string; update_note:string };
type Member = { id:string; full_name:string; email:string; role:string };
type Delivery = { id:string; project_id:string; task_id:string|null; title:string; url:string; description:string; status:string; submitted_at:string; submitted_by:string; manager_feedback:string };
type Review = { id:string; employee_id:string; title:string; purpose:string; evidence_summary:string; employee_response:string; status:string; due_date:string|null };
type Attendance = { id:string; checked_in_at:string; checked_out_at:string|null };
type Notice = { kind:"success"|"error"|"info"; text:string };

const today = () => { const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-"); };
const dateTime = (x?:string|null) => x ? new Date(x).toLocaleString() : "—";
const hoursLabel = (n:number) => `${n.toFixed(2)} h`;
const isManager = (p:Profile|null) => p?.role==="manager" || p?.role==="admin";

export default function App() {
  const [session,setSession]=useState<any>(null);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [booting,setBooting]=useState(true);
  const [busy,setBusy]=useState(false);
  const [tab,setTab]=useState("dashboard");
  const [notice,setNotice]=useState<Notice|null>(null);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [projects,setProjects]=useState<Project[]>([]);
  const [tasks,setTasks]=useState<Task[]>([]);
  const [members,setMembers]=useState<Member[]>([]);
  const [deliveries,setDeliveries]=useState<Delivery[]>([]);
  const [reviews,setReviews]=useState<Review[]>([]);
  const [attendance,setAttendance]=useState<Attendance[]>([]);
  const [myLogs,setMyLogs]=useState<any[]>([]);
  const [progress,setProgress]=useState<any[]>([]);
  const [teamAttendance,setTeamAttendance]=useState<any[]>([]);
  const [teamWorkLogs,setTeamWorkLogs]=useState<any[]>([]);
  const [teamProgress,setTeamProgress]=useState<any[]>([]);
  const [report,setReport]=useState<any>(null);
  const [selectedEmployee,setSelectedEmployee]=useState("");
  const [projectName,setProjectName]=useState("");
  const [clientName,setClientName]=useState("");
  const [projectDesc,setProjectDesc]=useState("");
  const [taskTitle,setTaskTitle]=useState("");
  const [taskProject,setTaskProject]=useState("");
  const [taskAssignee,setTaskAssignee]=useState("");
  const [taskDue,setTaskDue]=useState("");
  const [taskPriority,setTaskPriority]=useState("medium");
  const [requirement,setRequirement]=useState("");
  const [requirementProject,setRequirementProject]=useState("");
  const [requirementCriteria,setRequirementCriteria]=useState("");
  const [logProject,setLogProject]=useState("");
  const [logTask,setLogTask]=useState("");
  const [logHours,setLogHours]=useState("1");
  const [logSummary,setLogSummary]=useState("");
  const [updateProject,setUpdateProject]=useState("");
  const [updateAccomplished,setUpdateAccomplished]=useState("");
  const [updateNext,setUpdateNext]=useState("");
  const [updateBlockers,setUpdateBlockers]=useState("");
  const [deliveryProject,setDeliveryProject]=useState("");
  const [deliveryTask,setDeliveryTask]=useState("");
  const [deliveryTitle,setDeliveryTitle]=useState("");
  const [deliveryUrl,setDeliveryUrl]=useState("");
  const [deliveryDesc,setDeliveryDesc]=useState("");
  const [reviewEmployee,setReviewEmployee]=useState("");
  const [reviewTitle,setReviewTitle]=useState("Project support and progress review");
  const [reviewPurpose,setReviewPurpose]=useState("");
  const [reviewDue,setReviewDue]=useState("");
  const [reviewEvidence,setReviewEvidence]=useState("");

  const flash=(kind:Notice["kind"],text:string)=>{setNotice({kind,text});window.setTimeout(()=>setNotice(null),5000);};

  const loadProfile=useCallback(async (userId:string)=>{
    if(!supabase) return;
    const {data,error}=await supabase.from("profiles").select("id,organization_id,full_name,email,role,timezone,active").eq("id",userId).maybeSingle();
    if(error) throw error;
    setProfile(data as Profile|null);
  },[]);

  const refresh=useCallback(async ()=>{
    if(!supabase || !session?.user || !profile) return;
    setBusy(true);
    try {
      const org=profile.organization_id;
      const [pr,ta,at,logs,updates,ds,rs,ms,tAt,tLogs,tUpdates]=await Promise.all([
        supabase.from("projects").select("*").eq("organization_id",org).order("created_at",{ascending:false}),
        supabase.from("tasks").select("*").order("due_date",{ascending:true}),
        supabase.from("attendance_sessions").select("*").eq("user_id",session.user.id).order("checked_in_at",{ascending:false}).limit(25),
        supabase.from("work_logs").select("*").eq("user_id",session.user.id).order("work_date",{ascending:false}).limit(100),
        supabase.from("progress_updates").select("*").eq("user_id",session.user.id).order("created_at",{ascending:false}).limit(50),
        supabase.from("deliverables").select("*").order("submitted_at",{ascending:false}).limit(100),
        supabase.from("review_cycles").select("*").order("opened_at",{ascending:false}).limit(50),
        isManager(profile) ? supabase.from("profiles").select("id,full_name,email,role").eq("organization_id",org).eq("active",true).order("full_name") : Promise.resolve({data:[],error:null} as any),
        isManager(profile) ? supabase.from("attendance_sessions").select("*").eq("organization_id",org).order("checked_in_at",{ascending:false}).limit(100) : Promise.resolve({data:[],error:null} as any),
        isManager(profile) ? supabase.from("work_logs").select("*").eq("organization_id",org).order("work_date",{ascending:false}).limit(200) : Promise.resolve({data:[],error:null} as any),
        isManager(profile) ? supabase.from("progress_updates").select("*").eq("organization_id",org).order("created_at",{ascending:false}).limit(100) : Promise.resolve({data:[],error:null} as any)
      ]);
      for(const x of [pr,ta,at,logs,updates,ds,rs,ms,tAt,tLogs,tUpdates]) if(x.error) throw x.error;
      setProjects((pr.data||[]) as Project[]);
      setTasks((ta.data||[]) as Task[]);
      setAttendance((at.data||[]) as Attendance[]);
      setMyLogs(logs.data||[]);
      setProgress(updates.data||[]);
      setDeliveries((ds.data||[]) as Delivery[]);
      setReviews((rs.data||[]) as Review[]);
      setMembers((ms.data||[]) as Member[]);
      setTeamAttendance(tAt.data||[]);
      setTeamWorkLogs(tLogs.data||[]);
      setTeamProgress(tUpdates.data||[]);
      if(isManager(profile) && !selectedEmployee) setSelectedEmployee((ms.data||[]).find((m:any)=>m.role==="employee")?.id || "");
    } catch(e:any) {
      flash("error",e.message||"Could not load portal data.");
    } finally { setBusy(false); }
  },[session,profile,selectedEmployee]);

  useEffect(()=>{
    if(!supabase){setBooting(false);return;}
    supabase.auth.getSession().then(async ({data})=>{
      setSession(data.session);
      if(data.session?.user){
        try{await loadProfile(data.session.user.id);}catch(e:any){flash("error",e.message);}
      }
      setBooting(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{
      setSession(next);
      if(!next){setProfile(null);setBooting(false);}
      else {setTimeout(()=>loadProfile(next.user.id).catch((e:any)=>flash("error",e.message)),0);setBooting(false);}
    });
    return ()=>subscription.unsubscribe();
  },[loadProfile]);

  useEffect(()=>{if(session?.user && profile) refresh();},[session,profile,refresh]);

  const openAttendance=attendance.find(a=>!a.checked_out_at);
  const todaysLogs=myLogs.filter(x=>x.work_date===today());
  const todaysHours=todaysLogs.reduce((s,x)=>s+Number(x.hours),0);
  const myTasks=tasks.filter(t=>t.assigned_to===session?.user?.id);
  const myOpen=myTasks.filter(t=>t.status!=="done");
  const isManagerUser=isManager(profile);
  const visibleDeliveries=isManagerUser?deliveries:deliveries.filter(d=>d.submitted_by===session?.user?.id);
  const visibleReviews=isManagerUser?reviews:reviews.filter(r=>r.employee_id===session?.user?.id);

  const signIn=async(e:FormEvent)=>{
    e.preventDefault(); if(!supabase)return;
    setBusy(true);
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    setBusy(false);
    if(error) flash("error",error.message); else flash("success","Signed in successfully.");
  };
  const signOut=async()=>{await supabase?.auth.signOut();setSession(null);setProfile(null);};
  const run=(fn:()=>Promise<void>)=>async(e:FormEvent)=>{e.preventDefault();setBusy(true);try{await fn();await refresh();}catch(err:any){flash("error",err.message||"Action failed.");}finally{setBusy(false);}};

  const checkIn=run(async()=>{
    const {error}=await supabase!.from("attendance_sessions").insert({organization_id:profile!.organization_id,user_id:profile!.id});
    if(error)throw error;flash("success","Attendance check-in recorded.");
  });
  const checkOut=run(async()=>{
    if(!openAttendance)throw new Error("No open attendance session.");
    const {error}=await supabase!.from("attendance_sessions").update({checked_out_at:new Date().toISOString()}).eq("id",openAttendance.id);
    if(error)throw error;flash("success","Attendance check-out recorded.");
  });
  const saveTaskUpdate=run(async()=>{
    if(!taskEdit) throw new Error("Select a task to update.");
    const {error}=await supabase!.rpc("update_task_progress",{p_task_id:taskEdit.id,p_status:taskEdit.status,p_percent_complete:taskEdit.percent_complete,p_blocker:taskEdit.blocker,p_update_note:taskEdit.update_note});
    if(error)throw error;flash("success","Task tracker updated.");
  });
  const [taskEdit,setTaskEdit]=useState<Task|null>(null);

  const saveWorkLog=run(async()=>{
    const h=Number(logHours); if(!logProject || !logSummary.trim() || !Number.isFinite(h) || h<=0 || h>24)throw new Error("Select a project, enter a summary and provide hours between 0 and 24.");
    const {error}=await supabase!.from("work_logs").insert({organization_id:profile!.organization_id,user_id:profile!.id,project_id:logProject,task_id:logTask||null,work_date:today(),hours:h,summary:logSummary.trim()});
    if(error)throw error;setLogSummary("");flash("success","Work hours logged.");
  });
  const saveDailyUpdate=run(async()=>{
    if(!updateAccomplished.trim())throw new Error("Please enter today's accomplishment.");
    const {error}=await supabase!.from("progress_updates").insert({organization_id:profile!.organization_id,user_id:profile!.id,project_id:updateProject||null,update_date:today(),accomplished:updateAccomplished.trim(),next_steps:updateNext,blockers:updateBlockers});
    if(error)throw error;setUpdateAccomplished("");setUpdateNext("");setUpdateBlockers("");flash("success","Daily update submitted.");
  });
  const saveProject=run(async()=>{
    if(!projectName.trim()||!clientName.trim())throw new Error("Project and client names are required.");
    const {error}=await supabase!.from("projects").insert({organization_id:profile!.organization_id,name:projectName,client_name:clientName,description:projectDesc,created_by:profile!.id});
    if(error)throw error;setProjectName("");setClientName("");setProjectDesc("");flash("success","Project created.");
  });
  const assignTask=run(async()=>{
    if(!taskProject||!taskAssignee||!taskTitle.trim())throw new Error("Task title, project and assignee are required.");
    const {error}=await supabase!.from("tasks").insert({organization_id:profile!.organization_id,project_id:taskProject,assigned_to:taskAssignee,title:taskTitle,priority:taskPriority,due_date:taskDue||null,created_by:profile!.id});
    if(error)throw error;setTaskTitle("");flash("success","Task assigned.");
  });
  const saveRequirement=run(async()=>{
    if(!requirementProject||!requirement.trim())throw new Error("Select project and enter requirement.");
    const {error}=await supabase!.from("project_requirements").insert({organization_id:profile!.organization_id,project_id:requirementProject,requirement,acceptance_criteria:requirementCriteria,created_by:profile!.id});
    if(error)throw error;setRequirement("");setRequirementCriteria("");flash("success","Requirement added.");
  });
  const submitDeliverable=run(async()=>{
    if(!deliveryProject||!deliveryTitle.trim()||!/^https?:\/\//i.test(deliveryUrl))throw new Error("Select a project, title and valid http(s) URL.");
    const {error}=await supabase!.from("deliverables").insert({organization_id:profile!.organization_id,project_id:deliveryProject,task_id:deliveryTask||null,title:deliveryTitle,url:deliveryUrl,description:deliveryDesc,submitted_by:profile!.id});
    if(error)throw error;setDeliveryTitle("");setDeliveryUrl("");setDeliveryDesc("");flash("success","Deliverable submitted for manager review.");
  });
  const reviewDecision=async(d:Delivery,status:"approved"|"changes_requested")=>{
    const feedback=window.prompt(status==="approved"?"Optional approval note":"Describe the changes requested"); if(status==="changes_requested"&&!feedback?.trim())return;
    const {error}=await supabase!.from("deliverables").update({status,manager_feedback:feedback||"",reviewed_by:profile!.id,reviewed_at:new Date().toISOString()}).eq("id",d.id);
    if(error)flash("error",error.message);else{flash("success","Deliverable review saved.");refresh();}
  };
  const createReview=run(async()=>{
    if(!reviewEmployee||!reviewPurpose.trim())throw new Error("Select an employee and write the review purpose.");
    const {error}=await supabase!.from("review_cycles").insert({organization_id:profile!.organization_id,employee_id:reviewEmployee,initiated_by:profile!.id,title:reviewTitle,purpose:reviewPurpose,evidence_summary:reviewEvidence,due_date:reviewDue||null});
    if(error)throw error;setReviewPurpose("");setReviewEvidence("");flash("success","Human-led review cycle opened. Employee can respond.");
  });
  const closeReview=async(r:Review)=>{
    if(!window.confirm("Close this review cycle? The employee response and evidence will remain in the record."))return;
    const {error}=await supabase!.from("review_cycles").update({status:"closed",closed_at:new Date().toISOString()}).eq("id",r.id);
    if(error)flash("error",error.message);else{flash("success","Review cycle closed.");refresh();}
  };
  const employeeResponse=async(r:Review)=>{
    const response=window.prompt("Add your response or context for the review cycle"); if(!response?.trim())return;
    const {error}=await supabase!.from("review_cycles").update({employee_response:response,status:"employee_response"}).eq("id",r.id);
    if(error)flash("error",error.message);else{flash("success","Your response was saved.");refresh();}
  };

  const runReport=async()=>{
    if(!supabase)return;
    setBusy(true);setReport(null);
    try{
      const day=today();
      const result=await runDailyReportingAgent(supabase,{date:day,employeeId:isManagerUser?(selectedEmployee||undefined):undefined});
      setReport(result);flash("success","Read-only reporting agent completed its workflow.");
    }catch(e:any){flash("error",e.message||"Report generation failed.");}
    finally{setBusy(false);}
  };

  const taskProjectName=(id:string)=>projects.find(p=>p.id===id)?.name||"Project";
  const tabs=[
    {id:"dashboard",label:"Overview",icon:LayoutDashboard},
    {id:"mywork",label:"My work",icon:ClipboardList},
    {id:"attendance",label:"Attendance & hours",icon:Clock3},
    {id:"projects",label:"Projects & requirements",icon:BriefcaseBusiness},
    {id:"deliverables",label:"Deliverables",icon:FileCheck2},
    {id:"reports",label:"Daily reports",icon:BarChart3},
    ...(isManagerUser?[{id:"manager",label:"Manager console",icon:Users}]:[])
  ];

  if(!supabaseConfigured || !supabase){
    return <div className="setup-screen"><div className="login-card"><div className="brand-icon"><ShieldCheck/></div><h1>WorkLedger</h1><p>Employee operations and project delivery portal</p><div className="alert warning">The portal frontend is deployed, but its Supabase backend is not configured yet.</div><h3>Administrator setup required</h3><ol><li>Create a Supabase project.</li><li>Apply <code>supabase/migrations/0001_initial_schema.sql</code>.</li><li>Invite your first administrator and complete the bootstrap instructions.</li><li>Set the Supabase URL and publishable key in GitHub Actions secrets, then redeploy.</li></ol><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase Dashboard ↗</a><p className="muted small">No credentials are embedded in this source code. Never place a Supabase secret/service-role key in this frontend.</p></div></div>;
  }
  if(booting)return <div className="setup-screen"><div className="spinner"/></div>;
  if(!session)return <div className="setup-screen"><div className="login-card"><div className="brand-icon"><ShieldCheck/></div><p className="eyebrow">EMPLOYEE OPERATIONS</p><h1>Welcome back</h1><p>Sign in to access attendance, project trackers and deliverables.</p><form onSubmit={signIn} className="stack"><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></label><button className="primary" disabled={busy}>{busy?"Signing in…":"Sign in securely"}</button></form><p className="muted small">Accounts are invitation-only. Contact your organisation administrator if you need access.</p>{notice&&<div className={`alert ${notice.kind}`}>{notice.text}</div>}</div></div>;
  if(!profile)return <div className="setup-screen"><div className="login-card"><div className="brand-icon"><ShieldCheck/></div><h1>Account setup pending</h1><p>Your login exists, but an administrator has not assigned your organisation and role. No business data is accessible until the profile is provisioned.</p><button onClick={signOut} className="secondary">Sign out</button></div></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon small-icon"><ShieldCheck/></div><div><b>WorkLedger</b><span>WORK & DELIVERY OS</span></div></div>
      <div className="org-label">WORKSPACE</div>
      <nav>{tabs.map(t=><button key={t.id} className={tab===t.id?"nav active":"nav"} onClick={()=>setTab(t.id)}><t.icon size={17}/>{t.label}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user-mini"><div className="avatar">{profile.full_name.slice(0,1).toUpperCase()}</div><div><b>{profile.full_name}</b><span>{profile.role}</span></div></div><button className="nav signout" onClick={signOut}><LogOut size={16}/>Sign out</button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><p className="eyebrow">{new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p><h2>{tabs.find(t=>t.id===tab)?.label||"Overview"}</h2></div><div className="top-actions"><span className="role-pill">{profile.role}</span><button className="icon-button" onClick={refresh} title="Refresh data"><RefreshCw size={17}/></button></div></header>
      {notice&&<div className={`toast ${notice.kind}`} onClick={()=>setNotice(null)}>{notice.text}<XCircle size={16}/></div>}
      {tab==="dashboard"&&<section className="content">
        <div className="welcome"><div><h1>Good day, {profile.full_name.split(" ")[0]}.</h1><p>Here is your operational snapshot. Record your work as it happens; managers see delivery status and submitted evidence.</p></div><span className="welcome-icon"><Activity size={28}/></span></div>
        <div className="metric-grid"><Metric icon={<AlarmClock/>} label="Attendance" value={openAttendance?"Checked in":"Not checked in"} hint={openAttendance?`Since ${dateTime(openAttendance.checked_in_at)}`:"Today's session"}/><Metric icon={<Clock3/>} label="Hours logged today" value={hoursLabel(todaysHours)} hint="Submitted work logs"/><Metric icon={<ClipboardList/>} label="Open tasks" value={String(myOpen.length)} hint={`${myTasks.filter(t=>t.status==="done").length} completed`}/><Metric icon={<FileCheck2/>} label="Deliverables" value={String(visibleDeliveries.length)} hint="Your submissions"/></div>
        <div className="two-col"><div className="panel"><PanelTitle title="Quick actions" subtitle="Keep your project record current"/><div className="quick-grid"><Quick title="Check in / out" subtitle="Attendance session" onClick={()=>setTab("attendance")}/><Quick title="Update task tracker" subtitle="Progress and blockers" onClick={()=>setTab("mywork")}/><Quick title="Log working hours" subtitle="Time against a task" onClick={()=>setTab("attendance")}/><Quick title="Submit deliverable" subtitle="Send work for review" onClick={()=>setTab("deliverables")}/></div></div><div className="panel"><PanelTitle title="Today's work" subtitle="Recorded time and focus"/><div className="big-number">{hoursLabel(todaysHours)}</div><p className="muted">Across {todaysLogs.length} time entries</p><div className="divider"/><p><b>{myOpen.length}</b> tasks still open</p><p><b>{myTasks.filter(t=>t.status==="blocked").length}</b> work items currently blocked</p></div></div>
        <div className="panel"><PanelTitle title="My tasks" subtitle="Current assigned work"/><TaskList tasks={myTasks.slice(0,6)} projects={projects} onOpen={t=>{setTaskEdit(t);setTab("mywork");}}/></div>
        <div className="panel"><PanelTitle title="Projects" subtitle="Organisation project workspace"/><ProjectCards projects={projects}/></div>
      </section>}
      {tab==="mywork"&&<section className="content"><div className="section-intro"><h1>My work tracker</h1><p>Update status, percent complete and blockers. Changes are saved with a timestamp.</p></div><div className="panel"><PanelTitle title="Assigned tasks" subtitle="Your tasks and their due dates"/><TaskList tasks={myTasks} projects={projects} onOpen={setTaskEdit}/></div>
        {taskEdit&&<div className="panel form-panel"><PanelTitle title={`Update: ${taskEdit.title}`} subtitle={taskProjectName(taskEdit.project_id)}/><form className="form-grid" onSubmit={saveTaskUpdate}><label>Status<select value={taskEdit.status} onChange={e=>setTaskEdit({...taskEdit,status:e.target.value})}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option></select></label><label>Progress (%)<input type="number" min="0" max="100" value={taskEdit.percent_complete} onChange={e=>setTaskEdit({...taskEdit,percent_complete:Number(e.target.value)})}/></label><label className="wide">Latest update<textarea value={taskEdit.update_note} onChange={e=>setTaskEdit({...taskEdit,update_note:e.target.value})} placeholder="What changed since your last update?"/></label><label className="wide">Blocker / dependency<textarea value={taskEdit.blocker} onChange={e=>setTaskEdit({...taskEdit,blocker:e.target.value})} placeholder="Describe blocker, or leave blank"/></label><div className="form-actions wide"><button className="secondary" type="button" onClick={()=>setTaskEdit(null)}>Cancel</button><button className="primary" disabled={busy}>Save progress</button></div></form></div>}</section>}
      {tab==="attendance"&&<section className="content"><div className="section-intro"><h1>Attendance & time logs</h1><p>Record a work session and log time against a project/task. Time entries are self-reported.</p></div><div className="two-col"><div className="panel attendance-card"><PanelTitle title="Attendance session" subtitle="One open session per employee"/><div className="attendance-state"><span className={openAttendance?"status-dot green":"status-dot"}/><b>{openAttendance?"You are checked in":"You are checked out"}</b></div><p className="muted">{openAttendance?`Started ${dateTime(openAttendance.checked_in_at)}`:"Start your session when you begin work."}</p>{openAttendance?<button className="primary" onClick={e=>checkOut(e as any)} disabled={busy}>Check out</button>:<button className="primary" onClick={e=>checkIn(e as any)} disabled={busy}>Check in</button>}</div><div className="panel"><PanelTitle title="Today's hours" subtitle="From saved work logs"/><div className="big-number">{hoursLabel(todaysHours)}</div><p className="muted">{todaysLogs.length} entries recorded today</p></div></div>
        <div className="panel form-panel"><PanelTitle title="Log work hours" subtitle="Record time against a deliverable or task"/><form className="form-grid" onSubmit={saveWorkLog}><label>Project<select value={logProject} onChange={e=>{setLogProject(e.target.value);setLogTask("");}} required><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Task<select value={logTask} onChange={e=>setLogTask(e.target.value)}><option value="">No task linked</option>{myTasks.filter(t=>!logProject||t.project_id===logProject).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label>Hours<input type="number" step="0.25" min="0.25" max="24" value={logHours} onChange={e=>setLogHours(e.target.value)} required/></label><label className="wide">Work summary<textarea value={logSummary} onChange={e=>setLogSummary(e.target.value)} placeholder="Describe the work performed" required/></label><div className="form-actions wide"><button className="primary" disabled={busy}>Save time entry</button></div></form></div>
        <div className="panel"><PanelTitle title="Recent time entries" subtitle="Your submitted records"/><div className="table-wrap"><table><thead><tr><th>Date</th><th>Project</th><th>Hours</th><th>Work summary</th></tr></thead><tbody>{myLogs.slice(0,20).map(x=><tr key={x.id}><td>{x.work_date}</td><td>{taskProjectName(x.project_id)}</td><td>{hoursLabel(Number(x.hours))}</td><td>{x.summary}</td></tr>)}</tbody></table></div></div>
        <div className="panel form-panel"><PanelTitle title="Daily update" subtitle="Accomplishments, next steps and blockers"/><form className="form-grid" onSubmit={saveDailyUpdate}><label>Project<select value={updateProject} onChange={e=>setUpdateProject(e.target.value)}><option value="">General update</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="wide">Completed today<textarea value={updateAccomplished} onChange={e=>setUpdateAccomplished(e.target.value)} required placeholder="Tasks completed, progress and outcomes"/></label><label className="wide">Next steps<textarea value={updateNext} onChange={e=>setUpdateNext(e.target.value)}/></label><label className="wide">Blockers / help required<textarea value={updateBlockers} onChange={e=>setUpdateBlockers(e.target.value)}/></label><div className="form-actions wide"><button className="primary" disabled={busy}>Submit daily update</button></div></form></div>
        <div className="panel"><PanelTitle title="Recent daily updates"/>{progress.slice(0,10).map(x=><div className="update-item" key={x.id}><b>{x.update_date} · {x.project_id?taskProjectName(x.project_id):"General"}</b><p>{x.accomplished}</p>{x.next_steps&&<p className="muted">Next: {x.next_steps}</p>}{x.blockers&&<p className="text-warning">Blocker: {x.blockers}</p>}</div>)}</div>
      </section>}
      {tab==="projects"&&<section className="content"><div className="section-intro"><h1>Projects & client requirements</h1><p>Project scope, acceptance criteria, owners and delivery status.</p></div><ProjectCards projects={projects}/><div className="panel"><PanelTitle title="Requirements" subtitle="Client requirements are tracked as explicit acceptance criteria"/>{projects.map(p=><div className="requirement-project" key={p.id}><h3>{p.name} <span className="muted">· {p.client_name}</span></h3><RequirementList projectId={p.id}/></div>)}</div>{isManagerUser&&<><div className="panel form-panel"><PanelTitle title="Create project" subtitle="Manager/admin only"/><form className="form-grid" onSubmit={saveProject}><label>Project name<input value={projectName} onChange={e=>setProjectName(e.target.value)} required/></label><label>Client name<input value={clientName} onChange={e=>setClientName(e.target.value)} required/></label><label className="wide">Project description<textarea value={projectDesc} onChange={e=>setProjectDesc(e.target.value)}/></label><div className="form-actions wide"><button className="primary" disabled={busy}>Create project</button></div></form></div><div className="panel form-panel"><PanelTitle title="Add client requirement"/><form className="form-grid" onSubmit={saveRequirement}><label>Project<select value={requirementProject} onChange={e=>setRequirementProject(e.target.value)} required><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="wide">Requirement<input value={requirement} onChange={e=>setRequirement(e.target.value)} required/></label><label className="wide">Acceptance criteria<textarea value={requirementCriteria} onChange={e=>setRequirementCriteria(e.target.value)}/></label><div className="form-actions wide"><button className="primary" disabled={busy}>Add requirement</button></div></form></div></>}</section>}
      {tab==="deliverables"&&<section className="content"><div className="section-intro"><h1>Deliverables & reviews</h1><p>Employees submit a link and description. Managers approve or request specific changes.</p></div><div className="panel form-panel"><PanelTitle title="Submit a deliverable"/><form className="form-grid" onSubmit={submitDeliverable}><label>Project<select value={deliveryProject} onChange={e=>{setDeliveryProject(e.target.value);setDeliveryTask("");}} required><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Related task<select value={deliveryTask} onChange={e=>setDeliveryTask(e.target.value)}><option value="">No linked task</option>{myTasks.filter(t=>!deliveryProject||t.project_id===deliveryProject).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label className="wide">Deliverable title<input value={deliveryTitle} onChange={e=>setDeliveryTitle(e.target.value)} required/></label><label className="wide">Link (Drive/GitHub/document)<input type="url" value={deliveryUrl} onChange={e=>setDeliveryUrl(e.target.value)} required placeholder="https://..."/></label><label className="wide">Description<textarea value={deliveryDesc} onChange={e=>setDeliveryDesc(e.target.value)}/></label><div className="form-actions wide"><button className="primary" disabled={busy}>Submit for review</button></div></form></div><div className="panel"><PanelTitle title="Submitted deliverables"/>{visibleDeliveries.map(d=><div className="delivery-row" key={d.id}><div className="grow"><b>{d.title}</b><p className="muted">{taskProjectName(d.project_id)} · {dateTime(d.submitted_at)}</p><a href={d.url} target="_blank" rel="noreferrer">Open deliverable <ArrowUpRight size={13}/></a>{d.manager_feedback&&<p className="text-warning">Manager feedback: {d.manager_feedback}</p>}</div><StatusPill value={d.status}/>{isManagerUser&&d.status==="submitted"&&<div className="action-row"><button className="tiny success" onClick={()=>reviewDecision(d,"approved")}>Approve</button><button className="tiny danger" onClick={()=>reviewDecision(d,"changes_requested")}>Request changes</button></div>}</div>)}</div></section>}
      {tab==="reports"&&<section className="content"><div className="section-intro"><h1>Daily operational reporting</h1><p>A read-only reporting agent gathers attendance, work logs, task states, progress and deliverables through an allow-listed set of data tools.</p></div>{isManagerUser&&<div className="panel form-panel"><label>Employee for report<select value={selectedEmployee} onChange={e=>setSelectedEmployee(e.target.value)}><option value="">All organisation summary not enabled; select one employee</option>{members.filter(m=>m.role==="employee").map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label></div>}<div className="panel report-callout"><div><b>Generate today's report</b><p className="muted">The reporting agent only reads authorised records. It never changes data or makes personnel decisions.</p></div><button className="primary" onClick={runReport} disabled={busy|| (isManagerUser&&!selectedEmployee)}>{busy?"Generating…":"Run reporting agent"}</button></div>{report&&<div className="panel"><PanelTitle title="Report summary" subtitle={`Generated ${dateTime(report.generatedAt)}`}/><div className="metric-grid">{Object.entries(report.summary).map(([k,v])=><Metric key={k} label={k.replace(/([A-Z])/g," $1")} value={String(v)} />)}</div><h3>Project progress</h3>{report.projectProgress.map((p:any)=><div className="progress-row" key={p.project}><div><b>{p.project}</b><span>{p.client} · {p.taskCount} tasks</span></div><b>{p.progress}%</b><div className="progress-track"><span style={{width:`${p.progress}%`}}/></div></div>)}<h3>Work-item alerts for manager review</h3>{report.alerts.map((x:any,i:number)=><div className="alert-item" key={i}><CircleAlert size={16}/><div><b>{x.type.replace(/_/g," ")}</b><p>{x.title} · {x.reason}</p></div></div>)}<p className="muted small">{report.note}</p><button className="secondary" onClick={()=>{const blob=new Blob([JSON.stringify(report,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="daily-operations-report.json";a.click();URL.revokeObjectURL(url);}}>Download report JSON</button></div>}</section>}
      {tab==="manager"&&isManagerUser&&<section className="content"><div className="section-intro"><h1>Manager console</h1><p>Review project delivery evidence and open human-led review cycles with documented context and employee response.</p></div><div className="metric-grid"><Metric icon={<Users/>} label="Active employees" value={String(members.filter(m=>m.role==="employee").length)}/><Metric icon={<BriefcaseBusiness/>} label="Projects" value={String(projects.length)}/><Metric icon={<CircleAlert/>} label="Blocked work items" value={String(tasks.filter(t=>t.status==="blocked").length)}/><Metric icon={<FileCheck2/>} label="Pending deliverables" value={String(deliveries.filter(d=>d.status==="submitted").length)}/></div><div className="panel"><PanelTitle title="Team attendance" subtitle="Recorded check-in/check-out sessions; verify exceptions before taking action"/><div className="table-wrap"><table><thead><tr><th>Employee</th><th>Check-in</th><th>Check-out</th><th>Elapsed</th></tr></thead><tbody>{teamAttendance.slice(0,25).map(a=><tr key={a.id}><td>{members.find(m=>m.id===a.user_id)?.full_name||"Employee"}</td><td>{dateTime(a.checked_in_at)}</td><td>{dateTime(a.checked_out_at)}</td><td>{a.checked_out_at?hoursLabel(Math.max(0,(new Date(a.checked_out_at).getTime()-new Date(a.checked_in_at).getTime())/3600000)):"Session open"}</td></tr>)}</tbody></table></div></div><div className="panel"><PanelTitle title="Recent daily updates" subtitle="Employee-reported accomplishments and blockers"/>{teamProgress.slice(0,15).map(u=><div className="update-item" key={u.id}><b>{members.find(m=>m.id===u.user_id)?.full_name||"Employee"} · {u.update_date}</b><p>{u.accomplished}</p>{u.next_steps&&<p className="muted">Next: {u.next_steps}</p>}{u.blockers&&<p className="text-warning">Blocker: {u.blockers}</p>}</div>)}</div><div className="panel"><PanelTitle title="Recent team work logs" subtitle="Self-reported hours linked to tasks and projects"/><div className="table-wrap"><table><thead><tr><th>Employee</th><th>Date</th><th>Project</th><th>Hours</th><th>Summary</th></tr></thead><tbody>{teamWorkLogs.slice(0,30).map(w=><tr key={w.id}><td>{members.find(m=>m.id===w.user_id)?.full_name||"Employee"}</td><td>{w.work_date}</td><td>{taskProjectName(w.project_id)}</td><td>{hoursLabel(Number(w.hours))}</td><td>{w.summary}</td></tr>)}</tbody></table></div></div><div className="panel"><PanelTitle title="Team work-item exceptions" subtitle="Operational signals only; not employee performance ratings"/>{tasks.filter(t=>t.status==="blocked"||(t.due_date&&t.due_date<today()&&t.status!=="done")).map(t=><div className="delivery-row" key={t.id}><div className="grow"><b>{t.title}</b><p className="muted">{members.find(m=>m.id===t.assigned_to)?.full_name||"Assigned employee"} · {taskProjectName(t.project_id)}</p><p className="text-warning">{t.status==="blocked"?t.blocker||"Blocked status reported":`Overdue since ${t.due_date}`}</p></div><StatusPill value={t.status}/></div>)}{!tasks.some(t=>t.status==="blocked"||(t.due_date&&t.due_date<today()&&t.status!=="done"))&&<p className="muted">No blocked or overdue work items currently recorded.</p>}</div><div className="panel form-panel"><PanelTitle title="Create task" subtitle="Assign work to an employee"/><form className="form-grid" onSubmit={assignTask}><label className="wide">Task title<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} required/></label><label>Project<select value={taskProject} onChange={e=>setTaskProject(e.target.value)} required><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Assignee<select value={taskAssignee} onChange={e=>setTaskAssignee(e.target.value)} required><option value="">Select employee</option>{members.filter(m=>m.role==="employee").map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label><label>Priority<select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label><label>Due date<input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)}/></label><div className="form-actions wide"><button className="primary" disabled={busy}>Assign task</button></div></form></div><div className="panel form-panel"><PanelTitle title="Open human-led review cycle" subtitle="Manager initiated; employee is invited to add context and respond"/><form className="form-grid" onSubmit={createReview}><label>Employee<select value={reviewEmployee} onChange={e=>setReviewEmployee(e.target.value)} required><option value="">Select employee</option>{members.filter(m=>m.role==="employee").map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label><label>Due date<input type="date" value={reviewDue} onChange={e=>setReviewDue(e.target.value)}/></label><label className="wide">Review cycle title<input value={reviewTitle} onChange={e=>setReviewTitle(e.target.value)}/></label><label className="wide">Purpose / support required<textarea value={reviewPurpose} onChange={e=>setReviewPurpose(e.target.value)} required placeholder="Describe objective work context, expected outcome, support and review scope."/></label><label className="wide">Evidence and context<textarea value={reviewEvidence} onChange={e=>setReviewEvidence(e.target.value)} placeholder="Reference specific deliverables, blockers, agreed goals, dependencies and dates. Avoid unsupported judgements."/></label><div className="form-actions wide"><button className="primary" disabled={busy}>Open review cycle</button></div></form></div><div className="panel"><PanelTitle title="Review cycles" subtitle="Employee response remains part of the record"/>{reviews.map(r=><div className="delivery-row" key={r.id}><div className="grow"><b>{r.title}</b><p className="muted">{members.find(m=>m.id===r.employee_id)?.full_name||"Employee"} · {r.status}</p><p>{r.purpose}</p>{r.employee_response&&<p className="muted">Employee response: {r.employee_response}</p>}</div><StatusPill value={r.status}/>{r.status!=="closed"&&<button className="tiny secondary" onClick={()=>closeReview(r)}>Close cycle</button>}</div>)}</div><div className="panel"><PanelTitle title="Employee work reports" subtitle="Generate an employee-specific report in Daily reports; reports are operational context, not performance scores."/><button className="secondary" onClick={()=>setTab("reports")}>Open reporting workspace</button></div></section>}
      <footer className="footer">WorkLedger · Operational reporting is not employee scoring. Managers remain accountable for review decisions.</footer>
    </main>
  </div>;
}

function Metric({icon,label,value,hint}:{icon?:ReactNode;label:string;value:string;hint?:string}){return <div className="metric-card">{icon&&<span className="metric-icon">{icon}</span>}<span className="metric-label">{label}</span><strong>{value}</strong>{hint&&<span className="muted small">{hint}</span>}</div>}
function PanelTitle({title,subtitle}:{title:string;subtitle?:string}){return <div className="panel-title"><div><h3>{title}</h3>{subtitle&&<p className="muted">{subtitle}</p>}</div></div>}
function Quick({title,subtitle,onClick}:{title:string;subtitle:string;onClick:()=>void}){return <button className="quick-link" onClick={onClick}><span><b>{title}</b><small>{subtitle}</small></span><ArrowUpRight size={16}/></button>}
function StatusPill({value}:{value:string}){const cls=["approved","done","completed","met","closed"].includes(value)?"good":["blocked","changes_requested"].includes(value)?"bad":["in_progress","in_review","employee_response"].includes(value)?"info":"neutral";return <span className={`status-pill ${cls}`}>{value.replace(/_/g," ")}</span>}
function TaskList({tasks,projects,onOpen}:{tasks:Task[];projects:Project[];onOpen:(t:Task)=>void}){if(!tasks.length)return <p className="muted">No tasks assigned yet.</p>;return <div className="task-list">{tasks.map(t=><div className="task-row" key={t.id}><div className="grow"><b>{t.title}</b><p className="muted">{projects.find(p=>p.id===t.project_id)?.name||"Project"} · Due {t.due_date||"not set"}</p><div className="progress-track"><span style={{width:`${t.percent_complete}%`}}/></div></div><StatusPill value={t.status}/><button className="tiny secondary" onClick={()=>onOpen(t)}>Update</button></div>)}</div>}
function ProjectCards({projects}:{projects:Project[]}){return <div className="project-grid">{projects.map(p=><div className="project-card" key={p.id}><div className="project-icon"><BriefcaseBusiness/></div><b>{p.name}</b><span>{p.client_name}</span><StatusPill value={p.status}/></div>)}</div>}
function RequirementList({projectId}:{projectId:string}){const [rows,setRows]=useState<any[]>([]);useEffect(()=>{supabase?.from("project_requirements").select("*").eq("project_id",projectId).order("created_at",{ascending:false}).then(({data})=>setRows(data||[]));},[projectId]);return rows.length?<div className="requirement-list">{rows.map(r=><div key={r.id}><b>{r.requirement}</b><p className="muted">{r.acceptance_criteria}</p><StatusPill value={r.status}/></div>)}</div>:<p className="muted">No requirements recorded.</p>}
