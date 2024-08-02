/** @format */

document.addEventListener("DOMContentLoaded", () => {
  // Cargar el ID del usuario desde el localStorage
  const userId = localStorage.getItem("userId"); // Ajusta el nombre de la clave si es diferente
  if (userId) {
    document.getElementById("reminder-user-id").value = userId;
  } else {
    console.error("No se encontró el UserId en el localStorage.");
  }

  // Establecer la fecha mínima para el campo de fecha
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("reminder-date").setAttribute("min", today);

  // Manejo del formulario de recordatorios
  document
    .getElementById("reminder-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const userId = document.getElementById("reminder-user-id").value;
      const title = document.getElementById("reminder-title").value;
      const description = document.getElementById("reminder-description").value;
      const date = document.getElementById("reminder-date").value;
      const status = document.getElementById("reminder-status").value;

      const reminder = {
        Id: "", // Campo Id agregado
        UserToRemind: userId,
        Title: title,
        Description: description,
        Date: new Date(date).toISOString(),
        Status: status,
      };

      console.log("Datos a enviar:", JSON.stringify(reminder, null, 2));

      try {
        const response = await fetch(`${apiUrl}/reminder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reminder),
        });

        if (response.ok) {
          alert("Recordatorio enviado con éxito");
        } else {
          const errorResponse = await response.json();
          console.error("Error:", errorResponse);
          alert("Error al enviar el recordatorio: " + response.status);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al enviar el recordatorio");
      }
    });
});
