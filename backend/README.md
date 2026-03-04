# Tbarimt Backend API

Express.js backend API for tbarimt content marketplace with Sequelize ORM.

## Requirements

- Node.js 18.x
- MySQL database

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tbarimt_db
DB_USER=root
DB_PASSWORD=your_password
```

4. Create MySQL database:
```sql
CREATE DATABASE tbarimt_db;
```

5. Run migrations and seed data:
```bash
npm run seed
```

6. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (requires journalist/admin)
- `PUT /api/products/:id` - Update product (requires auth)
- `DELETE /api/products/:id` - Delete product (requires auth)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/:id/products` - Get products by category

### Journalists
- `GET /api/journalists/top` - Get top journalists
- `GET /api/journalists/:id` - Get journalist by ID

### Search
- `GET /api/search?q=query` - Search products

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - JWT expiration time

### QPay (payments)

- `QPAY_LOGIN` - QPay merchant login
- `QPAY_PASSWORD` - QPay merchant password
- `QPAY_BASE_URL` - (optional) Override API base URL, default `https://merchant.qpay.mn/v2`
- `QPAY_REQUEST_TIMEOUT` - (optional) Request timeout in ms, default 15000
- `QPAY_RETRY_ATTEMPTS` - (optional) Retries for transient DNS/network errors, default 3
- `QPAY_RETRY_DELAY_MS` - (optional) Delay between retries in ms, default 2000

## Production – QPay "getaddrinfo EAI_AGAIN merchant.qpay.mn"

If invoice creation works locally but fails in production with `QPay authentication failed: getaddrinfo EAI_AGAIN merchant.qpay.mn`, the production server cannot resolve or reach `merchant.qpay.mn` (DNS/network).

1. **Check DNS from the production host:**  
   `nslookup merchant.qpay.mn` or `curl -v https://merchant.qpay.mn/v2/auth/token`  
   If this fails, fix DNS or outbound access (e.g. add DNS servers 8.8.8.8 in the container/VPS, or open firewall to allow HTTPS to merchant.qpay.mn).

2. **Retries:** The backend retries QPay auth up to 3 times with a 2s delay. Transient DNS blips may be fixed by a later attempt.

3. **Override URL (only if you use a proxy):** Set `QPAY_BASE_URL` in production to your proxy URL that forwards to `https://merchant.qpay.mn/v2`.

