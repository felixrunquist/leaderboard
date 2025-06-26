export default function createHandler() {
  const methods = {};

  const handler = async (req, res) => {
    const method = req.method?.toLowerCase();
    if (methods[method]) {
      try {
        await methods[method](req, res);
      } catch (err) {
        console.error('API handler error:', err);
        res.status(500).json({ error: true, message: 'Internal server error' });
      }
    } else {
      res.setHeader('Allow', Object.keys(methods).map(m => m.toUpperCase()));
      res.status(405).json({ error: true, message: `Method ${req.method} not allowed` });
    }
  };

  ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
    handler[method] = (fn) => {
      methods[method] = fn;
    };
  });

  return handler;
}