/** @format */

document.addEventListener("DOMContentLoaded", function () {
  const rangeInput = document.querySelector('input[type="range"]');
  const imageList = document.querySelector(".image-list");
  const searchInput = document.querySelector('input[type="search"]');
  const btns = document.querySelectorAll(".view-options button");
  const photosCounter = document.querySelector(".toolbar .counter span");
  const captions = document.querySelectorAll(
    ".image-list figcaption p:first-child"
  );
  const myArray = [];
  let counter = 1;
  const active = "active";
  const listView = "list-view";
  const gridView = "grid-view";
  const dNone = "d-none";

  // Fetch user documents and render them
  fetchUserMedicalDocuments();

  // SET VIEW
  for (const btn of btns) {
    btn.addEventListener("click", function () {
      const parent = this.parentElement;
      document.querySelector(".view-options .active").classList.remove(active);
      parent.classList.add(active);
      this.disabled = true;
      document.querySelector(
        '.view-options [class^="show-"]:not(.active) button'
      ).disabled = false;

      if (parent.classList.contains("show-list")) {
        parent.previousElementSibling.previousElementSibling.classList.add(
          dNone
        );
        imageList.classList.remove(gridView);
        imageList.classList.add(listView);
      } else {
        parent.previousElementSibling.classList.remove(dNone);
        imageList.classList.remove(listView);
        imageList.classList.add(gridView);
      }
    });
  }

  // SET THUMBNAIL VIEW - CHANGE CSS VARIABLE
  rangeInput.addEventListener("input", function () {
    document.documentElement.style.setProperty(
      "--minRangeValue",
      `${this.value}px`
    );
  });

  // SEARCH FUNCTIONALITY
  searchInput.addEventListener("keyup", function () {
    const text = this.value.toLowerCase();
    for (const item of imageList.children) {
      const captionText = item
        .querySelector("figcaption p:first-child")
        .textContent.toLowerCase();
      if (captionText.includes(text)) {
        item.classList.remove(dNone);
      } else {
        item.classList.add(dNone);
      }
    }
    const visibleItems = document.querySelectorAll(
      ".image-list li:not(.d-none)"
    );
    photosCounter.textContent = visibleItems.length;
  });

  // REDIRECT ON CLICK
  imageList.addEventListener("click", function (event) {
    const item = event.target.closest("li");
    if (item) {
      const anchor = item.querySelector("a");
      if (anchor) {
        window.open(anchor.href, "_blank");
      }
    }
  });
});

// Obtener todos los documentos de un usuario
async function fetchUserMedicalDocuments() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  if (!token || !userId) {
    console.error("Token or User ID not found");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/medicalinfo/documents/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch medical documents: ${response.statusText}`
      );
    }

    const data = await response.json();
    // console.log("User medical documents:", data);
    renderDocuments(data);
  } catch (error) {
    console.error("Error fetching medical documents:", error.message);
  }
}

function getMimeTypeImage(mimeType) {
  switch (mimeType) {
    case "application/pdf":
      return "../../images/pdf.png"; // Ruta a la imagen del ícono PDF
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "../../images/word.png"; // Ruta a la imagen del ícono Word
    // Agrega más casos según los tipos MIME que necesites manejar
    default:
      return "../../images/css.png"; // Ruta a la imagen por defecto
  }
}

function renderDocuments(documents) {
  const container = document.querySelector(".image-list");

  if (!container) {
    console.error("Container not found");
    return;
  }

  // Ordena los documentos por fecha (más reciente primero)
  documents.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Limpia el contenedor antes de agregar nuevos documentos
  container.innerHTML = "";

  documents.forEach((doc) => {
    const listItem = document.createElement("li");

    const figure = document.createElement("figure");
    const anchor = document.createElement("a");
    anchor.href = doc.url; // Asignar el URL del documento

    const img = document.createElement("img");
    img.src = getMimeTypeImage(doc.type); // Obtener la imagen según el tipo MIME

    const figcaption = document.createElement("figcaption");

    const title = document.createElement("p");
    title.textContent = doc.name; // Asignar el nombre del documento

    const date = document.createElement("p");
    const documentDate = new Date(doc.date);
    date.textContent = `${
      documentDate.getMonth() + 1
    }/${documentDate.getDate()}/${documentDate.getFullYear()}`; // Asignar la fecha del documento

    figcaption.appendChild(title);
    figcaption.appendChild(date);
    anchor.appendChild(img);
    figure.appendChild(anchor);
    figure.appendChild(figcaption);
    listItem.appendChild(figure);
    container.appendChild(listItem);
  });
}
