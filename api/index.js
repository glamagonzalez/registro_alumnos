const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 5001;

// --- Configuración de la API ---
const API_KEY = '12345ABCDEF'; // Clave de API ficticia para autenticación

// --- Middleware ---
app.use(cors()); // Habilita CORS para permitir solicitudes desde el frontend
app.use(express.json()); // Permite que Express parsee el cuerpo de las solicitudes como JSON

// --- Rutas a los archivos JSON para simular la base de datos ---
const STUDENTS_FILE = './students.json';
const CAREERS_FILE = './careers.json';
const CATEGORIES_FILE = './categories.json';

// --- Funciones genéricas para cargar y guardar datos ---

/**
 * Carga datos de un archivo JSON dado.
 * Si el archivo no existe o está vacío, devuelve un array vacío.
 * @param {string} file - Ruta al archivo JSON.
 * @returns {Array} - Contenido parseado del archivo JSON.
 */
function loadData(file) {
    try {
        const data = fs.readFileSync(file, 'utf-8');
        // Si el archivo está vacío, JSON.parse lanzará un error, por eso el try/catch.
        return JSON.parse(data);
    } catch (error) {
        // console.warn(`Advertencia: No se pudo cargar el archivo ${file} o está vacío. Se inicializa con un array vacío.`, error.message);
        return []; // Retorna un array vacío si hay un error o el archivo no existe/está vacío
    }
}

/**
 * Guarda datos en un archivo JSON dado.
 * @param {string} file - Ruta al archivo JSON.
 * @param {Array} data - Array de datos a guardar.
 */
function saveData(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2)); // Guarda con formato legible (2 espacios)
    } catch (error) {
        console.error(`Error al guardar datos en ${file}:`, error);
    }
}

// --- Inicializar los datos globales del servidor ---
let students = loadData(STUDENTS_FILE);
let careers = loadData(CAREERS_FILE);
let categories = loadData(CATEGORIES_FILE);

// --- Middleware de Autenticación ---
// Se aplica a todas las rutas. Verifica que la API_KEY sea válida.
app.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({ error: 'Unauthorized. Invalid API Key.' });
    }
    next(); // Continúa con la siguiente función middleware o ruta
});

// ===============================================
// Endpoints para ESTUDIANTES
// ===============================================

/**
 * POST /api/students
 * Registra un nuevo estudiante.
 * Requiere: name, career en el cuerpo de la solicitud.
 */
app.post('/api/students', (req, res) => {
    const { name, career } = req.body;

    // Validación de campos obligatorios
    if (!name || !career) {
        return res.status(400).json({ error: "Faltan campos obligatorios: 'name' y 'career'." });
    }

    // Genera un nuevo ID para el estudiante
    const newStudentId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;

    const newStudent = {
        id: newStudentId,
        name,
        career
    };

    students.push(newStudent); // Agrega el nuevo estudiante al array
    saveData(STUDENTS_FILE, students); // Guarda el array actualizado en el archivo

    return res.status(201).json({ message: "Estudiante registrado exitosamente.", student: newStudent });
});

/**
 * GET /api/students/:id
 * Consulta un estudiante por su ID.
 */
app.get('/api/students/:id', (req, res) => {
    const id = parseInt(req.params.id); // Convierte el ID de la URL a entero
    const student = students.find(s => s.id === id); // Busca el estudiante por ID

    if (!student) {
        return res.status(404).json({ error: `Estudiante con ID ${id} no encontrado.` });
    }

    return res.status(200).json(student);
});

/**
 * GET /api/students
 * Consulta todos los estudiantes o filtra por nombre de carrera.
 * Opcional: query parameter 'career' para filtrar.
 */
app.get('/api/students', (req, res) => {
    const careerFilter = req.query.career; // Obtiene el filtro 'career' de los query parameters

    if (careerFilter) {
        // Filtra los estudiantes por el nombre de la carrera (ignorando mayúsculas/minúsculas)
        const filtered = students.filter(s => s.career.toLowerCase() === careerFilter.toLowerCase());
        return res.status(200).json(filtered);
    }
    // Si no hay filtro de carrera, devuelve todos los estudiantes
    return res.status(200).json(students);
});

/**
 * PUT /api/students/:id
 * Actualiza un estudiante existente por su ID.
 * Requiere: name, career en el cuerpo de la solicitud.
 */
