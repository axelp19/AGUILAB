import {
  ArrowLeft,
  Eye,
  FileSpreadsheet,
  FileText,
  List,
  Package,
  PackagePlus,
  Pencil,
  Save,
  ScanSearch,
  Ticket,
  Trash2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, Badge, Btn, PageHeader, Card, CardBody, FormGroup, Input, Textarea, Divider, SearchBar } from '../components/ui/UI'
import { api } from '../api'

const estadoLabel = { disponible: 'Disponible', mantenimiento: 'Mantenimiento', en_uso: 'En uso', baja: 'Baja' }

export default function Equipos({ activePage, navigationState, onNavigate, onLogout, title, subtitle, usuario }) {
  const [equipos, setEquipos] = useState([])
  const [labs, setLabs] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEst, setFiltroEst] = useState('')
  const [filtroCat, setFiltroCat] = useState('')
  const [view, setView] = useState('list')
  const [detalle, setDetalle] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [labSeleccionado, setLabSeleccionado] = useState('')
  const [form, setForm] = useState({ nombre: '', categoria: '', laboratorio_id: '', estado: 'disponible', marca: '', descripcion: '' })

  const puedeGestionar = usuario?.rol === 'administrador' || usuario?.rol === 'encargado'

  useEffect(() => {
    if (navigationState?.laboratorioId) {
      setLabSeleccionado(String(navigationState.laboratorioId))
    }
  }, [navigationState])

  const cargar = async () => {
    setLoading(true)
    try {
      const params = {}
      if (labSeleccionado) params.laboratorio_id = labSeleccionado

      const [e, l, c] = await Promise.all([
        api.getEquipos(params),
        api.getLabs(),
        api.getCategorias(),
      ])

      setEquipos(e)
      setLabs(l)
      setCategorias(c)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [labSeleccionado])

  const equiposFiltrados = equipos.filter(eq => {
    const txt = busqueda.toLowerCase()
    const coincide = eq.nombre.toLowerCase().includes(txt) || eq.categoria.toLowerCase().includes(txt)
    const est = !filtroEst || eq.estado === filtroEst
    const cat = !filtroCat || eq.categoria === filtroCat
    return coincide && est && cat
  })

  const abrirCrear = () => {
    const labInicial = labSeleccionado || String(labs[0]?.id || '')
    setEditando(null)
    setForm({
      nombre: '',
      categoria: categorias[0]?.nombre || '',
      laboratorio_id: labInicial,
      estado: 'disponible',
      marca: '',
      descripcion: '',
    })
    setShowForm(true)
  }

  const abrirEditar = eq => {
    setEditando(eq)
    setForm({
      nombre: eq.nombre,
      categoria: eq.categoria,
      laboratorio_id: String(eq.laboratorio_id),
      estado: eq.estado,
      marca: eq.marca || '',
      descripcion: eq.descripcion || '',
    })
    setShowForm(true)
  }

  const verDetalle = async eq => {
    try {
      const full = await api.getEquipo(eq.id)
      setDetalle(full)
      setView('detail')
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  const guardar = async () => {
    if (!form.nombre || !form.categoria || !form.laboratorio_id) return

    setGuardando(true)
    try {
      const payload = { ...form, laboratorio_id: Number(form.laboratorio_id) }
      if (editando) await api.updateEquipo(editando.id, payload)
      else await api.createEquipo(payload)

      setShowForm(false)
      await cargar()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  const darBaja = async id => {
    if (!confirm('¿Dar de baja este equipo?')) return

    try {
      await api.deleteEquipo(id)
      if (detalle?.id === id) {
        setDetalle(null)
        setView('list')
      }
      await cargar()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <AppLayout activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} title={title} subtitle={subtitle} usuario={usuario}>
      <PageHeader
        title={<><Package size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} /><span style={{ color: 'var(--rojo)' }}>Inventario</span></>}
        breadcrumb={labSeleccionado && navigationState?.laboratorioNombre ? `Inicio / Inventario / ${navigationState.laboratorioNombre}` : 'Inicio / Inventario de equipos'}
        actions={
          <>
            <Btn variant="outline" size="sm"><FileSpreadsheet size={16} />Excel</Btn>
            <Btn variant="outline" size="sm"><FileText size={16} />PDF</Btn>
            {puedeGestionar && <Btn onClick={abrirCrear}><PackagePlus size={16} />Agregar equipo</Btn>}
          </>
        }
      />

      <div style={{ display: 'flex', borderBottom: '2px solid var(--gris-200)', marginBottom: 20 }}>
        {[
          ['list', <><List size={15} /> Listado</>],
          ['detail', <><ScanSearch size={15} /> Detalle</>],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            style={{
              padding: '10px 22px',
              fontSize: '.85rem',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: view === k ? '3px solid var(--azul)' : '3px solid transparent',
              marginBottom: -2,
              color: view === k ? 'var(--azul)' : 'var(--gris-400)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {view === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <SearchBar placeholder="Buscar por nombre o categoría..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            <select value={labSeleccionado} onChange={e => setLabSeleccionado(e.target.value)} style={{ padding: '9px 14px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', outline: 'none', fontFamily: 'Nunito,sans-serif' }}>
              <option value="">Todos los laboratorios</option>
              {labs.map(l => <option key={l.id} value={String(l.id)}>{l.nombre}</option>)}
            </select>
            <select value={filtroEst} onChange={e => setFiltroEst(e.target.value)} style={{ padding: '9px 14px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', outline: 'none', fontFamily: 'Nunito,sans-serif' }}>
              <option value="">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="en_uso">En uso</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="baja">Baja</option>
            </select>
            <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)} style={{ padding: '9px 14px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', outline: 'none', fontFamily: 'Nunito,sans-serif' }}>
              <option value="">Todas las categorías</option>
              {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--gris-400)' }}>Cargando...</div>
          ) : (
            <Card>
              <CardBody noPad>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
                    <thead>
                      <tr>
                        {['ID', 'Equipo', 'Categoría', 'Laboratorio', 'Estado', 'Fecha', 'Acciones'].map(h => (
                          <th key={h} style={{ background: 'var(--azul-light)', color: 'var(--azul)', fontWeight: 700, fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.5px', padding: '11px 14px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {equiposFiltrados.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--gris-400)' }}>Sin equipos registrados</td></tr>
                      ) : (
                        equiposFiltrados.map(eq => (
                          <tr key={eq.id} style={{ borderBottom: '1px solid var(--gris-200)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--gris-100)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <td style={{ padding: '11px 14px' }}><strong style={{ color: 'var(--azul)' }}>#{eq.id}</strong></td>
                            <td style={{ padding: '11px 14px' }}>
                              <span style={{ fontWeight: 700, color: 'var(--azul)', cursor: 'pointer' }} onClick={() => verDetalle(eq)}>{eq.nombre}</span>
                            </td>
                            <td style={{ padding: '11px 14px', color: 'var(--gris-600)' }}>{eq.categoria}</td>
                            <td style={{ padding: '11px 14px', color: 'var(--gris-600)' }}>{eq.laboratorio_nombre}</td>
                            <td style={{ padding: '11px 14px' }}><Badge type={eq.estado}>{estadoLabel[eq.estado]}</Badge></td>
                            <td style={{ padding: '11px 14px', color: 'var(--gris-600)' }}>{new Date(eq.fecha_registro).toLocaleDateString('es-MX')}</td>
                            <td style={{ padding: '11px 14px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <Btn variant="outline" size="sm" onClick={() => verDetalle(eq)}><Eye size={16} /></Btn>
                                {puedeGestionar && <Btn variant="outline" size="sm" onClick={() => abrirEditar(eq)}><Pencil size={16} /></Btn>}
                                <Btn variant="warn" size="sm" onClick={() => onNavigate('tickets')}><Ticket size={16} /></Btn>
                                {puedeGestionar && <Btn variant="ghost" size="sm" onClick={() => darBaja(eq.id)}><Trash2 size={16} /></Btn>}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ padding: '13px 20px', borderTop: '1px solid var(--gris-200)', fontSize: '.78rem', color: 'var(--gris-400)' }}>
                  Mostrando {equiposFiltrados.length} de {equipos.length} equipos
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {view === 'detail' && (
        <Card>
          <CardBody>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <Btn variant="outline" size="sm" onClick={() => setView('list')}><ArrowLeft size={16} />Volver</Btn>
              {detalle && <span style={{ color: 'var(--gris-400)', fontSize: '.8rem', alignSelf: 'center' }}>#{detalle.id} · {detalle.nombre}</span>}
            </div>

            {detalle ? (
              <>
                <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ width: 80, height: 80, background: 'var(--azul-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--azul)' }}>
                    <Package size={34} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Barlow Condensed,sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--azul)' }}>{detalle.nombre}</div>
                    <div style={{ fontSize: '.82rem', color: 'var(--gris-400)', marginTop: 4 }}>Categoría: {detalle.categoria} · Marca: {detalle.marca || '—'}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <Badge type={detalle.estado}>{estadoLabel[detalle.estado]}</Badge>
                      <Badge type="en_uso">{detalle.laboratorio_nombre}</Badge>
                    </div>
                  </div>
                  {puedeGestionar && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Btn variant="outline" size="sm" onClick={() => abrirEditar(detalle)}><Pencil size={16} />Editar</Btn>
                      <Btn variant="warn" size="sm" onClick={() => onNavigate('tickets')}><Ticket size={16} />Ticket</Btn>
                      <Btn variant="ghost" size="sm" onClick={() => darBaja(detalle.id)}><Trash2 size={16} />Baja</Btn>
                    </div>
                  )}
                </div>
                <div className="responsive-grid-3">
                  {[
                    ['Laboratorio', detalle.laboratorio_nombre],
                    ['Estado', estadoLabel[detalle.estado]],
                    ['Fecha Registro', new Date(detalle.fecha_registro).toLocaleDateString('es-MX')],
                    ['Marca', detalle.marca || '—'],
                    ['Descripción', detalle.descripcion || '—'],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: 'var(--gris-100)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--gris-400)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{l}</div>
                      <div style={{ fontSize: '.88rem', fontWeight: 600, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--gris-400)' }}>Selecciona un equipo para ver su detalle.</div>
            )}
          </CardBody>
        </Card>
      )}

      <Modal show={showForm} onClose={() => setShowForm(false)} title={editando ? 'Editar equipo' : 'Nuevo equipo'} size="lg">
        <div className="responsive-form-grid">
          <FormGroup label="Nombre" required>
            <Input placeholder="Ej. PC Lenovo" value={form.nombre} onChange={e => f('nombre', e.target.value)} />
          </FormGroup>
          <FormGroup label="Marca">
            <Input placeholder="Ej. Lenovo" value={form.marca} onChange={e => f('marca', e.target.value)} />
          </FormGroup>
          <FormGroup label="Categoría" required>
            <select value={form.categoria} onChange={e => f('categoria', e.target.value)} style={{ padding: '9px 13px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', outline: 'none', width: '100%', fontFamily: 'Nunito,sans-serif' }}>
              {categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Laboratorio" required>
            <select value={form.laboratorio_id} onChange={e => f('laboratorio_id', e.target.value)} style={{ padding: '9px 13px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', outline: 'none', width: '100%', fontFamily: 'Nunito,sans-serif' }}>
              {labs.map(l => <option key={l.id} value={String(l.id)}>{l.nombre}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Estado" required>
            <select value={form.estado} onChange={e => f('estado', e.target.value)} style={{ padding: '9px 13px', border: '1.5px solid var(--gris-200)', borderRadius: 8, fontSize: '.85rem', outline: 'none', width: '100%', fontFamily: 'Nunito,sans-serif' }}>
              <option value="disponible">Disponible</option>
              <option value="en_uso">En uso</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="baja">Baja</option>
            </select>
          </FormGroup>
          <FormGroup label="Descripción" fullWidth>
            <Textarea placeholder="Especificaciones, observaciones..." value={form.descripcion} onChange={e => f('descripcion', e.target.value)} />
          </FormGroup>
        </div>
        <Divider />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={() => setShowForm(false)}>Cancelar</Btn>
          <Btn onClick={guardar} disabled={guardando || !labs.length || !categorias.length || !form.nombre || !form.categoria || !form.laboratorio_id}><Save size={16} />{guardando ? 'Guardando...' : 'Guardar'}</Btn>
        </div>
      </Modal>
    </AppLayout>
  )
}
