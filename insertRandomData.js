/** @format */

const { MongoClient, ObjectId } = require("mongodb");
const { faker } = require("@faker-js/faker");

async function main() {
  const uri =
    "mongodb+srv://pruebaKeepAnEye:Papalote78%40@cluster01.s1cdrcw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01";
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const database = client.db("KeepAnEyeDb");
    const collection = database.collection("appointments");

    const patientId = "66a833b635e5f07146b7e66b"; // patient_id como string
    const numberOfEntries = 100; // Número de entradas a generar

    // Fecha actual
    const today = new Date();

    const generateRandomData = () => {
      // Definir el rango de fechas a partir del día de hoy
      const startDate = today;
      const endDate = new Date(
        today.getFullYear(),
        today.getMonth() + 6,
        today.getDate()
      ); // 6 meses después del día de hoy

      const getRandomDate = (start, end) => {
        return new Date(
          start.getTime() + Math.random() * (end.getTime() - start.getTime())
        );
      };

      const data = [];

      for (let i = 0; i < numberOfEntries; i++) {
        const date = getRandomDate(startDate, endDate);
        const time = faker.date
          .between(
            new Date(date.setHours(0, 0, 0, 0)),
            new Date(date.setHours(23, 59, 59, 999))
          )
          .toTimeString()
          .split(" ")[0]; // Hora aleatoria durante el día

        data.push({
          date: date.toISOString(), // Convertir a formato ISO
          time: time,
          place: faker.address.streetAddress(), // Lugar aleatorio
        });
      }

      return data;
    };

    const appointmentData = generateRandomData();

    // Vaciar la colección
    await collection.deleteMany({});

    // Insertar los datos en un solo documento
    await collection.insertOne({
      patient_id: patientId,
      appointments: appointmentData,
    });

    console.log("Datos de citas insertados exitosamente en un solo documento");
  } catch (error) {
    console.error("Error al insertar datos:", error);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