app.put('/api/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, career } = req.body;
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({ error: `Estudiante con ID ${id} no encontrado para actualizar.` });
    }

    // Validación de campos obligatorios para la actualización
    if (!name || !career) {
        return res.status(400).json({ error: "Faltan campos obligatorios para la actualización: 'name' y 'career'." });
    }

    students[index] = { ...students[index], name, career }; // Actualiza los campos
    saveData(STUDENTS_FILE, students); // Guarda los cambios

    return res.status(200).json({ message: "Estudiante actualizado exitosamente.", student: students[index] });
});

/**
 * DELETE /api/students/:id
 * Elimina un estudiante por su ID.
 */
app.delete('/api/students/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = students.findIndex(s => s.id === id);

    if (index === -1) {
        return res.status(404).json({ error: `Estudiante con ID ${id} no encontrado para eliminación.` });
    }

    students.splice(index, 1); // Elimina el estudiante del array
    saveData(STUDENTS_FILE, students); // Guarda los cambios

    return res.status(200).json({ message: "Estudiante eliminado exitosamente." });
});

// ===============================================
// Endpoints para CARRERAS
// ===============================================

/**
 * POST /api/careers
 * Registra una nueva carrera.
 * Requiere: name, description, categoryId en el cuerpo de la solicitud.
 */
app.post('/api/careers', (req, res) => {
    const { name, description, categoryId } = req.body;

    // Validación de campos obligatorios
    if (!name || !description || categoryId === undefined) {
        return res.status(400).json({ error: "Faltan campos obligatorios: 'name', 'description' y 'categoryId'." });
    }

    // Verifica si la categoría existe
    const categoryExists = categories.some(cat => cat.id === parseInt(categoryId));
    if (!categoryExists) {
        return res.status(400).json({ error: `La categoría con ID ${categoryId} no existe.` });
    }

    // Verifica si la carrera ya existe
    const exists = careers.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        return res.status(409).json({ error: "La carrera ya existe." });
    }

    // Genera un nuevo ID para la carrera
    const newCareerId = careers.length > 0 ? Math.max(...careers.map(c => c.id)) + 1 : 1;

    const newCareer = {
        id: newCareerId,
        name,
        description,
        categoryId: parseInt(categoryId) // Asegura que categoryId sea un número
    };

    careers.push(newCareer); // Agrega la nueva carrera
    saveData(CAREERS_FILE, careers); // Guarda los cambios

    return res.status(201).json({ message: "Carrera registrada exitosamente.", career: newCareer });
});

/**
 * GET /api/careers/:id
 * Consulta una carrera por su ID.
 */
app.get('/api/careers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const career = careers.find(c => c.id === id);

    if (!career) {
        return res.status(404).json({ error: `Carrera con ID ${id} no encontrada.` });
    }

    return res.status(200).json(career);
});

/**
 * GET /api/careers
 * Consulta todas las carreras o filtra por nombre.
 * Opcional: query parameter 'name' para filtrar.
 */
app.get('/api/careers', (req, res) => {
    const careerName = req.query.name;

    if (careerName) {
        const filteredCareers = careers.filter(c => c.name.toLowerCase() === careerName.toLowerCase());
        return res.status(200).json(filteredCareers);
    }
    return res.status(200).json(careers);
});

/**
 * PUT /api/careers/:id
 * Actualiza una carrera existente por su ID.
 * Requiere: name, description, categoryId en el cuerpo de la solicitud.
 */
app.put('/api/careers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description, categoryId } = req.body;
    const index = careers.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: `Carrera con ID ${id} no encontrada para actualizar.` });
    }

    // Validación de campos obligatorios
    if (!name || !description || categoryId === undefined) {
        return res.status(400).json({ error: "Faltan campos obligatorios para la actualización: 'name', 'description' y 'categoryId'." });
    }

    // Verifica si la nueva categoría existe
    const categoryExists = categories.some(cat => cat.id === parseInt(categoryId));
    if (!categoryExists) {
        return res.status(400).json({ error: `La categoría con ID ${categoryId} no existe.` });
    }

    careers[index] = { ...careers[index], name, description, categoryId: parseInt(categoryId) }; // Actualiza los campos
    saveData(CAREERS_FILE, careers); // Guarda los cambios

    return res.status(200).json({ message: "Carrera actualizada exitosamente.", career: careers[index] });
});

