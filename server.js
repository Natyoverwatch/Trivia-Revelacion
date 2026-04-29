require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app  = express();
const PORT = process.env.PORT || 3000;
const URI  = process.env.MONGODB_URI;

// ── MIDDLEWARES ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));   // sirve index.html, style.css, etc.

// ── CONEXIÓN MONGODB ─────────────────────────────────────────
const client = new MongoClient(URI, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
});

let db;

async function conectarMongo() {
  try {
    await client.connect();
    db = client.db('revelacion_pachito');
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    console.error('   Revisa tu MONGODB_URI en el archivo .env');
    process.exit(1);
  }
}

// ── RUTAS API ────────────────────────────────────────────────

/**
 * POST /api/resultado
 * Guarda el resultado de un jugador.
 * Body esperado: { nombre, prediccion, puntaje, maxPuntos, correctas, incorrectas }
 */
app.post('/api/resultado', async (req, res) => {
  try {
    const { nombre, prediccion, puntaje, maxPuntos, correctas, incorrectas } = req.body;

    if (!nombre || puntaje === undefined) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos obligatorios' });
    }

    const documento = {
      nombre:      nombre.trim(),
      prediccion:  (prediccion || '').trim(),
      puntaje,
      maxPuntos,
      correctas,
      incorrectas,
      porcentaje:  Math.round((puntaje / maxPuntos) * 100),
      fecha:       new Date(),
    };

    const resultado = await db.collection('resultados').insertOne(documento);
    console.log(`📝 Guardado: ${nombre} → ${puntaje}/${maxPuntos} pts`);

    res.status(201).json({ ok: true, id: resultado.insertedId });
  } catch (err) {
    console.error('Error guardando resultado:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

/**
 * GET /api/resultados
 * Devuelve todos los resultados ordenados por puntaje desc.
 */
app.get('/api/resultados', async (req, res) => {
  try {
    const resultados = await db
      .collection('resultados')
      .find({}, { projection: { _id: 0 } })
      .sort({ puntaje: -1, fecha: 1 })
      .toArray();

    res.json(resultados);
  } catch (err) {
    console.error('Error obteniendo resultados:', err);
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

/**
 * GET /api/stats
 * Resumen rápido: total jugadores, promedio, predicciones niño/niña.
 */
app.get('/api/stats', async (req, res) => {
  try {
    const todos = await db.collection('resultados').find({}).toArray();
    const total = todos.length;
    if (total === 0) return res.json({ total: 0 });

    const promedio  = Math.round(todos.reduce((s, r) => s + r.puntaje, 0) / total);
    const nino      = todos.filter(r => r.prediccion.toLowerCase().includes('ni') && r.prediccion.toLowerCase().includes('o') && !r.prediccion.toLowerCase().includes('a')).length;
    const nina      = total - nino;
    const maxJugador = todos.reduce((m, r) => r.puntaje > m.puntaje ? r : m, todos[0]);

    res.json({ total, promedio, predicciones: { nino, nina }, lider: maxJugador });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

// ── FALLBACK → index.html ────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── ARRANQUE ─────────────────────────────────────────────────
conectarMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Panel de resultados: http://localhost:${PORT}/admin.html`);
  });
});
