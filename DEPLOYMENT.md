# 🚀 Deployment Guide - Career-Code Job Portal Backend

Complete guide for deploying your Job Portal backend to production.

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] Update all JWT secrets with strong, cryptographically secure random strings
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database credentials (Supabase)
- [ ] Update `CORS_ORIGIN` to your production frontend URL
- [ ] Set appropriate rate limits for production traffic
- [ ] Configure production logging level

### 2. Security Hardening

- [ ] Enable HTTPS/TLS
- [ ] Set secure HTTP headers (already configured with Helmet)
- [ ] Rotate JWT secrets regularly
- [ ] Implement IP whitelisting if needed
- [ ] Set up WAF (Web Application Firewall) if using cloud provider
- [ ] Enable database connection encryption

### 3. Database

- [ ] Verify all migrations are applied
- [ ] Set up automated backups
- [ ] Configure connection pooling
- [ ] Test RLS policies
- [ ] Create read replicas for scaling (if needed)

### 4. Monitoring & Logging

- [ ] Set up application performance monitoring (APM)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up log aggregation (e.g., CloudWatch, Datadog)
- [ ] Create alerts for critical errors
- [ ] Monitor database performance

---

## 🌐 Deployment Options

### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 process manager
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo apt install -y nginx
```

#### 2. Application Deployment

```bash
# Clone repository
git clone <your-repo-url>
cd career-code-server

# Install dependencies
npm install --production

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/server.js --name career-code-api

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 3. Nginx Configuration (Optional)

Create `/etc/nginx/sites-available/career-code-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/career-code-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/server.js"]
```

#### 2. Create .dockerignore

```
node_modules
npm-debug.log
dist
.env
.git
.gitignore
README.md
*.md
```

#### 3. Build and Run

```bash
# Build image
docker build -t career-code-api:latest .

# Run container
docker run -d \
  --name career-code-api \
  -p 5000:5000 \
  --env-file .env \
  career-code-api:latest
```

#### 4. Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

---

### Option 3: Cloud Platform Deployment

#### Heroku

1. Install Heroku CLI
2. Create `Procfile`:
```
web: npm start
```

3. Deploy:
```bash
heroku create career-code-api
heroku config:set NODE_ENV=production
heroku config:set JWT_ACCESS_SECRET=your_secret
# Set all other environment variables
git push heroku main
```

#### Railway

1. Connect GitHub repository
2. Configure environment variables in dashboard
3. Railway auto-deploys on push

#### Render

1. Connect repository
2. Set build command: `npm install && npm run build`
3. Set start command: `npm start`
4. Configure environment variables

#### AWS Elastic Beanstalk

1. Install EB CLI
2. Initialize:
```bash
eb init -p node.js-18 career-code-api
eb create production-env
eb deploy
```

---

## 🔧 Production Environment Variables

Create a production `.env` file with these values:

```bash
NODE_ENV=production
PORT=5000

# Supabase (Production)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_KEY=your_production_service_key

# JWT (Generate strong secrets: openssl rand -base64 32)
JWT_ACCESS_SECRET=<strong-random-32-char-secret>
JWT_REFRESH_SECRET=<different-strong-random-32-char-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=12

# CORS (Your production frontend URL)
CORS_ORIGIN=https://yourfrontend.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=warn
```

---

## 📊 Monitoring Setup

### PM2 Monitoring

```bash
# View logs
pm2 logs career-code-api

# Monitor resources
pm2 monit

# Web dashboard
pm2 plus
```

### Health Check Endpoint

Use `/api/v1/health` for monitoring:

```bash
curl https://api.yourdomain.com/api/v1/health
```

Set up monitoring with:
- **UptimeRobot** (free)
- **Pingdom**
- **AWS CloudWatch**
- **Datadog**

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/career-code-api
            git pull
            npm install --production
            npm run build
            pm2 restart career-code-api
```

---

## 🗄️ Database Maintenance

### Backup Strategy

```bash
# Supabase automatic backups are enabled by default
# For manual backups, use Supabase dashboard

# Or use pg_dump (if direct access)
pg_dump -h <host> -U <user> -d <database> > backup.sql
```

### Migration Management

```bash
# Apply new migrations in production
npm run migrate

# Rollback if needed (create rollback scripts)
npm run migrate:rollback
```

---

## 🚨 Troubleshooting

### Common Issues

**Issue: Server won't start**
```bash
# Check logs
pm2 logs career-code-api --lines 100

# Check environment variables
pm2 env 0
```

**Issue: Database connection fails**
```bash
# Verify Supabase credentials
# Check firewall rules
# Verify RLS policies
```

**Issue: High memory usage**
```bash
# Restart PM2 process
pm2 restart career-code-api

# Monitor memory
pm2 monit
```

**Issue: JWT errors**
```bash
# Verify JWT secrets are set correctly
# Check token expiry times
# Ensure secrets are at least 32 characters
```

---

## 📈 Scaling Strategies

### Vertical Scaling
- Upgrade server resources (CPU, RAM)
- Optimize database queries
- Implement caching (Redis)

### Horizontal Scaling
- Use load balancer (Nginx, AWS ALB)
- Run multiple instances with PM2:
```bash
pm2 start dist/server.js -i max
```

### Database Scaling
- Enable connection pooling
- Use read replicas
- Implement caching layer

---

## 🔐 Security Best Practices

1. **Never commit `.env` file**
2. **Use secrets management** (AWS Secrets Manager, Vault)
3. **Rotate JWT secrets** every 90 days
4. **Keep dependencies updated**: `npm audit fix`
5. **Enable HTTPS only** in production
6. **Implement rate limiting** aggressively
7. **Monitor for suspicious activity**
8. **Regular security audits**

---

## 📝 Post-Deployment Checklist

- [ ] Test all API endpoints
- [ ] Verify authentication flow
- [ ] Check role-based permissions
- [ ] Test error handling
- [ ] Verify database connections
- [ ] Check logs for errors
- [ ] Test rate limiting
- [ ] Verify CORS settings
- [ ] Test from production frontend
- [ ] Set up monitoring alerts

---

## 🆘 Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Review error logs
- Check server resources
- Monitor database size

**Monthly:**
- Update dependencies
- Review security advisories
- Database optimization
- Rotate logs

**Quarterly:**
- Rotate JWT secrets
- Security audit
- Performance optimization
- Backup verification

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Your Career-Code API is now production-ready! 🎉**
