// js/app.js

// --- 1. Registro del Service Worker (Va al inicio del archivo) ---
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

// --- 2. Variables Globales y Referencias a Elementos del DOM ---
const quienRegistraSelect = document.getElementById('quienRegistra');
const dniCeInput = document.getElementById('dniCe');
const dniList = document.getElementById('dni-list');
const apellidosNombresInput = document.getElementById('apellidosNombres');
const codigoInput = document.getElementById('codigo');
const puestoInput = document.getElementById('puesto');
const fechaInput = document.getElementById('fecha');
const ingresoInput = document.getElementById('ingreso');
const salidaInput = document.getElementById('salida');
const observacionInput = document.getElementById('observacion');
const horasExtrasForm = document.getElementById('horas-extras-form');
const descargarHorasExtrasBtn = document.getElementById('descargarHorasExtrasBtn');
const borrarRegistrosBtn = document.getElementById('borrarRegistrosBtn'); // NUEVA REFERENCIA AL BOTÓN
const horasExtrasTableBody = document.querySelector('#horas-extras-table tbody');

let trabajadoresMaestro = [];
let horasExtrasRegistradas = [];

// --- 3. Cargar el Archivo `trabajadores_maestro.csv` ---
async function loadTrabajadoresMaestro() {
    try {
        const response = await fetch('assets/trabajadores_maestro.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        trabajadoresMaestro = parseCSV(csvText);
        console.log('Trabajadores Maestro cargado:', trabajadoresMaestro);

        populateDniDatalist();
    } catch (error) {
        console.error('Error al cargar o parsear trabajadores_maestro.csv:', error);
        alert('No se pudo cargar la lista de trabajadores. La función de autocompletado de DNI/CE podría no funcionar.');
    }
}

function populateDniDatalist() {
    dniList.innerHTML = '';
    trabajadoresMaestro.forEach(trabajador => {
        const option = document.createElement('option');
        option.value = trabajador['DNI/CE']; // Acceso con corchetes
        dniList.appendChild(option);
    });
}

// --- 4. Lógica de Autocompletado y Relleno Automático de Campos (basado en DNI/CE) ---
dniCeInput.addEventListener('input', () => {
    const inputValue = dniCeInput.value.trim();
    const selectedTrabajador = trabajadoresMaestro.find(
        t => t['DNI/CE'] === inputValue // Acceso con corchetes
    );

    if (selectedTrabajador) {
        apellidosNombresInput.value = selectedTrabajador['APELLIDOS Y NOMBRES'] || ''; // Acceso con corchetes
        codigoInput.value = selectedTrabajador['CODIGO'] || ''; // Acceso con corchetes
        puestoInput.value = selectedTrabajador['PUESTO'] || ''; // Acceso con corchetes
    } else {
        apellidosNombresInput.value = '';
        codigoInput.value = '';
        puestoInput.value = '';
    }
});

// --- 5. Manejo del Envío del Formulario (Registro de Horas Extras) ---
horasExtrasForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!quienRegistraSelect.value) {
        alert('Por favor, selecciona quién registra la novedad.');
        quienRegistraSelect.focus();
        return;
    }

    const selectedTrabajador = trabajadoresMaestro.find(
        t => t['DNI/CE'] === dniCeInput.value.trim() // Acceso con corchetes
    );

    if (!selectedTrabajador) {
        alert('Por favor, ingresa o selecciona un DNI/CE válido de la lista de trabajadores.');
        dniCeInput.focus();
        return;
    }

    const ingresoTime = ingresoInput.value;
    const salidaTime = salidaInput.value;

    const parseTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    if (salidaTime && ingresoTime && parseTime(salidaTime) <= parseTime(ingresoTime)) {
        alert('La hora de salida debe ser posterior a la hora de ingreso.');
        salidaInput.focus();
        return;
    }

    const newHoraExtra = {
        quienRegistra: quienRegistraSelect.value,
        dniCe: selectedTrabajador['DNI/CE'], // Acceso con corchetes
        apellidosNombres: selectedTrabajador['APELLIDOS Y NOMBRES'], // Acceso con corchetes
        codigo: selectedTrabajador['CODIGO'], // Acceso con corchetes
        puesto: selectedTrabajador['PUESTO'], // Acceso con corchetes
        fecha: fechaInput.value,
        ingreso: ingresoInput.value,
        salida: salidaInput.value,
        observacion: observacionInput.value.trim()
    };

    horasExtrasRegistradas.push(newHoraExtra);
    saveDataToLocalStorage('horasExtrasData', horasExtrasRegistradas);
    console.log('Hora extra registrada:', newHoraExtra);
    alert('¡Hora extra registrada con éxito!');

    horasExtrasForm.reset();
    apellidosNombresInput.value = '';
    codigoInput.value = '';
    puestoInput.value = '';

    renderHorasExtrasTable();
});

