/** @format */
window.onload = fetchProfile;

async function fetchProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("Token not found");
    redirectToLogin();
    return;
  }

  try {
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
    //console.log("User profile:", data);
    generalInfo(data);
    const fullName = `${data.name.firstName} ${data.name.lastName}`;
    const userPhoto = data.userPhoto;
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    redirectToLogin();
  }
}

function generalInfo(data) {
  const fullName = `${data.name.firstName} ${data.name.lastName}`;
  const userPhoto = data.userPhoto;
  const email = data.email;
  const phone = data.phone;
  const address = data.address;
  const birthDate = data.birthDate;
  console.log(birthDate);
  document.getElementById("fullName").textContent = fullName;
  document.getElementById("userPhoto").src = userPhoto;
  document.getElementById("email").textContent = email;
  document.getElementById("phone").textContent = phone;
  document.getElementById("address").textContent = address;
  document.getElementById("birthDate").textContent = birthDate;
}
