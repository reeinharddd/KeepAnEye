/** @format */

// dashboard/Main/Dashboard.js

// Obtener la URL de la API desde las variables de entorno
const apiUrl = "http://localhost:5123/api"; // Fallback a URL local si no se define en .env
let map;
let pinMarker;
let geofenceCircle;

// Función para inicializar el mapa
function initMap() {
  const mapCenter = { lat: 34.052235, lng: -118.243683 }; // Centro inicial del mapa cerca de Los Ángeles
  map = L.map("map").setView([mapCenter.lat, mapCenter.lng], 25); // Inicializar mapa con Leaflet, nivel de zoom 13

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 25,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Llamar a la función para obtener y mostrar las métricas del usuario
  fetchUserMetrics();
}
// Función para obtener las métricas del usuario
async function fetchUserMetrics() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  console.log("userId", userId);
  if (!token || !userId) {
    console.error("Token or User ID not found");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/metrics/location/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("User metrics:", data);

    // Llamar a la función para renderizar las métricas en el gráfico
    updateMap(data);
  } catch (error) {
    console.error("Error fetching user metrics:", error.message);
  }
}
function updateMap(metrics) {
  // Si no hay métricas, no hacer nada
  if (metrics.length === 0) {
    console.warn("No metrics available to display");
    return;
  }

  // Encontrar la ubicación más reciente
  const latestLocation = metrics.reduce((prev, current) => {
    return new Date(current.timestamp) > new Date(prev.timestamp)
      ? current
      : prev;
  });

  // Si el marcador ya existe, actualizar su posición; de lo contrario, crear uno nuevo
  if (pinMarker) {
    pinMarker.setLatLng([
      latestLocation.coordinates.latitude,
      latestLocation.coordinates.longitude,
    ]);
  } else {
    pinMarker = L.marker([
      latestLocation.coordinates.latitude,
      latestLocation.coordinates.longitude,
    ])
      .addTo(map)
      .bindPopup("Última ubicación")
      .openPopup();
  }

  // Centrar el mapa en la ubicación más reciente
  map.setView(
    [latestLocation.coordinates.latitude, latestLocation.coordinates.longitude],
    13 // Nivel de zoom, ajusta según sea necesario
  );

  // Definir un círculo para el geofence
  if (geofenceCircle) {
    geofenceCircle.setLatLng([
      latestLocation.coordinates.latitude,
      latestLocation.coordinates.longitude,
    ]);
  } else {
    geofenceCircle = L.circle(
      [
        latestLocation.coordinates.latitude,
        latestLocation.coordinates.longitude,
      ],
      {
        color: "#00A696", // Color del borde del círculo
        fillColor: "#00A696", // Color de relleno del círculo
        fillOpacity: 0.3, // Opacidad de relleno
        radius: 5000, // Radio de 5 km (ajusta según sea necesario)
      }
    ).addTo(map);
  }
}

// Llamar a la función de inicialización del mapa cuando se cargue la página
document.addEventListener("DOMContentLoaded", initMap);

// Función para obtener los documentos del usuario
async function fetchUserMedicalInfo() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    console.error("Token or User ID not found");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/medical-info/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized access - redirecting to login");
        redirectToLogin();
      }
      throw new Error(`Failed to fetch medical info: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("User medical info:", data);
    fetchUserMedicalDocuments();

    // Aquí puedes manejar los datos recibidos y actualizar la UI
  } catch (error) {
    console.error("Error fetching medical info:", error.message);
    // Añade manejo adicional de errores según sea necesario
  }
}

//Obtener todos los documentos de un usurio

async function fetchUserMedicalDocuments() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  if (!token || !userId) {
    console.error("Token or User ID not found");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/medical-info/documents/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch medical documents: ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("User medical documents:", data);
  } catch (error) {
    console.error("Error fetching medical documents:", error.message);
  }
}

// Llamada a la función principal de obtención de perfil de usuario y datos iniciales
async function fetchUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token not found");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/user/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized access - redirecting to login");
        redirectToLogin();
      }
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("User profile:", data);

    let userId;
    if (data.user_type === "admin") {
      if (data.patients && data.patients.length > 0) {
        userId = data.patients[0].patientId;
      } else {
        console.error("No valid userId found for admin user with no patients");
        redirectToLogin();
        return;
      }
    } else {
      userId = data.id;
    }

    localStorage.setItem("userId", userId);

    const fullName = `${data.name.firstName} ${data.name.lastName}`;
    const userPhoto = data.userPhoto;

    // Actualizar elementos DOM con los datos del usuario
    const welcomeTitle = document.querySelector(
      ".main-header__welcome-title.text-light"
    );
    if (welcomeTitle) {
      welcomeTitle.innerText = fullName;
    }

    const profileTitle = document.querySelector(
      ".sidenav__profile-title.text-light"
    );
    if (profileTitle) {
      profileTitle.innerText = fullName;
    }

    const profileAvatar = document.querySelector(".sidenav__profile-avatar");
    if (profileAvatar) {
      profileAvatar.src = userPhoto;
    }

    const headerAvatar = document.querySelector(".header__avatar");
    if (headerAvatar) {
      headerAvatar.style.backgroundImage = `url(${userPhoto})`;
    }

    // Llamar a las funciones de obtención de métricas y documentos después de obtener el perfil
    fetchUserMetrics();
    fetchUserMedicalInfo();
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    redirectToLogin();
  }
}

window.onload = fetchUserProfile;

// function redirectToLogin() {
//   window.location.href = "../../login/LoginScreen/LoginScreen.html";
// }
function redirectToLogin() {
  // Esperar 3 segundos antes de redirigir
  setTimeout(() => {
    window.location.href = "../../login/LoginScreen/LoginScreen.html";
  }, 30000); // 3000 milisegundos = 3 segundos
}
