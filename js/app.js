// Importar funciones y variables desde helpers.js
import {
    cargarCSV,
    cargarEmpleadosDinamicos,
    guardarEmpleadosDinamicos,
    cargarHorasExtras,
    guardarHorasExtras,
    actualizarTrabajadoresDisponibles, // Esta función actualiza la variable interna en helpers.js
    obtenerCoordinadoresUnicos,
    filtrarTrabajadoresPorJefe,
    buscarTrabajadorPorNombre,
    generarIdUnico,
    exportarAExcel,
    showMessageModal // <-- Importa la nueva función de modal
} from './helpers.js';


// --- Elementos del DOM del Formulario Principal ---
const horasExtrasForm = document.getElementById('horas-extras-form');
const quienRegistraSelect = document.getElementById('quienRegistra');
const apellidosNombresInputSearch = document.getElementById('apellidosNombresInputSearch');
const nombresDatalist = document.getElementById('nombres-list');
const dniCeInput = document.getElementById('dniCe');
const codigoInput = document.getElementById('codigo');
const puestoInput = document.getElementById('puesto');
const fechaIngresoInput = document.getElementById('fechaIngreso');
const horaIngresoInput = document.getElementById('ingreso');
const fechaSalidaInput = document.getElementById('fechaSalida');
const horaSalidaInput = document.getElementById('salida');
const observacionTextarea = document.getElementById('observacion');

// --- Elementos del DOM de la Tabla de Reporte ---
const horasExtrasTableBody = document.querySelector('#horasExtrasTable tbody');
const descargarHorasExtrasBtn = document.getElementById('descargarHorasExtrasBtn');
const borrarRegistrosBtn = document.getElementById('borrarRegistrosBtn');
const horasExtrasTableHead = document.querySelector('#horasExtrasTable thead'); // Para obtener los encabezados


// --- Elementos del DOM del MODAL de Nuevo Colaborador ---
const nuevoColaboradorBtn = document.getElementById('nuevoColaboradorBtn');
const nuevoColaboradorModal = document.getElementById('nuevoColaboradorModal');
const newColaboradorModalCloseButton = document.getElementById('newColaboradorModalClose');
const nuevoColaboradorForm = document.getElementById('nuevoColaboradorForm');
const newColaboradorApellidosNombresInput = document.getElementById('newColaboradorApellidosNombres');
const newColaboradorDniCeInput = document.getElementById('newColaboradorDniCe');
const newColaboradorCodigoInput = document.getElementById('newColaboradorCodigo');
const newColaboradorPuestoInput = document.getElementById('newColaboradorPuesto');
const newColaboradorJefeRegistraSelect = document.getElementById('newColaboradorJefeRegistra'); // Este select es para EL JEFE QUE REGISTRA AL NUEVO COLABORADOR DINÁMICO.

// --- Elementos del DOM del MODAL de Eliminar Colaborador ---
const eliminarColaboradorBtn = document.getElementById('eliminarColaboradorBtn');
const eliminarColaboradorModal = document.getElementById('eliminarColaboradorModal');
const deleteColaboradorModalCloseButton = document.getElementById('deleteColaboradorModalClose');
const eliminarColaboradorForm = document.getElementById('eliminarColaboradorForm');
const colaboradorToDeleteSelect = document.getElementById('colaboradorToDeleteSelect');


// --- Variables para los datos ---
let trabajadoresMaestro = [];
let empleadosDinamicos = [];
let horasExtras = []; // Almacena los registros de horas extras

// Variable para almacenar la lista de trabajadores *filtrados por el jefe seleccionado*
let currentFilteredTrabajadores = [];

// --- Funciones de Inicialización y Carga de Datos ---

