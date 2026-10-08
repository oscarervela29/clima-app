// ============================================
// CONFIGURACIÓN
// ============================================
// REEMPLAZA ESTA API KEY CON LA TUYA
const API_KEY = '172bcfa906cd5f364a10f1a59a183c91';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// ============================================
// REFERENCIAS AL DOM
// ============================================
const formulario = document.getElementById('formulario');
const inputCiudad = document.getElementById('inputCiudad');
const resultado = document.getElementById('resultado');
const estado = document.getElementById('estado');

// Referencias adicionales para los RETOS
const btnUbicacion = document.getElementById('btnUbicacion');
const btnModo = document.getElementById('btnModo');
const historialDiv = document.getElementById('historial');

// ============================================
// FUNCIÓN PRINCIPAL: CONSULTAR CLIMA POR CIUDAD
// ============================================
async function consultarClima(ciudad) {
  // Mostrar estado de carga
  estado.textContent = '⏳ Consultando el clima...';
  resultado.classList.remove('visible');

  try {
    // Codificar la ciudad para la URL
    const ciudadCodificada = encodeURIComponent(ciudad);
    // Construir la URL con parámetros
    const url = `${API_URL}?q=${ciudadCodificada}&appid=${API_KEY}&units=metric&lang=es`;
    
    // Hacer la petición
    const respuesta = await fetch(url);
    
    // Verificar si la respuesta fue exitosa
    if (!respuesta.ok) {
      if (respuesta.status === 404) {
        throw new Error('Ciudad no encontrada');
      } else if (respuesta.status === 401) {
        throw new Error('API Key inválida');
      } else {
        throw new Error('Error en la petición: ' + respuesta.status);
      }
    }
    
    // Convertir a JSON
    const datos = await respuesta.json();
    
    // Mostrar los datos principales
    mostrarClima(datos);
    estado.textContent = '✅ Datos actualizados correctamente.';

    // RETO 2: Consultar Pronóstico de 5 días
    consultarPronostico(ciudad);

    // RETO 3: Guardar en Historial
    guardarEnHistorial(ciudad);

  } catch (error) {
    console.error('Error:', error);
    estado.textContent = `❌ ${error.message}. Intenta con otra ciudad.`;
    resultado.classList.remove('visible');
  }
}

// ============================================
// RETO 1: GEOLOCALIZACIÓN
// ============================================
async function consultarClimaPorCoordenadas(lat, lon) {
  estado.textContent = '⏳ Obteniendo clima de tu ubicación actual...';
  resultado.classList.remove('visible');

  try {
    const url = `${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      throw new Error('Error al obtener el clima de la ubicación');
    }

    const datos = await respuesta.json();
    mostrarClima(datos);
    estado.textContent = '✅ Clima de tu ubicación cargado correctamente.';

    // Consultar pronóstico de 5 días por coordenadas
    consultarPronosticoPorCoordenadas(lat, lon);

    // Guardar en historial el nombre de la ciudad obtenida
    if (datos.name) {
      guardarEnHistorial(datos.name);
    }

  } catch (error) {
    console.error('Error:', error);
    estado.textContent = `❌ ${error.message}`;
    resultado.classList.remove('visible');
  }
}

if (btnUbicacion) {
  btnUbicacion.addEventListener('click', () => {
    if (!navigator.geolocation) {
      estado.textContent = '❌ Tu navegador no soporta geolocalización.';
      return;
    }
    estado.textContent = '📍 Obteniendo ubicación...';
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const lat = posicion.coords.latitude;
        const lon = posicion.coords.longitude;
        consultarClimaPorCoordenadas(lat, lon);
      },
      (error) => {
        estado.textContent = '❌ No se pudo obtener tu ubicación. Revisa tus permisos.';
      }
    );
  });
}

// ============================================
// RETO 2: PRONÓSTICO DE 5 DÍAS
// ============================================
async function consultarPronostico(ciudad) {
  try {
    const ciudadCodificada = encodeURIComponent(ciudad);
    const url = `${FORECAST_URL}?q=${ciudadCodificada}&appid=${API_KEY}&units=metric&lang=es`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) return;

    const datos = await respuesta.json();
    mostrarPronostico(datos);
  } catch (error) {
    console.error('Error al obtener pronóstico:', error);
  }
}

async function consultarPronosticoPorCoordenadas(lat, lon) {
  try {
    const url = `${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) return;

    const datos = await respuesta.json();
    mostrarPronostico(datos);
  } catch (error) {
    console.error('Error al obtener pronóstico:', error);
  }
}

function mostrarPronostico(datos) {
  const pronosticoDiv = document.getElementById('pronostico');
  if (!pronosticoDiv) return;

  // Filtrar los datos para obtener 1 registro por día (alrededor de las 12:00:00)
  const listaDiaria = datos.list.filter(item => item.dt_txt.includes('12:00:00'));

  let htmlPronostico = `
    <h3 class="titulo-pronostico">📅 Pronóstico de 5 Días</h3>
    <div class="pronostico-grid">
  `;

  listaDiaria.forEach(item => {
    const fechaObj = new Date(item.dt * 1000);
    const opcionesDia = { weekday: 'short', day: 'numeric', month: 'short' };
    const nombreDia = fechaObj.toLocaleDateString('es-ES', opcionesDia);
    const temp = Math.round(item.main.temp);
    const desc = item.weather[0].description;
    const icono = item.weather[0].icon;
    const iconoUrl = `https://openweathermap.org/img/wn/${icono}@2x.png`;

    htmlPronostico += `
      <div class="pronostico-card">
        <div class="pronostico-fecha">${nombreDia}</div>
        <img src="${iconoUrl}" alt="${desc}" class="pronostico-icono">
        <div class="pronostico-temp">${temp}°C</div>
        <div class="pronostico-desc">${desc}</div>
      </div>
    `;
  });

  htmlPronostico += `</div>`;
  pronosticoDiv.innerHTML = htmlPronostico;
}

