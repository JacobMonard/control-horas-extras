// --- Rutas y Variables Globales ---
const CSV_PATH = 'assets/trabajadores_maestro.csv';

// Constantes para los nombres de las claves en localStorage
const LOCAL_STORAGE_HORAS_EXTRAS_KEY = 'horasExtrasData';
const LOCAL_STORAGE_EMPLEADOS_DINAMICOS_KEY = 'empleadosDinamicos';

// Variables para almacenar los datos (se inicializan vacías y se llenan al cargar)
let trabajadoresMaestro = [];
let allAvailableTrabajadores = []; // Esta seguirá siendo la lista combinada para eficiencia en búsquedas

// --- Funciones de Utilidad de UI ---
/**
 * Muestra un modal de mensaje personalizado.
 * @param {string} title Título del modal.
 * @param {string} message Contenido del mensaje.
 * @param {string} type Tipo de mensaje ('success', 'error', 'info', 'warning').
 */
export function showMessageModal(title, message, type = 'info') {
    const messageModal = document.getElementById('messageModal');
    const messageModalTitle = document.getElementById('messageModalTitle');
    const messageModalText = document.getElementById('messageModalText');
    const messageModalOkButton = document.getElementById('messageModalOkButton');

    messageModalTitle.textContent = title;
    messageModalText.textContent = message;

    // Limpiar clases de tipo previas
    messageModalTitle.className = '';
    messageModalText.className = '';
    messageModalOkButton.className = 'submit-button'; // Resetear a la clase base

    // Añadir clase de tipo para estilos CSS si es necesario (ej: color del título)
    if (type === 'error') {
        messageModalTitle.classList.add('modal-title-error');
        messageModalOkButton.style.backgroundColor = '#e74c3c'; // Rojo para error
    } else if (type === 'success') {
        messageModalTitle.classList.add('modal-title-success');
        messageModalOkButton.style.backgroundColor = '#2ecc71'; // Verde para éxito
    } else if (type === 'warning') {
        messageModalTitle.classList.add('modal-title-warning');
        messageModalOkButton.style.backgroundColor = '#f39c12'; // Naranja para advertencia
    } else { // info
        messageModalTitle.classList.add('modal-title-info');
        messageModalOkButton.style.backgroundColor = '#3498db'; // Azul para info
    }

    messageModal.classList.add('active'); // Muestra el modal

    messageModalOkButton.onclick = () => {
        messageModal.classList.remove('active');
    };
    document.getElementById('messageModalClose').onclick = () => {
        messageModal.classList.remove('active');
    };
}

/**
 * Normaliza una cadena de texto para comparaciones (quita tildes y convierte a minúsculas).
 * @param {string} text La cadena a normalizar.
 * @returns {string} La cadena normalizada.
 */
function normalizarTexto(text) {
    if (!text) return '';
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}


// --- Funciones de Carga y Guardado ---

/**
 * Carga el archivo CSV de trabajadores maestros.
 * @returns {Promise<Array>} Una promesa que resuelve con los datos del CSV.
 */
export async function cargarCSV() {
    return new Promise((resolve, reject) => {
        Papa.parse(CSV_PATH, {
            download: true,
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    const data = results.data.slice(1);
                    trabajadoresMaestro = data.map(row => ({
                        jefeLider: row[0] ? row[0].trim() : '',
                        jefeRegistra: row[1] ? row[1].trim() : '',
                        apellidosNombres: row[2] ? row[2].trim() : '',
                        dniCe: row[3] ? row[3].trim() : '',
                        codigo: row[4] ? row[4].trim() : '',
                        puesto: row[5] ? row[5].trim() : ''
                    })).filter(row => row.apellidosNombres !== ''); // Filtra filas que puedan quedar vacías si el CSV tiene comas pero no contenido

                    console.log('Base de datos de trabajadores maestros cargada con éxito:', trabajadoresMaestro.length, 'registros.');
                    resolve(trabajadoresMaestro);
                } else {
                    const errorMsg = 'El archivo CSV está vacío o no contiene datos válidos.';
                    console.error(errorMsg);
                    showMessageModal('Error de Carga CSV', `${errorMsg} Asegúrate de que '${CSV_PATH}' existe y está bien formateado (puede tener encabezados, pero no filas vacías).`, 'error');
                    reject(new Error(errorMsg));
                }
            },
            error: (err) => {
                const errorMsg = `Error al cargar o parsear el CSV: ${err.message}.`;
                console.error(errorMsg);
                showMessageModal('Error de Carga CSV', `${errorMsg} Asegúrate de que '${CSV_PATH}' existe y está bien formateado (puede tener encabezados, pero no filas vacías).`, 'error');
                reject(err);
            }
        });
    });
}

