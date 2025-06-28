# Shanmukha Generators API Documentation

## Base URLs
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:3001`

## Authentication
Admin endpoints require authentication via JWT token stored in HTTP-only cookies.

---

## Public API Endpoints

### GET /api/generators
Get list of generators with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 12)
- `search` (string): Text search across brand, model, description
- `brand` (string): Filter by brand name
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `minHours` (number): Minimum hours filter
- `maxHours` (number): Maximum hours filter
- `location` (string): Location filter
- `sortBy` (string): Sort option (newest, oldest, price_asc, price_desc, hours_asc, hours_desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "generators": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "limit": 12,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "availableBrands": ["Kirloskar", "Mahindra", ...],
      "priceRange": { "minPrice": 50000, "maxPrice": 2000000, "avgPrice": 800000 },
      "hoursRange": { "minHours": 0, "maxHours": 50000, "avgHours": 15000 }
    }
  }
}
```

### GET /api/generators/[id]
Get individual generator details.

**Response:**
```json
{
  "success": true,
  "data": {
    "generator": {
      "_id": "...",
      "brand": "Kirloskar",
      "model": "KG1-62.5AS",
      "price": 850000,
      "hours_run": 12500,
      "location_text": "Mumbai, Maharashtra",
      "description": "...",
      "images": [...],
      "seller_id": {...},
      "views": 45,
      "whatsapp_clicks": 12
    },
    "related": [...],
    "sellerOtherListings": [...]
  }
}
```

### POST /api/generators/[id]
Track WhatsApp clicks.

**Body:**
```json
{
  "action": "whatsapp_click"
}
```

---

## Admin API Endpoints

### POST /api/admin/auth
Admin login.

**Body:**
```json
{
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "role": "admin",
    "expiresIn": "24h"
  }
}
```

### GET /api/admin/auth
Verify admin authentication.

### DELETE /api/admin/auth
Admin logout.

### GET /api/admin/generators
Get generators for admin review.

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status (pending_review, for_sale, sold, rejected, failed_parsing, all)
- `search` (string): Text search

**Response:**
```json
{
  "success": true,
  "data": {
    "generators": [...],
    "pagination": {...},
    "statusStats": {
      "pending_review": 5,
      "for_sale": 25,
      "sold": 10,
      "rejected": 2,
      "failed_parsing": 1
    }
  }
}
```

### PUT /api/generators/[id]
Approve or reject generator listing.

**Body:**
```json
{
  "action": "approve", // or "reject"
  "reason": "Optional rejection reason",
  "approved_by": "admin_user_id"
}
```

---

## Backend Webhook Endpoints

### GET /api/webhook
WhatsApp webhook verification.

**Query Parameters:**
- `hub.mode`: "subscribe"
- `hub.verify_token`: Your verification token
- `hub.challenge`: Challenge string to echo back

### POST /api/webhook
Receive WhatsApp messages.

**Body:** WhatsApp webhook payload

**Response:**
```json
{
  "success": true,
  "message": "Webhook received and queued for processing",
  "timestamp": "2023-12-01T10:30:00.000Z"
}
```

### GET /api/queue/status
Get message queue status.

**Response:**
```json
{
  "queue_name": "whatsapp_messages",
  "pending_messages": 3,
  "timestamp": "2023-12-01T10:30:00.000Z"
}
```

### DELETE /api/queue/clear
Clear message queue (development only).

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

- Public API: 100 requests per minute per IP
- Admin API: 200 requests per minute per authenticated user
- Webhook: 1000 requests per minute

---

## Data Models

### Generator
```json
{
  "_id": "ObjectId",
  "brand": "string",
  "model": "string", 
  "price": "number",
  "hours_run": "number",
  "location_text": "string",
  "description": "string",
  "images": [
    {
      "url": "string",
      "filename": "string",
      "size": "number",
      "mimetype": "string"
    }
  ],
  "status": "pending_review|for_sale|sold|rejected|failed_parsing",
  "seller_id": "ObjectId",
  "audit_trail": {
    "whatsapp_message_id": "string",
    "original_message_text": "string",
    "parsed_at": "Date",
    "parsing_errors": ["string"],
    "approved_by": "ObjectId",
    "approved_at": "Date",
    "rejected_reason": "string"
  },
  "tags": ["string"],
  "views": "number",
  "whatsapp_clicks": "number",
  "sold_date": "Date",
  "sold_price": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### User
```json
{
  "_id": "ObjectId",
  "whatsapp_id": "string",
  "display_name": "string",
  "role": "seller|admin",
  "is_active": "boolean",
  "total_listings": "number",
  "successful_sales": "number",
  "first_message_date": "Date",
  "last_activity": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## WebSocket Events (Future Enhancement)

Real-time updates for admin dashboard:
- `new_listing`: New generator submitted
- `status_change`: Generator status updated
- `new_message`: New WhatsApp message received

---

## Webhook Payload Examples

### Text Message
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "919876543210",
                "id": "wamid.xxx",
                "timestamp": "1703123456",
                "text": {
                  "body": "Type: Used Generator\nBrand: Kirloskar\n..."
                },
                "type": "text"
              }
            ],
            "contacts": [
              {
                "profile": { "name": "John Seller" },
                "wa_id": "919876543210"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### Reply Message (SOLD)
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "919876543210",
                "id": "wamid.yyy",
                "timestamp": "1703123456",
                "text": { "body": "SOLD" },
                "type": "text",
                "context": {
                  "id": "wamid.xxx"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```
