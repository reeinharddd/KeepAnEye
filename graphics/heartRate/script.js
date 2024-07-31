/** @format */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await fetchAllUserMetrics();
    const dailyAverages = calculateDailyAverages(data);

    Highcharts.stockChart("container", {
      chart: {
        type: "line",
      },
      title: {
        text: "Grafica de ritmo cardiaco por dia",
      },
      xAxis: {
        type: "datetime",
        title: {
          text: "Fecha",
        },
      },
      yAxis: {
        title: {
          text: "Ritmo Cardiaco (bpm)",
        },
        plotBands: [
          {
            from: 60,
            to: 100,
            color: "rgba(68, 170, 213, 0.1)",
            // label: {
            //   text: "Normal Range",
            //   style: {
            //     color: "#606060",
            //   },
            // },
          },
        ],
      },
      tooltip: {
        headerFormat: "<b>{point.x:%e %b %Y}</b><br>",
        pointFormat: "{point.y:.2f} bpm",
      },
      series: [
        {
          name: "Heart Rate",
          data: dailyAverages,
          zIndex: 1,
          marker: {
            fillColor: "white",
            lineWidth: 2,
            lineColor: Highcharts.getOptions().colors[0],
          },
        },
      ],
      annotations: [
        {
          labels: [
            {
              point: {
                xAxis: 0,
                yAxis: 0,
                x: dailyAverages.reduce((a, b) => (a[1] > b[1] ? a : b))[0],
                y: dailyAverages.reduce((a, b) => (a[1] > b[1] ? a : b))[1],
              },
              text:
                "Mas alto: " +
                dailyAverages.reduce((a, b) => (a[1] > b[1] ? a : b))[1] +
                " bpm",
            },
            {
              point: {
                xAxis: 0,
                yAxis: 0,
                x: dailyAverages.reduce((a, b) => (a[1] < b[1] ? a : b))[0],
                y: dailyAverages.reduce((a, b) => (a[1] < b[1] ? a : b))[1],
              },
              text:
                "Mas bajo: " +
                dailyAverages.reduce((a, b) => (a[1] < b[1] ? a : b))[1] +
                " bpm",
            },
          ],
        },
      ],
      navigator: {
        enabled: true,
      },
      scrollbar: {
        enabled: true,
      },
      rangeSelector: {
        selected: 1,
      },
    });
  } catch (error) {
    console.error("Error loading chart:", error);
  }
});

async function fetchAllUserMetrics() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const apiUrl = "http://localhost:5123/api";

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
    return data;
  } catch (error) {
    console.error("Error fetching all user metrics:", error.message);
  }
}

function calculateDailyAverages(data) {
  const dailyData = {};

  data.forEach((record) => {
    record.heartRate.forEach((entry) => {
      const date = new Date(entry.timestamp).toISOString().split("T")[0];
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push(entry.value);
    });
  });

  const dailyAverages = Object.keys(dailyData).map((date) => {
    const values = dailyData[date];
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    return [new Date(date).getTime(), avg];
  });

  return dailyAverages.sort((a, b) => a[0] - b[0]);
}