/**
 * Inicializa la aplicación cargando los datos y configurando la UI.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar empleados dinámicos del localStorage
    empleadosDinamicos = cargarEmpleadosDinamicos();

    // 2. Cargar datos del CSV
    try {
        const dataMaestro = await cargarCSV();
        trabajadoresMaestro = dataMaestro; // Asigna los datos cargados desde el CSV
    } catch (error) {
        console.error("Error al cargar el archivo CSV durante la inicialización:", error);
        // El showMessageModal ya se mostró en cargarCSV
    }

    // 3. Unir trabajadores maestros y dinámicos (para obtener la lista total de coordinadores)
    actualizarTrabajadoresDisponiblesEnHelpers();

    // 4. Poblar selects y datalists
    poblarCoordinadoresSelects();
    poblarColaboradoresToDeleteSelect(); // Para el modal de eliminar

    // 5. Cargar y renderizar horas extras existentes
    horasExtras = cargarHorasExtras();
    renderizarHorasExtras();

    console.log("Aplicación inicializada.");
});

/**
 * Actualiza la variable `allAvailableTrabajadores` en `helpers.js`
 * combinando los datos maestros y dinámicos actuales de `app.js`.
 * Es crucial llamar a esta función cada vez que `trabajadoresMaestro` o `empleadosDinamicos` cambien.
 */
function actualizarTrabajadoresDisponiblesEnHelpers() {
    actualizarTrabajadoresDisponibles(trabajadoresMaestro, empleadosDinamicos);
}

/**
 * Rellena los selects de "Quién Registra la Novedad" en el formulario principal
 * y en el modal de nuevo colaborador.
 */
function poblarCoordinadoresSelects() {
    const coordinadores = obtenerCoordinadoresUnicos(); // Obtiene la lista de helpers

    // Select principal
    quienRegistraSelect.innerHTML = '<option value="">Seleccione...</option>';
    coordinadores.forEach(jefe => {
        const option = document.createElement('option');
        option.value = jefe;
        option.textContent = jefe;
        quienRegistraSelect.appendChild(option);
    });

    // Select del modal "Agregar Nuevo Colaborador"
    newColaboradorJefeRegistraSelect.innerHTML = '<option value="">Seleccione...</option>';
    coordinadores.forEach(jefe => {
        const option = document.createElement('option');
        option.value = jefe;
        option.textContent = jefe;
        newColaboradorJefeRegistraSelect.appendChild(option);
    });
}

/**
 * Rellena el select del modal "Eliminar Colaborador Dinámico".
 * Este select solo debe mostrar los colaboradores que son "dinámicos" (no del CSV).
 */
function poblarColaboradoresToDeleteSelect() {
    colaboradorToDeleteSelect.innerHTML = '<option value="">Seleccione el colaborador a eliminar...</option>';
    if (empleadosDinamicos.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay colaboradores dinámicos para eliminar.';
        option.disabled = true;
        colaboradorToDeleteSelect.appendChild(option);
        eliminarColaboradorForm.querySelector('button[type="submit"]').disabled = true;
        return;
    }

    eliminarColaboradorForm.querySelector('button[type="submit"]').disabled = false;
    empleadosDinamicos.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.dniCe; // Usamos DNI/CE como valor único
        option.textContent = `${emp.apellidosNombres} - DNI/CE: ${emp.dniCe}`;
        colaboradorToDeleteSelect.appendChild(option);
    });
}


// --- Event Listeners del Formulario Principal ---

