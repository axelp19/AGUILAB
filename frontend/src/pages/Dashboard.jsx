import { useState, useEffect } from 'react'
import {
  Activity,
  Building2,
  PackagePlus,
  PieChart as PieChartIcon,
  TriangleAlert,
} from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AppLayout from '../components/layout/AppLayout'
import { KpiCard, Card, CardHeader, CardBody, Btn, PageHeader } from '../components/ui/UI'
import { api } from '../api'

const COLORES_ESTADO = {
  disponible: '#0a7c4e',
  mantenimiento: '#d97706',
  en_uso: '#003087',
  baja: '#CC0000',
}

export default function Dashboard({ activePage, onNavigate, onLogout, title, subtitle, usuario }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const pct = (v, t) => (t > 0 ? Math.round((v / t) * 100) : 0)

  return (
    <AppLayout activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} title={title} subtitle={subtitle} usuario={usuario}>
      <PageHeader
        title={
          <>
            Bienvenido, <span style={{ color: 'var(--rojo)' }}>{usuario?.nombre?.split(' ')[0]}</span>
          </>
        }
        breadcrumb="ITSJR - Sistema de Inventarios AguiLab"
        actions={
          usuario?.rol === 'administrador' && (
            <Btn onClick={() => onNavigate('equipos')}>
              <PackagePlus size={16} />
              Agregar equipo
            </Btn>
          )
        }
      />

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--gris-400)' }}>Cargando datos...</div>}
      {error && (
        <div style={{ background: 'var(--rojo-light)', color: 'var(--rojo)', padding: 14, borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TriangleAlert size={16} />
          {error}
        </div>
      )}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
            <KpiCard label="Total Equipos" value={data.kpis.total} sub="En todos los labs" accent="blue" />
            <KpiCard label="Disponibles" value={data.kpis.disponibles} sub={`${pct(data.kpis.disponibles, data.kpis.total)}% del total`} accent="green" />
            <KpiCard label="En Mantenimiento" value={data.kpis.mantenimiento} sub={`${pct(data.kpis.mantenimiento, data.kpis.total)}% del total`} accent="orange" />
            <KpiCard label="Dados de Baja" value={data.kpis.bajas} sub={`${pct(data.kpis.bajas, data.kpis.total)}% del total`} accent="red" />
            <KpiCard label="Tickets Abiertos" value={data.ticketsAbiertos} sub="Requieren atención" accent="red" />
          </div>

          <div className="responsive-grid-2" style={{ marginBottom: 24 }}>
            <Card>
              <CardHeader icon={<Activity size={16} />} title="Equipos por laboratorio" />
              <CardBody>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.porLab} barSize={50}>
                    <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="equipos" radius={[6, 6, 0, 0]}>
                      {data.porLab.map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? '#003087' : '#CC0000'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader icon={<PieChartIcon size={16} />} title="Estado del inventario" />
              <CardBody>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.porEstado.map(e => ({ name: e.estado, value: Number(e.total) }))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                      {data.porEstado.map((e, i) => (
                        <Cell key={i} fill={COLORES_ESTADO[e.estado] || '#aaa'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          <div className="responsive-grid-2">
            <Card>
              <CardHeader icon={<Activity size={16} />} title="Actividad reciente" actions={<Btn variant="outline" size="sm" onClick={() => onNavigate('admin')}>Ver todo</Btn>} />
              <CardBody>
                {data.actividad.length === 0 ? (
                  <p style={{ color: 'var(--gris-400)', fontSize: '.85rem' }}>Sin actividad reciente.</p>
                ) : (
                  data.actividad.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < data.actividad.length - 1 ? '1px solid var(--gris-200)' : 'none' }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: a.accion === 'CREAR' ? '#0a7c4e' : a.accion === 'BAJA' ? '#CC0000' : '#003087',
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.83rem', fontWeight: 600 }}>{a.descripcion}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--gris-400)' }}>{a.detalle} · {a.usuario_nombre}</div>
                      </div>
                      <div style={{ fontSize: '.72rem', color: 'var(--gris-400)', whiteSpace: 'nowrap' }}>{new Date(a.fecha).toLocaleDateString('es-MX')}</div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader icon={<Building2 size={16} />} title="Laboratorios" actions={<Btn variant="outline" size="sm" onClick={() => onNavigate('laboratorios')}>Ver todos</Btn>} />
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.labs.map(lab => {
                    const p = pct(lab.disponibles, lab.total)
                    const color = p >= 80 ? '#0a7c4e' : p >= 60 ? '#d97706' : '#CC0000'

                    return (
                      <div
                        key={lab.id}
                        onClick={() => onNavigate('equipos', { laboratorioId: lab.id, laboratorioNombre: lab.nombre })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          cursor: 'pointer',
                          background: 'var(--gris-100)',
                          borderRadius: 10,
                          padding: '12px 14px',
                          border: '1px solid var(--gris-200)',
                          transition: 'transform .15s, box-shadow .15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{ width: 36, height: 36, background: 'var(--azul-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--azul)' }}>
                          <Building2 size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '.87rem', color: 'var(--azul)' }}>{lab.nombre}</div>
                          <div style={{ fontSize: '.73rem', color: 'var(--gris-400)', marginBottom: 5 }}>{lab.total} equipos</div>
                          <div style={{ height: 5, background: 'var(--gris-200)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 3 }} />
                          </div>
                        </div>
                        <span style={{ fontSize: '.8rem', fontWeight: 700, color }}>{p}% OK</span>
                      </div>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </AppLayout>
  )
}
