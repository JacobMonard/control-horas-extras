// js/app.js

// Importar funciones de helpers.js
import { cargarCSV, guardarDatos, cargarDatos, limpiarTabla, renderizarTablaHorasExtras } from './helpers.js';

// --- Constantes para los índices de las columnas en el CSV ---
const CSV_COLUMN_INDEX = {
    JEFE_LIDER: 0, // Columna "JEFE (LIDER DEL CENTRO DE ARMADO)" donde está Nestor
    JEFE_REGISTRA: 1, // Columna "JEFE QUE RIGISTRA LA NOVEDAD" para David, Oriol, y empleados a su cargo
    APELLIDOS_NOMBRES: 2,
    DNI_CE: 3,
    CODIGO: 4,
    PUESTO: 5
};

let trabajadoresMaestro = [];
let horasExtras = [];
const CSV_PATH = 'assets/trabajadores_maestro.csv';

// --- Elementos del DOM ---
const horasExtrasForm = document.getElementById('horas-extras-form');
const quienRegistraSelect = document.getElementById('quienRegistra');
const apellidosNombresInputSearch = document.getElementById('apellidosNombresInputSearch');
const dniCeInput = document.getElementById('dniCe');
const codigoInput = document.getElementById('codigo');
const puestoInput = document.getElementById('puesto');

// --- Elementos de fecha y hora ---
const fechaIngresoInput = document.getElementById('fechaIngreso');
const ingresoInput = document.getElementById('ingreso');
const fechaSalidaInput = document.getElementById('fechaSalida');
const salidaInput = document.getElementById('salida');

const observacionTextarea = document.getElementById('observacion');
const descargarHorasExtrasBtn = document.getElementById('descargarHorasExtrasBtn');
const borrarRegistrosBtn = document.getElementById('borrarRegistrosBtn');
const nombresListDatalist = document.getElementById('nombres-list');

// --- Nombres de los coordinadores que pueden registrar novedades ---
// Se añaden explícitamente para asegurar que siempre estén en el select
const COORDINADORES_QUE_REGISTRAN = [
    "Nestor Jose Lopez Peraza - Supervisor Centros de Armado",
    "Oriol Westreycher Flores - Coordinador Zona Centro y Sur",
    "David Valencia Chinchay - Coordinador Zona Norte"
];

// --- Inicialización de la aplicación ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar trabajadores del CSV
    try {
        const data = await cargarCSV(CSV_PATH);
        trabajadoresMaestro = data.map(row => ({
            jefeLider: row[CSV_COLUMN_INDEX.JEFE_LIDER],
            jefeRegistra: row[CSV_COLUMN_INDEX.JEFE_REGISTRA],
            apellidosNombres: row[CSV_COLUMN_INDEX.APELLIDOS_NOMBRES],
            dniCe: row[CSV_COLUMN_INDEX.DNI_CE],
            codigo: row[CSV_COLUMN_INDEX.CODIGO],
            puesto: row[CSV_COLUMN_INDEX.PUESTO]
        }));
        console.log('Trabajadores Maestro cargado:', trabajadoresMaestro);
        poblarCoordinadoresEnSelect(); // Poblar el select de quién registra

    } catch (error) {
        console.error('Error al cargar el archivo CSV:', error);
        alert('Error al cargar la base de datos de trabajadores. Asegúrate de que "trabajadores_maestro.csv" existe y está bien formateado.');
    }

    // 2. Cargar horas extras guardadas
    horasExtras = cargarDatos('horasExtrasData') || [];
    console.log('Horas extras cargadas desde localStorage:', horasExtras);
    renderizarTablaHorasExtras(horasExtras);

    // 3. Configurar Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registrado con éxito:', registration);
                })
                .catch(error => {
                    console.error('Fallo el registro del Service Worker:', error);
                });
        });
    }

    // 4. Establecer la fecha actual por defecto en los campos de fecha
    const today = new Date();
    const currentYear = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    fechaIngresoInput.value = `${currentYear}-${mm}-${dd}`;
    fechaSalidaInput.value = `${currentYear}-${mm}-${dd}`;
});

