import React, { useState, useEffect, useCallback } from 'react'

const API = '/api'

// ── API helpers ───────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('token') }

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ── Icons (inline SVG) ────────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    chevronDown: <polyline points="6 9 12 15 18 9"/>,
    workspace: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    bot: <><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M12 3a3 3 0 0 0-3 3v5h6V6a3 3 0 0 0-3-3z"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    node: <><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  )
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiFetch(`/${mode}`, { method: 'POST', body: { email, password } })
      localStorage.setItem('token', data.token)
      onAuth(data.user)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={styles.authWrap}>
      <div style={styles.authCard}>
        <div style={styles.authLogo}>
          <span style={styles.logoMark}>P</span>
          <span style={styles.logoText}>PlanAI</span>
        </div>
        <p style={styles.authSub}>AI-powered hierarchical planning</p>

        <form onSubmit={submit} style={styles.form}>
          <input
            style={styles.input}
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
          />
          <input
            style={styles.input}
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required
          />
          {error && <p style={styles.errorText}>{error}</p>}
          <button style={styles.btnPrimary} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={styles.authSwitch}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button style={styles.linkBtn} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}

// ── Tree Node Component ───────────────────────────────────────────────────────
function TreeNode({ node, allNodes, depth, onSelect, selectedId, onDelete }) {
  const [open, setOpen] = useState(true)
  const children = allNodes.filter(n => n.parent_id === node.id)
  const hasChildren = children.length > 0
  const isSelected = selectedId === node.id

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 16 }}>
      <div
        style={{
          ...styles.treeNode,
          background: isSelected ? 'rgba(108,99,255,0.15)' : 'transparent',
          borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent'
        }}
        onClick={() => onSelect(node)}
      >
        <button
          style={styles.chevronBtn}
          onClick={e => { e.stopPropagation(); setOpen(!open) }}
        >
          {hasChildren
            ? <Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} />
            : <span style={{ width: 12, display: 'inline-block' }} />}
        </button>

        <span style={{
          ...styles.nodeTitle,
          textDecoration: node.is_completed ? 'line-through' : 'none',
          color: node.is_completed ? 'var(--text-muted)' : 'var(--text)'
        }}>
          {node.is_completed && <span style={{ color: 'var(--success)', marginRight: 4 }}>✓</span>}
          {node.title}
        </span>

        <button
          style={styles.deleteBtn}
          onClick={e => { e.stopPropagation(); onDelete(node.id) }}
          title="Delete"
        >
          <Icon name="x" size={11} />
        </button>
      </div>

      {open && hasChildren && (
        <div style={styles.treeChildren}>
          {children.map(child => (
            <TreeNode key={child.id} node={child} allNodes={allNodes}
              depth={depth + 1} onSelect={onSelect} selectedId={selectedId} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Execution Panel ───────────────────────────────────────────────────────────
function ExecutionPanel({ node, onUpdate, onClose }) {
  const [content, setContent] = useState(node.content || '')
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [preview, setPreview] = useState(false)

  const isHtml = content.trim().startsWith('<')

  // Auto-switch to preview when node has HTML content
  useEffect(() => {
    setContent(node.content || '')
    setPreview(node.content?.trim().startsWith('<') || false)
  }, [node.id])

  async function save() {
    setSaving(true)
    await apiFetch(`/nodes/${node.id}`, {
      method: 'PUT',
      body: { title: node.title, content, is_completed: node.is_completed }
    })
    onUpdate({ ...node, content })
    setSaving(false)
  }

  async function complete() {
    setCompleting(true)
    await apiFetch(`/nodes/${node.id}`, {
      method: 'PUT',
      body: { title: node.title, content, is_completed: true }
    })
    onUpdate({ ...node, content, is_completed: 1 })
    setCompleting(false)
  }

  return (
    <div style={styles.execPanel}>
      <div style={styles.execHeader}>
        <h3 style={styles.execTitle}>{node.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isHtml && (
            <button style={preview ? styles.btnPrimarySmall : styles.btnSecondarySmall} onClick={() => setPreview(!preview)}>
              {preview ? 'Edit' : 'Preview'}
            </button>
          )}
          <button style={styles.iconBtn} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
      </div>

      <div style={styles.execBody}>
        {node.is_completed && (
          <div style={styles.completedBadge}>✓ Completed</div>
        )}

        {preview && isHtml ? (
          <div
            className="html-content"
            style={styles.htmlPreview}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <>
            <p style={styles.label}>
              {isHtml ? 'HTML Content (switch to Preview to read)' : 'Notes / Content'}
            </p>
            <textarea
              style={styles.textarea}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`Add notes, or ask AI: "Generate explanation for ${node.title}"`}
              rows={8}
            />
          </>
        )}

        <div style={styles.execActions}>
          {!preview && (
            <button style={styles.btnSecondary} onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          {!node.is_completed && (
            <button style={styles.btnSuccess} onClick={complete} disabled={completing}>
              {completing ? '...' : '✓ Mark Complete'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── AI Chat Panel ─────────────────────────────────────────────────────────────
function AIPanel({ workspace, nodes, onNodesChange }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: `Hi! I'm your planning assistant for "${workspace.name}". Try:\n• "Generate top level plan"\n• "Generate subtopics for Algebra"\n• "Generate explanation for Variables"\n• "Add node: Practice Problems under Algebra"` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      // ── Explanation command: separate path, returns raw HTML (no JSON) ─────────
      const explainMatch = userMsg.match(/generate explanation for (.+)|explain (.+)/i)
      if (explainMatch) {
        const nodeName = (explainMatch[1] || explainMatch[2]).trim()
        const htmlPrompt = `Write a detailed educational lesson about "${nodeName}" for high school students.
Return ONLY clean HTML — no JSON, no markdown, no code fences.
Use tags: h2, h3, p, ul, li, strong, em, blockquote.
Structure: definition → key concepts → 2-3 worked examples → important tips.
Start directly with <h2>${nodeName}</h2> and write at least 300 words.`

        const { text } = await apiFetch('/ai/generate', { method: 'POST', body: { prompt: htmlPrompt } })
        const html = text.replace(/```html|```/g, '').trim()

        const freshNodes = await apiFetch(`/workspaces/${workspace.id}/nodes`)
        const target = freshNodes.find(x => x.title.toLowerCase() === nodeName.toLowerCase())
        if (target) {
          await apiFetch(`/nodes/${target.id}`, {
            method: 'PUT',
            body: { title: target.title, content: html, is_completed: target.is_completed }
          })
          await onNodesChange()
          setMessages(m => [...m, { role: 'ai', text: `Explanation saved for "${nodeName}". Click the node in the tree to read it.` }])
        } else {
          setMessages(m => [...m, { role: 'ai', text: `Node "${nodeName}" not found in the tree. Check the spelling and try again.` }])
        }
        setLoading(false)
        return
      }

      // ── All other commands: JSON path ─────────────────────────────────────────
      const nodeList = nodes.map(n => `ID:${n.id} ParentID:${n.parent_id || 'null'} "${n.title}"`).join('\n')

      const prompt = `You are a planning assistant for workspace "${workspace.name}".

Current nodes:
${nodeList || '(empty)'}

User command: "${userMsg}"

Reply with a JSON object ONLY — no markdown, no explanation, raw JSON only.

ACTION 1 — generate top level plan:
{"action":"create_nodes","nodes":[{"title":"Algebra","parent_id":null},{"title":"Geometry","parent_id":null}],"message":"Top level plan created."}
RULE: ALL parent_id must be null.

ACTION 2 — generate subtopics for X:
{"action":"create_nodes","nodes":[{"title":"Variables","parent_id":"Algebra"},{"title":"Linear Equations","parent_id":"Algebra"}],"message":"Subtopics created under Algebra."}
RULE: Use EXACT parent title from the node list. Generate 4-6 children only.

ACTION 3 — anything else:
{"action":"message","message":"Your response here."}`

      const { text } = await apiFetch('/ai/generate', { method: 'POST', body: { prompt } })

      let parsed
      try {
        const stripped = text.replace(/```[\w]*\n?/g, '').trim()
        const match = stripped.match(/\{[\s\S]*\}/)
        parsed = JSON.parse(match ? match[0] : stripped)
      } catch {
        setMessages(m => [...m, { role: 'ai', text: text }])
        setLoading(false)
        return
      }

      if (parsed.action === 'create_nodes') {
        const freshNodes = await apiFetch(`/workspaces/${workspace.id}/nodes`)
        const created = {}
        for (const n of parsed.nodes) {
          let parentId = null
          if (n.parent_id) {
            const pid = String(n.parent_id)
            const existing = freshNodes.find(x => x.title.toLowerCase() === pid.toLowerCase())
            if (existing) parentId = existing.id
            else if (created[pid]) parentId = created[pid]
          }
          const newNode = await apiFetch('/nodes', {
            method: 'POST',
            body: { workspace_id: workspace.id, parent_id: parentId, title: n.title, position: 0 }
          })
          created[n.title] = newNode.id
        }
        await onNodesChange()
        setMessages(m => [...m, { role: 'ai', text: parsed.message || `Created ${parsed.nodes.length} nodes.` }])
      } else {
        setMessages(m => [...m, { role: 'ai', text: parsed.message || text }])
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', text: 'Error: ' + e.message }])
    }
    setLoading(false)
  }

  return (
    <div style={styles.aiPanel}>
      <div style={styles.aiHeader}>
        <Icon name="bot" size={16} />
        <span style={{ marginLeft: 8, fontWeight: 600 }}>AI Assistant</span>
      </div>

      <div style={styles.aiMessages}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? styles.userMsg : styles.aiMsg}>
            <pre style={styles.msgText}>{m.text}</pre>
          </div>
        ))}
        {loading && <div style={styles.aiMsg}><span style={styles.typing}>Thinking...</span></div>}
      </div>

      <div style={styles.aiInput}>
        <input
          style={styles.chatInput}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Give a command..."
        />
        <button style={styles.sendBtn} onClick={send} disabled={loading}>
          <Icon name="send" size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspace, setActiveWorkspace] = useState(null)
  const [nodes, setNodes] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [newWsName, setNewWsName] = useState('')
  const [showNewWs, setShowNewWs] = useState(false)

  // restore session
  useEffect(() => {
    const token = getToken()
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({ id: payload.id, email: payload.email })
      } catch { localStorage.removeItem('token') }
    }
  }, [])

  useEffect(() => {
    if (user) loadWorkspaces()
  }, [user])

  async function loadWorkspaces() {
    const data = await apiFetch('/workspaces')
    setWorkspaces(data)
  }

  async function loadNodes() {
    if (!activeWorkspace) return
    const data = await apiFetch(`/workspaces/${activeWorkspace.id}/nodes`)
    setNodes(data)
  }

  useEffect(() => {
    if (activeWorkspace) { setNodes([]); setSelectedNode(null); loadNodes() }
  }, [activeWorkspace])

  async function createWorkspace() {
    if (!newWsName.trim()) return
    const ws = await apiFetch('/workspaces', { method: 'POST', body: { name: newWsName.trim() } })
    setWorkspaces(w => [ws, ...w])
    setNewWsName('')
    setShowNewWs(false)
    setActiveWorkspace(ws)
  }

  async function deleteWorkspace(id) {
    await apiFetch(`/workspaces/${id}`, { method: 'DELETE' })
    setWorkspaces(w => w.filter(x => x.id !== id))
    if (activeWorkspace?.id === id) { setActiveWorkspace(null); setNodes([]) }
  }

  async function deleteNode(id) {
    await apiFetch(`/nodes/${id}`, { method: 'DELETE' })
    setNodes(n => n.filter(x => x.id !== id && x.parent_id !== id))
    if (selectedNode?.id === id) setSelectedNode(null)
    loadNodes()
  }

  function updateNode(updated) {
    setNodes(n => n.map(x => x.id === updated.id ? updated : x))
    setSelectedNode(updated)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null); setWorkspaces([]); setActiveWorkspace(null); setNodes([])
  }

  if (!user) return <AuthScreen onAuth={setUser} />

  const rootNodes = nodes.filter(n => !n.parent_id)

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logoRow}>
            <span style={styles.logoMark}>P</span>
            <span style={styles.logoText}>PlanAI</span>
          </div>
          <p style={styles.userEmail}>{user.email}</p>
        </div>

        <div style={styles.sidebarSection}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionLabel}>Workspaces</span>
            <button style={styles.iconBtn} onClick={() => setShowNewWs(!showNewWs)}>
              <Icon name="plus" size={14} />
            </button>
          </div>

          {showNewWs && (
            <div style={styles.newWsRow}>
              <input
                style={styles.miniInput}
                value={newWsName}
                onChange={e => setNewWsName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createWorkspace()}
                placeholder="Workspace name..."
                autoFocus
              />
              <button style={styles.btnPrimarySmall} onClick={createWorkspace}>Add</button>
            </div>
          )}

          <div style={styles.wsList}>
            {workspaces.map(ws => (
              <div
                key={ws.id}
                style={{
                  ...styles.wsItem,
                  background: activeWorkspace?.id === ws.id ? 'rgba(108,99,255,0.2)' : 'transparent'
                }}
                onClick={() => setActiveWorkspace(ws)}
              >
                <Icon name="workspace" size={13} />
                <span style={styles.wsName}>{ws.name}</span>
                <button style={styles.deleteBtn} onClick={e => { e.stopPropagation(); deleteWorkspace(ws.id) }}>
                  <Icon name="trash" size={11} />
                </button>
              </div>
            ))}
            {workspaces.length === 0 && (
              <p style={styles.emptyHint}>Create your first workspace</p>
            )}
          </div>
        </div>

        <button style={styles.logoutBtn} onClick={logout}>
          <Icon name="logout" size={14} /> <span>Sign Out</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {!activeWorkspace ? (
          <div style={styles.emptyState}>
            <Icon name="workspace" size={48} />
            <h2 style={styles.emptyTitle}>Select a Workspace</h2>
            <p style={styles.emptyText}>Choose a workspace from the sidebar or create a new one to get started.</p>
          </div>
        ) : (
          <div style={styles.workspaceView}>
            {/* Tree Panel */}
            <div style={styles.treePanel}>
              <div style={styles.treePanelHeader}>
                <h2 style={styles.wsTitle}>{activeWorkspace.name}</h2>
              </div>
              <div style={styles.treeScroll}>
                {rootNodes.length === 0 ? (
                  <div style={styles.treeEmpty}>
                    <Icon name="node" size={32} />
                    <p>No nodes yet.</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Use the AI assistant to generate a plan.</p>
                  </div>
                ) : (
                  rootNodes.map(node => (
                    <TreeNode
                      key={node.id}
                      node={node}
                      allNodes={nodes}
                      depth={0}
                      onSelect={setSelectedNode}
                      selectedId={selectedNode?.id}
                      onDelete={deleteNode}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right Panel: Execution or AI */}
            <div style={styles.rightPanel}>
              {selectedNode ? (
                <ExecutionPanel
                  node={selectedNode}
                  onUpdate={updateNode}
                  onClose={() => setSelectedNode(null)}
                />
              ) : (
                <AIPanel
                  workspace={activeWorkspace}
                  nodes={nodes}
                  onNodesChange={loadNodes}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  app: { display: 'flex', height: '100vh', overflow: 'hidden' },

  // Auth
  authWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' },
  authCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, width: 360 },
  authLogo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  authSub: { color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none' },
  btnPrimary: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, marginTop: 4 },
  errorText: { color: 'var(--danger)', fontSize: 13 },
  authSwitch: { marginTop: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 },
  linkBtn: { background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: 13 },

  // Logo
  logoMark: { background: 'var(--accent)', color: '#fff', borderRadius: 8, width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  logoText: { fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10 },

  // Sidebar
  sidebar: { width: 240, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarTop: { padding: '20px 16px 14px', borderBottom: '1px solid var(--border)' },
  userEmail: { color: 'var(--text-muted)', fontSize: 11, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sidebarSection: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '12px 0' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  iconBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' },
  newWsRow: { display: 'flex', gap: 6, padding: '0 12px', marginBottom: 8 },
  miniInput: { flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: 12 },
  btnPrimarySmall: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' },
  wsList: { flex: 1, overflowY: 'auto', padding: '0 8px' },
  wsItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 2 },
  wsName: { flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  deleteBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', opacity: 0.5, padding: 2, borderRadius: 4, display: 'flex', alignItems: 'center' },
  emptyHint: { fontSize: 12, color: 'var(--text-muted)', padding: '8px 8px' },
  logoutBtn: { margin: 12, background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },

  // Main
  main: { flex: 1, overflow: 'hidden', display: 'flex' },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 },
  emptyTitle: { fontSize: 20, color: 'var(--text)' },
  emptyText: { fontSize: 14, textAlign: 'center', maxWidth: 300 },

  // Workspace view
  workspaceView: { flex: 1, display: 'flex', overflow: 'hidden' },

  // Tree
  treePanel: { width: 300, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  treePanelHeader: { padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' },
  wsTitle: { fontSize: 16, fontWeight: 700 },
  treeScroll: { flex: 1, overflowY: 'auto', padding: 8 },
  treeEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', gap: 10, textAlign: 'center', fontSize: 13 },
  treeNode: { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 6px', borderRadius: 6, cursor: 'pointer', marginBottom: 1 },
  chevronBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 },
  nodeTitle: { flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  treeChildren: { borderLeft: '1px dashed var(--border)', marginLeft: 10 },

  // Right panel
  rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },

  // Execution panel
  execPanel: { flex: 1, display: 'flex', flexDirection: 'column' },
  execHeader: { padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  execTitle: { fontSize: 16, fontWeight: 700 },
  execBody: { flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 },
  completedBadge: { background: 'rgba(74,222,128,0.1)', color: 'var(--success)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600 },
  label: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },
  textarea: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, color: 'var(--text)', fontSize: 14, resize: 'vertical', minHeight: 160 },
  execActions: { display: 'flex', gap: 10 },
  btnSecondary: { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600 },
  btnSecondarySmall: { background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600 },
  htmlPreview: { flex: 1, overflowY: 'auto', padding: '4px 2px' },
  btnSuccess: { background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: 'var(--success)', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600 },

  // AI panel
  aiPanel: { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' },
  aiHeader: { padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', background: 'var(--surface)', flexShrink: 0 },
  aiMessages: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 },
  userMsg: { alignSelf: 'flex-end', background: 'var(--accent)', borderRadius: '12px 12px 2px 12px', padding: '8px 14px', maxWidth: '80%' },
  aiMsg: { alignSelf: 'flex-start', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 2px', padding: '8px 14px', maxWidth: '90%' },
  msgText: { fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontFamily: 'inherit' },
  typing: { color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' },
  aiInput: { padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 },
  chatInput: { flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text)', fontSize: 13 },
  sendBtn: { background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '9px 14px', color: '#fff', display: 'flex', alignItems: 'center' }
}
