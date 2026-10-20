import client from 'prom-client';

// Node/process metrics: memory, CPU, event-loop lag, GC ...
client.collectDefaultMetrics({ prefix: 'intellmeet_' });

const httpDuration = new client.Histogram({
  name: 'intellmeet_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
});

const socketConnections = new client.Gauge({
  name: 'intellmeet_socket_connections',
  help: 'Currently connected Socket.IO clients',
});

const transcriptions = new client.Counter({
  name: 'intellmeet_transcriptions_total',
  help: 'AI transcription requests by result',
  labelNames: ['result'],
});

// Times every request. The "route" label is the matched route pattern (e.g. /:id),
// never the raw URL, so random URLs cannot create unlimited label values.
export const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics') return next();
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      route: req.route ? req.route.path : 'unmatched',
      status: res.statusCode,
    });
  });
  next();
};

// GET /metrics. If METRICS_TOKEN is set (do this on Render), a bearer token is required.
export const metricsHandler = async (req, res) => {
  const token = process.env.METRICS_TOKEN;
  if (token && req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).end();
  }
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
};

export const trackSockets = (io) => {
  io.on('connection', (socket) => {
    socketConnections.inc();
    socket.on('disconnect', () => socketConnections.dec());
  });
};

export const recordTranscription = (result) => transcriptions.inc({ result });