// --- 6. Cargar y Mostrar Registros Existentes al Inicio ---
function loadAndRenderHorasExtras() {
    const loadedData = loadDataFromLocalStorage('horasExtrasData');
    if (loadedData) {
        horasExtrasRegistradas = loadedData;
        console.log('Horas extras cargadas desde localStorage:', horasExtrasRegistradas);
    }
    renderHorasExtrasTable();
}

function renderHorasExtrasTable() {
    horasExtrasTableBody.innerHTML = '';

    if (horasExtrasRegistradas.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = '<td colspan="9" style="text-align: center; color: #777;">No hay horas extras registradas aún.</td>';
        horasExtrasTableBody.appendChild(noDataRow);
        return;
    }

    horasExtrasRegistradas.forEach(hora => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${hora.quienRegistra}</td>
            <td>${hora.dniCe}</td>
            <td>${hora.apellidosNombres}</td>
            <td>${hora.codigo}</td>
            <td>${hora.puesto}</td>
            <td>${hora.fecha}</td>
            <td>${hora.ingreso}</td>
            <td>${hora.salida}</td>
            <td>${hora.observacion || '-'}</td>
        `;
        horasExtrasTableBody.appendChild(row);
    });
}

// --- 7. Lógica del Botón de Descarga de CSV ---
descargarHorasExtrasBtn.addEventListener('click', () => {
    if (horasExtrasRegistradas.length === 0) {
        alert('No hay horas extras para descargar.');
        return;
    }

    const objectKeys = [
        "quienRegistra",
        "dniCe",
        "apellidosNombres",
        "codigo",
        "puesto",
        "fecha",
        "ingreso",
        "salida",
        "observacion"
    ];

    const displayHeaders = [
        "QUIEN REGISTRA LA NOVEDAD",
        "DNI/CE",
        "APELLIDOS Y NOMBRES",
        "CODIGO",
        "PUESTO",
        "Fecha",
        "INGRESO",
        "SALIDA",
        "OBSERVACION DE LA NOVEDAD"
    ];

    const contenidoCSV = convertToCSV(horasExtrasRegistradas, objectKeys, displayHeaders);
    const filename = `informe_horas_extras_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(contenidoCSV, filename);
});

// --- 8. Lógica del Botón Borrar Registros (NUEVO) ---
borrarRegistrosBtn.addEventListener('click', () => {
    const confirmDelete = confirm('¿Estás seguro de que deseas borrar TODOS los registros de horas extras? Esta acción es irreversible.');

    if (confirmDelete) {
        localStorage.removeItem('horasExtrasData'); // Borra los datos del localStorage
        horasExtrasRegistradas = []; // Vacía el array en memoria
        renderHorasExtrasTable(); // Actualiza la tabla para que se vea vacía
        alert('Todos los registros de horas extras han sido borrados.');
    }
});

// --- 9. Inicialización de la Aplicación ---
document.addEventListener('DOMContentLoaded', () => {
    loadTrabajadoresMaestro();
    loadAndRenderHorasExtras();
});