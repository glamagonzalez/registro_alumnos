const API_URL = "http://localhost:5001/api";
const API_CAREERS_URL = `${API_URL}/careers`;
const API_CATEGORIES_URL = `${API_URL}/categories`;
const API_STUDENTS_URL = `${API_URL}/students`;

const API_KEY = "12345ABCDEF";

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_KEY}`
};

// ==================== Funciones de Utilidad y Manejo de Respuestas ==================== //

/**
 * Muestra un mensaje de éxito con SweetAlert2.
 * @param {string} title - El título del mensaje.
 * @param {string} message - El cuerpo del mensaje.
 */
// Función para mostrar mensajes de éxito al usuario usando SweetAlert2
function showSuccess(title, message) {
  Swal.fire({
    icon: "success",
    title: title,
    text: message,
    confirmButtonText: "Aceptar",
    customClass: {
      popup: 'swal2-dark',
      title: 'swal2-title-light',
      content: 'swal2-content-light'
    }
  });
}

/**
 * Muestra un mensaje de error con SweetAlert2.
 * @param {string} title - El título del mensaje.
 * @param {string} message - El cuerpo del mensaje.
 */
// Función para mostrar mensajes de error al usuario usando SweetAlert2
function showError(title, message) {
  Swal.fire({
    icon: "error",
    title: title,
    text: message,
    confirmButtonText: "Cerrar",
    customClass: {
      popup: 'swal2-dark',
      title: 'swal2-title-light',
      content: 'swal2-content-light'
    }
  });
}

/**
 * Muestra un mensaje de confirmación con SweetAlert2.
 * @param {string} title - El título del mensaje.
 * @param {string} message - El cuerpo del mensaje.
 * @returns {Promise<boolean>} - Resuelve a true si el usuario confirma, false en caso contrario.
 */
// Función para mostrar un cuadro de confirmación y devolver la respuesta del usuario
async function showConfirmation(title, message) {
  const result = await Swal.fire({
    title: title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'No, cancelar',
    customClass: {
      popup: 'swal2-dark',
      title: 'swal2-title-light',
      content: 'swal2-content-light'
    }
  });
  return result.isConfirmed;
}

// ==================== Funciones para Estudiantes ==================== //

/**
 * Carga las carreras disponibles en el select de registro de estudiantes.
 */
// Función que obtiene las carreras desde la API y las carga en el select del formulario de estudiantes
async function loadCareersForStudentRegistration() {
  const selectElement = document.getElementById('studentCareerSelect');
  if (!selectElement) {
    console.warn("Elemento 'studentCareerSelect' no encontrado en la página.");
    return;
  }
  selectElement.innerHTML = '<option value="">Cargando carreras...</option>';
  try {
    const response = await fetch(API_CAREERS_URL, { headers: headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cargar las carreras.');
    }
    const careers = await response.json();
    selectElement.innerHTML = '<option value="">Seleccione una carrera</option>';
    if (careers.length > 0) {
      careers.forEach(career => {
        const option = document.createElement('option');
        option.value = career.name; // Usar el nombre de la carrera como valor
        option.textContent = career.name;
        selectElement.appendChild(option);
      });
    } else {
      selectElement.innerHTML = '<option value="">No hay carreras disponibles</option>';
    }
  } catch (error) {
    showError("Error al Cargar Carreras", error.message);
    selectElement.innerHTML = '<option value="">Error al cargar las carreras</option>';
  }
}

/**
 * Registra un nuevo estudiante enviando los datos a la API.
 */
// Función que envía los datos del formulario para registrar un nuevo estudiante en la API
async function registerStudent() {
  const studentNameInput = document.getElementById('studentName');
  const studentCareerSelect = document.getElementById('studentCareerSelect');

  const name = studentNameInput.value.trim();
  const career = studentCareerSelect.value;

  if (!name || !career) {
    showError("Campos Vacíos", "Por favor, complete el nombre y seleccione una carrera.");
    return;
  }

  try {
    const response = await fetch(API_STUDENTS_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ name, career })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al registrar estudiante.');
    }

    const result = await response.json();
    showSuccess("Registro Exitoso", result.message);
    studentNameInput.value = ''; // Limpiar campo
    studentCareerSelect.value = ''; // Limpiar selección
    getAllStudents(); // Actualizar la lista de estudiantes
  } catch (error) {
    showError("Error de Registro", error.message);
  }
}

/**
 * Consulta un estudiante por su ID y muestra el resultado.
 */
// Función que busca un estudiante por su ID y muestra la información obtenida de la API
async function getStudentById() {
  const studentIdInput = document.getElementById('getStudentId');
  const resultDiv = document.getElementById('getStudentResult');
  resultDiv.innerHTML = ''; // Limpiar resultados anteriores

  const id = studentIdInput.value.trim();

  if (!id) {
    showError("Campo Vacío", "Por favor, ingrese el ID del estudiante.");
    return;
  }

  try {
    const response = await fetch(`${API_STUDENTS_URL}/${id}`, { headers: headers });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Estudiante con ID ${id} no encontrado.`);
    }

    const student = await response.json();
    resultDiv.innerHTML = `
      <div class="alert alert-info" role="alert">
        <strong>ID:</strong> ${student.id}<br>
        <strong>Nombre:</strong> ${student.name}<br>
        <strong>Carrera:</strong> ${student.career}
      </div>
    `;
  } catch (error) {
    showError("Error al Buscar Estudiante", error.message);
    resultDiv.innerHTML = `<div class="alert alert-danger" role="alert">${error.message}</div>`;
  }
}