quienRegistraSelect.addEventListener('change', () => {
    const jefeSeleccionado = quienRegistraSelect.value;
    
    // Filtramos los trabajadores (maestros y dinámicos) según el jefe seleccionado
    // La lógica para Nestor Lopez Peraza está ahora dentro de filtrarTrabajadoresPorJefe
    currentFilteredTrabajadores = filtrarTrabajadoresPorJefe(jefeSeleccionado, trabajadoresMaestro, empleadosDinamicos);

    nombresDatalist.innerHTML = ''; // Limpiar datalist previo
    apellidosNombresInputSearch.value = ''; // Limpiar campo de búsqueda
    dniCeInput.value = '';
    codigoInput.value = '';
    puestoInput.value = '';

    if (jefeSeleccionado) {
        apellidosNombresInputSearch.disabled = false;
        currentFilteredTrabajadores.forEach(trabajador => {
            const option = document.createElement('option');
            option.value = trabajador.apellidosNombres;
            nombresDatalist.appendChild(option);
        });
        apellidosNombresInputSearch.placeholder = "Empieza a escribir los Apellidos y Nombres del trabajador...";
    } else {
        apellidosNombresInputSearch.disabled = true;
        apellidosNombresInputSearch.placeholder = "Seleccione un coordinador primero...";
    }
});

apellidosNombresInputSearch.addEventListener('input', () => {
    const nombreBuscado = apellidosNombresInputSearch.value;
    // Buscamos solo dentro de la lista filtrada por el jefe
    const trabajadorEncontrado = buscarTrabajadorPorNombre(nombreBuscado, currentFilteredTrabajadores);

    if (trabajadorEncontrado) {
        dniCeInput.value = trabajadorEncontrado.dniCe;
        codigoInput.value = trabajadorEncontrado.codigo;
        puestoInput.value = trabajadorEncontrado.puesto;
    } else {
        dniCeInput.value = '';
        codigoInput.value = '';
        puestoInput.value = '';
    }
});

horasExtrasForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const quienRegistra = quienRegistraSelect.value;
    const apellidosNombres = apellidosNombresInputSearch.value;
    const dniCe = dniCeInput.value;
    const codigo = codigoInput.value;
    const puesto = puestoInput.value;
    const fechaIngreso = fechaIngresoInput.value;
    const horaIngreso = horaIngresoInput.value;
    const fechaSalida = fechaSalidaInput.value;
    const horaSalida = horaSalidaInput.value;
    const observacion = observacionTextarea.value;

    // Validaciones básicas antes de guardar
    if (!quienRegistra || !apellidosNombres || !dniCe || !codigo || !puesto || !fechaIngreso || !horaIngreso || !fechaSalida || !horaSalida) {
        showMessageModal('Campos Obligatorios', 'Por favor, complete todos los campos obligatorios antes de registrar la novedad.', 'warning');
        return;
    }

    const nuevaHoraExtra = {
        id: generarIdUnico(),
        quienRegistra,
        apellidosNombres,
        dniCe,
        codigo,
        puesto,
        fechaIngreso,
        horaIngreso,
        fechaSalida,
        horaSalida,
        observacion
    };

    horasExtras.push(nuevaHoraExtra);
    guardarHorasExtras(horasExtras);
    renderizarHorasExtras(); // Actualiza la tabla visualmente

    showMessageModal('Registro Exitoso', 'Hora extra registrada con éxito.', 'success');
    horasExtrasForm.reset();
    quienRegistraSelect.dispatchEvent(new Event('change')); // Para limpiar y deshabilitar el campo de nombres
});


// --- Funciones de Renderizado de la Tabla de Reporte ---

/**
 * Renderiza los registros de horas extras en la tabla.
 */
