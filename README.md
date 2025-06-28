# Shanmukha Generators - WhatsApp to Website Automation

A full-stack web application that automatically converts WhatsApp messages into a public-facing generator catalog. Built with Next.js, Node.js, MongoDB, and Redis.

## 🚀 Features

### Core Functionality
- **WhatsApp Integration**: Automatically listens to WhatsApp group messages
- **Message Parsing**: Extracts generator details using regex patterns
- **Media Processing**: Downloads and stores images from WhatsApp
- **Admin Moderation**: Review and approve listings before they go live
- **Public Catalog**: Beautiful, searchable website for buyers
- **SOLD Workflow**: Automatic status updates via WhatsApp replies

### Technical Features
- **Real-time Processing**: Redis queue for message processing
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Search & Filters**: Advanced filtering by brand, price, hours, location
- **Image Gallery**: Multiple image support with carousel
- **WhatsApp Integration**: Direct contact with sellers
- **Admin Dashboard**: Comprehensive moderation panel

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp API  │───▶│ Webhook Service │───▶│  Redis Queue    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │◀───│    MongoDB      │◀───│ Parser Service  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+
- MongoDB 4.4+
- Redis 6+
- WhatsApp Business API access (optional for testing)

## 🛠️ Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
./scripts/start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x ./scripts/start-dev.sh
./scripts/start-dev.sh
```

### Option 2: Manual Setup

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd shanmukha-generators
npm install
cd backend && npm install && cd ..
```

2. **Setup Environment Variables**
```bash
# Copy environment files
cp .env.local.example .env.local
cp backend/.env.example backend/.env

# Edit the files with your configuration
```

3. **Start Services**
```bash
# Terminal 1: Start MongoDB and Redis
# MongoDB: mongod
# Redis: redis-server

# Terminal 2: Start Backend Webhook Service
cd backend && npm run dev

# Terminal 3: Start Backend Parser Service
cd backend && npm run dev:parser

# Terminal 4: Start Frontend
npm run dev
```

### Option 3: Docker Setup

```bash
# Start all services with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local):**
```env
MONGODB_URI=mongodb://localhost:27017/shanmukha-generators
NEXT_PUBLIC_API_URL=http://localhost:3000
ADMIN_PASSWORD=admin123
JWT_SECRET=your-super-secret-jwt-key
```

**Backend (backend/.env):**
```env
MONGODB_URI=mongodb://localhost:27017/shanmukha-generators
REDIS_URL=redis://localhost:6379
PORT=3001
WHATSAPP_API_TOKEN=your_whatsapp_api_token
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your-bucket-name
```

### WhatsApp API Setup

1. **Get WhatsApp Business API Access**
   - Sign up with a provider like Whapi.cloud
   - Get your API token and webhook URL

2. **Configure Webhook**
   - Webhook URL: `https://yourdomain.com/api/webhook`
   - Verify Token: Set in your environment variables

3. **Message Format**
   The system expects WhatsApp messages in this format:
   ```
   Type: Used Generator
   Brand: Kirloskar
   Model: KG1-62.5AS
   Price: ₹850000
   Hours: 12500
   Location: Mumbai, Maharashtra
   Contact: +91 98765 43210
   Description: Excellent condition diesel generator,
   well maintained, all documents available.
   ```

## 📱 Usage

### For Sellers
1. Join the WhatsApp group
2. Send generator details in the specified format
3. Include photos of the generator
4. Wait for admin approval
5. Reply "SOLD" to mark items as sold

### For Buyers
1. Visit the website
2. Browse or search for generators
3. Use filters to narrow down options
4. View detailed generator information
5. Contact sellers directly via WhatsApp

### For Admins
1. Go to `/admin/login`
2. Enter admin password (default: admin123)
3. Review pending listings
4. Approve or reject submissions
5. Monitor system statistics

## 🎨 Customization

### Styling
- Built with Tailwind CSS
- Customize colors in `tailwind.config.js`
- Component styles in `/src/components/`

### Message Parsing
- Modify regex patterns in `backend/services/parser-service.js`
- Add new fields in the Generator schema
- Update frontend components accordingly

### WhatsApp Integration
- Customize message templates in components
- Modify contact flow in `GeneratorDetailPage.tsx`
- Update seller onboarding process

## 🧪 Testing

### Manual Testing
1. **Test Message Processing**
   ```bash
   # Send test message to webhook
   curl -X POST http://localhost:3001/api/webhook \
     -H "Content-Type: application/json" \
     -d @test-message.json
   ```

2. **Test Admin Functions**
   - Login to admin panel
   - Test approve/reject workflow
   - Verify status updates

3. **Test Public Website**
   - Browse generators
   - Test search and filters
   - Verify WhatsApp contact flow

### API Testing
```bash
# Test generator listing
curl http://localhost:3000/api/generators

# Test individual generator
curl http://localhost:3000/api/generators/[id]

# Test admin endpoints
curl http://localhost:3000/api/admin/generators
```

## 📊 Monitoring

### Health Checks
- Frontend: `http://localhost:3000/api/health`
- Backend: `http://localhost:3001/health`

### Queue Monitoring
- Queue status: `http://localhost:3001/api/queue/status`
- Clear queue: `DELETE http://localhost:3001/api/queue/clear`

### Database Monitoring
- Use MongoDB Compass or CLI
- Monitor Redis with `redis-cli monitor`

## 🚀 Deployment

### Production Checklist
- [ ] Update all environment variables
- [ ] Set strong passwords and JWT secrets
- [ ] Configure SSL certificates
- [ ] Set up MongoDB replica set
- [ ] Configure Redis persistence
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Deployment Options

**1. VPS/Cloud Server**
```bash
# Clone repository
git clone <repo-url>
cd shanmukha-generators

# Install dependencies
npm install
cd backend && npm install && cd ..

# Build frontend
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

**2. Docker Deployment**
```bash
# Production docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

**3. Vercel + Railway**
- Deploy frontend to Vercel
- Deploy backend to Railway
- Use MongoDB Atlas and Redis Cloud

## 🔒 Security

### Best Practices
- Change default admin password
- Use strong JWT secrets
- Implement rate limiting
- Validate all inputs
- Sanitize user content
- Use HTTPS in production
- Regular security updates

### Environment Security
- Never commit `.env` files
- Use secrets management in production
- Rotate API keys regularly
- Monitor for suspicious activity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**1. MongoDB Connection Failed**
- Check if MongoDB is running
- Verify connection string
- Check firewall settings

**2. Redis Connection Failed**
- Ensure Redis server is running
- Check Redis URL format
- Verify network connectivity

**3. WhatsApp Webhook Not Working**
- Verify webhook URL is accessible
- Check verify token configuration
- Review webhook logs

**4. Images Not Loading**
- Check S3 configuration
- Verify AWS credentials
- Review CORS settings

### Getting Help
- Check the documentation
- Review error logs
- Search existing issues
- Create a new issue with details

## 📞 Contact

For questions or support, please contact:
- Email: support@shanmukhagenerators.com
- WhatsApp: +91 98765 43210

---

Built with ❤️ for the generator trading community