// --- Funciones de Lógica de Negocio ---

/**
 * Pobla el select de "quienRegistra" con los nombres de los coordinadores que pueden registrar.
 */
function poblarCoordinadoresEnSelect() {
    const coordinadoresSet = new Set();

    // 1. Añadir los coordinadores principales definidos en la constante (Nestor, Oriol, David)
    COORDINADORES_QUE_REGISTRAN.forEach(coord => {
        coordinadoresSet.add(coord);
    });

    // 2. Opcional: Si hay otros coordinadores en la columna JEFE_REGISTRA del CSV que no están en la lista fija,
    //    también se pueden añadir aquí para que aparezcan.
    trabajadoresMaestro.forEach(trabajador => {
        if (trabajador.jefeRegistra && trabajador.jefeRegistra.trim() !== '') {
            coordinadoresSet.add(trabajador.jefeRegistra.trim());
        }
    });

    quienRegistraSelect.innerHTML = '<option value="">Seleccione...</option>'; // Limpiar y añadir opción por defecto

    Array.from(coordinadoresSet).sort().forEach(coordinador => {
        const option = document.createElement('option');
        option.value = coordinador;
        option.textContent = coordinador;
        quienRegistraSelect.appendChild(option);
    });

    console.log('Coordinadores disponibles en el select:', Array.from(coordinadoresSet).sort());
}


/**
 * Filtra los trabajadores maestros basándose en el coordinador seleccionado y el término de búsqueda por Apellidos y Nombres.
 * @param {string} coordinadorSeleccionado - Nombre completo del coordinador seleccionado.
 * @param {string} searchTerm - Término de búsqueda en Apellidos y Nombres.
 * @returns {Array} - Lista de trabajadores filtrados.
 */
function filtrarTrabajadores(coordinadorSeleccionado, searchTerm) {
    let filtered = trabajadoresMaestro; // Por defecto, el array completo de trabajadores

    const NESTOR_SUPERVISOR = "Nestor Jose Lopez Peraza - Supervisor Centros de Armado";

    if (coordinadorSeleccionado === NESTOR_SUPERVISOR) {
        // Si el coordinador seleccionado es Nestor, ve a TODOS los trabajadores.
        // No se aplica filtro adicional por la columna 'JEFE QUE RIGISTRA LA NOVEDAD'.
    } else if (coordinadorSeleccionado && coordinadorSeleccionado !== '') {
        // Para otros coordinadores (Oriol, David, etc.), se filtra por la columna 'JEFE QUE RIGISTRA LA NOVEDAD'.
        filtered = filtered.filter(trabajador =>
            trabajador.jefeRegistra && trabajador.jefeRegistra.trim() === coordinadorSeleccionado.trim()
        );
    } else {
        // Si no hay coordinador seleccionado en "QUIÉN REGISTRA LA NOVEDAD?",
        // la lista de "APELLIDOS Y NOMBRES" estará vacía.
        return [];
    }

    // Aplicar filtro de búsqueda si hay un término (solo en Apellidos y Nombres)
    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(trabajador =>
            (trabajador.apellidosNombres && trabajador.apellidosNombres.toLowerCase().includes(lowerCaseSearchTerm))
        );
    }

    return filtered;
}


/**
 * Actualiza la datalist de Apellidos y Nombres basándose en el coordinador seleccionado y el texto de búsqueda.
 */
