// js/helpers.js

/**
 * Carga un archivo CSV desde una ruta especificada y lo parsea en un array de arrays.
 * @param {string} url La URL del archivo CSV.
 * @returns {Promise<Array<Array<string>>>} Una promesa que resuelve con los datos del CSV.
 */
export async function cargarCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim() !== ''); // Ignorar líneas vacías
        const data = lines.map(line => {
            // Un split simple por coma, asumiendo que no hay comas dentro de campos sin comillas.
            return line.split(',');
        });

        // Eliminar la fila de encabezado
        return data.slice(1);

    } catch (error) {
        console.error('Error al cargar o parsear el CSV:', error);
        throw error;
    }
}

/**
 * Guarda datos en el localStorage.
 * @param {string} key La clave bajo la cual se guardarán los datos.
 * @param {any} data Los datos a guardar.
 */
export function guardarDatos(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Datos guardados en localStorage con clave: ${key}`);
    } catch (e) {
        console.error(`Error al guardar datos en localStorage con clave ${key}:`, e);
        alert('No se pudieron guardar los datos. El almacenamiento local puede estar lleno o deshabilitado.');
    }
}

/**
 * Carga datos desde el localStorage.
 * @param {string} key La clave de los datos a cargar.
 * @returns {any | null} Los datos cargados, o null si no se encontraron.
 */
export function cargarDatos(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error(`Error al cargar datos de localStorage con clave ${key}:`, e);
        alert('No se pudieron cargar los datos desde el almacenamiento local.');
        return null;
    }
}

/**
 * Limpia la tabla de horas extras en el DOM.
 */
export function limpiarTabla() {
    const tableBody = document.querySelector('#horas-extras-table tbody');
    if (tableBody) {
        tableBody.innerHTML = ''; // Elimina todas las filas existentes
    }
}

/**
 * Renderiza los registros de horas extras en la tabla HTML.
 * @param {Array<Object>} horasExtrasArray El array de objetos de horas extras a renderizar.
 */
export function renderizarTablaHorasExtras(horasExtrasArray) {
    const tableBody = document.querySelector('#horas-extras-table tbody');
    if (!tableBody) {
        console.error('No se encontró el tbody de la tabla #horas-extras-table.');
        return;
    }
    limpiarTabla(); // Limpia la tabla antes de renderizar

    if (horasExtrasArray && horasExtrasArray.length > 0) {
        horasExtrasArray.forEach((registro, index) => {
            const row = tableBody.insertRow();
            row.dataset.index = index;

            row.insertCell().textContent = registro.quienRegistra;
            row.insertCell().textContent = registro.dniCe;
            row.insertCell().textContent = registro.apellidosNombres;
            row.insertCell().textContent = registro.codigo;
            row.insertCell().textContent = registro.puesto;
            row.insertCell().textContent = registro.fechaIngreso;
            row.insertCell().textContent = registro.ingreso;
            row.insertCell().textContent = registro.fechaSalida;
            row.insertCell().textContent = registro.salida;
            row.insertCell().textContent = registro.observacion;

            // Celda de acciones (por ejemplo, para eliminar)
            const actionsCell = row.insertCell();
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
                    const realIndex = horasExtrasArray.findIndex(item =>
                        item.dniCe === registro.dniCe &&
                        item.fechaIngreso === registro.fechaIngreso &&
                        item.ingreso === registro.ingreso &&
                        item.fechaSalida === registro.fechaSalida &&
                        item.salida === registro.salida &&
                        item.quienRegistra === registro.quienRegistra
                    );
                    if (realIndex > -1) {
                        horasExtrasArray.splice(realIndex, 1);
                        guardarDatos('horasExtrasData', horasExtrasArray);
                        renderizarTablaHorasExtras(horasExtrasArray);
                        alert('Registro eliminado.');
                    } else {
                        alert('Error: No se pudo encontrar el registro para eliminar.');
                    }
                }
            });
            actionsCell.appendChild(deleteBtn);
        });
    } else {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 11; // Ajustado para cubrir las nuevas columnas
        cell.textContent = 'No hay registros de horas extras disponibles.';
        cell.style.textAlign = 'center';
        cell.style.fontStyle = 'italic';
    }
}