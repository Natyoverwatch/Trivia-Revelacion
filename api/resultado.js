// POST /api/resultado → guarda el puntaje de un jugador
const { conectarDB } = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });

  try {
    const { nombre, prediccion, puntaje, maxPuntos, correctas, incorrectas } = req.body;

    if (!nombre || puntaje === undefined)
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos obligatorios' });

    const db  = await conectarDB();
    const doc = {
      nombre:     nombre.trim(),
      prediccion: (prediccion || '').trim(),
      puntaje,
      maxPuntos,
      correctas,
      incorrectas,
      porcentaje: Math.round((puntaje / maxPuntos) * 100),
      fecha:      new Date(),
    };

    const result = await db.collection('resultados').insertOne(doc);
    return res.status(201).json({ ok: true, id: result.insertedId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, mensaje: err.message });
  }
};