function actualizarSugerenciasYCampos() {
    const coordinadorSeleccionado = quienRegistraSelect.value;
    const searchTerm = apellidosNombresInputSearch.value;

    // Limpiar datalist y campos de autocompletado cada vez que se actualizan las sugerencias
    nombresListDatalist.innerHTML = '';
    dniCeInput.value = '';
    codigoInput.value = '';
    puestoInput.value = '';

    if (!coordinadorSeleccionado) {
        apellidosNombresInputSearch.placeholder = "Seleccione un coordinador primero...";
        apellidosNombresInputSearch.disabled = true;
        return;
    } else {
        apellidosNombresInputSearch.placeholder = "Empieza a escribir los Apellidos y Nombres del trabajador...";
        apellidosNombresInputSearch.disabled = false;
    }

    const filteredTrabajadores = filtrarTrabajadores(coordinadorSeleccionado, searchTerm);

    // Poblar datalist con los Apellidos y Nombres de los trabajadores filtrados
    filteredTrabajadores.forEach(trabajador => {
        if (trabajador.apellidosNombres) {
            const option = document.createElement('option');
            option.value = trabajador.apellidosNombres;
            option.textContent = `${trabajador.apellidosNombres} (DNI: ${trabajador.dniCe})`;
            nombresListDatalist.appendChild(option);
        }
    });

    // Autocompletar los campos si el término de búsqueda coincide exactamente con un Apellidos y Nombres filtrado
    const exactMatch = filteredTrabajadores.find(trabajador =>
        (trabajador.apellidosNombres && trabajador.apellidosNombres.toLowerCase() === searchTerm.toLowerCase())
    );

    if (exactMatch) {
        apellidosNombresInputSearch.value = exactMatch.apellidosNombres;
        dniCeInput.value = exactMatch.dniCe;
        codigoInput.value = exactMatch.codigo;
        puestoInput.value = exactMatch.puesto;
    }
}


/**
 * Busca un trabajador por su Apellidos y Nombres exactos
 * dentro de los trabajadores filtrados por el coordinador.
 * Se usa cuando el usuario selecciona una sugerencia o termina de escribir.
 * @param {string} nombreCompletoValue - El valor introducido (Apellidos y Nombres).
 * @param {string} coordinadorSeleccionado - El coordinador actualmente seleccionado.
 */
function buscarYAutocompletarTrabajador(nombreCompletoValue, coordinadorSeleccionado) {
    const lowerCaseNombreCompletoValue = nombreCompletoValue.toLowerCase();
    const filteredTrabajadores = filtrarTrabajadores(coordinadorSeleccionado, '');

    const foundTrabajador = filteredTrabajadores.find(trabajador =>
        (trabajador.apellidosNombres && trabajador.apellidosNombres.toLowerCase() === lowerCaseNombreCompletoValue)
    );

    if (foundTrabajador) {
        apellidosNombresInputSearch.value = foundTrabajador.apellidosNombres;
        dniCeInput.value = foundTrabajador.dniCe;
        codigoInput.value = foundTrabajador.codigo;
        puestoInput.value = foundTrabajador.puesto;
    } else {
        dniCeInput.value = '';
        codigoInput.value = '';
        puestoInput.value = '';
    }
}


// --- Event Listeners ---

// Cuando cambia el coordinador en el select "¿QUIÉN REGISTRA LA NOVEDAD?"
quienRegistraSelect.addEventListener('change', () => {
    actualizarSugerenciasYCampos();
    apellidosNombresInputSearch.value = '';
    dniCeInput.value = '';
    codigoInput.value = '';
    puestoInput.value = '';
});

// Cuando el usuario escribe en el campo de búsqueda de "APELLIDOS Y NOMBRES"
apellidosNombresInputSearch.addEventListener('input', () => {
    actualizarSugerenciasYCampos();
});

// Cuando el usuario selecciona una sugerencia de la datalist o sale del campo de "APELLIDOS Y NOMBRES"
apellidosNombresInputSearch.addEventListener('change', (event) => {
    const coordinadorSeleccionado = quienRegistraSelect.value;
    buscarYAutocompletarTrabajador(event.target.value, coordinadorSeleccionado);
});


