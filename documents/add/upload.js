/** @format */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-storage.js";

// Configuración de Firebase
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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

document
  .getElementById("uploadForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById("fileInput");
    const patientId = document.getElementById("patientIdInput").value;

    if (fileInput.files.length === 0) {
      alert("Por favor, seleccione un archivo.");
      return;
    }

    const file = fileInput.files[0];
    const mimeType = file.type; // Obtener el tipo MIME del archivo automáticamente
    const fileName = file.name;
    const uploadDate = new Date().toISOString(); // Obtener la fecha actual en formato ISO
    const storageRef = ref(storage, `documents/${fileName}`);
    const id = localStorage.getItem("userId");
    try {
      // Subir el archivo
      const snapshot = await uploadBytes(storageRef, file);
      const fileURL = await getDownloadURL(snapshot.ref);

      // Enviar el enlace y otros datos al backend
      const response = await fetch(
        `http://localhost:5123/api/medicalinfo/${id}/documents`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              Type: mimeType,
              name: fileName,
              Date: uploadDate,
              url: fileURL,
            },
          ]),
        }
      );

      if (response.ok) {
        alert("Documento subido exitosamente.");
      } else {
        const error = await response.json();
        alert(`Error al subir el documento: ${error.message}`);
      }
    } catch (error) {
      console.error("Error en la subida del archivo:", error);
      alert("Error al subir el archivo.");
    }
  });
