const redis = require('redis');
require('dotenv').config();

// Create Redis client
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis server connection refused');
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      console.error('Redis max retry attempts reached');
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

// Handle Redis events
client.on('connect', () => {
  console.log('Redis client connected');
});

client.on('ready', () => {
  console.log('Redis client ready');
});

client.on('error', (err) => {
  console.error('Redis client error:', err);
});

client.on('end', () => {
  console.log('Redis client disconnected');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await client.connect();
    console.log('Connected to Redis successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
};

// Queue operations
const queueOperations = {
  // Add message to queue
  addToQueue: async (queueName, message) => {
    try {
      const result = await client.lPush(queueName, JSON.stringify(message));
      console.log(`Message added to queue ${queueName}:`, result);
      return result;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  },

  // Get message from queue (blocking)
  getFromQueue: async (queueName, timeout = 0) => {
    try {
      const result = await client.brPop(queueName, timeout);
      if (result) {
        return JSON.parse(result.element);
      }
      return null;
    } catch (error) {
      console.error('Error getting from queue:', error);
      throw error;
    }
  },

  // Get queue length
  getQueueLength: async (queueName) => {
    try {
      return await client.lLen(queueName);
    } catch (error) {
      console.error('Error getting queue length:', error);
      throw error;
    }
  },

  // Clear queue
  clearQueue: async (queueName) => {
    try {
      return await client.del(queueName);
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await client.quit();
  process.exit(0);
});

module.exports = {
  client,
  connectRedis,
  queueOperations
};
