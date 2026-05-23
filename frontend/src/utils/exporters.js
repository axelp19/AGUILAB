import itsjrLogo from '../assets/itsjr.png'
import nxuniLogo from '../assets/nxuni.png'
import appLogo from '../assets/logo.png'

const COLORS = {
  blue: [0, 48, 135],
  red: [204, 0, 0],
  green: [10, 124, 78],
  gray: [95, 111, 131],
  lightBlue: [232, 239, 252],
}

const estadoLabels = {
  disponible: 'Disponible',
  mantenimiento: 'Mantenimiento',
  en_uso: 'En uso',
  baja: 'Baja',
}

function stamp() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return {
    display: now.toLocaleString('es-MX'),
    file: `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`,
    seal: `AGUILAB-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`,
  }
}

async function imageToDataUrl(src) {
  const res = await fetch(src)
  const blob = await res.blob()
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

async function loadPdfLibs() {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  return { jsPDF, autoTable: autoTableModule.default }
}

async function loadXlsx() {
  return import('xlsx')
}

function pct(value, total) {
  return total > 0 ? `${Math.round((Number(value) / Number(total)) * 100)}%` : '0%'
}

function text(value, fallback = '') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function dateText(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-MX')
}

function safeName(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function addWatermark(doc, eagle) {
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  if (doc.setGState && doc.GState) {
    doc.setGState(new doc.GState({ opacity: 0.055 }))
  }
  doc.addImage(eagle, 'PNG', width / 2 - 50, height / 2 - 50, 100, 100)
  if (doc.setGState && doc.GState) {
    doc.setGState(new doc.GState({ opacity: 1 }))
  }
}

async function loadSealLogo() {
  return imageToDataUrl(appLogo)
}

function addSeal(doc, sealText, sealLogo) {
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()
  const x = width - 26
  const y = height - 25

  if (sealLogo) {
    doc.addImage(sealLogo, 'PNG', x, y, 14, 14)
  }

  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(6)
  doc.text(sealText, width - 12, height - 7, { align: 'right' })
}

function addHeader(doc, { title, subtitle, generatedBy, generatedAt, logo, eagle, sealText, sealLogo }) {
  const width = doc.internal.pageSize.getWidth()

  addWatermark(doc, eagle)

  // Header band
  doc.setFillColor(...COLORS.blue)
  doc.rect(0, 0, width, 24, 'F')
  doc.setFillColor(...COLORS.red)
  doc.rect(0, 24, width, 2, 'F')
  doc.addImage(logo, 'PNG', 12, 4.5, 15, 15)

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(title, 32, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(subtitle, 32, 17)
  doc.setFontSize(7.5)
  doc.text(`Generado: ${generatedAt}`, width - 12, 10, { align: 'right' })
  doc.text(`Usuario: ${generatedBy}`, width - 12, 16, { align: 'right' })

  addSeal(doc, sealText, sealLogo)
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    doc.setDrawColor(230, 235, 242)
    doc.line(12, height - 12, width - 30, height - 12)
    doc.setTextColor(...COLORS.gray)
    doc.setFontSize(7)
    doc.text('AguiLab - Sistema de Gestión de Inventarios ITSJR', 12, height - 7)
    doc.text(`Página ${i} de ${pageCount}`, width - 30, height - 7, { align: 'right' })
  }
}

function tableTheme() {
  return {
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3.5,
      lineColor: [235, 240, 247],
      lineWidth: 0.1,
      textColor: [45, 55, 72],
    },
    headStyles: {
      fillColor: COLORS.blue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function downloadPdf(doc, filename) {
  downloadBlob(doc.output('blob'), filename)
}

function appendSheet(XLSX, workbook, name, rows, widths = []) {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  if (widths.length) sheet['!cols'] = widths.map(wch => ({ wch }))
  XLSX.utils.book_append_sheet(workbook, sheet, name)
}

function saveWorkbook(XLSX, workbook, filename) {
  const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  downloadBlob(
    new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename
  )
}

export async function exportInventoryPdf({ dash, equipos, tickets, usuario }) {
  const { jsPDF, autoTable } = await loadPdfLibs()
  const meta = stamp()
  const logo = await imageToDataUrl(itsjrLogo)
  const eagle = await imageToDataUrl(nxuniLogo)
  const sealLogo = await loadSealLogo()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const generatedBy = usuario?.nombre || 'Usuario del sistema'
  const kpis = dash?.kpis || {}

  addHeader(doc, {
    title: 'Reporte General de Inventario',
    subtitle: 'Instituto Tecnológico de San Juan del Río - AguiLab',
    generatedBy,
    generatedAt: meta.display,
    logo,
    eagle,
    sealText: meta.seal,
    sealLogo,
  })

  autoTable(doc, {
    ...tableTheme(),
    startY: 36,
    margin: { left: 12, right: 12 },
    head: [['Indicador', 'Valor', 'Observación']],
    body: [
      ['Total de equipos', text(kpis.total, '0'), 'Inventario total registrado'],
      ['Disponibles', text(kpis.disponibles, '0'), pct(kpis.disponibles, kpis.total)],
      ['En mantenimiento', text(kpis.mantenimiento, '0'), pct(kpis.mantenimiento, kpis.total)],
      ['Dados de baja', text(kpis.bajas, '0'), pct(kpis.bajas, kpis.total)],
      ['Tickets totales', String(tickets.length), 'Tickets registrados'],
    ],
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
  })

  autoTable(doc, {
    ...tableTheme(),
    startY: doc.lastAutoTable.finalY + 8,
    margin: { left: 12, right: 12 },
    head: [['Laboratorio', 'Total', 'Disponibles', 'Mantenimiento', 'Bajas', '% OK']],
    body: (dash?.labs || []).map(lab => {
      const disp = equipos.filter(e => e.laboratorio_id === lab.id && e.estado === 'disponible').length
      const mant = equipos.filter(e => e.laboratorio_id === lab.id && e.estado === 'mantenimiento').length
      const bajas = equipos.filter(e => e.laboratorio_id === lab.id && e.estado === 'baja').length
      return [lab.nombre, lab.total, disp, mant, bajas, pct(disp, lab.total)]
    }),
  })

  doc.addPage()
  addHeader(doc, {
    title: 'Detalle de Equipos',
    subtitle: 'Inventario completo por laboratorio',
    generatedBy,
    generatedAt: meta.display,
    logo,
    eagle,
    sealText: meta.seal,
    sealLogo,
  })

  autoTable(doc, {
    ...tableTheme(),
    startY: 36,
    margin: { left: 12, right: 12 },
    head: [['ID', 'Equipo', 'Categoría', 'Laboratorio', 'Estado', 'Marca', 'Descripción']],
    body: equipos.map(e => [
      e.id,
      e.nombre,
      e.categoria,
      e.laboratorio_nombre,
      estadoLabels[e.estado] || e.estado,
      text(e.marca, 'S/M'),
      text(e.descripcion, ''),
    ]),
    columnStyles: {
      0: { halign: 'right', cellWidth: 12 },
      1: { cellWidth: 36 },
      3: { cellWidth: 34 },
      6: { cellWidth: 68 },
    },
  })

  doc.addPage()
  addHeader(doc, {
    title: 'Tickets de Soporte',
    subtitle: 'Seguimiento de incidencias registradas',
    generatedBy,
    generatedAt: meta.display,
    logo,
    eagle,
    sealText: meta.seal,
    sealLogo,
  })

  autoTable(doc, {
    ...tableTheme(),
    startY: 36,
    margin: { left: 12, right: 12 },
    head: [['ID', 'Equipo', 'Tipo', 'Prioridad', 'Estado', 'Reportó', 'Fecha', 'Descripción']],
    body: tickets.map(t => [
      t.id,
      text(t.equipo_nombre, `Equipo ${t.equipo_id}`),
      t.tipo,
      t.prioridad,
      t.estado,
      text(t.reporto_nombre, ''),
      dateText(t.fecha_creacion),
      t.descripcion,
    ]),
    columnStyles: {
      0: { halign: 'right', cellWidth: 12 },
      7: { cellWidth: 72 },
    },
  })

  addFooter(doc)
  downloadPdf(doc, `reporte-aguilab-${meta.file}.pdf`)
}

export async function exportInventoryExcel({ dash, equipos, tickets, usuario }) {
  const XLSX = await loadXlsx()
  const meta = stamp()
  const workbook = XLSX.utils.book_new()
  workbook.Props = {
    Title: 'Reporte General AguiLab',
    Subject: 'Inventario de laboratorios',
    Author: usuario?.nombre || 'AguiLab',
    Company: 'ITSJR',
    CreatedDate: new Date(),
  }

  const kpis = dash?.kpis || {}
  appendSheet(XLSX, workbook, 'Resumen', [
    ['AguiLab - Reporte General de Inventario'],
    ['Generado', meta.display],
    ['Usuario', usuario?.nombre || 'Usuario del sistema'],
    [],
    ['Indicador', 'Valor', 'Observación'],
    ['Total de equipos', kpis.total || 0, 'Inventario total registrado'],
    ['Disponibles', kpis.disponibles || 0, pct(kpis.disponibles, kpis.total)],
    ['En mantenimiento', kpis.mantenimiento || 0, pct(kpis.mantenimiento, kpis.total)],
    ['Dados de baja', kpis.bajas || 0, pct(kpis.bajas, kpis.total)],
    ['Tickets totales', tickets.length, 'Tickets registrados'],
  ], [34, 20, 34])

  appendSheet(XLSX, workbook, 'Laboratorios', [
    ['Laboratorio', 'Total', 'Disponibles', 'Mantenimiento', 'Bajas', '% OK'],
    ...(dash?.labs || []).map(lab => {
      const disp = equipos.filter(e => e.laboratorio_id === lab.id && e.estado === 'disponible').length
      const mant = equipos.filter(e => e.laboratorio_id === lab.id && e.estado === 'mantenimiento').length
      const bajas = equipos.filter(e => e.laboratorio_id === lab.id && e.estado === 'baja').length
      return [lab.nombre, lab.total, disp, mant, bajas, pct(disp, lab.total)]
    }),
  ], [28, 12, 14, 16, 10, 10])

  appendSheet(XLSX, workbook, 'Equipos', [
    ['ID', 'Equipo', 'Categoría', 'Laboratorio', 'Estado', 'Marca', 'Descripción', 'Fecha registro'],
    ...equipos.map(e => [
      e.id,
      e.nombre,
      e.categoria,
      e.laboratorio_nombre,
      estadoLabels[e.estado] || e.estado,
      text(e.marca, 'S/M'),
      text(e.descripcion, ''),
      dateText(e.fecha_registro),
    ]),
  ], [10, 28, 20, 24, 16, 16, 44, 22])

  appendSheet(XLSX, workbook, 'Tickets', [
    ['ID', 'Equipo', 'Tipo', 'Prioridad', 'Estado', 'Reportó', 'Fecha', 'Descripción'],
    ...tickets.map(t => [
      t.id,
      text(t.equipo_nombre, `Equipo ${t.equipo_id}`),
      t.tipo,
      t.prioridad,
      t.estado,
      text(t.reporto_nombre, ''),
      dateText(t.fecha_creacion),
      t.descripcion,
    ]),
  ], [10, 28, 18, 14, 14, 24, 22, 48])

  appendSheet(XLSX, workbook, 'Por estado', [
    ['Estado', 'Total'],
    ...(dash?.porEstado || []).map(e => [estadoLabels[e.estado] || e.estado, Number(e.total)]),
  ], [20, 12])

  saveWorkbook(XLSX, workbook, `reporte-aguilab-${meta.file}.xlsx`)
}

export async function exportActivityLogPdf({ log, usuario }) {
  const { jsPDF, autoTable } = await loadPdfLibs()
  const meta = stamp()
  const logo = await imageToDataUrl(itsjrLogo)
  const eagle = await imageToDataUrl(nxuniLogo)
  const sealLogo = await loadSealLogo()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  addHeader(doc, {
    title: 'Bitácora de Actividad',
    subtitle: 'Auditoría administrativa del sistema AguiLab',
    generatedBy: usuario?.nombre || 'Usuario del sistema',
    generatedAt: meta.display,
    logo,
    eagle,
    sealText: meta.seal,
    sealLogo,
  })

  autoTable(doc, {
    ...tableTheme(),
    startY: 36,
    margin: { left: 12, right: 12 },
    head: [['ID', 'Acción', 'Descripción', 'Detalle', 'Usuario', 'Fecha']],
    body: log.map(item => [
      item.id,
      item.accion,
      item.descripcion,
      text(item.detalle, ''),
      text(item.usuario_nombre, ''),
      dateText(item.fecha),
    ]),
    columnStyles: {
      0: { halign: 'right', cellWidth: 12 },
      2: { cellWidth: 72 },
      3: { cellWidth: 62 },
    },
  })

  addFooter(doc)
  downloadPdf(doc, `bitacora-aguilab-${meta.file}.pdf`)
}
      dateText(item.fecha),
    ]),
  ], [10, 14, 54, 44, 26, 22])

  saveWorkbook(XLSX, workbook, `bitacora-aguilab-${meta.file}.xlsx`)
}

