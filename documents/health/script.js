/** @format */
document.addEventListener("DOMContentLoaded", () => {
  // Aquí va tu código addData

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
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
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
    () => [
      {
        name: document.getElementById("medicine-name").value,
        dosage: document.getElementById("medicine-dosage").value,
        frequency: document.getElementById("medicine-frequency").value,
      },
    ]
  );

  addData(
    "add-allergy-form",
    `${apiUrl}/medicalinfo/${patientId}/allergies`,
    () => [
      {
        Name: document.getElementById("allergy-name").value,
        Severity: document.getElementById("allergy-severity").value,
        Reaction: document.getElementById("allergy-reaction").value,
        Treatment: document.getElementById("allergy-treatment").value,
      },
    ]
  );
  addData(
    "add-medical-condition-form",
    `${apiUrl}/MedicalInfo/${patientId}/conditions`, // Ajustada la ruta
    () => [
      {
        Name: document.getElementById("condition-name").value,
        Severity: document.getElementById("condition-severity").value,
        Treatment: document.getElementById("condition-treatment").value,
        Symptoms: document.getElementById("condition-symptoms").value,
        DiagnosisDate: document.getElementById("condition-diagnosis-date")
          .value,
      },
    ]
  );

  addData(
    "add-hospital-form",
    `${apiUrl}/MedicalInfo/${patientId}/hospitals`,
    () => [
      {
        Name: document.getElementById("hospital-name").value,
        Phone: formatPhoneNumber(
          document.getElementById("hospital-phone").value
        ),
        Address: {
          Street: document.getElementById("hospital-address-street").value,
          City: document.getElementById("hospital-address-city").value,
          State: document.getElementById("hospital-address-state").value,
          Zip: document.getElementById("hospital-address-zip").value,
        },
      },
    ]
  );

  function formatPhoneNumber(phone) {
    // Remove all non-numeric characters
    const digits = phone.replace(/\D/g, "");
    // Apply formatting if there are exactly 10 digits
    if (digits.length === 10) {
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    return phone;
  }

  const phoneInput = document.getElementById("hospital-phone");

  phoneInput.addEventListener("input", () => {
    phoneInput.value = formatPhoneNumber(phoneInput.value);
  });
});
