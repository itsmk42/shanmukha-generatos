// Basic test for message parsing functionality
// Run with: node tests/parser.test.js

const assert = require('assert');

// Mock message parser function (simplified version)
function parseGeneratorListing(messageText) {
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

// Test cases
function runTests() {
  console.log('🧪 Running Parser Tests...\n');

  // Test 1: Valid message
  const validMessage = `Type: Used Generator
Brand: Kirloskar
Model: KG1-62.5AS
Price: ₹850000
Hours: 12500
Location: Mumbai, Maharashtra
Contact: +91 98765 43210
Description: Excellent condition diesel generator, well maintained with all documents.`;

  const result1 = parseGeneratorListing(validMessage);
  assert(result1.success === true, 'Valid message should parse successfully');
  assert(result1.data.brand === 'Kirloskar', 'Brand should be extracted correctly');
  assert(result1.data.model === 'KG1-62.5AS', 'Model should be extracted correctly');
  assert(result1.data.price === 850000, 'Price should be parsed as number');
  assert(result1.data.hours_run === 12500, 'Hours should be parsed as number');
  console.log('✅ Test 1 passed: Valid message parsing');

  // Test 2: Missing required fields
  const invalidMessage = `Type: Used Generator
Brand: Kirloskar
Description: Some description`;

  const result2 = parseGeneratorListing(invalidMessage);
  assert(result2.success === false, 'Invalid message should fail parsing');
  assert(result2.errors.length > 0, 'Should have parsing errors');
  console.log('✅ Test 2 passed: Missing fields validation');

  // Test 3: Invalid price format
  const invalidPriceMessage = `Type: Used Generator
Brand: Kirloskar
Model: KG1-62.5AS
Price: invalid
Hours: 12500
Location: Mumbai, Maharashtra`;

  const result3 = parseGeneratorListing(invalidPriceMessage);
  assert(result3.success === false, 'Invalid price should fail parsing');
  assert(result3.errors.some(error => error.includes('price')), 'Should have price error');
  console.log('✅ Test 3 passed: Invalid price validation');

  // Test 4: Price with commas and currency symbol
  const priceWithCommasMessage = `Type: Used Generator
Brand: Mahindra
Model: MDG-125
Price: ₹12,50,000
Hours: 8,500
Location: Delhi, India`;

  const result4 = parseGeneratorListing(priceWithCommasMessage);
  assert(result4.success === true, 'Price with commas should parse successfully');
  assert(result4.data.price === 1250000, 'Price should handle commas correctly');
  assert(result4.data.hours_run === 8500, 'Hours should handle commas correctly');
  console.log('✅ Test 4 passed: Price and hours with commas');

  console.log('\n🎉 All tests passed!');
}

// Run the tests
if (require.main === module) {
  try {
    runTests();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}