/**
 * Elimina un estudiante por su ID.
 */
// Función que elimina un estudiante de la base de datos usando su ID
async function deleteStudent() {
  const studentIdInput = document.getElementById('deleteStudentId');
  const resultDiv = document.getElementById('deleteStudentResult');
  resultDiv.innerHTML = '';

  const id = studentIdInput.value.trim();

  if (!id) {
    showError("Campo Vacío", "Por favor, ingrese el ID del estudiante a eliminar.");
    return;
  }

  const confirm = await showConfirmation(
    "Confirmar Eliminación",
    `¿Está seguro de que desea eliminar al estudiante con ID ${id}?`
  );

  if (!confirm) {
    return;
  }

  try {
    const response = await fetch(`${API_STUDENTS_URL}/${id}`, {
      method: 'DELETE',
      headers: headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al eliminar estudiante con ID ${id}.`);
    }

    const result = await response.json();
    showSuccess("Eliminación Exitosa", result.message);
    studentIdInput.value = ''; // Limpiar campo
    getAllStudents(); // Actualizar la lista
  } catch (error) {
    showError("Error de Eliminación", error.message);
    resultDiv.innerHTML = `<div class="alert alert-danger" role="alert">${error.message}</div>`;
  }
}

/**
 * Obtiene todos los estudiantes de la API y los muestra en el DOM.
 */
// Función que obtiene y muestra la lista completa de estudiantes desde la API
async function getAllStudents() {
  const accordionContainer = document.getElementById('studentsAccordion');
  if (!accordionContainer) {
    console.warn("Elemento 'studentsAccordion' no encontrado en la página.");
    return;
  }
  accordionContainer.innerHTML = '<p class="text-info">Cargando estudiantes...</p>'; // Mensaje de carga

  try {
    const response = await fetch(API_STUDENTS_URL, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener estudiantes.');
    }

    const students = await response.json();

    if (students.length > 0) {
      let accordionHtml = '';
      students.forEach(student => {
        accordionHtml += `
          <div class="accordion-item bg-dark text-white">
            <h2 class="accordion-header" id="heading${student.id}">
              <button class="accordion-button collapsed bg-secondary text-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${student.id}" aria-expanded="false" aria-controls="collapse${student.id}">
                ${student.name}
              </button>
            </h2>
            <div id="collapse${student.id}" class="accordion-collapse collapse" aria-labelledby="heading${student.id}" data-bs-parent="#studentsAccordion">
              <div class="accordion-body">
                <strong>ID:</strong> ${student.id}<br>
                <strong>Nombre:</strong> ${student.name}<br>
                <strong>Carrera:</strong> ${student.career}
              </div>
            </div>
          </div>
        `;
      });
      accordionContainer.innerHTML = accordionHtml;
    } else {
      accordionContainer.innerHTML = '<p class="text-info">No hay estudiantes registrados.</p>';
    }
  } catch (error) {
    showError("Error al Cargar Estudiantes", error.message);
    accordionContainer.innerHTML = '<p class="text-danger">Error al cargar los estudiantes.</p>';
  }
}


// ==================== Funciones para Carreras ==================== //

/**
 * Carga las categorías disponibles en el select de registro de carreras.
 */
// Función que obtiene las categorías desde la API y las carga en el select del formulario de carreras
async function loadCategoriesForCareerRegistration() {
  const selectElement = document.getElementById('careerCategorySelect');
  if (!selectElement) {
    console.warn("Elemento 'careerCategorySelect' no encontrado en la página.");
    return;
  }
  selectElement.innerHTML = '<option value="">Cargando categorías...</option>';
  try {
    const response = await fetch(API_CATEGORIES_URL, { headers: headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cargar las categorías.');
    }
    const categories = await response.json();
    selectElement.innerHTML = '<option value="">Seleccione una categoría</option>';
    if (categories.length > 0) {
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id; // Usar el ID de la categoría como valor
        option.textContent = category.name;
        selectElement.appendChild(option);
      });
    } else {
      selectElement.innerHTML = '<option value="">No hay categorías disponibles</option>';
    }
  } catch (error) {
    showError("Error al Cargar Categorías", error.message);
    selectElement.innerHTML = '<option value="">Error al cargar las categorías</option>';
  }
}

/**
 * Registra una nueva carrera.
 */
// Función que envía los datos del formulario para registrar una nueva carrera en la API
async function registerCareer() {
  const careerNameInput = document.getElementById('careerName');
  const careerDescriptionInput = document.getElementById('careerDescription');
  const careerCategorySelect = document.getElementById('careerCategorySelect');

  const name = careerNameInput.value.trim();
  const description = careerDescriptionInput.value.trim();
  const categoryId = careerCategorySelect.value; // Obtener el ID de la categoría

  if (!name || !description || !categoryId) {
    showError("Campos Vacíos", "Por favor, complete todos los campos y seleccione una categoría.");
    return;
  }

  try {
    const response = await fetch(API_CAREERS_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ name, description, categoryId: parseInt(categoryId) }) // Enviar categoryId como número
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al registrar carrera.');
    }

    const result = await response.json();
    showSuccess("Registro Exitoso", result.message);
    careerNameInput.value = '';
    careerDescriptionInput.value = '';
    careerCategorySelect.value = '';
    getAllCareers(); // Actualizar la lista
  } catch (error) {
    showError("Error de Registro", error.message);
  }
}

/**
 * Consulta una carrera por su ID.
 */
// Función que busca una carrera por su ID y muestra la información obtenida de la API
async function getCareerById() {
  const careerIdInput = document.getElementById('getCareerId');
  const resultDiv = document.getElementById('getCareerResult');
  resultDiv.innerHTML = '';

  const id = careerIdInput.value.trim();

  if (!id) {
    showError("Campo Vacío", "Por favor, ingrese el ID de la carrera.");
    return;
  }

  try {
    const response = await fetch(`${API_CAREERS_URL}/${id}`, { headers: headers });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Carrera con ID ${id} no encontrada.`);
    }

    const career = await response.json();
    resultDiv.innerHTML = `
      <div class="alert alert-info" role="alert">
        <strong>ID:</strong> ${career.id}<br>
        <strong>Nombre:</strong> ${career.name}<br>
        <strong>Descripción:</strong> ${career.description}<br>
        <strong>ID Categoría:</strong> ${career.categoryId}
      </div>
    `;
  } catch (error) {
    showError("Error al Buscar Carrera", error.message);
    resultDiv.innerHTML = `<div class="alert alert-danger" role="alert">${error.message}</div>`;
  }
}