// ============================================
// FUNCIÓN: MOSTRAR EL CLIMA EN EL DOM (+ RETO 5)
// ============================================
function mostrarClima(datos) {
  // Extraer datos del objeto JSON anidado
  const ciudad = datos.name;
  const pais = datos.sys.country;
  const temperatura = Math.round(datos.main.temp);
  const sensacion = Math.round(datos.main.feels_like);
  const humedad = datos.main.humidity;
  const presion = datos.main.pressure;
  const viento = datos.wind.speed;
  const descripcion = datos.weather[0].description;
  const icono = datos.weather[0].icon;
  const iconoUrl = `https://openweathermap.org/img/wn/${icono}@2x.png`;

  // RETO 5: Texto para compartir en WhatsApp
  const textoWhatsapp = encodeURIComponent(` El clima en ${ciudad}, ${pais} es de ${temperatura}°C (${descripcion}). Sensación térmica de ${sensacion}°C.`);
  const urlWhatsapp = `https://wa.me/?text=${textoWhatsapp}`;

  // Construir el HTML del resultado
  resultado.innerHTML = `
    <div class="ciudad">${ciudad}</div>
    <div class="pais">${pais}</div>
    <img src="${iconoUrl}" alt="${descripcion}" class="icono-clima">
    <div class="temperatura">${temperatura}°C</div>
    <div class="descripcion">${descripcion}</div>
    <div class="detalles">
      <div class="detalle">
        <div class="etiqueta">Sensación</div>
        <div class="valor">${sensacion}°C</div>
      </div>
      <div class="detalle">
        <div class="etiqueta">Humedad</div>
        <div class="valor">${humedad}%</div>
      </div>
      <div class="detalle">
        <div class="etiqueta">Presión</div>
        <div class="valor">${presion} hPa</div>
      </div>
      <div class="detalle">
        <div class="etiqueta">Viento</div>
        <div class="valor">${viento} m/s</div>
      </div>
    </div>
    
    <!-- RETO 5: Botón Compartir en WhatsApp -->
    <div class="acciones-extra">
      <a href="${urlWhatsapp}" target="_blank" class="btn-whatsapp">
        💬 Compartir en WhatsApp
      </a>
    </div>

    <!-- RETO 2: Contenedor para el Pronóstico de 5 Días -->
    <div id="pronostico" class="pronostico-seccion"></div>
  `;

  // Mostrar el resultado
  resultado.classList.add('visible');
  // Cambiar el fondo según el clima
  cambiarFondoSegunClima(datos.weather[0].main);
}

// ============================================
// FUNCIÓN: CAMBIAR FONDO SEGÚN EL CLIMA
// ============================================
function cambiarFondoSegunClima(clima) {
  // Remover clases anteriores
  document.body.classList.remove('clima-soleado', 'clima-nublado', 'clima-lluvioso', 'clima-nieve');
  
  // Agregar la clase según el clima
  const climaLower = clima.toLowerCase();
  if (climaLower.includes('clear')) {
    document.body.classList.add('clima-soleado');
  } else if (climaLower.includes('cloud')) {
    document.body.classList.add('clima-nublado');
  } else if (climaLower.includes('rain') || climaLower.includes('drizzle') || climaLower.includes('thunderstorm')) {
    document.body.classList.add('clima-lluvioso');
  } else if (climaLower.includes('snow')) {
    document.body.classList.add('clima-nieve');
  }
}

// ============================================
// RETO 3: HISTORIAL DE BÚSQUEDAS (JSON + localStorage)
// ============================================
function guardarEnHistorial(ciudad) {
  let historial = JSON.parse(localStorage.getItem('historial')) || [];
  // Evitar duplicados no sensibles a mayúsculas/minúsculas
  historial = historial.filter(c => c.toLowerCase() !== ciudad.toLowerCase());
  historial.unshift(ciudad); // Agregar al inicio
  if (historial.length > 5) {
    historial = historial.slice(0, 5); // Guardar únicamente las últimas 5
  }
  localStorage.setItem('historial', JSON.stringify(historial));
  mostrarHistorial();
}

function mostrarHistorial() {
  if (!historialDiv) return;
  let historial = JSON.parse(localStorage.getItem('historial')) || [];
  
  if (historial.length === 0) {
    historialDiv.innerHTML = '';
    return;
  }

  let html = `<p class="titulo-historial">Búsquedas recientes:</p><div class="botones-historial">`;
  historial.forEach(ciudad => {
    html += `<button type="button" class="btn-historial" onclick="consultarClima('${ciudad}')">${ciudad}</button>`;
  });
  html += `</div>`;
  historialDiv.innerHTML = html;
}

// ============================================
// RETO 4: MODO CLARO / OSCURO
// ============================================
if (btnModo) {
  // Restaurar tema previo
  const temaGuardado = localStorage.getItem('tema');
  if (temaGuardado === 'claro') {
    document.body.classList.add('claro');
  }

  btnModo.addEventListener('click', () => {
    document.body.classList.toggle('claro');
    const esClaro = document.body.classList.contains('claro');
    localStorage.setItem('tema', esClaro ? 'claro' : 'oscuro');
  });
}

// ============================================
// EVENTO DEL FORMULARIO
// ============================================
formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  const ciudad = inputCiudad.value.trim();
  if (!ciudad) {
    estado.textContent = ' Escribe el nombre de una ciudad.';
    return;
  }
  consultarClima(ciudad);
});

// ============================================
// MENSAJE E INICIALIZACIÓN
// ============================================
estado.textContent = 'Escribe una ciudad y presiona "Consultar".';
mostrarHistorial();
