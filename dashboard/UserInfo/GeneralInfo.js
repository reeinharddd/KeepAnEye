/** @format */

// dashboard/Main/Dashboard.js

// Obtener la URL de la API desde las variables de entorno
const apiUrl = "http://localhost:9000/api"; // Fallback a URL local si no se define en .env

// Función para obtener el perfil del usuario
async function fetchUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token not found");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/users/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized access - redirecting to login");
      }
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("User profile:", data);

    // Mostrar los datos del usuario en la página
    localStorage.setItem("userId", data._id);
    const fullName = `${data.name.first_name} ${data.name.last_name}`;
    const userPhoto = data.user_photo;

    // Actualizar el nombre completo en los elementos DOM correspondientes
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

    // Actualizar la foto de perfil en los elementos DOM correspondientes
    const profileAvatar = document.querySelector(".sidenav__profile-avatar");
    if (profileAvatar) {
      profileAvatar.src = userPhoto;
    }

    const headerAvatar = document.querySelector(".header__avatar");
    if (headerAvatar) {
      headerAvatar.style.backgroundImage = `url(${userPhoto})`;
    }

    // Otros elementos que necesiten datos del usuario pueden ser actualizados aquí
    // Ejemplo: document.getElementById("anotherElement").innerText = data.anotherField;
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    redirectToLogin();
  }
}
// Función para obtener las métricas del usuario
async function fetchUserMetrics() {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.error("User ID not found");
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/metrics/location/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("User metrics:", data);

    // Llamar a la función para renderizar las métricas en el gráfico
    renderChart(data);
  } catch (error) {
    console.error("Error fetching user metrics:", error.message);
  }
}

// Llamar a la función para obtener las métricas cuando se cargue la página
window.onload = () => {
  fetchUserProfile();
  fetchUserMetrics();
};

// Función para redirigir al login
function redirectToLogin() {
  window.location.href = "../../login/LoginScreen/LoginScreen.html";
}

// Llamar a la función para obtener el perfil del usuario cuando se cargue la página
// window.onload = fetchUserProfile;
