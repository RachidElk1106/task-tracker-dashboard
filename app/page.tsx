'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpDown,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  ClipboardList,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type Status = 'Completed' | 'Pending' | 'In Review'
type SortKey = 'title' | 'project' | 'assignee' | 'due' | 'status' | 'priority'
type SortDir = 'asc' | 'desc'

type Task = {
  id: string
  title: string
  project: string
  assignee: string
  initials: string
  due: string
  status: Status
  priority: 'High' | 'Medium' | 'Low'
}

const initialTasks: Task[] = [
  { id: '1', title: 'Finalize homepage wireframes', project: 'Website Redesign', assignee: 'Olivia Martin', initials: 'OM', due: 'Today', status: 'In Review', priority: 'High' },
  { id: '2', title: 'Set up analytics events', project: 'Growth Dashboard', assignee: 'Ethan Lee', initials: 'EL', due: 'Sep 28', status: 'Pending', priority: 'Medium' },
  { id: '3', title: 'Review brand illustrations', project: 'Brand Refresh', assignee: 'Sophia Turner', initials: 'ST', due: 'Sep 29', status: 'Completed', priority: 'Low' },
  { id: '4', title: 'Write onboarding email sequence', project: 'Launch Campaign', assignee: 'Noah Williams', initials: 'NW', due: 'Oct 02', status: 'Pending', priority: 'High' },
  { id: '5', title: 'QA mobile navigation', project: 'Website Redesign', assignee: 'Mia Anderson', initials: 'MA', due: 'Oct 04', status: 'Completed', priority: 'Medium' },
  { id: '6', title: 'Prepare sprint retrospective', project: 'Internal Operations', assignee: 'Liam Davis', initials: 'LD', due: 'Oct 06', status: 'In Review', priority: 'Low' },
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'My Tasks', icon: ClipboardList },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Team', icon: Users },
]

const statusStyles: Record<Status, string> = {
  Completed: 'status-completed',
  Pending: 'status-pending',
  'In Review': 'status-review',
}

const statusOrder: Record<Status, number> = { Pending: 0, 'In Review': 1, Completed: 2 }
const priorityOrder: Record<'High' | 'Medium' | 'Low', number> = { High: 0, Medium: 1, Low: 2 }
const statusCycle: Status[] = ['Pending', 'In Review', 'Completed']

const projects = ['Website Redesign', 'Growth Dashboard', 'Brand Refresh', 'Launch Campaign', 'Internal Operations']

