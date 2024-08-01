/** @format */

// dashboard/Main/Dashboard.js

// Obtener la URL de la API desde las variables de entorno
const apiUrl = "http://localhost:5123/api"; // Fallback a URL local si no se define en .env
let map;
let pinMarker;
let geofenceCircle;

//Funcion para obtener los datos del usuario cunado se cargue la pagina
window.onload = fetchUserProfile;

//Obtener Metrics:
document.addEventListener("DOMContentLoaded", fetchAllUserMetrics);

// Llamar a la función de inicialización del mapa cuando se cargue la página
document.addEventListener("DOMContentLoaded", initMap);

// Conectar al Hub de SignalR
const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5123/metricsHub", {
    transport: signalR.HttpTransportType.WebSockets,
  })
  .configureLogging(signalR.LogLevel.Trace)
  .build();

connection.on("ReceiveLocationUpdate", (locationData) => {
  // console.log("Location update received:", locationData);
  updateMap([locationData]);
});

connection.on("ReceiveAllMetrics", (metricsData) => {
  // console.log("All metrics received:", metricsData);
});

connection
  .start()
  .catch((err) => console.error("SignalR Connection Error: ", err));

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
    // console.log("User profile:", data);

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
    fetchUserLocation();
    fetchUserMedicalInfo();
    fetchAllUserMetrics();
    fetchAllUserAppointments();
    fetchAllUserReminders();
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    redirectToLogin();
  }
}

//FUncion para obtener todas las metrics
async function fetchAllUserMetrics() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  // console.log("token", token);
  if (!token || !userId) {
    console.error("Token or User ID not found");
    redirectToLogin(); // Función para redirigir al usuario a la página de inicio de sesión
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/metrics/all/${userId}`, {
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
    // console.log("All user metrics:", data);

    if (data.length === 0) {
      console.warn("No metrics available to display");
      return;
    }

    updateMetricsDOM(data);

    // // Extraer el último resultado de cada métrica
    // const latestMetrics = {
    //   heartRate: null,
    //   temperature: null,
    // };

    // data.forEach((record) => {
    //   if (record.heartRate.length > 0) {
    //     const latestHeartRate = record.heartRate.reduce((prev, current) =>
    //       new Date(current.timestamp) > new Date(prev.timestamp)
    //         ? current
    //         : prev
    //     );
    //     latestMetrics.heartRate = latestHeartRate;
    //   }

    //   if (record.temperature.length > 0) {
    //     const latestTemperature = record.temperature.reduce((prev, current) =>
    //       new Date(current.timestamp) > new Date(prev.timestamp)
    //         ? current
    //         : prev
    //     );
    //     latestMetrics.temperature = latestTemperature;
    //   }
    // });

    // // Inyectar los últimos resultados en el DOM
    // const heartRateTotalElement = document.getElementById("heartRateTotal");
    // const temperatureTotalElement = document.getElementById("temperatureTotal");

    // if (heartRateTotalElement) {
    //   heartRateTotalElement.textContent = latestMetrics.heartRate
    //     ? `${latestMetrics.heartRate.value} bpm`
    //     : "No data";
    // }

    // if (temperatureTotalElement) {
    //   temperatureTotalElement.textContent = latestMetrics.temperature
    //     ? `${latestMetrics.temperature.value} °C`
    //     : "No data";
    // }
  } catch (error) {
    console.error("Error fetching all user metrics:", error.message);
  }
}

//actualizar metricas del dom
function updateMetricsDOM(data) {
  const latestMetrics = {
    heartRate: null,
    temperature: null,
  };

  data.forEach((record) => {
    if (record.heartRate.length > 0) {
      const latestHeartRate = record.heartRate.reduce((prev, current) =>
        new Date(current.timestamp) > new Date(prev.timestamp) ? current : prev
      );
      latestMetrics.heartRate = latestHeartRate;
    }

    if (record.temperature.length > 0) {
      const latestTemperature = record.temperature.reduce((prev, current) =>
        new Date(current.timestamp) > new Date(prev.timestamp) ? current : prev
      );
      latestMetrics.temperature = latestTemperature;
    }
  });

  // Inyectar los últimos resultados en el DOM
  const heartRateTotalElement = document.getElementById("heartRateTotal");
  const temperatureTotalElement = document.getElementById("temperatureTotal");

  if (heartRateTotalElement) {
    heartRateTotalElement.textContent = latestMetrics.heartRate
      ? `${latestMetrics.heartRate.value} bpm`
      : "No data";
  }

  if (temperatureTotalElement) {
    temperatureTotalElement.textContent = latestMetrics.temperature
      ? `${latestMetrics.temperature.value} °C`
      : "No data";
  }
}

// Función para obtener la ubicaion del usuario
// Función para obtener la ubicación del usuario
async function fetchUserLocation() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  // console.log("userId", userId);

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
    // console.log("User Location:", data);

    updateMap(data);
  } catch (error) {
    console.error("Error fetching user metrics:", error.message);
  }
}

// Función para inicializar el mapa
function initMap() {
  const mapCenter = { lat: 34.052235, lng: -118.243683 }; // Centro inicial del mapa cerca de Los Ángeles
  map = L.map("map").setView([mapCenter.lat, mapCenter.lng], 13); // Nivel de zoom ajustado a 13

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  fetchUserLocation();
}

// Función para actualizar el mapa con la ubicación del usuario
function updateMap(metrics) {
  if (!metrics || metrics.length === 0) {
    console.warn("No metrics available to display");
    return;
  }

  // const latestLocation = metrics.reduce((prev, current) => {
  //   return new Date(current.timestamp) > new Date(prev.timestamp)
  //     ? current
  //     : prev;
  // });
  const latestLocation = metrics[metrics.length - 1];

  // Actualizar el marcador si existe o crear uno nuevo
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

  // Actualizar o crear el círculo del geofence
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
        radius: 500, // Radio de 500 metros
      }
    ).addTo(map);
  }
}

// Función para obtener toda la informacion medica del usuario
async function fetchUserMedicalInfo() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    console.error("Token or User ID not found");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/medicalinfo/${userId}`, {
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
    // console.log("User medical info:", data);
    fetchUserMedicalDocuments();

    // Aquí puedes manejar los datos recibidos y actualizar la UI
  } catch (error) {
    console.error("Error fetching medical info:", error.message);
    // Añade manejo adicional de errores según sea necesario
  }
}