/**
 * DELETE /api/careers/:id
 * Elimina una carrera por su ID.
 * No permite eliminar si hay estudiantes asociados a esta carrera.
 */
app.delete('/api/careers/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = careers.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: `Carrera con ID ${id} no encontrada para eliminación.` });
    }

    // Verificar si hay estudiantes asociados a la carrera
    const studentsInCareer = students.some(s => s.career.toLowerCase() === careers[index].name.toLowerCase());
    if (studentsInCareer) {
        return res.status(400).json({ error: "No se puede eliminar la carrera porque tiene estudiantes asociados." });
    }

    careers.splice(index, 1); // Elimina la carrera del array
    saveData(CAREERS_FILE, careers); // Guarda los cambios

    return res.status(200).json({ message: "Carrera eliminada exitosamente." });
});

// ===============================================
// Endpoints para CATEGORÍAS
// ===============================================

/**
 * POST /api/categories
 * Registra una nueva categoría de carrera.
 * Requiere: name en el cuerpo de la solicitud.
 */
app.post('/api/categories', (req, res) => {
    const { name } = req.body;

    // Validación de campos obligatorios
    if (!name) {
        return res.status(400).json({ error: "Falta el campo obligatorio: 'name'." });
    }

    // Verifica si la categoría ya existe
    const existingCategory = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existingCategory) {
        return res.status(409).json({ error: "La categoría de carrera ya existe." });
    }

    // Genera un nuevo ID para la categoría
    const newCategoryId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;

    const newCategory = {
        id: newCategoryId,
        name
    };

    categories.push(newCategory); // Agrega la nueva categoría
    saveData(CATEGORIES_FILE, categories); // Guarda los cambios

    return res.status(201).json({ message: "Categoría de carrera registrada exitosamente.", category: newCategory });
});

/**
 * GET /api/categories/:id
 * Consulta una categoría por su ID.
 */
app.get('/api/categories/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const category = categories.find(c => c.id === id);

    if (!category) {
        return res.status(404).json({ error: `Categoría de carrera con ID ${id} no encontrada.` });
    }

    return res.status(200).json(category);
});

/**
 * GET /api/categories
 * Consulta todas las categorías de carreras o filtra por nombre.
 * Opcional: query parameter 'name' para filtrar.
 */
app.get('/api/categories', (req, res) => {
    const categoryName = req.query.name;

    if (categoryName) {
        const filteredCategories = categories.filter(c => c.name.toLowerCase() === categoryName.toLowerCase());
        return res.status(200).json(filteredCategories);
    }
    return res.status(200).json(categories);
});

/**
 * PUT /api/categories/:id
 * Actualiza una categoría existente por su ID.
 * Requiere: name en el cuerpo de la solicitud.
 */
app.put('/api/categories/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    const index = categories.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: `Categoría de carrera con ID ${id} no encontrada para actualizar.` });
    }

    // Validación de campos obligatorios
    if (!name) {
        return res.status(400).json({ error: "Falta el campo obligatorio para la actualización: 'name'." });
    }

    categories[index] = { ...categories[index], name }; // Actualiza el campo 'name'
    saveData(CATEGORIES_FILE, categories); // Guarda los cambios

    return res.status(200).json({ message: "Categoría de carrera actualizada exitosamente.", category: categories[index] });
});

/**
 * DELETE /api/categories/:id
 * Elimina una categoría por su ID.
 * No permite eliminar si hay carreras asociadas a esta categoría.
 */
app.delete('/api/categories/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = categories.findIndex(c => c.id === id);

    if (index === -1) {
        return res.status(404).json({ error: `Categoría de carrera con ID ${id} no encontrada para eliminación.` });
    }

    // Verificar si hay carreras asociadas a esta categoría
    const careersInCategory = careers.some(c => c.categoryId === id);
    if (careersInCategory) {
        return res.status(400).json({ error: "No se puede eliminar la categoría porque tiene carreras asociadas." });
    }

    categories.splice(index, 1); // Elimina la categoría del array
    saveData(CATEGORIES_FILE, categories); // Guarda los cambios

    return res.status(200).json({ message: "Categoría de carrera eliminada exitosamente." });
});

// ===============================================
// Inicio del Servidor
// ===============================================
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
