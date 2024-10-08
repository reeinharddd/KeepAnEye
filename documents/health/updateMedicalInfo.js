/** @format */

document.addEventListener("DOMContentLoaded", () => {
  const patientId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  if (!patientId) {
    console.error("No se encontró el ID del paciente en localStorage.");
    return;
  }

  async function loadMedicalInfo() {
    try {
      const response = await fetch(`${apiUrl}/medicalinfo/${patientId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const medicalInfo = await response.json();
        console.log("Información médica:", medicalInfo);
        console.log("nss", medicalInfo.nss);
        document.getElementById("nss").value = medicalInfo.nss || "";
        document.getElementById("blood-type").value =
          medicalInfo.bloodType || "";
        document.getElementById("height").value = medicalInfo.height || "";
        document.getElementById("weight").value = medicalInfo.weight || "";
      } else {
        console.error(
          `Error al cargar la información médica: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error durante la carga de datos:", error);
    }
  }

  async function updateMedicalInfo(event) {
    event.preventDefault();

    const updatedInfo = {
      NSS: document.getElementById("nss").value,
      BloodType: document.getElementById("blood-type").value,
      Height: document.getElementById("height").value,
      Weight: document.getElementById("weight").value,
    };

    try {
      const response = await fetch(
        `${apiUrl}/medicalinfo/${patientId}/update-fields`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedInfo),
        }
      );

      if (response.ok) {
        alert("Información médica actualizada exitosamente");
      } else {
        alert(
          `Error al actualizar la información médica: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error durante la actualización de datos:", error);
      alert("Ocurrió un error al actualizar la información médica");
    }
  }

  const form = document.getElementById("update-medical-info-form");
  if (form) {
    form.addEventListener("submit", updateMedicalInfo);
    loadMedicalInfo();
  } else {
    console.error("Formulario no encontrado");
  }
});