const sortableColumns: { key: SortKey; label: string }[] = [
  { key: 'title', label: 'Task' },
  { key: 'project', label: 'Project' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'due', label: 'Due date' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function parseDue(due: string): number {
  if (due.toLowerCase() === 'today') return 0
  const match = due.match(/^(\w{3})\s+(\d{1,2})$/)
  if (!match) return Infinity
  const [, m, d] = match
  const baseYear = new Date().getFullYear()
  const date = new Date(`${m} ${d}, ${baseYear}`)
  return date.getTime()
}

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filter, setFilter] = useState<'All' | Status>('All')
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newProject, setNewProject] = useState(projects[0])
  const [newAssignee, setNewAssignee] = useState('Jamie Davis')
  const [newDue, setNewDue] = useState('Today')
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editProject, setEditProject] = useState(projects[0])
  const [editAssignee, setEditAssignee] = useState('')
  const [editDue, setEditDue] = useState('')
  const [editStatus, setEditStatus] = useState<Status>('Pending')
  const [editPriority, setEditPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')

  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    if (!openMenuId) return
    function handleDocClick() { setOpenMenuId(null) }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [openMenuId])

  function toggleMenu(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setOpenMenuId((prev) => (prev === id ? null : id))
  }

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'Completed').length
    const inReview = tasks.filter((t) => t.status === 'In Review').length
    const pending = tasks.filter((t) => t.status === 'Pending').length
    const inProgress = inReview + pending
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, inProgress, pending, inReview, completionRate }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const matchesStatus = filter === 'All' || task.status === filter
      const query = search.toLowerCase()
      return matchesStatus && (!query || `${task.title} ${task.project} ${task.assignee}`.toLowerCase().includes(query))
    })
    if (!sortKey) return result
    const dir = sortDir === 'asc' ? 1 : -1
    return [...result].sort((a, b) => {
      let av: number | string
      let bv: number | string
      switch (sortKey) {
        case 'due':
          av = parseDue(a.due); bv = parseDue(b.due); break
        case 'status':
          av = statusOrder[a.status]; bv = statusOrder[b.status]; break
        case 'priority':
          av = priorityOrder[a.priority]; bv = priorityOrder[b.priority]; break
        default:
          av = a[sortKey].toLowerCase(); bv = b[sortKey].toLowerCase()
      }
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [tasks, filter, search, sortKey, sortDir])

  function addTask() {
    if (!newTitle.trim()) return
    const task: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      project: newProject,
      assignee: newAssignee,
      initials: getInitials(newAssignee),
      due: newDue,
      status: 'Pending',
      priority: newPriority,
    }
    setTasks((prev) => [task, ...prev])
    setNewTitle('')
    setNewProject(projects[0])
    setNewAssignee('Jamie Davis')
    setNewDue('Today')
    setNewPriority('Medium')
    setShowComposer(false)
  }

  function cycleStatus(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        const currentIndex = statusCycle.indexOf(t.status)
        const nextIndex = (currentIndex + 1) % statusCycle.length
        return { ...t, status: statusCycle[nextIndex] }
      })
    )
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setOpenMenuId(null)
  }

  function openComposer() {
    setShowComposer(true)
    setNewTitle('')
    setNewProject(projects[0])
    setNewAssignee('Jamie Davis')
    setNewDue('Today')
    setNewPriority('Medium')
  }

  function openEditor(task: Task) {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditProject(task.project)
    setEditAssignee(task.assignee)
    setEditDue(task.due)
    setEditStatus(task.status)
    setEditPriority(task.priority)
    setShowEditor(true)
    setOpenMenuId(null)
  }

  function saveEdit() {
    if (!editingId || !editTitle.trim()) return
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== editingId) return t
        return {
          ...t,
          title: editTitle.trim(),
          project: editProject,
          assignee: editAssignee,
          initials: getInitials(editAssignee),
          due: editDue,
          status: editStatus,
          priority: editPriority,
        }
      })
    )
    setShowEditor(false)
    setEditingId(null)
  }

  function closeEditor() {
    setShowEditor(false)
    setEditingId(null)
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIndicator({ colKey }: { colKey: SortKey }) {
    if (sortKey !== colKey) return <ArrowUpDown className="sort-icon" aria-hidden="true" />
    return sortDir === 'asc'
      ? <ChevronUp className="sort-icon sort-icon-active" aria-hidden="true" />
      : <ChevronDown className="sort-icon sort-icon-active" aria-hidden="true" />
  }

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><Sparkles aria-hidden="true" /></div>
          <span>taskflow</span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X /></button>
        </div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">A</div>
          <div><strong>Acme Studio</strong><span>Workspace</span></div>
          <ChevronDown aria-hidden="true" />
        </div>
        <nav aria-label="Primary navigation" className="sidebar-nav">
          <p className="nav-label">Workspace</p>
          {navItems.map(({ label, icon: Icon, active }) => (
            <button key={label} className={`nav-item ${active ? 'nav-item-active' : ''}`}>
              <Icon aria-hidden="true" /> {label}
            </button>
          ))}
          <p className="nav-label nav-label-spaced">Manage</p>
          <button className="nav-item"><CalendarDays aria-hidden="true" /> Calendar</button>
          <button className="nav-item"><BarChart3 aria-hidden="true" /> Reports</button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><Settings aria-hidden="true" /> Settings</button>
          <div className="profile-card"><div className="profile-avatar">JD</div><div><strong>Jamie Davis</strong><span>Admin</span></div><MoreHorizontal aria-hidden="true" /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Overview</strong></div>
          <div className="topbar-actions"><button className="icon-button" aria-label="Notifications"><Bell /><span className="notification-dot" /></button><div className="topbar-avatar">JD</div></div>
        </header>

        <div className="content-wrap">
          <section className="page-heading"><div><p className="eyebrow">Monday, September 26, 2026</p><h1>Good morning, Jamie <span>✦</span></h1><p className="heading-copy">Here&apos;s what&apos;s happening across your workspace today.</p></div><Button className="add-task-button" onClick={openComposer}><Plus data-icon="inline-start" /> Add task</Button></section>

          <section className="stats-grid" aria-label="Workspace metrics">
            <StatCard label="Total tasks" value={stats.total.toString()} detail={`${stats.completionRate}% completion rate`} icon={<ClipboardList />} accent="purple" />
            <StatCard label="In progress" value={stats.inProgress.toString()} detail={`${stats.inReview} in review · ${stats.pending} pending`} icon={<Clock3 />} accent="blue" />
            <StatCard label="Completed" value={stats.completed.toString()} detail={`${stats.completionRate}% of all tasks`} icon={<CheckCircle2 />} accent="green" />
          </section>

          <section className="tasks-panel">
            <div className="panel-header"><div><h2>Recent tasks</h2><p>Stay on top of your team&apos;s work.</p></div><button className="view-all">View all <span>→</span></button></div>
            <div className="toolbar"><div className="search-wrap"><Search aria-hidden="true" /><input aria-label="Search tasks" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." /></div><div className="filter-tabs" role="group" aria-label="Filter tasks">{(['All', 'Pending', 'In Review', 'Completed'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'filter-active' : ''}>{item}{item === 'All' && <span className="filter-count">{tasks.length}</span>}{item === 'Pending' && <span className="filter-count">{stats.pending}</span>}{item === 'In Review' && <span className="filter-count">{stats.inReview}</span>}{item === 'Completed' && <span className="filter-count">{stats.completed}</span>}</button>)}</div></div>
            <div className="table-wrap"><table><thead><tr>{sortableColumns.map((col) => <th key={col.key}><button className={`sortable-header ${sortKey === col.key ? 'sortable-header-active' : ''}`} onClick={() => handleSort(col.key)} aria-label={`Sort by ${col.label}`}><span>{col.label}</span><SortIndicator colKey={col.key} /></button></th>)}<th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredTasks.map((task) => <tr key={task.id}><td><div className="task-title"><button className="task-check" onClick={() => cycleStatus(task.id)} aria-label={`Cycle status for ${task.title}`}>{task.status === 'Completed' ? <CheckCircle2 aria-hidden="true" /> : <CircleDot aria-hidden="true" />}</button><strong style={{ textDecoration: task.status === 'Completed' ? 'line-through' : 'none', opacity: task.status === 'Completed' ? 0.7 : 1 }}>{task.title}</strong></div></td><td><span className="project-name">{task.project}</span></td><td><div className="assignee"><span className="assignee-avatar">{task.initials}</span>{task.assignee}</div></td><td><span className="due-date">{task.due}</span></td><td><button className={`status-badge ${statusStyles[task.status]}`} onClick={() => cycleStatus(task.id)} aria-label={`Current status: ${task.status}. Click to cycle.`}><span />{task.status}</button></td><td><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span></td><td><div className="row-actions"><div className="row-menu-wrap"><button className={`row-menu ${openMenuId === task.id ? 'row-menu-active' : ''}`} onClick={(e) => toggleMenu(task.id, e)} aria-label={`More options for ${task.title}`} aria-expanded={openMenuId === task.id}><MoreHorizontal /></button>{openMenuId === task.id && <div className="row-dropdown" role="menu" onClick={(e) => e.stopPropagation()}><button className="dropdown-item dropdown-item-edit" role="menuitem" onClick={() => openEditor(task)}><Pencil size={14} /><span>Edit</span></button><button className="dropdown-item dropdown-item-delete" role="menuitem" onClick={() => deleteTask(task.id)}><Trash2 size={14} /><span>Delete</span></button></div>}</div></div></td></tr>)}</tbody></table>{filteredTasks.length === 0 && <div className="empty-state">No tasks match your filters.</div>}</div>
          </section>
        </div>
      </main>
      {showComposer && <div className="modal-backdrop" role="presentation" onClick={() => setShowComposer(false)}><div className="task-composer" role="dialog" aria-modal="true" aria-labelledby="composer-title" onClick={(event) => event.stopPropagation()}><div className="composer-header"><div><p className="eyebrow">New task</p><h2 id="composer-title">Add a task</h2></div><button className="icon-button" onClick={() => setShowComposer(false)} aria-label="Close dialog"><X /></button></div><label>Task name<input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Prepare project brief" onKeyDown={(e) => { if (e.key === 'Enter') addTask() }} /></label><label>Project<select value={newProject} onChange={(e) => setNewProject(e.target.value)}>{projects.map((p) => <option key={p} value={p}>{p}</option>)}</select></label><label>Assignee<input value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} placeholder="Team member name" /></label><label>Due date<input value={newDue} onChange={(e) => setNewDue(e.target.value)} placeholder="e.g. Today, Oct 15" /></label><label>Priority<select value={newPriority} onChange={(e) => setNewPriority(e.target.value as 'High' | 'Medium' | 'Low')}><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></label><div className="composer-actions"><Button variant="outline" onClick={() => setShowComposer(false)}>Cancel</Button><Button onClick={addTask} disabled={!newTitle.trim()}>Create task</Button></div></div></div>}
      {showEditor && <div className="modal-backdrop" role="presentation" onClick={closeEditor}><div className="task-composer" role="dialog" aria-modal="true" aria-labelledby="editor-title" onClick={(event) => event.stopPropagation()}><div className="composer-header"><div><p className="eyebrow">Edit task</p><h2 id="editor-title">Edit task</h2></div><button className="icon-button" onClick={closeEditor} aria-label="Close dialog"><X /></button></div><label>Task name<input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Task name" onKeyDown={(e) => { if (e.key === 'Enter') saveEdit() }} /></label><label>Project<select value={editProject} onChange={(e) => setEditProject(e.target.value)}>{projects.map((p) => <option key={p} value={p}>{p}</option>)}</select></label><label>Assignee<input value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)} placeholder="Team member name" /></label><label>Due date<input value={editDue} onChange={(e) => setEditDue(e.target.value)} placeholder="e.g. Today, Oct 15" /></label><label>Status<select value={editStatus} onChange={(e) => setEditStatus(e.target.value as Status)}><option value="Pending">Pending</option><option value="In Review">In Review</option><option value="Completed">Completed</option></select></label><label>Priority<select value={editPriority} onChange={(e) => setEditPriority(e.target.value as 'High' | 'Medium' | 'Low')}><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></label><div className="composer-actions"><Button variant="outline" onClick={closeEditor}>Cancel</Button><Button onClick={saveEdit} disabled={!editTitle.trim()}>Save changes</Button></div></div></div>}
    </div>
  )
}

function StatCard({ label, value, detail, icon, accent }: { label: string; value: string; detail: string; icon: React.ReactNode; accent: string }) {
  return <article className="stat-card"><div className={`stat-icon stat-icon-${accent}`}>{icon}</div><div className="stat-info"><p>{label}</p><div className="stat-value-row"><strong>{value}</strong></div><span className="stat-detail">{detail}</span></div></article>
}


