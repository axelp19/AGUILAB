export const laboratorios = [
  { id: 1, nombre: 'Lab LRS', clave: 'LAB-LRS', piso: 'Piso 2', edificio: 'Edificio P', responsable: 'Ariopajita Rojo López', total: 48, disponibles: 42, mantenimiento: 4, bajas: 2 },
  { id: 2, nombre: 'Lab LSO', clave: 'LAB-LSO', piso: 'Piso 2', edificio: 'Edificio P', responsable: 'Ariopajita Rojo López', total: 47, disponibles: 39, mantenimiento: 6, bajas: 2 },
];

export const equipos = [
  { id:'EQ-001', nombre:'PC Lenovo', categoria:'Computadora', laboratorio:'Lab LRS', estado:'disponible',    fecha:'12/01/2026' },
  { id:'EQ-002', nombre:'Monitor ASUS"',   categoria:'Monitor',     laboratorio:'Lab LRS',  estado:'mantenimiento', fecha:'12/01/2026' },
  { id:'EQ-003', nombre:'Teclado ASUS', categoria:'Periférico',  laboratorio:'Lab LRS',  estado:'en_uso',        fecha:'15/01/2026' },
  { id:'EQ-004', nombre:'Mouse Óptico',     categoria:'Periférico',  laboratorio:'Lab LSO',  estado:'disponible',    fecha:'15/01/2026' },
  { id:'EQ-005', nombre:'Silla',  categoria:'Mobiliario',  laboratorio:'Lab LSO',   estado:'baja',          fecha:'20/02/2026' },
  { id:'EQ-006', nombre:'Impresora HP',     categoria:'Impresora',   laboratorio:'Lab LSO',  estado:'disponible',    fecha:'05/03/2026' },
];

export const tickets = [
  { id:'TK-023', equipo:'Teclado EQ-003',  lab:'Lab LRS', tipo:'Daño físico',     prioridad:'alta',  estado:'abierto', reporto:'J. García',   fecha:'17/03/2026' },
  { id:'TK-022', equipo:'Monitor EQ-002',  lab:'Lab LRS', tipo:'Mantenimiento',   prioridad:'media', estado:'proceso', reporto:'L. Martínez', fecha:'14/03/2026' },
  { id:'TK-021', equipo:'Impresora EQ-006',lab:'Lab LSO', tipo:'Equipo faltante', prioridad:'alta',  estado:'abierto', reporto:'Admin',       fecha:'12/03/2026' },
  { id:'TK-020', equipo:'Silla EQ-005',    lab:'Lab LSO', tipo:'Daño físico',     prioridad:'baja',  estado:'cerrado', reporto:'R. Torres',   fecha:'08/03/2026' },
];

export const usuarios = [
  { id:1, nombre:'Administrador General', correo:'admin@itsjr.edu.mx',      rol:'administrador', lab:'Todos',   activo:true,  ultimoAcceso:'Hoy 10:34' },
  { id:2, nombre:'Ariopajita Rojo López', correo:'arojo@itsjr.edu.mx',      rol:'administrador',     lab:'Lab LRS y LSO', activo:true,  ultimoAcceso:'Ayer 15:20' },
  { id:3, nombre:'Axel Ponce',      correo:'l22590349@itsjr.edu.mx',     rol:'consultor',     lab:'Lab LRS y LSO', activo:true, ultimoAcceso:'15/03/2026' },
];

export const categorias = [
  { id:1, nombre:'Computadora',   emoji:'💻', descripcion:'PCs de escritorio, laptops, All-in-One', count:60 },
  { id:2, nombre:'Monitor',       emoji:'🖥️', descripcion:'Monitores LCD, LED, pantallas',          count:25 },
  { id:3, nombre:'Periférico',    emoji:'⌨️', descripcion:'Teclados, ratones, webcams',             count:95 },
  { id:4, nombre:'Mobiliario',    emoji:'🪑', descripcion:'Sillas, mesas, estantes',               count:20 },
  { id:5, nombre:'Impresora',     emoji:'🖨️', descripcion:'Impresoras láser, de inyección',        count:5  },
  { id:6, nombre:'Equipo de Red', emoji:'📡', descripcion:'Switches, routers, patch panels',       count:8  },
];

export const logActividad = [
  { id:1, accion:'CREAR',    descripcion:'Equipo EQ-045 registrado',                detalle:'Lab LRS · PC ASUS', usuario:'Admin',            fecha:'Hoy 10:34',  color:'#0a7c4e' },
  { id:2, accion:'CREAR',    descripcion:'Ticket #TK-023 abierto',                  detalle:'Teclado EQ-003 · Lab LRS',   usuario:'J. García',        fecha:'Hoy 09:55',  color:'#d97706' },
  { id:3, accion:'EDITAR',   descripcion:'Equipo EQ-002 → Estado: Mantenimiento',  detalle:'Monitor LG · Lab LRS',       usuario:'Admin',            fecha:'Hoy 09:20',  color:'#003087' },
  { id:4, accion:'EXPORTAR', descripcion:'Reporte mensual exportado',               detalle:'Todos los labs · PDF',       usuario:'Coord. Principal', fecha:'Ayer 16:00', color:'#d97706' },
  { id:5, accion:'BAJA',     descripcion:'Equipo EQ-033 dado de baja',              detalle:'Silla · Lab LSO',            usuario:'Admin',            fecha:'Ayer 14:10', color:'#CC0000' },
  { id:6, accion:'EDITAR',   descripcion:'Usuario l22590349@itsjr.edu.mx desactivado', detalle:'Módulo de Usuarios',        usuario:'Admin',            fecha:'15/03/2026', color:'#003087' },
];