// Manejar el envío del formulario de registro de horas extras
horasExtrasForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!apellidosNombresInputSearch.value || !dniCeInput.value || !codigoInput.value || !puestoInput.value) {
        alert('Por favor, selecciona un trabajador válido de la lista de sugerencias o asegúrate de que todos los campos del trabajador estén autocompletados (Apellidos y Nombres, DNI/CE, Código, Puesto).');
        return;
    }
    
    // Validar que las fechas y horas sean válidas y coherentes
    const fechaIngresoVal = new Date(fechaIngresoInput.value);
    const fechaSalidaVal = new Date(fechaSalidaInput.value);

    // Obtener horas y minutos
    const [hIngreso, mIngreso] = ingresoInput.value.split(':').map(Number);
    const [hSalida, mSalida] = salidaInput.value.split(':').map(Number);

    // Crear objetos Date completos para una comparación precisa
    const momentoIngreso = new Date(fechaIngresoVal.getFullYear(), fechaIngresoVal.getMonth(), fechaIngresoVal.getDate(), hIngreso, mIngreso);
    const momentoSalida = new Date(fechaSalidaVal.getFullYear(), fechaSalidaVal.getMonth(), fechaSalidaVal.getDate(), hSalida, mSalida);

    if (momentoSalida <= momentoIngreso) {
        alert('La fecha y hora de SALIDA deben ser posteriores a la fecha y hora de INGRESO.');
        return;
    }

    const nuevaHoraExtra = {
        quienRegistra: quienRegistraSelect.value,
        dniCe: dniCeInput.value,
        apellidosNombres: apellidosNombresInputSearch.value,
        codigo: codigoInput.value,
        puesto: puestoInput.value,
        fechaIngreso: fechaIngresoInput.value,
        ingreso: ingresoInput.value,
        fechaSalida: fechaSalidaInput.value,
        salida: salidaInput.value,
        observacion: observacionTextarea.value || 'N/A'
    };

    horasExtras.push(nuevaHoraExtra);
    guardarDatos('horasExtrasData', horasExtras);
    renderizarTablaHorasExtras(horasExtras);
    horasExtrasForm.reset();

    const today = new Date();
    const currentYear = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    fechaIngresoInput.value = `${currentYear}-${mm}-${dd}`;
    fechaSalidaInput.value = `${currentYear}-${mm}-${dd}`;

    apellidosNombresInputSearch.value = '';
    dniCeInput.value = '';
    codigoInput.value = '';
    puestoInput.value = '';

    console.log('Hora extra registrada:', nuevaHoraExtra);
    alert('Hora extra registrada con éxito!');
});

// Evento para descargar el informe Excel
descargarHorasExtrasBtn.addEventListener('click', () => {
    if (horasExtras.length === 0) {
        alert('No hay registros de horas extras para descargar.');
        return;
    }

    // Definir los encabezados del archivo Excel
    const headers = [
        'Quién Registra', 'DNI/CE', 'Apellidos y Nombres', 'Código', 'Puesto',
        'Fecha Ingreso', 'Hora Ingreso', 'Fecha Salida', 'Hora Salida', 'Observación'
    ];

    // Mapear los datos de las horas extras a un array de arrays para SheetJS
    const dataForExcel = [headers]; // La primera fila es el encabezado
    horasExtras.forEach(he => {
        dataForExcel.push([
            he.quienRegistra,
            he.dniCe,
            he.apellidosNombres,
            he.codigo,
            he.puesto,
            he.fechaIngreso,
            he.ingreso,
            he.fechaSalida,
            he.salida,
            he.observacion
        ]);
    });

    // Crear una hoja de trabajo (worksheet) a partir del array de arrays
    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);

    // Crear un libro de trabajo (workbook)
    const wb = XLSX.utils.book_new();
    // Añadir la hoja de trabajo al libro con un nombre
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Horas Extras");

    // Generar el nombre del archivo
    const filename = `informe_horas_extras_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Escribir el libro de trabajo a un archivo y descargarlo
    XLSX.writeFile(wb, filename);
});

// Evento para borrar todos los registros de horas extras del localStorage
borrarRegistrosBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas borrar TODOS los registros de horas extras? Esta acción es irreversible.')) {
        localStorage.removeItem('horasExtrasData');
        horasExtras = [];
        renderizarTablaHorasExtras(horasExtras);
        alert('Todos los registros de horas extras han sido borrados.');
    }
});