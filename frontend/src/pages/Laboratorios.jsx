import { Building2, Cpu, Eye, Globe, MapPin, Pencil, Plus, Save, Trash2, TriangleAlert, Wrench } from 'lucide-react'
import { useState, useEffect } from 'react'
import AppLayout from '../components/layout/AppLayout'
import { Modal, Btn, PageHeader, FormGroup, Input, Divider } from '../components/ui/UI'
import { api } from '../api'

const iconSet = [Globe, Cpu, Building2, Wrench]

export default function Laboratorios({ activePage, onNavigate, onLogout, title, subtitle, usuario }) {
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', clave: '', piso: '', edificio: '', responsable: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const esAdmin = usuario?.rol === 'administrador'

  const cargar = () => {
    setLoading(true)
    api.getLabs()
      .then(setLabs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(cargar, [])

  const abrirCrear = () => {
    setEditando(null)
    setForm({ nombre: '', clave: '', piso: 'Piso 1', edificio: '', responsable: '' })
    setShowModal(true)
  }

  const abrirEditar = lab => {
    setEditando(lab)
    setForm({
      nombre: lab.nombre || '',
      clave: lab.clave || '',
      piso: lab.piso || '',
      edificio: lab.edificio || '',
      responsable: lab.responsable || '',
    })
    setShowModal(true)
  }

  const guardar = async () => {
    if (!form.nombre || !form.clave) return
    setGuardando(true)
    try {
      if (editando) await api.updateLab(editando.id, form)
      else await api.createLab(form)
      setShowModal(false)
      cargar()
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async id => {
    if (!confirm('¿Eliminar este laboratorio?')) return
    try {
      await api.deleteLab(id)
      cargar()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

  const headerColors = ['#003087', '#CC0000', '#001a5c', '#004db3']

  return (
    <AppLayout activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} title={title} subtitle={subtitle} usuario={usuario}>
      <PageHeader
        title={<><Building2 size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} /><span style={{ color: 'var(--rojo)' }}>Laboratorios</span></>}
        breadcrumb="Inicio / Laboratorios"
        actions={esAdmin && <Btn onClick={abrirCrear}><Plus size={16} />Nuevo laboratorio</Btn>}
      />

      {error && (
        <div style={{ background: 'var(--rojo-light)', color: 'var(--rojo)', padding: 12, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TriangleAlert size={16} />
          {error}
        </div>
      )}
      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--gris-400)' }}>Cargando laboratorios...</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 18 }}>
        {labs.map((lab, i) => {
          const total = Number(lab.total_equipos) || 0
          const disp = Number(lab.disponibles) || 0
          const mant = Number(lab.mantenimiento) || 0
          const bajas = Number(lab.bajas) || 0
          const pct = total > 0 ? Math.round((disp / total) * 100) : 0
          const color = pct >= 80 ? '#0a7c4e' : pct >= 60 ? '#d97706' : '#CC0000'
          const HeaderIcon = iconSet[i % iconSet.length]

          return (
            <div
              key={lab.id}
              style={{ background: 'var(--blanco)', borderRadius: 'var(--radius)', border: '1px solid var(--gris-200)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', transition: 'transform .15s, box-shadow .15s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
            >
              <div style={{ background: headerColors[i % headerColors.length], padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <HeaderIcon size={28} color="#fff" />
                <div>
                  <div style={{ fontFamily: 'Barlow Condensed,sans-serif', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{lab.nombre}</div>
                  <div style={{ fontSize: '.74rem', color: 'rgba(255,255,255,.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={13} />
                    {lab.piso} · {lab.edificio}
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  {[['Total', total, 'var(--azul)'], ['Disponibles', disp, '#0a7c4e'], ['Mant.', mant, '#d97706'], ['Bajas', bajas, 'var(--rojo)']].map(([l, v, c]) => (
                    <div key={l} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Barlow Condensed,sans-serif', fontSize: '1.4rem', fontWeight: 800, color: c }}>{v}</div>
                      <div style={{ fontSize: '.66rem', color: 'var(--gris-400)', fontWeight: 600, textTransform: 'uppercase' }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 5, background: 'var(--gris-200)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: '.73rem', color: 'var(--gris-400)', marginBottom: 12 }}>Resp.: {lab.responsable}</div>
                <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--gris-200)' }}>
                  <Btn size="sm" onClick={() => onNavigate('equipos', { laboratorioId: lab.id, laboratorioNombre: lab.nombre })} style={{ flex: 1 }}>
                    <Eye size={16} />
                    Ver equipos
                  </Btn>
                  {esAdmin && <Btn size="sm" variant="outline" onClick={() => abrirEditar(lab)}><Pencil size={16} /></Btn>}
                  {esAdmin && <Btn size="sm" variant="ghost" onClick={() => eliminar(lab.id)}><Trash2 size={16} /></Btn>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title={editando ? 'Editar laboratorio' : 'Nuevo laboratorio'}>
        <div className="responsive-form-grid">
          <FormGroup label="Nombre" required>
            <Input placeholder="Ej. Lab LRS" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Clave" required>
            <Input placeholder="Ej. LAB-LRS" value={form.clave} onChange={e => setForm(f => ({ ...f, clave: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Piso">
            <Input placeholder="Piso 2" value={form.piso} onChange={e => setForm(f => ({ ...f, piso: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Edificio">
            <Input placeholder="Edificio P" value={form.edificio} onChange={e => setForm(f => ({ ...f, edificio: e.target.value }))} />
          </FormGroup>
          <FormGroup label="Responsable" fullWidth>
            <Input placeholder="Nombre del responsable" value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} />
          </FormGroup>
        </div>
        <Divider />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="outline" onClick={() => setShowModal(false)}>Cancelar</Btn>
          <Btn onClick={guardar} disabled={guardando || !form.nombre || !form.clave}><Save size={16} />{guardando ? 'Guardando...' : 'Guardar'}</Btn>
        </div>
      </Modal>
    </AppLayout>
  )
}
