// GET /api/stats → resumen rápido para el panel admin
const { conectarDB } = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET')
    return res.status(405).json({ ok: false, mensaje: 'Método no permitido' });

  try {
    const db   = await conectarDB();
    const todos = await db.collection('resultados').find({}).toArray();
    const total = todos.length;

    if (total === 0) return res.json({ total: 0 });

    const promedio = Math.round(todos.reduce((s, r) => s + r.puntaje, 0) / total);
    const nino     = todos.filter(r =>
      r.prediccion.toLowerCase().includes('niño') ||
      r.prediccion.toLowerCase() === 'nino'
    ).length;
    const nina  = total - nino;
    const lider = todos.reduce((m, r) => (r.puntaje > m.puntaje ? r : m), todos[0]);

    return res.json({ total, promedio, predicciones: { nino, nina }, lider });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, mensaje: err.message });
  }
};