/**
 * Carga los empleados dinámicos desde localStorage.
 * @returns {Array} Array de empleados dinámicos.
 */
export function cargarEmpleadosDinamicos() {
    const data = localStorage.getItem(LOCAL_STORAGE_EMPLEADOS_DINAMICOS_KEY);
    try {
        const empleados = data ? JSON.parse(data) : [];
        console.log('Empleados dinámicos cargados desde localStorage:', empleados.length);
        return empleados;
    } catch (e) {
        console.error('Error al parsear empleados dinámicos de localStorage, se inicializará vacío.', e);
        showMessageModal('Error de Datos', 'Hubo un problema al cargar los empleados dinámicos. Se ha reiniciado la lista.', 'error');
        return [];
    }
}

/**
 * Guarda los empleados dinámicos en localStorage.
 * @param {Array} empleados Array de empleados a guardar.
 */
export function guardarEmpleadosDinamicos(empleados) {
    localStorage.setItem(LOCAL_STORAGE_EMPLEADOS_DINAMICOS_KEY, JSON.stringify(empleados));
    console.log('Empleados dinámicos guardados en localStorage:', empleados.length);
}

/**
 * Carga los registros de horas extras desde localStorage.
 * @returns {Array} Array de registros de horas extras.
 */
export function cargarHorasExtras() {
    const data = localStorage.getItem(LOCAL_STORAGE_HORAS_EXTRAS_KEY);
    try {
        const horas = data ? JSON.parse(data) : [];
        console.log('Horas extras cargadas desde localStorage:', horas.length);
        return horas;
    } catch (e) {
        console.error('Error al parsear horas extras de localStorage, se inicializará vacío.', e);
        showMessageModal('Error de Datos', 'Hubo un problema al cargar los registros de horas extras. Se ha reiniciado la lista.', 'error');
        return [];
    }
}

/**
 * Guarda los registros de horas extras en localStorage.
 * @param {Array} horas Array de horas extras a guardar.
 */
export function guardarHorasExtras(horas) {
    localStorage.setItem(LOCAL_STORAGE_HORAS_EXTRAS_KEY, JSON.stringify(horas));
    console.log('Horas extras guardadas en localStorage:', horas.length);
}

// --- Funciones de Utilidad de Datos ---

/**
 * Combina los trabajadores maestros y los dinámicos.
 * Exporta directamente `allAvailableTrabajadores` para que `app.js` pueda acceder a ella.
 */
export function actualizarTrabajadoresDisponibles(maestros, dinamicos) {
    allAvailableTrabajadores = [...maestros, ...dinamicos];
    console.log('Total de trabajadores disponibles (maestros + dinámicos):', allAvailableTrabajadores.length);
}

/**
 * Obtiene una lista de jefes/coordinadores únicos para los selects.
 * @returns {Array} Array de strings de jefes/coordinadores únicos.
 */
export function obtenerCoordinadoresUnicos() {
    const coordinadoresSet = new Set(allAvailableTrabajadores.map(t => `${t.jefeRegistra}`)); // Usamos jefeRegistra
    const coordinadoresArray = Array.from(coordinadoresSet).filter(Boolean).sort(); // Eliminar vacíos y ordenar
    console.log('Coordinadores disponibles para selects:', coordinadoresArray.length);
    return coordinadoresArray;
}

