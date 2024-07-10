/** @format */

// login/LoginAuth/Auth.js

// Obtener la URL de la API desde las variables de entorno
const apiUrl = "http://localhost:9000/api"; // Fallback a URL local si no se define en .env

// Función para hacer login
async function loginUser(email, password) {
  try {
    const response = await fetch(`${apiUrl}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    // Aquí puedes manejar la respuesta del servidor, como almacenar tokens de sesión, etc.
    console.log("Login successful, token:", data.token);

    // Almacenar el token en localStorage
    localStorage.setItem("token", data.token);

    // Redirigir al usuario a otra página (por ejemplo, dashboard.html)
    window.location.href = "../../dashboard/Main/Dashboard.html";
  } catch (error) {
    console.error("Error logging in:", error.message);
  }
}

// Event listener para el botón de login
document.getElementById("loginButton").addEventListener("click", () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  loginUser(email, password);
});
