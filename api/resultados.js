// GET /api/resultados → devuelve todos los jugadores ordenados por puntaje
const { conectarDB } = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET')
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });

  try {
    const db = await conectarDB();
    const resultados = await db
      .collection('resultados')
      .find({}, { projection: { _id: 0 } })
      .sort({ puntaje: -1, fecha: 1 })
      .toArray();

    return res.json(resultados);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, mensaje: err.message });
  }
};
