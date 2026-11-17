Jemima Backend

Quick start:

1. Copy `.env.example` to `.env` and fill DB credentials.
2. Install dependencies:

```bash
cd server
npm install
```

3. Create database and run migration:

```sql
mysql -u root -p < migrations/schema.sql
```

4. Populate seed data:

```bash
cd server
npm run seed
```

4.5 Test database connection:

```bash
cd server
npm run test-db
```

5. Start server:

```bash
npm run start
```

API endpoints:
- POST `/api/auth/register` { username, email, password }
- POST `/api/auth/login` { username, password }
- GET `/api/auth/me` (auth)
- POST `/api/auth/change-password` (auth)
- GET `/api/inventory` (auth)
- POST `/api/inventory` (auth)
- PUT `/api/inventory/:id` (auth)
- DELETE `/api/inventory/:id` (auth)
- GET `/api/categories` (auth)
- POST `/api/categories` (auth)
- GET `/api/sales` (auth)
- POST `/api/sales` (auth)
- GET `/api/profile` (auth)
- PUT `/api/profile` (auth)
- GET `/api/store` (auth)
- PUT `/api/store` (auth)

You will need to update the frontend to call these endpoints and store JWT tokens. The backend listens on port `4000` by default, and the frontend can use `VITE_API_URL=http://localhost:4000`.