export function reportFileBaseName(prefix) {
  return `${safeName(prefix)}-${stamp().file}`
}

export async function exportEquiposPdf({ equipos, labNombre, usuario }) {
  const { jsPDF, autoTable } = await loadPdfLibs()
  const meta = stamp()
  const logo = await imageToDataUrl(itsjrLogo)
  const eagle = await imageToDataUrl(nxuniLogo)
  const sealLogo = await loadSealLogo()
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const generatedBy = usuario?.nombre || 'Usuario del sistema'
  const subtitleText = labNombre
    ? `Equipos del laboratorio: ${labNombre}`
    : 'Listado completo de equipos registrados'

  addHeader(doc, {
    title: 'Inventario de Equipos',
    subtitle: `${subtitleText} - AguiLab`,
    generatedBy,
    generatedAt: meta.display,
    logo,
    eagle,
    sealText: meta.seal,
    sealLogo,
  })

  const resumen = {
    total: equipos.length,
    disponibles: equipos.filter(e => e.estado === 'disponible').length,
    mantenimiento: equipos.filter(e => e.estado === 'mantenimiento').length,
    en_uso: equipos.filter(e => e.estado === 'en_uso').length,
    bajas: equipos.filter(e => e.estado === 'baja').length,
  }

  autoTable(doc, {
    ...tableTheme(),
    startY: 36,
    margin: { left: 12, right: 12 },
    head: [['Indicador', 'Valor', 'Porcentaje']],
    body: [
      ['Total de equipos', resumen.total, '100%'],
      ['Disponibles', resumen.disponibles, pct(resumen.disponibles, resumen.total)],
      ['En uso', resumen.en_uso, pct(resumen.en_uso, resumen.total)],
      ['En mantenimiento', resumen.mantenimiento, pct(resumen.mantenimiento, resumen.total)],
      ['Dados de baja', resumen.bajas, pct(resumen.bajas, resumen.total)],
    ],
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { halign: 'right' } },
  })

  autoTable(doc, {
    ...tableTheme(),
    startY: doc.lastAutoTable.finalY + 8,
    margin: { left: 12, right: 12 },
    head: [['ID', 'Equipo', 'Categoría', 'Laboratorio', 'Estado', 'Marca', 'Fecha registro', 'Descripción']],
    body: equipos.map(e => [
      e.id,
      e.nombre,
      e.categoria,
      e.laboratorio_nombre,
      estadoLabels[e.estado] || e.estado,
      text(e.marca, 'S/M'),
      dateText(e.fecha_registro),
      text(e.descripcion, ''),
    ]),
    columnStyles: {
      0: { halign: 'right', cellWidth: 12 },
      1: { cellWidth: 34 },
      3: { cellWidth: 30 },
      7: { cellWidth: 60 },
    },
  })

  addFooter(doc)
  const suffix = labNombre ? safeName(labNombre) : 'todos'
  downloadPdf(doc, `inventario-${suffix}-${meta.file}.pdf`)
}