/**
 * Elimina una carrera por su ID.
 */
// Función que elimina una carrera de la base de datos usando su ID
async function deleteCareer() {
  const careerIdInput = document.getElementById('deleteCareerId');
  const resultDiv = document.getElementById('deleteCareerResult');
  resultDiv.innerHTML = '';

  const id = careerIdInput.value.trim();

  if (!id) {
    showError("Campo Vacío", "Por favor, ingrese el ID de la carrera a eliminar.");
    return;
  }

  const confirm = await showConfirmation(
    "Confirmar Eliminación",
    `¿Está seguro de que desea eliminar la carrera con ID ${id}?`
  );

  if (!confirm) {
    return;
  }

  try {
    const response = await fetch(`${API_CAREERS_URL}/${id}`, {
      method: 'DELETE',
      headers: headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al eliminar carrera con ID ${id}.`);
    }

    const result = await response.json();
    showSuccess("Eliminación Exitosa", result.message);
    careerIdInput.value = '';
    getAllCareers(); // Actualizar la lista
  } catch (error) {
    showError("Error de Eliminación", error.message);
    resultDiv.innerHTML = `<div class="alert alert-danger" role="alert">${error.message}</div>`;
  }
}

/**
 * Obtiene todas las carreras de la API y las muestra en el DOM.
 */
// Función que obtiene y muestra la lista completa de carreras desde la API
async function getAllCareers() {
  const careersListDiv = document.getElementById('allCareersResult');
  if (!careersListDiv) {
    console.warn("Elemento 'allCareersResult' no encontrado en la página.");
    return;
  }
  careersListDiv.innerHTML = '<p class="text-info">Cargando carreras...</p>';

  try {
    const response = await fetch(API_CAREERS_URL, { headers: headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener carreras.');
    }
    const careers = await response.json();

    if (careers.length > 0) {
      let html = '<ul class="list-group">';
      for (const career of careers) {
        html += `<li class="list-group-item bg-dark text-white">ID: ${career.id} - ${career.name} (${career.description}) [Categoría ID: ${career.categoryId}]</li>`;
      }
      html += '</ul>';
      careersListDiv.innerHTML = html;
    } else {
      careersListDiv.innerHTML = '<p class="text-info">No hay carreras registradas.</p>';
    }
  } catch (error) {
    showError("Error al Cargar Carreras", error.message);
    careersListDiv.innerHTML = '<p class="text-danger">Error al cargar las carreras.</p>';
  }
}

/**
 * Inserta un conjunto predefinido de carreras.
 */
// Función que inserta varias carreras predefinidas en la base de datos (seed)
async function seedCareers() {
  const confirmation = await showConfirmation(
    "Insertar Oferta Académica",
    "¿Desea insertar la oferta académica completa? Esto agregará varias carreras predefinidas."
  );

  if (!confirmation) {
    return;
  }

  const predefinedCareers = [
    { name: "Licenciatura en Administración", description: "Formación en gestión, finanzas, marketing y recursos humanos.", categoryId: 2 },
    { name: "Licenciatura en Psicología", description: "Estudio del comportamiento humano y salud mental.", categoryId: 8 },
    { name: "Licenciatura en Trabajo Social", description: "Intervención profesional en problemáticas sociales y comunitarias.", categoryId: 8 },
    { name: "Licenciatura en Turismo", description: "Gestión del turismo sostenible y planificación de destinos.", categoryId: 5 },
    { name: "Licenciatura en Higiene y Seguridad en el Trabajo", description: "Gestión de prevención de riesgos laborales en entornos profesionales.", categoryId: 7 },
    { name: "Licenciatura en Ciencias de la Educación", description: "Análisis y diseño de políticas y prácticas educativas.", categoryId: 4 },
    { name: "Ingeniería en Sistemas de Información", description: "Desarrollo e integración de sistemas informáticos complejos.", categoryId: 1 },
    { name: "Licenciatura en Comunicación Social", description: "Estudio de los procesos comunicacionales y medios masivos.", categoryId: 3 },
    { name: "Licenciatura en Diseño Gráfico", description: "Diseño visual, branding y comunicación gráfica.", categoryId: 9 },
    { name: "Licenciatura en Nutrición", description: "Asesoramiento nutricional y salud pública.", categoryId: 10 },
    { name: "Tecnicatura en Programación", description: "Desarrollo de software y aplicaciones.", categoryId: 1 },
    { name: "Tecnicatura en Redes Informáticas", description: "Administración y configuración de infraestructuras de red.", categoryId: 1 },
    { name: "Diplomatura en Marketing Digital", description: "Publicidad online, redes sociales y posicionamiento web.", categoryId: 2 },
    { name: "Diplomatura en Big Data", description: "Análisis y gestión de grandes volúmenes de datos.", categoryId: 1 },
    { name: "Diplomatura en Energías Renovables", description: "Energía solar, eólica y sustentabilidad energética.", categoryId: 6 },
    { name: "Diplomatura en Gestión Ambiental", description: "Sustentabilidad, legislación ambiental y manejo de residuos.", categoryId: 6 }
  ];

  let successCount = 0;
  let errorMessages = [];

  for (const careerData of predefinedCareers) {
    try {
      const response = await fetch(API_CAREERS_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(careerData)
      });

      if (response.ok) {
        successCount++;
      } else {
        const errorData = await response.json();
        errorMessages.push(`Error al insertar ${careerData.name}: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      errorMessages.push(`Error de red al insertar ${careerData.name}: ${error.message}`);
    }
  }

  if (successCount > 0) {
    showSuccess("Oferta Académica Insertada", `Se insertaron ${successCount} carreras. ${errorMessages.length > 0 ? '\nErrores: ' + errorMessages.join('\n') : ''}`);
  } else {
    showError("Fallo al Insertar Oferta Académica", "No se pudo insertar ninguna carrera. " + errorMessages.join('\n'));
  }
  getAllCareers(); // Actualizar la lista de carreras
}


// ==================== Funciones para Categorías ==================== //

/**
 * Registra una nueva categoría.
 */
// Función que envía los datos del formulario para registrar una nueva categoría en la API
async function registerCategory() {
  const categoryNameInput = document.getElementById('categoryName');
  const name = categoryNameInput.value.trim();

  if (!name) {
    showError("Campo Vacío", "Por favor, ingrese el nombre de la categoría.");
    return;
  }

  try {
    const response = await fetch(API_CATEGORIES_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al registrar categoría.');
    }

    const result = await response.json();
    showSuccess("Registro Exitoso", result.message);
    categoryNameInput.value = ''; // Limpiar campo
    getAllCategories(); // Actualizar la lista
  } catch (error) {
    showError("Error de Registro", error.message);
  }
}

/**
 * Consulta una categoría por su ID.
 */
// Función que busca una categoría por su ID y muestra la información obtenida de la API
async function getCategoryById() {
  const categoryIdInput = document.getElementById('getCategoryId');
  const resultDiv = document.getElementById('getCategoryResult');
  resultDiv.innerHTML = '';

  const id = categoryIdInput.value.trim();

  if (!id) {
    showError("Campo Vacío", "Por favor, ingrese el ID de la categoría.");
    return;
  }

  try {
    const response = await fetch(`${API_CATEGORIES_URL}/${id}`, { headers: headers });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Categoría con ID ${id} no encontrada.`);
    }

    const category = await response.json();
    resultDiv.innerHTML = `
      <div class="alert alert-info" role="alert">
        <strong>ID:</strong> ${category.id}<br>
        <strong>Nombre:</strong> ${category.name}
      </div>
    `;
  } catch (error) {
    showError("Error al Buscar Categoría", error.message);
    resultDiv.innerHTML = `<div class="alert alert-danger" role="alert">${error.message}</div>`;
  }
}

/**
 * Elimina una categoría por su ID.
 */
// Función que elimina una categoría de la base de datos usando su ID
async function deleteCategory() {
  const categoryIdInput = document.getElementById('deleteCategoryId');
  const resultDiv = document.getElementById('deleteCategoryResult');
  resultDiv.innerHTML = '';

  const id = categoryIdInput.value.trim();

  if (!id) {
    showError("Campo Vacío", "Por favor, ingrese el ID de la categoría a eliminar.");
    return;
  }

  const confirm = await showConfirmation(
    "Confirmar Eliminación",
    `¿Está seguro de que desea eliminar la categoría con ID ${id}?`
  );

  if (!confirm) {
    return;
  }

  try {
    const response = await fetch(`${API_CATEGORIES_URL}/${id}`, {
      method: 'DELETE',
      headers: headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error al eliminar categoría con ID ${id}.`);
    }

    const result = await response.json();
    showSuccess("Eliminación Exitosa", result.message);
    categoryIdInput.value = ''; // Limpiar campo
    getAllCategories(); // Actualizar la lista
  } catch (error) {
    showError("Error de Eliminación", error.message);
    resultDiv.innerHTML = `<div class="alert alert-danger" role="alert">${error.message}</div>`;
  }
}