/**
 * Filtra los trabajadores por el jefe/coordinador seleccionado.
 * Este ahora también filtra los dinámicos por su 'registradoPorJefe'.
 * Se añade la excepción para "Nestor Jose Lopez Peraza - Supervisor Centros de Armado".
 * @param {string} jefeSeleccionado El valor del jefe seleccionado en el select.
 * @param {Array} maestros La lista de trabajadores maestros.
 * @param {Array} dinamicos La lista de trabajadores dinámicos.
 * @returns {Array} Array de trabajadores que corresponden al jefe seleccionado.
 */
export function filtrarTrabajadoresPorJefe(jefeSeleccionado, maestros, dinamicos) {
    if (!jefeSeleccionado) {
        return [];
    }

    // Definir el nombre del jefe que puede ver todos los colaboradores
    const NESTOR_LOPEZ = "Nestor Jose Lopez Peraza - Supervisor Centros de Armado";

    if (jefeSeleccionado === NESTOR_LOPEZ) {
        // Si el jefe es Nestor, devuelve la lista completa de todos los trabajadores (maestros + dinámicos)
        return [...maestros, ...dinamicos];
    } else {
        // Para otros jefes, aplica el filtro normal
        const filteredMaestros = maestros.filter(t => t.jefeRegistra === jefeSeleccionado);
        const filteredDinamicos = dinamicos.filter(t => t.registradoPorJefe === jefeSeleccionado);
        return [...filteredMaestros, ...filteredDinamicos];
    }
}

/**
 * Busca un trabajador por su nombre completo.
 * @param {string} nombreCompleto Nombre completo del trabajador a buscar.
 * @param {Array} trabajadores La lista de trabajadores sobre la cual buscar.
 * @returns {Object|undefined} El objeto trabajador si se encuentra, o undefined.
 */
export function buscarTrabajadorPorNombre(nombreCompleto, trabajadores) {
    const nombreNormalizado = normalizarTexto(nombreCompleto);
    return trabajadores.find(t => normalizarTexto(t.apellidosNombres) === nombreNormalizado);
}

/**
 * Genera un ID único basado en la fecha y un número aleatorio.
 * @returns {string} ID único.
 */
export function generarIdUnico() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`;
}

/**
 * Exporta los datos de horas extras a un archivo Excel (.xlsx).
 * Se ha eliminado la columna 'ID'.
 * @param {Array} data Los datos de horas extras a exportar.
 */
export function exportarAExcel(data) {
    if (data.length === 0) {
        showMessageModal('Advertencia', "No hay registros de horas extras para exportar.", 'warning');
        return;
    }

    // Encabezados sin la columna "ID"
    const headers = [
        "QUIÉN REGISTRA LA NOVEDAD", "DNI/CE", "APELLIDOS Y NOMBRES",
        "CÓDIGO", "PUESTO", "FECHA INGRESO", "HORA INGRESO",
        "FECHA SALIDA", "HORA SALIDA", "OBSERVACIÓN"
    ];

    // Mapear los datos, excluyendo el campo 'id'
    const exportData = data.map(item => [
        item.quienRegistra,
        item.dniCe,
        item.apellidosNombres,
        item.codigo,
        item.puesto,
        item.fechaIngreso,
        item.horaIngreso,
        item.fechaSalida,
        item.horaSalida,
        item.observacion
    ]);

    const ws_data = [headers, ...exportData];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "HorasExtras");

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const filename = `Reporte_Horas_Extras_${dateStr}.xlsx`;

    try {
        XLSX.writeFile(wb, filename);
        showMessageModal('Exportación Exitosa', `Reporte "${filename}" generado con éxito.`, 'success');
        console.log(`Reporte "${filename}" generado con éxito.`);
    } catch (e) {
        showMessageModal('Error de Exportación', `No se pudo generar el archivo Excel. Error: ${e.message}`, 'error');
        console.error('Error al generar el archivo Excel:', e);
    }
}