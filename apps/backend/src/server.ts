/**
 * Dragonvite Backend Server
 * Fastify HTTP server with Socket.io real-time support
 */

import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import pino from 'pino';
import { loadConfig, getConfig } from './config.js';
import { healthRouter } from './routes/health.js';
import { setupSocketIO } from './socket/index.js';

/**
 * Create and configure Fastify instance
 */
async function createServer() {
  const config = getConfig();

  // Setup logger
  const logger = pino(
    config.LOG_LEVEL === 'debug' ? { transport: { target: 'pino-pretty' } } : undefined
  );

  // Create Fastify instance
  const fastify = Fastify({
    logger,
  });

  // Register plugins
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // Rate limiting
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    allowList: [{ route: '/health', numRequests: 1000 }],
  });

  // CORS
  await fastify.register(fastifyCors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  });

  // WebSocket support
  await fastify.register(fastifyWebsocket);

  // Request logging
  fastify.addHook('onRequest', async (request, _reply) => {
    logger.debug({ method: request.method, url: request.url }, 'Incoming request');
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    logger.error({ error }, 'Unhandled error');

    if (error.statusCode === 429) {
      return reply.status(429).send({ error: 'Too many requests' });
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    return reply.status(statusCode).send({
      error: message,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  });

  // Routes
  await fastify.register(healthRouter, { prefix: '/api' });

  // Socket.io setup
  await setupSocketIO(fastify, logger);

  return fastify;
}

/**
 * Start the server
 */
async function startServer() {
  try {
    // Load config
    loadConfig();
    const config = getConfig();

    // Create server
    const fastify = await createServer();

    // Start listening
    await fastify.listen({ port: config.PORT, host: config.HOST });

    fastify.log.info(
      `🚀 Server running on http://${config.HOST}:${config.PORT}`,
      { environment: config.NODE_ENV }
    );

    // Graceful shutdown
    const signals = ['SIGTERM', 'SIGINT'] as const;
    for (const signal of signals) {
      process.on(signal, async () => {
        fastify.log.info(`Received ${signal}, shutting down gracefully...`);
        await fastify.close();
        process.exit(0);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server
startServer();
