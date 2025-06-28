const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const connectDB = require('../config/database');
const { connectRedis, queueOperations } = require('../config/redis');
const User = require('../models/User');
const Generator = require('../models/Generator');
const { uploadToS3 } = require('../utils/s3-upload');

const QUEUE_NAME = process.env.MESSAGE_QUEUE_NAME || 'whatsapp_messages';

class MessageParser {
  constructor() {
    this.isRunning = false;
  }

  // Parse generator listing from WhatsApp message text
  parseGeneratorListing(messageText) {
    try {
      const data = {};
      const errors = [];

      // Define regex patterns for each field
      const patterns = {
        type: /type:\s*(.+?)(?:\n|$)/i,
        brand: /brand:\s*(.+?)(?:\n|$)/i,
        model: /model:\s*(.+?)(?:\n|$)/i,
        price: /price:\s*₹?\s*([0-9,]+)(?:\n|$)/i,
        hours: /hours:\s*([0-9,]+)(?:\n|$)/i,
        location: /location:\s*(.+?)(?:\n|$)/i,
        contact: /contact:\s*([0-9+\s-]+)(?:\n|$)/i,
        description: /description:\s*([\s\S]+?)(?:\n\n|$)/i
      };

      // Extract each field
      for (const [field, pattern] of Object.entries(patterns)) {
        const match = messageText.match(pattern);
        if (match) {
          data[field] = match[1].trim();
        }
      }

      // Validate required fields
      const requiredFields = ['brand', 'model', 'price', 'hours', 'location'];
      for (const field of requiredFields) {
        if (!data[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }

      // Validate and clean price
      if (data.price) {
        const cleanPrice = data.price.replace(/[₹,\s]/g, '');
        const priceNum = parseInt(cleanPrice);
        if (isNaN(priceNum) || priceNum <= 0) {
          errors.push('Invalid price format');
        } else {
          data.price = priceNum;
        }
      }

      // Validate and clean hours
      if (data.hours) {
        const cleanHours = data.hours.replace(/[,\s]/g, '');
        const hoursNum = parseInt(cleanHours);
        if (isNaN(hoursNum) || hoursNum < 0) {
          errors.push('Invalid hours format');
        } else {
          data.hours = hoursNum;
        }
      }

      // Check if this looks like a generator listing
      const hasGeneratorKeywords = /generator|genset|dg\s*set|diesel\s*generator/i.test(messageText);
      if (!hasGeneratorKeywords && !data.type?.toLowerCase().includes('generator')) {
        errors.push('Message does not appear to be a generator listing');
      }

      return {
        success: errors.length === 0,
        data: {
          brand: data.brand || '',
          model: data.model || '',
          price: data.price || 0,
          hours_run: data.hours || 0,
          location_text: data.location || '',
          description: data.description || messageText,
          contact: data.contact || ''
        },
        errors
      };

    } catch (error) {
      return {
        success: false,
        data: {},
        errors: [`Parsing error: ${error.message}`]
      };
    }
  }

  // Download and upload media files
  async processMedia(mediaArray) {
    const uploadedMedia = [];

    for (const media of mediaArray) {
      try {
        if (!media.url) continue;

        // Download the media file
        const response = await axios.get(media.url, {
          responseType: 'arraybuffer',
          timeout: 30000
        });

        const buffer = Buffer.from(response.data);
        const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${media.mimetype?.split('/')[1] || 'jpg'}`;

        // Upload to S3 (placeholder implementation)
        const uploadResult = await uploadToS3(buffer, filename, media.mimetype);

        uploadedMedia.push({
          url: uploadResult.url,
          filename: filename,
          size: buffer.length,
          mimetype: media.mimetype
        });

      } catch (error) {
        console.error('Error processing media:', error);
        // Continue with other media files
      }
    }

    return uploadedMedia;
  }

  // Process a single WhatsApp message
  async processMessage(payload) {
    try {
      console.log('Processing message payload...');

      // Extract message data from WhatsApp webhook payload
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;
      const contacts = value?.contacts;

      if (!messages || messages.length === 0) {
        console.log('No messages found in payload');
        return;
      }

      const message = messages[0];
      const contact = contacts?.[0];

      // Extract sender information
      const senderWhatsAppId = message.from;
      const senderName = contact?.profile?.name || contact?.wa_id;

      // Find or create user
      const user = await User.findOrCreate(senderWhatsAppId, senderName);
      await user.updateActivity();

      // Check if this is a reply (for SOLD workflow)
      if (message.context?.id) {
        await this.handleReply(message, user);
        return;
      }

      // Process text message for generator listing
      if (message.type === 'text') {
        const messageText = message.text.body;
        
        // Parse the message
        const parseResult = this.parseGeneratorListing(messageText);
        
        // Process media if present
        let images = [];
        if (message.image || message.video || message.document) {
          const mediaArray = [];
          if (message.image) mediaArray.push(message.image);
          if (message.video) mediaArray.push(message.video);
          if (message.document) mediaArray.push(message.document);
          
          images = await this.processMedia(mediaArray);
        }

        // Create generator document
        const generatorData = {
          ...parseResult.data,
          images,
          seller_id: user._id,
          status: parseResult.success ? 'pending_review' : 'failed_parsing',
          audit_trail: {
            whatsapp_message_id: message.id,
            original_message_text: messageText,
            parsed_at: new Date(),
            parsing_errors: parseResult.errors
          }
        };

        const generator = new Generator(generatorData);
        await generator.save();

        // Update user's listing count
        user.total_listings += 1;
        await user.save();

        console.log(`Generator listing ${parseResult.success ? 'created' : 'failed'}: ${generator._id}`);
      }

    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  // Handle reply messages (for SOLD workflow)
  async handleReply(message, user) {
    try {
      const replyText = message.text?.body?.trim().toLowerCase();
      
      if (replyText === 'sold') {
        const originalMessageId = message.context.id;
        
        // Find the generator by original message ID
        const generator = await Generator.findByMessageId(originalMessageId);
        
        if (generator && generator.seller_id.equals(user._id)) {
          await generator.markAsSold();
          
          // Update user's successful sales count
          user.successful_sales += 1;
          await user.save();
          
          console.log(`Generator marked as sold: ${generator._id}`);
        } else {
          console.log('Generator not found or user not authorized to mark as sold');
        }
      }
    } catch (error) {
      console.error('Error handling reply:', error);
    }
  }

  // Main processing loop
  async start() {
    if (this.isRunning) {
      console.log('Parser service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting message parser service...');

    while (this.isRunning) {
      try {
        // Get message from queue (blocking call with 5 second timeout)
        const message = await queueOperations.getFromQueue(QUEUE_NAME, 5);
        
        if (message) {
          console.log('Processing message from queue...');
          await this.processMessage(message);
        }
        
      } catch (error) {
        console.error('Error in parser loop:', error);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  // Stop the parser service
  stop() {
    console.log('🛑 Stopping message parser service...');
    this.isRunning = false;
  }
}

// Initialize and start the service
const startParserService = async () => {
  try {
    // Connect to databases
    await connectDB();
    await connectRedis();
    
    // Create and start parser
    const parser = new MessageParser();
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, stopping parser...');
      parser.stop();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, stopping parser...');
      parser.stop();
      process.exit(0);
    });

    // Start processing
    await parser.start();
    
  } catch (error) {
    console.error('Failed to start parser service:', error);
    process.exit(1);
  }
};

// Start the service
startParserService();
