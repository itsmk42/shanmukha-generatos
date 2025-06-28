const Generator = require('../models/Generator');
const User = require('../models/User');

/**
 * Handle SOLD reply workflow
 * @param {Object} message - WhatsApp message object
 * @param {Object} user - User object
 * @returns {Promise<Object>} Result of the operation
 */
const handleSoldReply = async (message, user) => {
  try {
    const replyText = message.text?.body?.trim().toLowerCase();
    
    // Check if the reply is exactly "SOLD" (case-insensitive)
    if (replyText !== 'sold') {
      return {
        success: false,
        message: 'Reply text is not "SOLD"',
        action: 'ignored'
      };
    }

    // Get the original message ID from context
    const originalMessageId = message.context?.id;
    
    if (!originalMessageId) {
      return {
        success: false,
        message: 'No context/original message ID found',
        action: 'ignored'
      };
    }

    // Find the generator by original WhatsApp message ID
    const generator = await Generator.findByMessageId(originalMessageId);
    
    if (!generator) {
      return {
        success: false,
        message: 'Generator not found for the original message',
        action: 'not_found',
        originalMessageId
      };
    }

    // Verify that the user is the seller of this generator
    if (!generator.seller_id.equals(user._id)) {
      return {
        success: false,
        message: 'User is not authorized to mark this generator as sold',
        action: 'unauthorized',
        generatorId: generator._id,
        sellerId: generator.seller_id,
        userId: user._id
      };
    }

    // Check if generator is already sold
    if (generator.status === 'sold') {
      return {
        success: false,
        message: 'Generator is already marked as sold',
        action: 'already_sold',
        generatorId: generator._id,
        soldDate: generator.sold_date
      };
    }

    // Check if generator is in a valid state to be sold
    if (generator.status !== 'for_sale') {
      return {
        success: false,
        message: `Generator cannot be sold from status: ${generator.status}`,
        action: 'invalid_status',
        generatorId: generator._id,
        currentStatus: generator.status
      };
    }

    // Mark the generator as sold
    await generator.markAsSold();
    
    // Update user's successful sales count
    user.successful_sales += 1;
    await user.save();

    console.log(`Generator marked as sold: ${generator._id} by user: ${user._id}`);

    return {
      success: true,
      message: 'Generator successfully marked as sold',
      action: 'marked_sold',
      generatorId: generator._id,
      sellerId: user._id,
      soldDate: generator.sold_date,
      userStats: {
        totalListings: user.total_listings,
        successfulSales: user.successful_sales
      }
    };

  } catch (error) {
    console.error('Error in handleSoldReply:', error);
    return {
      success: false,
      message: 'Internal error processing SOLD reply',
      action: 'error',
      error: error.message
    };
  }
};

/**
 * Validate if a message is a valid reply
 * @param {Object} message - WhatsApp message object
 * @returns {boolean} True if message is a reply
 */
const isReplyMessage = (message) => {
  return !!(message.context && message.context.id);
};

/**
 * Extract reply information from message
 * @param {Object} message - WhatsApp message object
 * @returns {Object} Reply information
 */
const extractReplyInfo = (message) => {
  if (!isReplyMessage(message)) {
    return null;
  }

  return {
    originalMessageId: message.context.id,
    replyText: message.text?.body?.trim() || '',
    replyType: message.type,
    timestamp: message.timestamp
  };
};

/**
 * Get statistics for SOLD workflow
 * @param {string} userId - User ID (optional)
 * @returns {Promise<Object>} Statistics
 */
const getSoldWorkflowStats = async (userId = null) => {
  try {
    const matchCondition = userId ? { seller_id: userId } : {};
    
    const stats = await Generator.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$price' }
        }
      }
    ]);

    const result = {
      total: 0,
      pending_review: 0,
      for_sale: 0,
      sold: 0,
      rejected: 0,
      failed_parsing: 0,
      totalValue: {
        pending_review: 0,
        for_sale: 0,
        sold: 0,
        rejected: 0,
        failed_parsing: 0
      }
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
      result.totalValue[stat._id] = stat.totalValue;
    });

    return result;

  } catch (error) {
    console.error('Error getting SOLD workflow stats:', error);
    throw error;
  }
};

/**
 * Get recent SOLD activities
 * @param {number} limit - Number of recent activities to fetch
 * @returns {Promise<Array>} Recent SOLD activities
 */
const getRecentSoldActivities = async (limit = 10) => {
  try {
    const recentSold = await Generator.find({ status: 'sold' })
      .populate('seller_id', 'whatsapp_id display_name')
      .sort({ sold_date: -1 })
      .limit(limit)
      .select('brand model price sold_date sold_price seller_id');

    return recentSold;

  } catch (error) {
    console.error('Error getting recent SOLD activities:', error);
    throw error;
  }
};

module.exports = {
  handleSoldReply,
  isReplyMessage,
  extractReplyInfo,
  getSoldWorkflowStats,
  getRecentSoldActivities
};
