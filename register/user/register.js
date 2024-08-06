/** @format */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAD5J750kg-Sk9bXVHNZy9HM9Py2b8yxNo",
  authDomain: "keepaneye5b.firebaseapp.com",
  databaseURL: "https://keepaneye5b-default-rtdb.firebaseio.com",
  projectId: "keepaneye5b",
  storageBucket: "keepaneye5b.appspot.com",
  messagingSenderId: "455930935818",
  appId: "1:455930935818:web:1e21310a4ba1cb70153df3",
  measurementId: "G-D0LX7JKTEB",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    // Obtener el archivo del campo de archivo
    const fileInput = document.querySelector('input[type="file"]');
    let photoUrl = "";
    if (fileInput && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const storageRef = ref(storage, "profile_pictures/" + file.name);

      try {
        const snapshot = await uploadBytes(storageRef, file);
        photoUrl = await getDownloadURL(snapshot.ref);
        console.log("Uploaded Photo URL:", photoUrl);
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Error al subir la foto.");
        return;
      }
    }

    // Validación de email
    const email = formData.get("email");
    if (!validateEmail(email)) {
      alert("Correo electrónico inválido.");
      return;
    }

    // Validación de teléfono
    let phone = formData.get("phone");
    if (phone) {
      phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
      if (!validatePhone(phone)) {
        alert("Número de teléfono inválido.");
        return;
      }
    } else {
      alert("Número de teléfono no proporcionado.");
      return;
    }

    try {
      const user = {
        name: {
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
        },
        sex: formData.get("sex"),
        born_date: formData.get("bornDate"),
        email: email,
        password: formData.get("password"),
        phone: phone,
        address: {
          street: formData.get("street"),
          city: formData.get("city"),
          state: formData.get("state"),
          zip: formData.get("zip"),
        },
        userType: "admin",
        status: "active",
        created_at: new Date().toISOString(),
        patients: [],
        userPhoto: photoUrl,
      };

      console.log("User Data to Register:", user);

      const response = await fetch("http://localhost:5123/api/user/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error("Error al parsear la respuesta JSON:", e);
        throw new Error("La respuesta del servidor no es un JSON válido.");
      }

      console.log("Register Response Status:", response.status);
      console.log("Register Response Headers:", response.headers);

      if (response.ok) {
        alert("Usuario registrado exitosamente.");
        form.reset();
        window.location.href = "../../login/LoginScreen/LoginScreen.html";
      } else {
        console.log("Register Error Data:", responseData);
        alert(`Error: ${responseData.message}`);
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Error al registrar el usuario.");
    }
  });

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
    return re.test(email);
  }

  function validatePhone(phone) {
    const re = /^\d{3}-\d{3}-\d{4}$/;
    return re.test(phone);
  }
});
