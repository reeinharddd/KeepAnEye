/** @format */

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

    const temperaturePoints = temperatures.map((item) => ({
      x: new Date(item.timestamp).getTime(),
      y: item.value,
      color:
        item.value >= 37.5
          ? "#FF5733"
          : item.value >= 37
          ? "#FFC300"
          : item.value >= 36
          ? "#DAF7A6"
          : "#008000",
    }));

    console.log("Temperature Points:", temperaturePoints);

    Highcharts.chart("main", {
      chart: {
        type: "scatter",
        plotBorderWidth: 1,
        plotBackgroundColor: "#FAFAFA",
      },
      title: {
        text: "Daily Body Temperature Readings",
        style: {
          fontSize: "24px",
          fontWeight: "bold",
        },
      },
      subtitle: {
        text: "Source: User Metrics",
        style: {
          fontSize: "16px",
        },
      },
      xAxis: {
        type: "datetime",
        title: {
          text: "Date",
          style: {
            fontSize: "16px",
          },
        },
        labels: {
          format: "{value:%Y-%m-%d}",
          style: {
            fontSize: "12px",
          },
        },
        gridLineWidth: 1,
        gridLineColor: "#E0E0E0",
      },
      yAxis: {
        title: {
          text: "Temperature (°C)",
          style: {
            fontSize: "16px",
          },
        },
        min: 34,
        max: 38,
        tickAmount: 5,
        labels: {
          style: {
            fontSize: "12px",
          },
        },
        gridLineWidth: 1,
        gridLineColor: "#E0E0E0",
        plotLines: [
          {
            value: 36.5,
            color: "green",
            dashStyle: "shortdash",
            width: 2,
            label: {
              text: "Normal Temperature",
              align: "center",
              style: {
                color: "green",
                fontSize: "12px",
              },
            },
          },
        ],
      },
      tooltip: {
        headerFormat: "<b>{point.x:%Y-%m-%d}</b><br>",
        pointFormat: "{point.y}°C",
        valueSuffix: "°C",
        shared: true,
        crosshairs: true,
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          name: "Temperature Points",
          data: temperaturePoints,
          marker: {
            radius: 5,
            symbol: "circle",
            states: {
              hover: {
                enabled: true,
                radius: 7,
              },
            },
          },
          states: {
            hover: {
              enabled: true,
            },
          },
        },
      ],
      plotOptions: {
        series: {
          label: {
            connectorAllowed: false,
          },
          marker: {
            enabled: true,
          },
        },
        scatter: {
          tooltip: {
            headerFormat: "<b>{point.x:%Y-%m-%d}</b><br>",
            pointFormat: "{point.y}°C",
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