export async function exportEquiposExcel({ equipos, labNombre, usuario }) {
  const XLSX = await loadXlsx()
  const meta = stamp()
  const workbook = XLSX.utils.book_new()
  const subtitleText = labNombre || 'Todos los laboratorios'

  workbook.Props = {
    Title: `Inventario - ${subtitleText}`,
    Subject: 'Inventario de equipos',
    Author: usuario?.nombre || 'AguiLab',
    Company: 'ITSJR',
    CreatedDate: new Date(),
  }

  const resumen = {
    total: equipos.length,
    disponibles: equipos.filter(e => e.estado === 'disponible').length,
    mantenimiento: equipos.filter(e => e.estado === 'mantenimiento').length,
    en_uso: equipos.filter(e => e.estado === 'en_uso').length,
    bajas: equipos.filter(e => e.estado === 'baja').length,
  }

  appendSheet(XLSX, workbook, 'Resumen', [
    [`AguiLab - Inventario de Equipos`],
    ['Laboratorio', subtitleText],
    ['Generado', meta.display],
    ['Usuario', usuario?.nombre || 'Usuario del sistema'],
    [],
    ['Indicador', 'Valor', 'Porcentaje'],
    ['Total de equipos', resumen.total, '100%'],
    ['Disponibles', resumen.disponibles, pct(resumen.disponibles, resumen.total)],
    ['En uso', resumen.en_uso, pct(resumen.en_uso, resumen.total)],
    ['En mantenimiento', resumen.mantenimiento, pct(resumen.mantenimiento, resumen.total)],
    ['Dados de baja', resumen.bajas, pct(resumen.bajas, resumen.total)],
  ], [34, 20, 20])

  appendSheet(XLSX, workbook, 'Equipos', [
    ['ID', 'Equipo', 'Categoría', 'Laboratorio', 'Estado', 'Marca', 'Descripción', 'Fecha registro'],
    ...equipos.map(e => [
      e.id,
      e.nombre,
      e.categoria,
      e.laboratorio_nombre,
      estadoLabels[e.estado] || e.estado,
      text(e.marca, 'S/M'),
      text(e.descripcion, ''),
      dateText(e.fecha_registro),
    ]),
  ], [10, 28, 20, 24, 16, 16, 44, 22])

  const suffix = labNombre ? safeName(labNombre) : 'todos'
  saveWorkbook(XLSX, workbook, `inventario-${suffix}-${meta.file}.xlsx`)
}
