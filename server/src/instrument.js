import * as Sentry from '@sentry/node';

// Error tracking is switched on only when SENTRY_DSN is set (on Render).
// Locally and in Docker it stays off, so nothing is sent from your computer.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
  console.log('[Sentry] enabled');
}
