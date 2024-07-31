/** @format */
const apiUrl = "http://localhost:5123/api"; // Fallback a URL local si no se define en .env

document.addEventListener("DOMContentLoaded", () => {
  fetchAllUserMetrics();
});

async function fetchAllUserMetrics() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    console.error("Token or User ID not found");
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/metrics/all/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      console.warn("No metrics available to display");
      return;
    }

    const temperatures = data.flatMap((record) => record.temperature);

    const dailyTemperatures = {};
    temperatures.forEach((item) => {
      const date = new Date(item.timestamp).toISOString().split("T")[0];
      if (!dailyTemperatures[date]) {
        dailyTemperatures[date] = { total: 0, count: 0 };
      }
      dailyTemperatures[date].total += item.value;
      dailyTemperatures[date].count += 1;
    });

    const heatmapData = Object.keys(dailyTemperatures).map((date) => ({
      x: new Date(date).getTime(),
      y: dailyTemperatures[date].total / dailyTemperatures[date].count,
    }));

    console.log("Heatmap Data:", heatmapData);

    Highcharts.chart("container", {
      chart: {
        type: "heatmap",
        plotBorderWidth: 1,
        plotBackgroundColor: "#FAFAFA",
      },
      title: {
        text: "Daily Average Body Temperature",
      },
      xAxis: {
        type: "datetime",
        title: {
          text: "Date",
        },
      },
      yAxis: {
        title: {
          text: "Average Temperature (°C)",
        },
        min: 34, // Ajusta el mínimo según tus datos
        max: 38, // Ajusta el máximo según tus datos
        tickAmount: 5, // Opcional: número de ticks en el eje Y
      },
      colorAxis: {
        min: 34, // Ajusta el mínimo según tus datos
        max: 38, // Ajusta el máximo según tus datos
        stops: [
          [0, "#FF0000"],
          [0.5, "#FFFF00"],
          [1, "#00FF00"],
        ],
      },
      series: [
        {
          name: "Temperature",
          data: heatmapData,
          dataLabels: {
            enabled: true,
            color: "#000000",
          },
        },
      ],
      plotOptions: {
        heatmap: {
          colorAxis: {
            min: 34, // Ajusta el mínimo según tus datos
            max: 38, // Ajusta el máximo según tus datos
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching all user metrics:", error.message);
  }
}

function redirectToLogin() {
  window.location.href = "/login";
}
