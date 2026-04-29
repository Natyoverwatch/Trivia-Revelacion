// Conexión compartida a MongoDB — el guión bajo (_db.js) hace
// que Vercel NO lo exponga como ruta pública.
const { MongoClient, ServerApiVersion } = require('mongodb');

let cachedDb = null;

async function conectarDB() {
  if (cachedDb) return cachedDb;

  const client = new MongoClient(process.env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  cachedDb = client.db('revelacion_pachito');
  return cachedDb;
}

module.exports = { conectarDB };
