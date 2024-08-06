/** @format */

// dashboard/Main/Dashboard.js

// Obtener la URL de la API desde las variables de entorno
const apiUrl = "http://localhost:5123/api"; // Fallback a URL local si no se define en .env
let map;
let pinMarker;
let geofenceCircle;

//Funcion para obtener los datos del usuario cunado se cargue la pagina
window.onload = async () => {
  await fetchUserProfile();
  fetchAllUserMetrics();
  initMap();
};
//Obtener Metrics:
// document.addEventListener("DOMContentLoaded", fetchAllUserMetrics);

// // Llamar a la función de inicialización del mapa cuando se cargue la página
// document.addEventListener("DOMContentLoaded", initMap);

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
    console.log("User profile:", data);

    let userId;

    if (data.userType === "admin") {
      if (data.patients && data.patients.length > 0) {
        userId = data.patients[0].patientId;
        console.log(
          "Admin user with patients, using first patient ID:",
          userId
        );
      } else {
        userId = data.id; // Usar el propio ID si no hay pacientes
        console.log("Admin user with no patients, using own ID:", userId);
      }
    } else {
      userId = data.id; // Usar el propio ID para usuarios que no son admin
      console.log("Regular user ID:", userId);
    }

    localStorage.setItem("userId", userId);

    const fullName = `${data.name.firstName} ${data.name.lastName}`;
    const userPhoto = data.userPhoto;

    // Actualizar elementos DOM con los datos del usuario
    updateUserProfileDOM(fullName, userPhoto);

    // Llamar a las funciones de obtención de métricas y documentos después de obtener el perfil
    await fetchUserLocation();
    await fetchUserMedicalInfo();
    await fetchAllUserAppointments();
    await fetchAllUserReminders();
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    redirectToLogin();
  }
}

function updateUserProfileDOM(fullName, userPhoto) {
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
}

//FUncion para obtener todas las metrics
async function fetchAllUserMetrics() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  console.log("token", token);
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
    console.log("User medical info:", data);
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
    console.log("All user appointments:", data);
    // console.log("test", data[0].appointments[0]);

    // Llamar a la función para actualizar el DOM con las citas
    updateAppointmentsDOM(data);
  } catch (error) {
    console.error("Error fetching all user appointments:", error.message);
  }
}
// Función para actualizar el DOM con las citas
function updateAppointmentsDOM(appointments) {
  const container = document.getElementById("appointmentsContainer");
  if (!container) {
    console.error("Appointments container not found");
    return;
  }

  console.log("appoints antes de filteredAppointments", appointments);

  const now = new Date();

  const filteredAppointments = appointments.flatMap((item) =>
    item.appointments
      .map((appointment) => ({
        ...appointment,
        appointmentId: item.id, // Incluye el ID del item en el objeto appointment
      }))
      .filter((appointment) => {
        const appointmentDate = new Date(appointment.date);
        const isPending = appointment.status === "Pending";
        console.log("appoints antes de durante", appointment);

        return appointmentDate >= now && isPending;
      })
  );

  filteredAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));

  const limitedAppointments = filteredAppointments.slice(0, 5);

  container.innerHTML = "";

  limitedAppointments.forEach((appointment, index) => {
    const appointmentElement = document.createElement("div");
    appointmentElement.classList.add("card__row");

    const iconElement = document.createElement("div");
    iconElement.classList.add("card__icon");
    iconElement.innerHTML = '<i class="fas fa-calendar-alt"></i>';

    const appointmentDate = new Date(appointment.date);
    const currentDate = new Date();

    // Calcular los días restantes
    const timeDiff = appointmentDate.getTime() - currentDate.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Crear el elemento para mostrar la fecha y los días restantes
    const timeElement = document.createElement("div");
    timeElement.classList.add("card__time");
    timeElement.innerHTML = `
  <div>
    Fecha: ${appointmentDate.toLocaleDateString()}
  </div>
  <div>
    Días restantes: ${daysRemaining}
  </div>
`;

    const detailElement = document.createElement("div");
    detailElement.classList.add("card__detail");

    const sourceElement = document.createElement("div");
    sourceElement.classList.add("card__source", "text-bold");
    sourceElement.textContent = appointment.place
      ? appointment.place
      : "No place provided";

    const descriptionElement = document.createElement("div");
    descriptionElement.classList.add("card__description");
    descriptionElement.textContent = appointment.time
      ? `Time: ${appointment.time}`
      : "No time provided";

    const noteElement = document.createElement("div");
    noteElement.classList.add("card__note");

    detailElement.appendChild(sourceElement);
    detailElement.appendChild(descriptionElement);
    detailElement.appendChild(noteElement);

    const completeButton = document.createElement("button");
    completeButton.textContent = "Marcar como completado";
    completeButton.classList.add("mark-complete-button");
    completeButton.addEventListener("click", async () => {
      console.log("Mark as complete clicked");
      console.log("Appointment:", appointment);
      await markAppointmentAsComplete(appointment, index);
    });

    detailElement.appendChild(completeButton);

    appointmentElement.appendChild(iconElement);
    appointmentElement.appendChild(timeElement);
    appointmentElement.appendChild(detailElement);

    container.appendChild(appointmentElement);
  });
}