export function renderizarHorasExtras() {
    horasExtrasTableBody.innerHTML = ''; // Limpiar tabla antes de renderizar

    if (horasExtras.length === 0) {
        const row = horasExtrasTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 12; // Número de columnas de tu tabla
        cell.textContent = 'No hay registros de horas extras para mostrar.';
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
        return;
    }

    // Obtener los encabezados de la tabla para usarlos como etiquetas en móvil
    const headers = Array.from(horasExtrasTableHead.querySelectorAll('th')).map(th => th.textContent);

    horasExtras.forEach((horaExtra, index) => {
        const row = horasExtrasTableBody.insertRow();
        row.dataset.id = horaExtra.id; // Almacenar el ID en el data-atributo de la fila

        // Usar los mismos nombres de propiedad que en los encabezados (o mapearlos)
        const dataOrder = [
            index + 1, // N°
            horaExtra.quienRegistra,
            horaExtra.dniCe,
            horaExtra.apellidosNombres,
            horaExtra.codigo,
            horaExtra.puesto,
            horaExtra.fechaIngreso,
            horaExtra.horaIngreso,
            horaExtra.fechaSalida,
            horaExtra.horaSalida,
            horaExtra.observacion || 'N/A' // Observación opcional
        ];

        dataOrder.forEach((value, cellIndex) => {
            const cell = row.insertCell();
            cell.textContent = value;
            // Añadir el atributo data-label a cada celda (importante para CSS en móvil)
            if (headers[cellIndex]) {
                cell.setAttribute('data-label', headers[cellIndex]);
            }
        });

        const accionesCell = row.insertCell();
        accionesCell.setAttribute('data-label', 'Acciones'); // Etiqueta para el botón de eliminar
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.classList.add('delete-row-button'); // Clase para estilos de botón de fila
        deleteBtn.addEventListener('click', () => {
            // Reemplazar `confirm` por showMessageModal si deseas un modal de confirmación personalizado
            // Para simplicidad, se mantiene `confirm` aquí.
            if (confirm('¿Estás seguro de que quieres eliminar este registro de horas extras?')) {
                eliminarRegistroHorasExtras(horaExtra.id);
            }
        });
        accionesCell.appendChild(deleteBtn);
    });
}

/**
 * Elimina un registro de horas extras de la tabla y localStorage.
 * @param {string} id El ID del registro a eliminar.
 */
function eliminarRegistroHorasExtras(id) {
    horasExtras = horasExtras.filter(item => item.id !== id);
    guardarHorasExtras(horasExtras);
    renderizarHorasExtras(); // Vuelve a renderizar la tabla sin el registro eliminado
    showMessageModal('Eliminación Exitosa', 'Registro de horas extras eliminado con éxito.', 'success');
}


// --- Event Listeners del Reporte ---

descargarHorasExtrasBtn.addEventListener('click', () => {
    exportarAExcel(horasExtras); // Llama a la función de helper para exportar
});

borrarRegistrosBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres borrar TODOS los registros de horas extras? Esta acción no se puede deshacer.')) {
        horasExtras = []; // Vacía el array
        guardarHorasExtras(horasExtras); // Guarda el array vacío en localStorage
        renderizarHorasExtras(); // Actualiza la tabla para mostrar que está vacía
        showMessageModal('Registros Borrados', 'Todos los registros de horas extras han sido borrados.', 'success');
    }
});


// --- Lógica del MODAL de Nuevo Colaborador ---

nuevoColaboradorBtn.addEventListener('click', () => {
    nuevoColaboradorForm.reset(); // Limpia el formulario del modal
    poblarCoordinadoresSelects(); // Asegura que el select del modal esté actualizado
    nuevoColaboradorModal.classList.add('active'); // Muestra el modal con animación
});

newColaboradorModalCloseButton.addEventListener('click', () => {
    nuevoColaboradorModal.classList.remove('active'); // Oculta el modal
});

// Cerrar modales haciendo clic fuera del contenido
window.addEventListener('click', (event) => {
    if (event.target === nuevoColaboradorModal) {
        nuevoColaboradorModal.classList.remove('active');
    }
    if (event.target === eliminarColaboradorModal) {
        eliminarColaboradorModal.classList.remove('active');
    }
    // El messageModal tiene su propia lógica de cierre en helpers.js
});

nuevoColaboradorForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newApellidosNombres = newColaboradorApellidosNombresInput.value.trim();
    const newDniCe = newColaboradorDniCeInput.value.trim();
    const newCodigo = newColaboradorCodigoInput.value.trim();
    const newPuesto = newColaboradorPuestoInput.value.trim();
    const newJefeRegistra = newColaboradorJefeRegistraSelect.value.trim(); // Este es el jefe que está REGISTRANDO al nuevo colaborador.

    if (!newApellidosNombres || !newDniCe || !newCodigo || !newPuesto || !newJefeRegistra) {
        showMessageModal('Campos Obligatorios', 'Por favor, complete todos los campos para agregar un nuevo colaborador.', 'warning');
        return;
    }

    // Validar si el DNI/CE ya existe en la lista combinada (maestros + dinámicos)
    const dniExistenteDinamicos = empleadosDinamicos.some(t => t.dniCe === newDniCe);
    const dniExistenteMaestros = trabajadoresMaestro.some(t => t.dniCe === newDniCe);

    if (dniExistenteDinamicos || dniExistenteMaestros) {
        showMessageModal('DNI/CE Duplicado', 'Ya existe un trabajador con ese DNI/CE. Por favor, verifique.', 'warning');
        return;
    }

    const nuevoColaborador = {
        jefeLider: newJefeRegistra.split(' - ')[0], // Puedes ajustar esto si el formato es diferente
        jefeRegistra: newJefeRegistra, // Mantener el nombre completo del jefe registrador
        apellidosNombres: newApellidosNombres,
        dniCe: newDniCe,
        codigo: newCodigo,
        puesto: newPuesto,
        registradoPorJefe: newJefeRegistra // <-- Nuevo campo para asociar al jefe que lo registró
    };

    empleadosDinamicos.push(nuevoColaborador);
    guardarEmpleadosDinamicos(empleadosDinamicos);
    actualizarTrabajadoresDisponiblesEnHelpers(); // Recombina las listas de trabajadores
    poblarCoordinadoresSelects(); // Actualiza los selects de jefe (si hubiera un nuevo jefe)
    poblarColaboradoresToDeleteSelect(); // Actualiza el select de eliminar

    showMessageModal('Colaborador Agregado', 'Nuevo colaborador agregado con éxito.', 'success');
    nuevoColaboradorModal.classList.remove('active');
    nuevoColaboradorForm.reset();
    quienRegistraSelect.dispatchEvent(new Event('change')); // Esto fuerza la actualización de la lista de nombres
});


// --- Lógica del MODAL de Eliminar Colaborador ---

eliminarColaboradorBtn.addEventListener('click', () => {
    poblarColaboradoresToDeleteSelect(); // Asegura que el select esté actualizado con los dinámicos
    eliminarColaboradorModal.classList.add('active'); // Muestra el modal
});

deleteColaboradorModalCloseButton.addEventListener('click', () => {
    eliminarColaboradorModal.classList.remove('active'); // Oculta el modal
});

eliminarColaboradorForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const dniCeToDelete = colaboradorToDeleteSelect.value;

    if (!dniCeToDelete) {
        showMessageModal('Selección Requerida', 'Por favor, seleccione un colaborador para eliminar.', 'warning');
        return;
    }

    if (confirm(`¿Estás seguro de que quieres eliminar al colaborador con DNI/CE: ${dniCeToDelete}? Esta acción no se puede deshacer.`)) {
        empleadosDinamicos = empleadosDinamicos.filter(emp => emp.dniCe !== dniCeToDelete);
        guardarEmpleadosDinamicos(empleadosDinamicos);
        actualizarTrabajadoresDisponiblesEnHelpers(); // Recombina las listas de trabajadores
        poblarCoordinadoresSelects(); // Actualiza los selects de jefe
        poblarColaboradoresToDeleteSelect(); // Vuelve a poblar el select de eliminar (refrescado)
        
        // También actualiza la lista de nombres del formulario principal
        quienRegistraSelect.dispatchEvent(new Event('change'));

        showMessageModal('Colaborador Eliminado', 'Colaborador eliminado con éxito.', 'success');
        eliminarColaboradorModal.classList.remove('active');
    }
});