# Stockify

Stockify is a MERN stack smart retail billing and inventory management system for stores that need product stock control, fast billing, printable invoices, customer records, supplier records, and admin analytics.

## Features

- JWT authentication with bcrypt password hashing
- Admin and user roles
- Admin block/unblock controls
- Product and inventory management
- Stock increase/decrease history
- Low stock and out of stock alerts
- Customer and supplier management
- Smart billing with stock validation
- Auto-generated invoice numbers
- Printable invoice page
- Dashboard summary APIs
- Sales charts, top products, payment mode reports, and profit calculation
- Premium responsive React admin UI with dark/light theme
- Production security with Helmet, rate limiting, secure CORS, and centralized error handling

## Tech Stack

- Frontend: React, Vite, Bootstrap 5, React Router, Axios, Recharts, Lucide React
- Backend: Node.js, Express.js, MongoDB Atlas, Mongoose
- Auth: JWT, bcrypt
- Deployment: Render
- Optional Image Upload: Cloudinary-ready env placeholders

## Folder Structure

```text
Stockify/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      scripts/
      utils/
  frontend/
    src/
      api/
      components/
      context/
      pages/
      styles/
      utils/
  render.yaml
```

## API Routes

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password`

Admin:
- `PUT /api/admin/users/:id/block`

Products:
- `POST /api/products`
- `GET /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `PATCH /api/products/:id/stock`
- `GET /api/products/low-stock`
- `GET /api/products/out-of-stock`

Billing:
- `POST /api/bills`
- `GET /api/bills`
- `GET /api/bills/:id`
- `DELETE /api/bills/:id`
- `GET /api/bills/invoice/:invoiceNo`

Customers:
- `POST /api/customers`
- `GET /api/customers`
- `GET /api/customers/:id`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`

Suppliers:
- `POST /api/suppliers`
- `GET /api/suppliers`
- `GET /api/suppliers/:id`
- `PUT /api/suppliers/:id`
- `DELETE /api/suppliers/:id`

Dashboard:
- `GET /api/dashboard/summary`
- `GET /api/dashboard/sales-chart`
- `GET /api/dashboard/top-products`
- `GET /api/dashboard/stock-alerts`

## Local Installation

Backend:

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Frontend:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Local URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
Health:   http://localhost:5000/api/health
```

## Environment Variables

Backend `.env`:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/stockify?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-stockify-frontend.onrender.com
CLIENT_URLS=https://your-stockify-frontend.onrender.com,http://localhost:5173
ADMIN_NAME=Stockify Admin
ADMIN_EMAIL=admin@stockify.com
ADMIN_PASSWORD=<strong-admin-password>
ADMIN_PHONE=9999999999
```

Frontend `.env`:

```env
VITE_API_URL=https://your-stockify-backend.onrender.com/api
```

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account.
2. Create a new project and cluster.
3. Create a database user with a strong password.
4. Add Render outbound access by allowing `0.0.0.0/0` in Network Access, or use a stricter allowlist if your plan supports stable outbound IPs.
5. Copy the Atlas connection string.
6. Replace username, password, and database name in `MONGO_URI`.

## Admin Seed

Set these backend environment variables first:

```env
ADMIN_NAME=Stockify Admin
ADMIN_EMAIL=admin@stockify.com
ADMIN_PASSWORD=<strong-admin-password>
ADMIN_PHONE=9999999999
```

Run:

```bash
cd backend
npm run seed:admin
```

Use `ADMIN_EMAIL` and `ADMIN_PASSWORD` to log in from the frontend.

## Render Deployment

This project includes [render.yaml](./render.yaml). You can use Render Blueprint deployment or create services manually.

Backend Web Service:
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Required Env Vars: `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `CLIENT_URLS`
- Optional Admin Seed Env Vars: `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE`

Frontend Static Site:
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Required Env Var: `VITE_API_URL=https://your-stockify-backend.onrender.com/api`
- Rewrite Rule: `/* -> /index.html`

Deployment order:

1. Deploy backend on Render.
2. Copy backend URL.
3. Set frontend `VITE_API_URL` to `<backend-url>/api`.
4. Deploy frontend.
5. Set backend `CLIENT_URL` and `CLIENT_URLS` to include frontend URL.
6. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_PHONE` on the backend service. The backend creates the admin automatically when it starts, so a paid Render shell or one-off job is not required.

## Production Notes

- Helmet is enabled for secure HTTP headers.
- Rate limiting is enabled globally.
- CORS only allows configured frontend origins.
- Backend error responses use centralized JSON handling.
- Vite build uses manual chunks for vendor, charts, UI, and HTTP libraries.
- Keep `JWT_SECRET`, `MONGO_URI`, and admin password private.
