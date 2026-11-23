import type { SupabaseClient } from "@supabase/supabase-js";

export type ReportToolResult = {
  attendance: any[];
  tasks: any[];
  workLogs: any[];
  deliverables: any[];
  progressUpdates: any[];
  projects: any[];
  alerts: any[];
};

type ReportArgs = { date: string; employeeId?: string };

function hoursBetween(start: string, end: string) {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 3600000);
}

/**
 * Read-only multi-step reporting agent.
 * Each tool is allow-listed and uses the caller's RLS-scoped Supabase client.
 * It cannot change a task, approve a deliverable, create a review, or assess employees.
 */
export async function runDailyReportingAgent(
  db: SupabaseClient,
  args: ReportArgs
) {
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) throw new Error("Please sign in again.");

  const { data: profile, error: profileError } = await db
    .from("profiles").select("id, organization_id, role, full_name")
    .eq("id", auth.user.id).single();
  if (profileError || !profile?.organization_id) throw new Error("Your account is not assigned to an organisation. Contact your administrator.");

  const selectedUser = args.employeeId || auth.user.id;
  if (selectedUser !== auth.user.id && !["manager", "admin"].includes(profile.role)) {
    throw new Error("Employees can only generate reports for their own account.");
  }

  const tools = {
    attendance: async () => {
      const { data, error } = await db.from("attendance_sessions")
        .select("id, user_id, checked_in_at, checked_out_at")
        .eq("user_id", selectedUser)
        .gte("checked_in_at", args.date + "T00:00:00")
        .lt("checked_in_at", args.date + "T23:59:59.999");
      if (error) throw error;
      return data || [];
    },
    tasks: async () => {
      const { data, error } = await db.from("tasks")
        .select("id, project_id, title, status, percent_complete, due_date, blocker, update_note, updated_at")
        .eq("assigned_to", selectedUser);
      if (error) throw error;
      return data || [];
    },
    workLogs: async () => {
      const { data, error } = await db.from("work_logs")
        .select("id, task_id, project_id, work_date, hours, summary")
        .eq("user_id", selectedUser).eq("work_date", args.date);
      if (error) throw error;
      return data || [];
    },
    deliverables: async () => {
      const { data, error } = await db.from("deliverables")
        .select("id, task_id, title, url, status, submitted_at, manager_feedback")
        .eq("submitted_by", selectedUser);
      if (error) throw error;
      return data || [];
    },
    progressUpdates: async () => {
      const { data, error } = await db.from("progress_updates")
        .select("id, project_id, update_date, accomplished, next_steps, blockers, created_at")
        .eq("user_id", selectedUser).eq("update_date", args.date);
      if (error) throw error;
      return data || [];
    },
    projects: async () => {
      const { data, error } = await db.from("projects")
        .select("id, name, client_name, status")
        .eq("organization_id", profile.organization_id);
      if (error) throw error;
      return data || [];
    }
  };

  // Agent plan: execute its fixed, read-only tools; no model-generated SQL or actions.
  const [attendance, tasks, workLogs, deliverables, progressUpdates, projects] = await Promise.all([
    tools.attendance(), tools.tasks(), tools.workLogs(), tools.deliverables(), tools.progressUpdates(), tools.projects()
  ]);

  const projectById = new Map(projects.map(p => [p.id, p]));
  const taskById = new Map(tasks.map(t => [t.id, t]));
  const totalHours = workLogs.reduce((sum, x) => sum + Number(x.hours || 0), 0);
  const completed = tasks.filter(t => t.status === "done");
  const blocked = tasks.filter(t => t.status === "blocked");
  const open = tasks.filter(t => t.status !== "done");
  const overdue = tasks.filter(t => t.status !== "done" && t.due_date && t.due_date < args.date);
  const submittedToday = deliverables.filter(d => String(d.submitted_at || "").startsWith(args.date));
  const projectProgress = projects.map(project => {
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    return {
      project: project.name, client: project.client_name,
      taskCount: projectTasks.length,
      progress: projectTasks.length
        ? Math.round(projectTasks.reduce((s, t) => s + Number(t.percent_complete || 0), 0) / projectTasks.length)
        : 0
    };
  }).filter(p => p.taskCount > 0);

  const alerts = [
    ...blocked.map(t => ({ type: "BLOCKED_WORK_ITEM", taskId: t.id, title: t.title, reason: t.blocker || "Blocker not described" })),
    ...overdue.map(t => ({ type: "OVERDUE_WORK_ITEM", taskId: t.id, title: t.title, reason: "Due date has passed; manager to review dependency and scope." })),
    ...tasks.filter(t => t.status !== "done" && !t.update_note).map(t => ({ type: "MISSING_TASK_UPDATE", taskId: t.id, title: t.title, reason: "No latest progress note recorded." }))
  ];

  const attendanceHours = attendance.reduce((sum, x) =>
    sum + (x.checked_out_at ? hoursBetween(x.checked_in_at, x.checked_out_at) : 0), 0);

  const toolResults: ReportToolResult = { attendance, tasks, workLogs, deliverables, progressUpdates, projects, alerts };

  return {
    reportType: "Daily operational report",
    date: args.date,
    generatedAt: new Date().toISOString(),
    subjectUserId: selectedUser,
    generatedBy: auth.user.id,
    dataSources: Object.keys(tools),
    summary: {
      attendanceSessions: attendance.length,
      closedAttendanceHours: Number(attendanceHours.toFixed(2)),
      workLogHours: Number(totalHours.toFixed(2)),
      taskCount: tasks.length,
      completedTasks: completed.length,
      openTasks: open.length,
      blockedWorkItems: blocked.length,
      overdueWorkItems: overdue.length,
      deliverablesSubmittedToday: submittedToday.length,
      dailyUpdatesSubmitted: progressUpdates.length,
      workItemAlerts: alerts.length
    },
    projectProgress,
    completedTaskTitles: completed.map(t => t.title),
    openTaskTitles: open.map(t => t.title),
    workLogEntries: workLogs,
    deliverablesSubmittedToday: submittedToday,
    dailyUpdatesSubmitted: progressUpdates,
    alerts,
    note: "Operational summary only. Alerts are attached to work items, not employee performance. No performance score, ranking, disciplinary suggestion or automated review decision is generated.",
    rawToolResults: toolResults
  };
}
