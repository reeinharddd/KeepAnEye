/** @format */

document.addEventListener("DOMContentLoaded", () => {
  // Cargar el ID del paciente desde el localStorage
  const patientId = localStorage.getItem("userId"); // Ajusta el nombre de la clave si es diferente
  if (patientId) {
    document.getElementById("appointment-patient-id").value = patientId;
  } else {
    console.error("No se encontró el UserId en el localStorage.");
  }

  // Establecer la fecha mínima para el campo de fecha
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("appointment-date").setAttribute("min", today);

  // Manejo del formulario de citas
  document
    .getElementById("appointment-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const patientId = document.getElementById("appointment-patient-id").value;
      const date = document.getElementById("appointment-date").value;
      const time = document.getElementById("appointment-time").value;
      const place = document.getElementById("appointment-place").value;
      const status = document.getElementById("appointment-status").value;

      const appointment = {
        Id: "", // Campo Id agregado
        PatientId: patientId,
        Appointments: [
          {
            Date: new Date(date).toISOString(), // Asegúrate de que la fecha esté en el formato adecuado
            Time: `${time}:00`, // Convertir a formato TimeSpan
            Place: place,
            Status: status,
          },
        ],
      };

      console.log("Datos a enviar:", JSON.stringify(appointment, null, 2));

      try {
        const response = await fetch(`${apiUrl}/appointment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(appointment),
        });

        if (response.ok) {
          alert("Cita enviada con éxito");
        } else {
          const errorResponse = await response.json();
          console.error("Error:", errorResponse);
          alert("Error al enviar la cita: " + response.status);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al enviar la cita");
      }

      // Delay de 30 segundos para observar cualquier error
      await new Promise((resolve) => setTimeout(resolve, 30000));
      console.log("Delay de 30 segundos completado");
    });
});
