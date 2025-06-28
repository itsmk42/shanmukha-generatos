const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { connectRedis, queueOperations } = require('../config/redis');

const app = express();
const PORT = process.env.PORT || 3001;
const QUEUE_NAME = process.env.MESSAGE_QUEUE_NAME || 'whatsapp_messages';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ingestion-service'
  });
});

// Webhook verification endpoint (for WhatsApp API setup)
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

// Main webhook endpoint for receiving WhatsApp messages
app.post('/api/webhook', async (req, res) => {
  try {
    const payload = req.body;
    
    // Log the incoming payload for debugging
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));
    
    // Validate payload structure
    if (!payload || typeof payload !== 'object') {
      console.error('Invalid payload received');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Add timestamp and processing metadata
    const enrichedPayload = {
      ...payload,
      received_at: new Date().toISOString(),
      processing_status: 'queued',
      service_version: '1.0.0'
    };

    // Push to Redis queue immediately
    await queueOperations.addToQueue(QUEUE_NAME, enrichedPayload);
    
    console.log(`Message queued successfully. Queue: ${QUEUE_NAME}`);
    
    // Respond immediately with 200 OK to prevent webhook retries
    res.status(200).json({
      success: true,
      message: 'Webhook received and queued for processing',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Still respond with 200 to prevent retries, but log the error
    res.status(200).json({
      success: false,
      message: 'Webhook received but failed to queue',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Queue status endpoint for monitoring
app.get('/api/queue/status', async (req, res) => {
  try {
    const queueLength = await queueOperations.getQueueLength(QUEUE_NAME);
    res.json({
      queue_name: QUEUE_NAME,
      pending_messages: queueLength,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      error: 'Failed to get queue status',
      message: error.message
    });
  }
});

// Clear queue endpoint (for development/testing)
app.delete('/api/queue/clear', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Queue clearing not allowed in production'
      });
    }
    
    const result = await queueOperations.clearQueue(QUEUE_NAME);
    res.json({
      success: true,
      message: `Queue ${QUEUE_NAME} cleared`,
      deleted_count: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing queue:', error);
    res.status(500).json({
      error: 'Failed to clear queue',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to Redis first
    await connectRedis();
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Ingestion Service running on port ${PORT}`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/webhook`);
      console.log(`📊 Queue status: http://localhost:${PORT}/api/queue/status`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
