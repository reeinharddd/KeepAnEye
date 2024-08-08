/** @format */

const apiUrl = "http://localhost:5123/api";

async function fetchProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token not found");
    redirectToLogin();
    return;
  }

  try {
    console.log("Fetching user profile");
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
    generalInfo(data);
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    redirectToLogin();
  }
}

function generalInfo(data) {
  const fullName = `${data.name.firstName} ${data.name.lastName}`;
  const userPhoto = data.userPhoto;
  const gender = data.sex;
  const email = data.email;
  const phone = data.phone;
  const address = `${data.address.street}, ${data.address.city}, ${data.address.state}, ${data.address.zip}`;
  const birthDate = new Date(data.bornDate).toLocaleDateString();
  const createdAt = new Date(data.created_at).toLocaleDateString();

  document.getElementById("fullName").textContent = `Nombre: ${fullName}`;
  document.getElementById("userPhoto").src = userPhoto;
  document.getElementById("gender").textContent = `Sexo: ${gender}`;
  document.getElementById("email").textContent = `Correo: ${email}`;
  document.getElementById("phone").textContent = `Teléfono: ${phone}`;
  document.getElementById("address").textContent = `Dirección: ${address}`;
  document.getElementById(
    "birthDate"
  ).textContent = `Fecha de nacimiento: ${birthDate}`;
  document.getElementById(
    "createdAt"
  ).textContent = `Fecha de creación: ${createdAt}`;

  const patientsList = document.getElementById("patientsList");
  patientsList.innerHTML = ""; // Limpiar lista existente
  data.patients.forEach((patient) => {
    const li = document.createElement("li");
    li.textContent = `Nombre: ${patient.name}`;
    patientsList.appendChild(li);
  });
}

// Función para redirigir al login
function redirectToLogin() {
  window.location.href = "/login.html";
}

document.addEventListener("DOMContentLoaded", fetchProfile);
