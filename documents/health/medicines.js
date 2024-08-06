/** @format */
const apiUrl = "http://localhost:5123/api"; // Fallback a URL local si no se define en .env
const token = localStorage.getItem("token");
document.addEventListener("DOMContentLoaded", () => {
  async function addData(formId, url, extractData) {
    const form = document.getElementById(formId);
    if (!form) {
      console.error(`Form with ID ${formId} not found`);
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = extractData();
      console.log("Data to add:", data);
      try {
        const response = await fetch(url, {
          method: "POST", // Cambiado de PATCH a POST
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          alert("Data added successfully");
          form.reset();
        } else {
          alert(`Failed to add data: ${response.statusText}`);
        }
      } catch (error) {
        console.error("Error during fetch:", error);
        alert("An error occurred while adding data");
      }
    });
  }

  const patientId = localStorage.getItem("userId");
  console.log(patientId);

  addData(
    "add-medicine-form",
    `${apiUrl}/medicalinfo/${patientId}/medicines`,
    () => ({
      NewMedicines: [
        {
          Name: document.getElementById("medicine-name").value,
          Dosage: document.getElementById("medicine-dosage").value,
          Frequency: document.getElementById("medicine-frequency").value,
        },
      ],
    })
  );
});
