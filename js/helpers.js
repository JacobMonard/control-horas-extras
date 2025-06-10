// js/helpers.js

/**
 * Convierte un array de objetos JavaScript en una cadena de texto CSV.
 * @param {Array<Object>} data - Array de objetos a exportar.
 * @param {Array<string>} objectKeys - Las claves de los objetos que corresponden al orden de las columnas en el CSV.
 * @param {Array<string>} displayHeaders - Los nombres de las cabeceras a mostrar en el CSV.
 * @returns {string} La cadena de texto en formato CSV.
 */
function convertToCSV(data, objectKeys, displayHeaders) {
    if (!data || data.length === 0) {
        return '';
    }

    if (!objectKeys || objectKeys.length === 0) {
        console.error("convertToCSV: 'objectKeys' array is required.");
        return '';
    }
    if (displayHeaders && displayHeaders.length !== objectKeys.length) {
        console.warn("convertToCSV: Mismatch between 'objectKeys' and 'displayHeaders' length. Using 'objectKeys' for headers.");
        displayHeaders = objectKeys;
    }

    const finalHeadersForCSV = displayHeaders || objectKeys;

    const escapeCsvValue = (value) => {
        if (value === null || value === undefined) {
            return '';
        }
        let stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            stringValue = stringValue.replace(/"/g, '""');
            return `"${stringValue}"`;
        }
        return stringValue;
    };

    const headerRow = finalHeadersForCSV.map(escapeCsvValue).join(',');

    const dataRows = data.map(row => {
        return objectKeys.map(key => escapeCsvValue(row[key])).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
}

/**
 * Inicia la descarga de un archivo CSV en el navegador.
 * @param {string} csvContent - La cadena de texto CSV a descargar.
 * @param {string} filename - El nombre del archivo CSV.
 */
function downloadCSV(csvContent, filename = 'reporte.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Función para parsear un archivo CSV en un array de objetos.
 * Asume que la primera fila son las cabeceras.
 * @param {string} csvText - El contenido del archivo CSV como texto.
 * @returns {Array<Object>} Un array de objetos, donde cada objeto es una fila.
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    // Identifica las cabeceras (primera fila) y las limpia
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i];
        if (!currentLine) continue; // Saltar líneas vacías o solo con espacios

        const values = [];
        let inQuote = false;
        let currentField = '';

        for (let j = 0; j < currentLine.length; j++) {
            const char = currentLine[j];
            if (char === '"') {
                // Manejar comillas escapadas (doble comilla dentro de un campo entre comillas)
                if (inQuote && currentLine[j + 1] === '"') {
                    currentField += '"';
                    j++; // Saltar la segunda comilla
                } else {
                    inQuote = !inQuote; // Alternar estado de comilla
                }
            } else if (char === ',' && !inQuote) {
                values.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        values.push(currentField.trim()); // Añadir el último campo de la línea

        // Pequeña validación para asegurar que la fila tenga el número esperado de columnas
        if (values.length !== headers.length) {
            console.warn(`Row ${i + 1} has ${values.length} columns, but expected ${headers.length}. Skipping or handling misalignment.`);
            continue; // Saltar esta fila si no coincide con las cabeceras
        }

        const rowObject = {};
        headers.forEach((header, index) => {
            rowObject[header] = values[index];
        });
        data.push(rowObject);
    }
    return data;
}

/**
 * Guarda datos en localStorage.
 * @param {string} key - La clave para guardar los datos.
 * @param {any} data - Los datos a guardar. Se convertirán a JSON.
 */
function saveDataToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Datos guardados en localStorage con la clave: ${key}`);
    } catch (e) {
        console.error(`Error al guardar en localStorage para la clave ${key}:`, e);
        alert('Error al guardar datos. Puede que el almacenamiento esté lleno o el navegador no lo soporte.');
    }
}

/**
 * Carga datos desde localStorage.
 * @param {string} key - La clave para cargar los datos.
 * @returns {any} Los datos cargados, o null si no se encuentran o hay un error.
 */
function loadDataFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error(`Error al cargar desde localStorage para la clave ${key}:`, e);
        return null;
    }
}