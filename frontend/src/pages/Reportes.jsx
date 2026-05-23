import { BarChart3, FileSpreadsheet, FileText, LineChart as LineChartIcon, PieChart as PieChartIcon, Table2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import AppLayout from '../components/layout/AppLayout'
import { Btn, KpiCard, PageHeader, Card, CardHeader, CardBody, Badge } from '../components/ui/UI'
import { api } from '../api'
import { exportInventoryExcel, exportInventoryPdf } from '../utils/exporters'

const COLORES_ESTADO = {
  disponible: '#0a7c4e',
  mantenimiento: '#d97706',
  en_uso: '#003087',
  baja: '#CC0000',
}

export default function Reportes({ activePage, onNavigate, onLogout, title, subtitle, usuario }) {
  const [dash, setDash] = useState(null)
  const [equipos, setEquipos] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    Promise.all([api.dashboard(), api.getEquipos({ incluir_bajas: 1 }), api.getTickets()])
      .then(([d, e, t]) => {
        setDash(d)
        setEquipos(e)
        setTickets(t)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppLayout activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} title={title} subtitle={subtitle} usuario={usuario}>
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gris-400)' }}>Cargando reportes...</div>
      </AppLayout>
    )
  }

  const porEstadoData = (dash?.porEstado || []).map(e => ({ name: e.estado, value: Number(e.total), color: COLORES_ESTADO[e.estado] || '#aaa' }))

  const porLabBar = (dash?.labs || []).map(l => ({
    lab: l.nombre,
    disponibles: equipos.filter(e => e.laboratorio_id === l.id && e.estado === 'disponible').length,
    mantenimiento: equipos.filter(e => e.laboratorio_id === l.id && e.estado === 'mantenimiento').length,
    bajas: equipos.filter(e => e.laboratorio_id === l.id && e.estado === 'baja').length,
  }))

  const ticketsPorMes = (() => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const conteo = {}
    tickets.forEach(t => {
      const m = new Date(t.fecha_creacion).getMonth()
      conteo[m] = (conteo[m] || 0) + 1
    })
    return Object.keys(conteo).map(m => ({ mes: meses[m], tickets: conteo[m] }))
  })()

  const kpis = dash?.kpis || { total: 0, disponibles: 0, mantenimiento: 0, bajas: 0 }
  const pct = (v, t) => (t > 0 ? Math.round((v / t) * 100) : 0)

  const handleExportPdf = async () => {
    setExporting('pdf')
    try {
      await exportInventoryPdf({ dash, equipos, tickets, usuario })
    } catch (e) {
      alert('No se pudo exportar el PDF: ' + e.message)
    } finally {
      setExporting('')
    }
  }

  const handleExportExcel = async () => {
    setExporting('excel')
    try {
      await exportInventoryExcel({ dash, equipos, tickets, usuario })
    } catch (e) {
      alert('No se pudo exportar Excel: ' + e.message)
    } finally {
      setExporting('')
    }
  }

  return (
    <AppLayout activePage={activePage} onNavigate={onNavigate} onLogout={onLogout} title={title} subtitle={subtitle} usuario={usuario}>
      <PageHeader
        title={<><BarChart3 size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} /><span style={{ color: 'var(--rojo)' }}>Reportes</span></>}
        breadcrumb="Inicio / Reportes y exportaciones"
        actions={
          <>
            <Btn variant="outline" onClick={handleExportPdf} disabled={Boolean(exporting)}>
              <FileText size={16} />{exporting === 'pdf' ? 'Generando...' : 'Exportar PDF'}
            </Btn>
            <Btn variant="success" onClick={handleExportExcel} disabled={Boolean(exporting)}>
              <FileSpreadsheet size={16} />{exporting === 'excel' ? 'Generando...' : 'Exportar Excel'}
            </Btn>
          </>
        }
      />

      <div className="responsive-grid-5" style={{ marginBottom: 24 }}>
        <KpiCard label="Total Equipos" value={kpis.total} accent="blue" />
        <KpiCard label="Disponibles" value={kpis.disponibles} sub={`${pct(kpis.disponibles, kpis.total)}%`} accent="green" />
        <KpiCard label="Mantenimiento" value={kpis.mantenimiento} sub={`${pct(kpis.mantenimiento, kpis.total)}%`} accent="orange" />
        <KpiCard label="Dados de Baja" value={kpis.bajas} sub={`${pct(kpis.bajas, kpis.total)}%`} accent="red" />
        <KpiCard label="Tickets Totales" value={tickets.length} accent="blue" />
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: 24 }}>
        <Card>
          <CardHeader icon={<BarChart3 size={16} />} title="Equipos por laboratorio" />
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porLabBar} barSize={40}>
                <XAxis dataKey="lab" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="disponibles" stackId="a" fill="#0a7c4e" name="Disponibles" />
                <Bar dataKey="mantenimiento" stackId="a" fill="#d97706" name="Mantenimiento" />
                <Bar dataKey="bajas" stackId="a" fill="#CC0000" radius={[4, 4, 0, 0]} name="Bajas" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader icon={<LineChartIcon size={16} />} title="Tickets por mes (2026)" />
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              {ticketsPorMes.length > 0 ? (
                <LineChart data={ticketsPorMes}>
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tickets" stroke="#CC0000" strokeWidth={2} dot={{ fill: '#CC0000', r: 4 }} />
                </LineChart>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gris-400)', fontSize: '.85rem' }}>Sin datos de tickets aún</div>
              )}
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="responsive-grid-2" style={{ marginBottom: 24 }}>
        <Card>
          <CardHeader icon={<PieChartIcon size={16} />} title="Distribución por estado" />
          <CardBody>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={porEstadoData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                  {porEstadoData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader icon={<Table2 size={16} />} title="Resumen por laboratorio" />
          <CardBody noPad>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.83rem' }}>
              <thead>
                <tr>{['Laboratorio', 'Total', 'Disponibles', 'Mant.', 'Bajas', '%OK'].map(h => <th key={h} style={{ background: 'var(--azul-light)', color: 'var(--azul)', fontWeight: 700, fontSize: '.72rem', textTransform: 'uppercase', padding: '9px 12px', textAlign: 'left' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {(dash?.labs || []).map(l => {
                  const disp = equipos.filter(e => e.laboratorio_id === l.id && e.estado === 'disponible').length
                  const mant = equipos.filter(e => e.laboratorio_id === l.id && e.estado === 'mantenimiento').length
                  const baj = equipos.filter(e => e.laboratorio_id === l.id && e.estado === 'baja').length
                  const tot = Number(l.total)
                  const p = pct(disp, tot)
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--gris-200)' }}>
                      <td style={{ padding: '9px 12px', fontWeight: 700 }}>{l.nombre}</td>
                      <td style={{ padding: '9px 12px' }}>{tot}</td>
                      <td style={{ padding: '9px 12px', color: '#0a7c4e', fontWeight: 700 }}>{disp}</td>
                      <td style={{ padding: '9px 12px' }}>{mant}</td>
                      <td style={{ padding: '9px 12px' }}>{baj}</td>
                      <td style={{ padding: '9px 12px' }}><Badge type={p >= 80 ? 'disponible' : p >= 60 ? 'mantenimiento' : 'baja'}>{p}%</Badge></td>
                    </tr>
                  )
                })}
                <tr style={{ background: 'var(--azul-light)', fontWeight: 700 }}>
                  <td style={{ padding: '9px 12px' }}>Total</td>
                  <td style={{ padding: '9px 12px' }}>{kpis.total}</td>
                  <td style={{ padding: '9px 12px', color: '#0a7c4e' }}>{kpis.disponibles}</td>
                  <td style={{ padding: '9px 12px' }}>{kpis.mantenimiento}</td>
                  <td style={{ padding: '9px 12px' }}>{kpis.bajas}</td>
                  <td style={{ padding: '9px 12px' }}><Badge type="disponible">{pct(kpis.disponibles, kpis.total)}%</Badge></td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </AppLayout>
  )
}