/**
 * Obtiene todas las categorías de la API y las muestra en el DOM.
 */
// Función que obtiene y muestra la lista completa de categorías desde la API
async function getAllCategories() {
  const categoriesListDiv = document.getElementById('allCategoriesResult');
  if (!categoriesListDiv) {
    console.warn("Elemento 'allCategoriesResult' no encontrado en la página.");
    return;
  }
  categoriesListDiv.innerHTML = '<p class="text-info">Cargando categorías...</p>';

  try {
    const response = await fetch(API_CATEGORIES_URL, { headers: headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener categorías.');
    }
    const categories = await response.json();

    if (categories.length > 0) {
      let html = '<ul class="list-group">';
      categories.forEach(category => {
        html += `<li class="list-group-item bg-dark text-white">ID: ${category.id} - ${category.name}</li>`;
      });
      html += '</ul>';
      categoriesListDiv.innerHTML = html;
    } else {
      categoriesListDiv.innerHTML = '<p class="text-info">No hay categorías registradas.</p>';
    }
  } catch (error) {
    showError("Error al Cargar Categorías", error.message);
    categoriesListDiv.innerHTML = '<p class="text-danger">Error al cargar las categorías.</p>';
  }
}


// ==================== Inicialización al Cargar el DOM ==================== //

// Evento que inicializa la carga de datos y selects según la página actual

document.addEventListener('DOMContentLoaded', () => {
  // Inicialización específica para cada página
  const currentPage = window.location.pathname.split('/').pop();

  if (currentPage === 'carreras.html') {
    loadCategoriesForCareerRegistration();
    getAllCareers();
  } else if (currentPage === 'categorias.html') {
    getAllCategories();
  } else if (currentPage === 'estudiantes.html') {
    loadCareersForStudentRegistration();
    getAllStudents(); 
  }
  
});
/**
 * INFORME SOBRE EL USO DE INTELIGENCIA ARTIFICIAL EN EL DESARROLLO DE ESTE PROYECTO
 *
 * Durante el desarrollo de este trabajo práctico, se ha utilizado un modelo de Lenguaje Grande (LLM)
 * para optimizar y asistir en diversas tareas, acelerando el avance y mejorando la calidad del código.
 *
 * 1. Modelo de IA Utilizado:
 * - Gemini (Google AI)
 *
 * 2. Prompts Clave y Resultados Positivos:
 * A continuación, se detallan algunos de los prompts específicos y cómo contribuyeron al desarrollo:
 *
 * a) Generación de Estructura HTML Base y Navegación:
 * - Prompt: "Genera el código HTML base para tres páginas: 'estudiantes.html', 'carreras.html' y 'categorias.html'.
 * Cada una debe incluir una estructura básica con head, body y un navbar simple
 * que permita la navegación entre ellas y a una página principal 'index.html'.
 * Asegúrate de que los enlaces sean correctos."
 * - Resultado Positivo: Proporcionó rápidamente la estructura inicial necesaria para cada página,
 * ahorrando tiempo en la configuración básica y asegurando una navegación consistente
 * desde el principio. Esto permitió centrarse en la lógica específica de cada sección.
 *
 * b) Asistencia en la Creación de Funciones CRUD para el Frontend (app.js):
 * - Prompt: "Necesito una función JavaScript para 'app.js' que maneje la obtención de todos los estudiantes
 * de una API RESTful (ej. 'http://localhost:3000/students') y los muestre en una tabla HTML.
 * Incluye manejo de errores y un indicador de carga."
 * - Resultado Positivo: Ayudó a estructurar funciones asíncronas para interactuar con la API.
 * Se obtuvieron bases para funciones como `fetchStudents()`, `addStudent()`,
 * `deleteStudent()`, `fetchCareers()` y `fetchCategories()`, incluyendo la lógica
 * para manejar las respuestas y errores de la API. Esto fue crucial para la integración
 * con el backend.
 *
 * c) Optimización de Código y Refactorización:
 * - Prompt: "Revisa el siguiente bloque de código JavaScript para `app.js`. Busca oportunidades para
 * refactorizarlo, mejorar la legibilidad y aplicar buenas prácticas. [Insertar bloque de código]"
 * - Resultado Positivo: Identificó áreas para simplificar el código, usar `async/await` de forma más efectiva,
 * y aplicar principios de DRY (Don't Repeat Yourself). Esto mejoró la mantenibilidad y
 * el rendimiento de la aplicación.
 *
 * d) Sugerencias para el Estilado con Bootstrap 5:
 * - Prompt: "Proporciona ejemplos de clases de Bootstrap 5 para crear un formulario de registro de estudiantes
 * con campos para nombre y carrera (desplegable), y botones para guardar y cancelar.
 * También, cómo estructurar una tabla para mostrar los datos de los estudiantes."
 * - Resultado Positivo: Ofreció directrices sobre cómo aplicar las clases de Bootstrap para un diseño responsivo
 * y estético, facilitando la implementación de la interfaz de usuario de manera eficiente.
 *
 * e) Resolución de Errores Comunes de JavaScript/API:
 * - Prompt: "Estoy recibiendo un error 'Failed to fetch' al intentar hacer una petición GET a mi API local.
 * Revisa mi función `fetchData()` y sugiere posibles causas o depuraciones. [Insertar función]"
 * - Resultado Positivo: Ayudó a diagnosticar y solucionar problemas comunes de CORS, rutas de API incorrectas,
 * o errores en el manejo de promesas, lo que aceleró el proceso de depuración.
 *
 * Conclusión:
 * El uso del modelo de IA ha sido una herramienta valiosa para la generación de código boilerplate, la propuesta
 * de estructuras funcionales, la optimización de código y la asistencia en la depuración. Esto ha permitido
 * una implementación más eficiente y robusta de la lógica del frontend, cumpliendo con los requisitos del proyecto.
 */