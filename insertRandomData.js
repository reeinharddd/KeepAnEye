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
    const collection = database.collection("metrics");

    const patientId = new ObjectId("668870df0083589ac85aee37");
    const numberOfEntries = 100; // Número de entradas a generar

    const generateRandomData = () => {
      const startDate = new Date(2024, 0, 1); // Fecha de inicio (1 de enero de 2024)
      const endDate = new Date(2024, 6, 31); // Fecha de fin (31 de julio de 2024)

      const getRandomDate = (start, end) => {
        return new Date(
          start.getTime() + Math.random() * (end.getTime() - start.getTime())
        );
      };

      const data = [];

      for (let i = 0; i < numberOfEntries; i++) {
        const timestamp = getRandomDate(startDate, endDate);
        data.push({
          timestamp: timestamp,
          value: faker.datatype.number({ min: 60, max: 100 }), // Ritmo cardíaco aleatorio entre 60 y 100
          _id: new ObjectId(),
        });
      }

      return data;
    };

    const heartRateData = generateRandomData();
    const temperatureData = generateRandomData().map((entry) => ({
      ...entry,
      value: faker.datatype.float({ min: 35.5, max: 37.5 }), // Temperatura aleatoria entre 35.5 y 37.5
    }));
    const locationData = generateRandomData().map((entry) => ({
      ...entry,
      coordinates: {
        latitude: parseFloat(faker.address.latitude()),
        longitude: parseFloat(faker.address.longitude()),
      },
    }));

    const update = {
      $push: {
        heartRate: { $each: heartRateData },
        temperature: { $each: temperatureData },
        location: { $each: locationData },
      },
    };

    await collection.updateOne({ patient_id: patientId }, update);

    console.log("Datos insertados exitosamente");
  } catch (error) {
    console.error("Error al insertar datos:", error);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