// Función para obtener todas las citas del usuario
async function fetchAllUserAppointments() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  if (!token || !userId) {
    console.error("Token or User ID not found");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/appointment/patient/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log("All user appointments:", data);

    // Llamar a la función para actualizar el DOM con las citas
    updateAppointmentsDOM(data);
  } catch (error) {
    console.error("Error fetching all user appointments:", error.message);
  }
}

// Función para obtener todos los recordatorios del usuario
async function fetchAllUserReminders() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  if (!token || !userId) {
    console.error("Token or User ID not found");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/reminder/user/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reminders: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log("All user reminders:", data);

    // Llamar a la función para actualizar el DOM con los recordatorios
    updateRemindersDOM(data);
  } catch (error) {
    console.error("Error fetching all user reminders:", error.message);
  }
}

// Función para actualizar el DOM con las citas
function updateAppointmentsDOM(appointments) {
  const container = document.getElementById("appointmentsContainer");
  if (!container) {
    console.error("Appointments container not found");
    return;
  }

  // Obtener la fecha y hora actual
  const now = new Date();

  // Filtrar las citas para excluir las anteriores a la fecha y hora actual
  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date);
    return appointmentDate >= now;
  });

  // Ordenar las citas filtradas por fecha en orden descendente
  filteredAppointments.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Limitar a 5 citas
  const limitedAppointments = filteredAppointments.slice(0, 5);

  // Limpiar el contenedor antes de añadir nuevos elementos
  container.innerHTML = "";

  limitedAppointments.forEach((appointment) => {
    const appointmentElement = document.createElement("div");
    appointmentElement.classList.add("card__row");

    const iconElement = document.createElement("div");
    iconElement.classList.add("card__icon");
    iconElement.innerHTML = '<i class="fas fa-calendar-alt"></i>';

    const timeElement = document.createElement("div");
    timeElement.classList.add("card__time");
    timeElement.innerHTML = `<div>${new Date(
      appointment.date
    ).toLocaleDateString()}</div>`;

    const detailElement = document.createElement("div");
    detailElement.classList.add("card__detail");

    const sourceElement = document.createElement("div");
    sourceElement.classList.add("card__source", "text-bold");
    sourceElement.textContent = `${appointment.place}`;

    const descriptionElement = document.createElement("div");
    descriptionElement.classList.add("card__description");
    descriptionElement.textContent = `Time: ${appointment.time}`;

    const noteElement = document.createElement("div");
    noteElement.classList.add("card__note");
    // noteElement.textContent = `Patient ID: ${appointment.patientId}`;

    detailElement.appendChild(sourceElement);
    detailElement.appendChild(descriptionElement);
    detailElement.appendChild(noteElement);

    appointmentElement.appendChild(iconElement);
    appointmentElement.appendChild(timeElement);
    appointmentElement.appendChild(detailElement);

    container.appendChild(appointmentElement);
  });
}

