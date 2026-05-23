import {
  Ban,
  Check,
  FileSpreadsheet,
  FileText,
  Lock,
  Pencil,
  Plus,
  Save,
  ScrollText,
  Settings,
  Tag,
  Trash2,
  Users,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, Badge, Btn, PageHeader, Card, CardBody, FormGroup, Input, Divider, SearchBar } from '../components/ui/UI'
import { api } from '../api'
import { exportActivityLogExcel, exportActivityLogPdf } from '../utils/exporters'

const logColor = { CREAR: '#0a7c4e', EDITAR: '#003087', BAJA: '#CC0000', EXPORTAR: '#d97706' }
const logBg = { CREAR: '#e6f4ef', EDITAR: 'var(--azul-light)', BAJA: 'var(--rojo-light)', EXPORTAR: 'var(--naranja-light)' }

export default function Admin({ activePage, onNavigate, onLogout, title, subtitle, usuario }) {
  const [tab, setTab] = useState('usuarios')
  const [usuarios, setUsuarios] = useState([])
  const [categorias, setCategorias] = useState([])
  const [labs, setLabs] = useState([])
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalUser, setModalUser] = useState(false)
  const [modalCat, setModalCat] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [editCat, setEditCat] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [exporting, setExporting] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const [formU, setFormU] = useState({ nombre: '', correo: '', password: '', rol: 'encargado', laboratorios: [] })
  const [formC, setFormC] = useState({ nombre: '', descripcion: '' })

  const cargar = () => {
    setLoading(true)
    setError('')
    Promise.all([api.getUsuarios(), api.getCategorias(), api.getLabs(), api.getLog()])
      .then(([u, c, l, lg]) => {
        setUsuarios(u)
        setCategorias(c)
        setLabs(l)
        setLog(lg)
      })
      .catch(e => setError(e.message || 'Error al cargar administracion'))
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const abrirCrearUser = () => {
    setEditUser(null)
    setFormU({ nombre: '', correo: '', password: '', rol: 'encargado', laboratorios: [] })
    setModalUser(true)
  }

  const abrirEditarUser = u => {
    setEditUser(u)
    const labIds = u.laboratorios
      ? u.laboratorios
          .split(',')
          .map(n => {
            const lab = labs.find(l => l.nombre.trim() === n.trim())
            return lab ? String(lab.id) : null
          })
          .filter(Boolean)
      : []

    setFormU({ nombre: u.nombre, correo: u.correo, password: '', rol: u.rol, laboratorios: labIds })
    setModalUser(true)
  }

  const guardarUser = async () => {
    if (!formU.nombre || !formU.correo) return
    if (!editUser && !formU.password) return alert('La contraseña es requerida para nuevos usuarios')
    setGuardando(true)
    try {
      const payload = { ...formU, laboratorios: formU.laboratorios.map(Number) }
      if (!payload.password) delete payload.password
      if (editUser) await api.updateUsuario(editUser.id, payload)
      else await api.createUsuario(payload)
      setModalUser(false)
      cargar()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  const toggleActivoUser = async u => {
    try {
      await api.updateUsuario(u.id, { nombre: u.nombre, correo: u.correo, rol: u.rol, activo: u.activo ? 0 : 1 })
      cargar()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  const guardarCat = async () => {
    if (!formC.nombre) return
    setGuardando(true)
    try {
      const payload = { ...formC, emoji: 'box' }
      if (editCat) await api.updateCategoria(editCat.id, payload)
      else await api.createCategoria(payload)
      setModalCat(false)
      cargar()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminarCat = async id => {
    if (!confirm('¿Eliminar esta categoría?')) return
    try {
      await api.deleteCategoria(id)
      cargar()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  const fU = (k, v) => setFormU(p => ({ ...p, [k]: v }))
  const fC = (k, v) => setFormC(p => ({ ...p, [k]: v }))

  const toggleLab = id => {
    const sid = String(id)
    setFormU(p => ({
      ...p,
      laboratorios: p.laboratorios.includes(sid) ? p.laboratorios.filter(l => l !== sid) : [...p.laboratorios, sid],
    }))
  }

  const exportarLogPdf = async () => {
    setExporting('pdf')
    setExportMessage('')
    try {
      await exportActivityLogPdf({ log, usuario })
      setExportMessage('PDF generado correctamente. Revisa tus descargas.')
    } catch (e) {
      setExportMessage('No se pudo exportar el PDF: ' + e.message)
    } finally {
      setExporting('')
    }
  }

  const exportarLogExcel = async () => {
    setExporting('excel')
    setExportMessage('')
    try {
      await exportActivityLogExcel({ log, usuario })
      setExportMessage('Excel generado correctamente. Revisa tus descargas.')
    } catch (e) {
      setExportMessage('No se pudo exportar Excel: ' + e.message)
    } finally {
      setExporting('')
    }
  }

  const tabs = [
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'categorias', label: 'Categorías', icon: Tag },
    { id: 'log', label: 'Log de actividad', icon: ScrollText },
  ]

  return (
    <AppLayout activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} title={title} subtitle={subtitle} usuario={usuario}>
      <PageHeader
        title={<><Settings size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} /><span style={{ color: 'var(--rojo)' }}>Administración</span></>}
        breadcrumb="Inicio / Panel de administración"
        actions={
          <span style={{ background: 'var(--azul-light)', color: 'var(--azul)', padding: '6px 14px', borderRadius: 20, fontSize: '.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} />
            Solo administradores
          </span>
        }
      />

      <div style={{ display: 'flex', borderBottom: '2px solid var(--gris-200)', marginBottom: 24 }}>
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '11px 22px',
                fontSize: '.85rem',
                fontWeight: 700,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: tab === t.id ? '3px solid var(--azul)' : '3px solid transparent',
                marginBottom: -2,
                color: tab === t.id ? 'var(--azul)' : 'var(--gris-400)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {error && (
        <div style={{ background: 'var(--rojo-light)', color: 'var(--rojo)', padding: 14, borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {exportMessage && (
        <div style={{ background: exportMessage.startsWith('No') ? 'var(--rojo-light)' : 'var(--verde-light)', color: exportMessage.startsWith('No') ? 'var(--rojo)' : 'var(--verde)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '.85rem', fontWeight: 700 }}>
          {exportMessage}
        </div>
      )}

      {tab === 'usuarios' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <SearchBar placeholder="Buscar usuario..." />
            <Btn size="sm" onClick={abrirCrearUser}><Plus size={16} />Nuevo usuario</Btn>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gris-400)' }}>Cargando...</div>
          ) : (
            <Card>
              <CardBody noPad>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
                    <thead>
                      <tr>{['', 'Nombre', 'Correo', 'Rol', 'Laboratorios', 'Estado', 'Último acceso', 'Acciones'].map(h => <th key={h} style={{ background: 'var(--azul-light)', color: 'var(--azul)', fontWeight: 700, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.5px', padding: '11px 14px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {usuarios.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--gris-200)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--gris-100)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.activo ? 'var(--azul)' : 'var(--gris-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.8rem' }}>
                              {u.nombre?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                          </td>
                          <td style={{ padding: '11px 14px', fontWeight: 700 }}>{u.nombre}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--gris-600)', fontSize: '.8rem' }}>{u.correo}</td>
                          <td style={{ padding: '11px 14px' }}><Badge type={u.rol === 'administrador' ? 'administrador' : 'encargado'}>{u.rol}</Badge></td>
                          <td style={{ padding: '11px 14px', color: 'var(--gris-600)', fontSize: '.8rem' }}>{u.laboratorios || 'Todos'}</td>
                          <td style={{ padding: '11px 14px' }}><Badge type={u.activo ? 'disponible' : 'baja'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                          <td style={{ padding: '11px 14px', color: 'var(--gris-600)', fontSize: '.8rem' }}>{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleDateString('es-MX') : '—'}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Btn variant="outline" size="sm" onClick={() => abrirEditarUser(u)}><Pencil size={16} /></Btn>
                              <Btn variant="ghost" size="sm" onClick={() => toggleActivoUser(u)}>{u.activo ? <Ban size={16} /> : <Check size={16} />}</Btn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {tab === 'categorias' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <Btn size="sm" onClick={() => { setEditCat(null); setFormC({ nombre: '', descripcion: '' }); setModalCat(true) }}><Plus size={16} />Nueva categoría</Btn>
          </div>
          <Card>
            <CardBody noPad>
              {categorias.map((cat, i) => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: i < categorias.length - 1 ? '1px solid var(--gris-200)' : 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--gris-100)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 42, height: 42, background: 'var(--azul-light)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--azul)', flexShrink: 0 }}>
                    <Tag size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{cat.nombre}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--gris-400)' }}>{cat.descripcion}</div>
                  </div>
                  <Badge type="en_uso">{cat.total_equipos || 0} equipos</Badge>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant="outline" size="sm" onClick={() => { setEditCat(cat); setFormC({ nombre: cat.nombre, descripcion: cat.descripcion }); setModalCat(true) }}><Pencil size={16} /></Btn>
                    <Btn variant="ghost" size="sm" onClick={() => eliminarCat(cat.id)}><Trash2 size={16} /></Btn>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </>
      )}

      {tab === 'log' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, gap: 8 }}>
            <Btn variant="outline" size="sm" onClick={exportarLogPdf} disabled={Boolean(exporting)}>
              <FileText size={16} />{exporting === 'pdf' ? 'Generando...' : 'PDF'}
            </Btn>
            <Btn variant="success" size="sm" onClick={exportarLogExcel} disabled={Boolean(exporting)}>
              <FileSpreadsheet size={16} />{exporting === 'excel' ? 'Generando...' : 'Excel'}
            </Btn>
          </div>
          <Card>
            <CardBody noPad>
              {log.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: 12, padding: '11px 18px', borderBottom: i < log.length - 1 ? '1px solid var(--gris-200)' : 'none', alignItems: 'flex-start' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--gris-100)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: logColor[item.accion] || '#aaa', flexShrink: 0, marginTop: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '.83rem', fontWeight: 600 }}>{item.descripcion}</div>
                    <div style={{ fontSize: '.73rem', color: 'var(--gris-400)' }}>{item.detalle}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '.68rem', fontWeight: 700, background: logBg[item.accion] || '#eee', color: logColor[item.accion] || '#666' }}>{item.accion}</span>
                    <div style={{ fontSize: '.72rem', color: 'var(--gris-400)', marginTop: 3 }}>{item.usuario_nombre} · {new Date(item.fecha).toLocaleString('es-MX')}</div>
                  </div>
                </div>
              ))}
              {log.length === 0 && <div style={{ textAlign: 'center', padding: 24, color: 'var(--gris-400)' }}>Sin actividad registrada</div>}
            </CardBody>
          </Card>
        </>
      )}

      <Modal show={modalUser} onClose={() => setModalUser(false)} title={editUser ? 'Editar usuario' : 'Nuevo usuario'}>
        <div className="responsive-form-grid">
          <FormGroup label="Nombre completo" required>
            <Input placeholder="Nombre completo" defaultValue={formU.nombre} onChange={e => fU('nombre', e.target.value)} />
          </FormGroup>
          <FormGroup label="Correo institucional" required>
            <Input type="email" placeholder="usuario@sjuanrio.tecnm.mx" defaultValue={formU.correo} onChange={e => fU('correo', e.target.value)} />
          </FormGroup>
          <FormGroup label={editUser ? 'Nueva contraseña (dejar vacío = sin cambio)' : 'Contraseña'} required={!editUser}>
            <Input type="password" placeholder="••••••••" onChange={e => fU('password', e.target.value)} />
          </FormGroup>
          <FormGroup label="Rol" required>
            <select value={formU.rol} onChange={e => fU('rol', e.target.value)} style={{ padding: '9px 13px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', outline: 'none', width: '100%', fontFamily: 'Nunito,sans-serif' }}>
              <option value="administrador">Administrador</option>
              <option value="encargado">Encargado</option>
            </select>
          </FormGroup>
          {formU.rol === 'encargado' && (
            <FormGroup label="Laboratorios asignados" fullWidth>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 14px', border: '1.5px solid var(--gris-200)', borderRadius: 8 }}>
                {labs.map(l => (
                  <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.85rem' }}>
                    <input type="checkbox" checked={formU.laboratorios.includes(String(l.id))} onChange={() => toggleLab(l.id)} />
                    {l.nombre}
                  </label>
                ))}
              </div>
            </FormGroup>
          )}
        </div>
        <Divider />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={() => setModalUser(false)}>Cancelar</Btn>
          <Btn onClick={guardarUser} disabled={guardando}><Save size={16} />{guardando ? 'Guardando...' : 'Guardar'}</Btn>
        </div>
      </Modal>

      <Modal show={modalCat} onClose={() => setModalCat(false)} title={editCat ? 'Editar categoría' : 'Nueva categoría'} size="sm">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <FormGroup label="Nombre" required>
            <Input placeholder="Ej. Proyector" defaultValue={formC.nombre} onChange={e => fC('nombre', e.target.value)} />
          </FormGroup>
          <FormGroup label="Descripción">
            <textarea value={formC.descripcion} onChange={e => fC('descripcion', e.target.value)} placeholder="Descripción breve..." rows={3} style={{ padding: '9px 13px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', resize: 'vertical', width: '100%', fontFamily: 'Nunito,sans-serif', outline: 'none' }} />
          </FormGroup>
        </div>
        <Divider />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={() => setModalCat(false)}>Cancelar</Btn>
          <Btn onClick={guardarCat} disabled={guardando}><Save size={16} />{guardando ? 'Guardando...' : 'Guardar'}</Btn>
        </div>
      </Modal>
    </AppLayout>
  )
}