// Función para marcar una cita como completa
async function markAppointmentAsComplete(appointment, index) {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token not found");
    redirectToLogin();
    return;
  }

  if (!appointment.appointmentId) {
    console.error("Appointment ID not found");
    return;
  }

  // Asegúrate de que el appointment tenga el formato esperado
  const updatedAppointment = {
    id: appointment.appointmentId, // El ID de la cita
    PatientId: localStorage.getItem("userId"), // Asegúrate de que el PatientId sea el ID del paciente
    Appointments: [
      {
        Date: appointment.date, // Fecha en formato ISO 8601
        Time: appointment.time,
        Place: appointment.place,
        Status: "Completed", // Cambia el estado a "Completed"
      },
    ],
  };

  try {
    const response = await fetch(
      `${apiUrl}/appointment/${appointment.appointmentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedAppointment),
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Failed to update appointment: ${response.statusText} - ${errorDetails}`
      );
    }

    fetchAllUserAppointments();
  } catch (error) {
    console.error("Error marking appointment as complete:", error.message);
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
    console.log("All user reminders:", data);

    // Llamar a la función para actualizar el DOM con los recordatorios
    updateRemindersDOM(data);
  } catch (error) {
    console.error("Error fetching all user reminders:", error.message);
  }
}

// Función para actualizar el DOM con los recordatorios
function updateRemindersDOM(reminders) {
  const container = document.getElementById("remindersContainer");
  if (!container) {
    console.error("Reminders container not found");
    return;
  }

  console.log("reminders antes de filteredReminders", reminders);

  const now = new Date();

  const filteredReminders = reminders
    .filter((reminder) => {
      const reminderDate = new Date(reminder.date);
      const isPending = reminder.status === "Pending";
      return reminderDate >= now && isPending;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  container.innerHTML = "";

  filteredReminders.forEach((reminder, index) => {
    const reminderElement = document.createElement("div");
    reminderElement.classList.add("card__row");

    const iconElement = document.createElement("div");
    iconElement.classList.add("card__icon");
    iconElement.innerHTML = '<i class="fas fa-bell"></i>';

    const timeElement = document.createElement("div");
    timeElement.classList.add("card__time");
    timeElement.innerHTML = `<div>${new Date(
      reminder.date
    ).toLocaleDateString()} ${new Date(
      reminder.date
    ).toLocaleTimeString()}</div>`;

    const detailElement = document.createElement("div");
    detailElement.classList.add("card__detail");

    const sourceElement = document.createElement("div");
    sourceElement.classList.add("card__source", "text-bold");
    sourceElement.textContent = reminder.title
      ? reminder.title
      : "No title provided";

    const descriptionElement = document.createElement("div");
    descriptionElement.classList.add("card__description");
    descriptionElement.textContent = reminder.description
      ? reminder.description
      : "No description provided";

    const noteElement = document.createElement("div");
    noteElement.classList.add("card__note");

    detailElement.appendChild(sourceElement);
    detailElement.appendChild(descriptionElement);
    detailElement.appendChild(noteElement);

    const completeButton = document.createElement("button");
    completeButton.textContent = "Marcar como completado";
    completeButton.classList.add("mark-complete-button");
    completeButton.addEventListener("click", async () => {
      console.log("Mark as complete clicked");
      console.log("Reminder:", reminder);
      await markReminderAsComplete(reminder, index);
    });

    detailElement.appendChild(completeButton);

    reminderElement.appendChild(iconElement);
    reminderElement.appendChild(timeElement);
    reminderElement.appendChild(detailElement);

    container.appendChild(reminderElement);
  });
}
async function markReminderAsComplete(reminder, index) {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token not found");
    redirectToLogin();
    return;
  }

  if (!reminder.id) {
    console.error("Reminder ID not found");
    return;
  }

  // Asegúrate de que el reminder tenga el formato esperado
  const updatedReminder = {
    id: reminder.id, // El ID del recordatorio
    userToRemind: localStorage.getItem("userId"), // Asegúrate de que userToRemind sea el ID del usuario
    title: reminder.title,
    description: reminder.description,
    date: reminder.date,
    status: "Completed", // Cambia el estado a "Completed"
  };

  try {
    const response = await fetch(`${apiUrl}/reminder/${reminder.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedReminder),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Failed to update reminder: ${response.statusText} - ${errorDetails}`
      );
    }

    // Actualiza la lista de recordatorios después de la actualización
    fetchAllUserReminders();
  } catch (error) {
    console.error("Error marking reminder as complete:", error.message);
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
    console.log("User medical documents:", data);
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
      return "../../images/pdf.png"; // Ruta a la imagen por defecto
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

    const anchorElement = document.createElement("a");
    anchorElement.href = doc.url; // Establece la URL del documento
    anchorElement.target = "_blank"; // Abre el enlace en una nueva pestaña

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

    anchorElement.appendChild(documentImg);
    documentElement.appendChild(anchorElement);
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