// Función para actualizar el DOM con los recordatorios
function updateRemindersDOM(reminders) {
  const container = document.getElementById("remindersContainer");
  if (!container) {
    console.error("Reminders container not found");
    return;
  }

  // Obtener la fecha y hora actual
  const now = new Date();

  // Filtrar los recordatorios para excluir los anteriores a la fecha y hora actual
  const filteredReminders = reminders.filter((reminder) => {
    const reminderDate = new Date(reminder.date);
    return reminderDate >= now;
  });

  // Ordenar los recordatorios filtrados por fecha en orden descendente
  filteredReminders.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Limitar a 5 recordatorios
  const limitedReminders = filteredReminders.slice(0, 5);

  // Limpiar el contenedor antes de añadir nuevos elementos
  container.innerHTML = "";

  limitedReminders.forEach((reminder) => {
    const reminderElement = document.createElement("div");
    reminderElement.classList.add("card__row");

    const iconElement = document.createElement("div");
    iconElement.classList.add("card__icon");
    iconElement.innerHTML = '<i class="fas fa-bell"></i>';

    const timeElement = document.createElement("div");
    timeElement.classList.add("card__time");
    timeElement.innerHTML = `<div>${new Date(
      reminder.date
    ).toLocaleDateString()}</div>`;

    const detailElement = document.createElement("div");
    detailElement.classList.add("card__detail");

    const sourceElement = document.createElement("div");
    sourceElement.classList.add("card__source", "text-bold");
    sourceElement.textContent = reminder.title || "No Title";

    const descriptionElement = document.createElement("div");
    descriptionElement.classList.add("card__description");
    descriptionElement.textContent = reminder.description || "No Description";

    const noteElement = document.createElement("div");
    noteElement.classList.add("card__note");
    noteElement.textContent = reminder.date;

    detailElement.appendChild(sourceElement);
    detailElement.appendChild(descriptionElement);
    detailElement.appendChild(noteElement);

    reminderElement.appendChild(iconElement);
    reminderElement.appendChild(timeElement);
    reminderElement.appendChild(detailElement);

    container.appendChild(reminderElement);
  });
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
    const response = await fetch(`${apiUrl}/medicalinfo/documents/${userId}`, {
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
    // console.log("User medical documents:", data);
    renderDocuments(data);
  } catch (error) {
    console.error("Error fetching medical documents:", error.message);
  }
}

function getMimeTypeImage(mimeType) {
  switch (mimeType) {
    case "application/pdf":
      return "../../images/pdf.png"; // Ruta a la imagen del ícono PDF
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "../../images/word.png"; // Ruta a la imagen del ícono Word
    // Agrega más casos según los tipos MIME que necesites manejar
    default:
      return "../../images/css.png"; // Ruta a la imagen por defecto
  }
}

function renderDocuments(documents) {
  const container = document.querySelector(".documents");

  // Ordena los documentos por fecha (más reciente primero)
  documents.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Limita a 4 documentos
  documents.slice(0, 4).forEach((doc) => {
    const documentElement = document.createElement("div");
    documentElement.classList.add("document");

    const documentImg = document.createElement("div");
    documentImg.classList.add("document__img");
    documentImg.style.backgroundImage = `url(${getMimeTypeImage(
      doc.mimeType
    )})`;

    const documentTitle = document.createElement("div");
    documentTitle.classList.add("document__title");
    documentTitle.textContent = doc.name;

    const documentDate = document.createElement("div");
    documentDate.classList.add("document__date");
    const date = new Date(doc.date);
    documentDate.textContent = `${
      date.getMonth() + 1
    }/${date.getDate()}/${date.getFullYear()}`;

    documentElement.appendChild(documentImg);
    documentElement.appendChild(documentTitle);
    documentElement.appendChild(documentDate);

    container.appendChild(documentElement);
  });
}

function redirectToLogin() {
  window.location.href = "../../login/LoginScreen/LoginScreen.html";
}
// function redirectToLogin() {
//   // Esperar 3 segundos antes de redirigir
//   setTimeout(() => {
//     window.location.href = "../../login/LoginScreen/LoginScreen.html";
//   }, 30000); // 3000 milisegundos = 3 segundos
// }
