import { ArrowLeft, Check, Eye, List, Play, Plus, Save, ScanSearch, Ticket as TicketIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, Badge, Btn, KpiCard, PageHeader, Card, CardBody, FormGroup, Divider } from '../components/ui/UI'
import { api } from '../api'

const prioridadType = { alta: 'alta', media: 'media', baja: 'baja_p' }
const estadoType = { abierto: 'abierto', proceso: 'proceso', cerrado: 'cerrado' }
const estadoLabel = { abierto: 'Abierto', proceso: 'En Proceso', cerrado: 'Cerrado' }

export default function Tickets({ activePage, onNavigate, onLogout, title, subtitle, usuario }) {
  const [tickets, setTickets] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('list')
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ equipo_id: '', tipo: 'Daño físico', prioridad: 'media', descripcion: '' })

  const cargar = () => {
    setLoading(true)
    Promise.all([api.getTickets(), api.getEquipos()])
      .then(([t, e]) => {
        setTickets(t)
        setEquipos(e)
      })
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const kpis = {
    abiertos: tickets.filter(t => t.estado === 'abierto').length,
    proceso: tickets.filter(t => t.estado === 'proceso').length,
    cerrados: tickets.filter(t => t.estado === 'cerrado').length,
  }

  const crearTicket = async () => {
    if (!form.equipo_id || !form.descripcion) return
    setGuardando(true)
    try {
      await api.createTicket(form)
      setShowModal(false)
      cargar()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (id, estado) => {
    try {
      await api.updateTicket(id, { estado })
      cargar()
      if (selected?.id === id) setSelected(prev => ({ ...prev, estado }))
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  return (
    <AppLayout activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} title={title} subtitle={subtitle} usuario={usuario}>
      <PageHeader
        title={<><TicketIcon size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} /><span style={{ color: 'var(--rojo)' }}>Tickets</span></>}
        breadcrumb="Inicio / Tickets"
        actions={<Btn onClick={() => setShowModal(true)}><Plus size={16} />Nuevo ticket</Btn>}
      />

      <div className="responsive-grid-4" style={{ marginBottom: 20 }}>
        <KpiCard label="Abiertos" value={kpis.abiertos} accent="red" />
        <KpiCard label="En Proceso" value={kpis.proceso} accent="orange" />
        <KpiCard label="Cerrados" value={kpis.cerrados} accent="green" />
        <KpiCard label="Total" value={tickets.length} accent="blue" />
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid var(--gris-200)', marginBottom: 20 }}>
        {[
          ['list', <><List size={15} /> Listado</>],
          ['detail', <><ScanSearch size={15} /> Detalle</>],
        ].map(([k, label]) => (
          <button key={k} onClick={() => setView(k)} style={{ padding: '10px 22px', fontSize: '.85rem', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', borderBottom: view === k ? '3px solid var(--azul)' : '3px solid transparent', marginBottom: -2, color: view === k ? 'var(--azul)' : 'var(--gris-400)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {label}
          </button>
        ))}
      </div>

      {view === 'list' &&
        (loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--gris-400)' }}>Cargando...</div>
        ) : (
          <Card>
            <CardBody noPad>
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
                  <thead>
                    <tr>
                      {['Ticket', 'Equipo', 'Lab', 'Tipo', 'Prioridad', 'Estado', 'Reportó', 'Fecha', 'Acciones'].map(h => (
                        <th key={h} style={{ background: 'var(--azul-light)', color: 'var(--azul)', fontWeight: 700, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.5px', padding: '11px 14px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 ? (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--gris-400)' }}>Sin tickets registrados</td></tr>
                    ) : (
                      tickets.map(tk => (
                        <tr key={tk.id} style={{ borderBottom: '1px solid var(--gris-200)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--gris-100)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '11px 14px' }}><strong style={{ color: 'var(--azul)' }}>#{tk.id}</strong></td>
                          <td style={{ padding: '11px 14px', fontWeight: 600 }}>{tk.equipo_nombre}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--gris-600)' }}>{tk.lab_nombre}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--gris-600)' }}>{tk.tipo}</td>
                          <td style={{ padding: '11px 14px' }}><Badge type={prioridadType[tk.prioridad]}>{tk.prioridad}</Badge></td>
                          <td style={{ padding: '11px 14px' }}><Badge type={estadoType[tk.estado]}>{estadoLabel[tk.estado]}</Badge></td>
                          <td style={{ padding: '11px 14px', color: 'var(--gris-600)' }}>{tk.reporto_nombre}</td>
                          <td style={{ padding: '11px 14px', color: 'var(--gris-600)' }}>{new Date(tk.fecha_creacion).toLocaleDateString('es-MX')}</td>
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Btn variant="outline" size="sm" onClick={() => { setSelected(tk); setView('detail') }}><Eye size={16} /></Btn>
                              {tk.estado !== 'cerrado' && <Btn variant="success" size="sm" onClick={() => cambiarEstado(tk.id, tk.estado === 'abierto' ? 'proceso' : 'cerrado')}>{tk.estado === 'abierto' ? <Play size={16} /> : <Check size={16} />}</Btn>}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        ))}

      {view === 'detail' && selected && (
        <Card>
          <CardBody>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <Btn variant="outline" size="sm" onClick={() => setView('list')}><ArrowLeft size={16} />Volver</Btn>
              <span style={{ alignSelf: 'center', color: 'var(--gris-400)', fontSize: '.8rem' }}>Ticket #{selected.id}</span>
              <Badge type={estadoType[selected.estado]}>{estadoLabel[selected.estado]}</Badge>
            </div>
            <div className="responsive-grid-2" style={{ marginBottom: 20 }}>
              <div><div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--gris-400)', textTransform: 'uppercase', marginBottom: 4 }}>Equipo</div><div style={{ fontWeight: 700, color: 'var(--azul)' }}>{selected.equipo_nombre}</div><div style={{ fontSize: '.8rem', color: 'var(--gris-400)' }}>{selected.lab_nombre}</div></div>
              <div><div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--gris-400)', textTransform: 'uppercase', marginBottom: 4 }}>Tipo</div><div style={{ fontWeight: 600 }}>{selected.tipo}</div></div>
              <div><div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--gris-400)', textTransform: 'uppercase', marginBottom: 4 }}>Prioridad</div><Badge type={prioridadType[selected.prioridad]}>{selected.prioridad}</Badge></div>
              <div><div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--gris-400)', textTransform: 'uppercase', marginBottom: 4 }}>Reportó</div><div style={{ fontWeight: 600 }}>{selected.reporto_nombre}</div><div style={{ fontSize: '.8rem', color: 'var(--gris-400)' }}>{new Date(selected.fecha_creacion).toLocaleString('es-MX')}</div></div>
            </div>
            <Divider />
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--gris-400)', textTransform: 'uppercase', marginBottom: 8 }}>Descripción</div>
            <div style={{ background: 'var(--gris-100)', borderRadius: 8, padding: 14, fontSize: '.85rem', color: 'var(--gris-600)', lineHeight: 1.6 }}>{selected.descripcion}</div>
            {selected.estado !== 'cerrado' && (
              <>
                <Divider />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <Btn variant="warn" onClick={() => cambiarEstado(selected.id, 'proceso')} disabled={selected.estado === 'proceso'}><Play size={16} />En proceso</Btn>
                  <Btn variant="success" onClick={() => cambiarEstado(selected.id, 'cerrado')}><Check size={16} />Cerrar ticket</Btn>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Crear nuevo ticket">
        <div className="responsive-form-grid">
          <FormGroup label="Equipo afectado" required fullWidth>
            <select value={form.equipo_id} onChange={e => setForm(p => ({ ...p, equipo_id: e.target.value }))} style={{ padding: '9px 13px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', outline: 'none', width: '100%', fontFamily: 'Nunito,sans-serif' }}>
              <option value="">Seleccionar equipo...</option>
              {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre} - {e.laboratorio_nombre}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Tipo de reporte" required>
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} style={{ padding: '9px 13px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', outline: 'none', width: '100%', fontFamily: 'Nunito,sans-serif' }}>
              {['Daño físico', 'Equipo faltante', 'Falla de software', 'Mantenimiento preventivo', 'Otro'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Prioridad" required>
            <select value={form.prioridad} onChange={e => setForm(p => ({ ...p, prioridad: e.target.value }))} style={{ padding: '9px 13px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', outline: 'none', width: '100%', fontFamily: 'Nunito,sans-serif' }}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </FormGroup>
          <FormGroup label="Descripción" required fullWidth>
            <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Describe el problema con detalle..." rows={4} style={{ padding: '9px 13px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', resize: 'vertical', width: '100%', fontFamily: 'Nunito,sans-serif', outline: 'none' }} />
          </FormGroup>
        </div>
        <Divider />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={() => setShowModal(false)}>Cancelar</Btn>
          <Btn onClick={crearTicket} disabled={guardando}><Save size={16} />{guardando ? 'Guardando...' : 'Crear ticket'}</Btn>
        </div>
      </Modal>
    </AppLayout>
  )
}
