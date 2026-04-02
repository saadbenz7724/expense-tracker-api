# 💰 Expense Tracker & Finance Manager API

A production-ready REST API built with **NestJS**, **MySQL**, and **Redis** for tracking personal expenses, managing budgets, and generating financial reports.

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| NestJS + Node.js | Backend framework |
| MySQL + TypeORM | Database & ORM |
| Redis + ioredis | Caching layer |
| JWT + bcryptjs | Authentication & security |
| Passport.js | Auth strategies |
| class-validator | Request validation |

---

## ✨ Key Features

- **JWT Authentication** with refresh token rotation
- **Role-based access** — every user sees only their own data
- **Expense & Income tracking** with soft delete
- **Smart filtering** — by category, type, date range, month/year
- **Pagination** on all list endpoints
- **Budget management** with auto alert when spending crosses threshold
- **Financial reports** — monthly summary, yearly overview, category breakdown
- **Redis caching** on dashboard with automatic cache invalidation
- **Global error handling** — consistent error + success response format
- **Request logging** — every request logged with response time

---

## 📁 Project Structure
```
src/
├── auth/               # JWT auth, refresh tokens, login, register
├── users/              # User entity and service
├── categories/         # Expense categories with auto-seeding
├── expenses/           # Core expense CRUD with filtering
├── budgets/            # Budget limits with alert logic
├── reports/            # SQL aggregation reports
├── redis/              # Redis service wrapper
└── common/
    ├── decorators/     # @CurrentUser() decorator
    ├── guards/         # JwtAuthGuard
    ├── filters/        # Global exception filter
    └── interceptors/   # Response + logging interceptors
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- MySQL 8+
- Redis

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/your-username/expense-tracker-api.git
cd expense-tracker-api
```

**2. Install dependencies**
```bash
npm install
```

**3. Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your MySQL password and secrets
```

**4. Create the database**
```sql
CREATE DATABASE expense_tracker;
```

**5. Start the server**
```bash
npm run start:dev
```

Server runs at `http://localhost:3000/api/v1`

> TypeORM will auto-create all tables on first run.

---

## 🔐 Authentication Flow
```
POST /auth/register  →  returns accessToken (15min) + refreshToken (7days)
POST /auth/login     →  returns accessToken + refreshToken
POST /auth/refresh   →  old refreshToken revoked, new tokens issued
POST /auth/logout    →  refreshToken revoked
```

All protected routes require:
```
Authorization: Bearer <accessToken>
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ❌ | Logout |
| POST | `/auth/me` | ✅ | Get current user |

### Categories
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/categories` | ✅ | Get all categories |
| GET | `/categories/:id` | ✅ | Get single category |
| POST | `/categories` | ✅ | Create custom category |
| PATCH | `/categories/:id` | ✅ | Update category |
| DELETE | `/categories/:id` | ✅ | Delete category |

### Expenses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/expenses` | ✅ | Get all with filters + pagination |
| GET | `/expenses/:id` | ✅ | Get single expense |
| POST | `/expenses` | ✅ | Create expense or income |
| PATCH | `/expenses/:id` | ✅ | Update expense |
| DELETE | `/expenses/:id` | ✅ | Soft delete expense |

### Expenses — Query Params
```
?type=expense|income
?categoryId=1
?month=3&year=2025
?startDate=2025-03-01&endDate=2025-03-31
?page=1&limit=10
```

### Budgets
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/budgets` | ✅ | Get all budgets with usage |
| GET | `/budgets/:id` | ✅ | Get single budget |
| POST | `/budgets` | ✅ | Create budget |
| PATCH | `/budgets/:id` | ✅ | Update budget |
| DELETE | `/budgets/:id` | ✅ | Delete budget |

### Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/reports/dashboard` | ✅ | Full dashboard (Redis cached) |
| GET | `/reports/monthly` | ✅ | Monthly summary |
| GET | `/reports/yearly` | ✅ | Yearly overview |
| GET | `/reports/categories` | ✅ | Category breakdown |
| GET | `/reports/recent` | ✅ | Recent transactions |
| GET | `/reports/budget-status` | ✅ | Budget usage status |
| GET | `/reports/cache-status` | ✅ | Redis cache info |

---

## 📊 Response Format

### Success
```json
{
  "success": true,
  "statusCode": 200,
  "path": "/api/v1/reports/dashboard",
  "timestamp": "2025-03-27T10:00:00.000Z",
  "data": { }
}
```

### Error
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["amount must be a number"],
  "path": "/api/v1/expenses",
  "method": "POST",
  "timestamp": "2025-03-27T10:00:00.000Z"
}
```

---

## ⚡ Redis Caching Strategy

| Endpoint | Cache TTL | Invalidated When |
|---|---|---|
| `/reports/dashboard` | 5 minutes | Expense created/updated/deleted |

---

## 🛡️ Security Features

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT refresh token rotation** — old token revoked on every refresh
- Refresh tokens stored in database with expiry
- Every user can only access their own data
- Request body sanitized with **whitelist validation**

---

## 🗄️ Database Schema
```
users           → id, full_name, email, password, monthly_income
refresh_tokens  → id, token, user_id, expires_at, is_revoked
categories      → id, name, icon, color, is_default, user_id
expenses        → id, amount, type, description, expense_date, is_deleted, user_id, category_id
budgets         → id, limit_amount, month, year, alert_percentage, is_alert_sent, user_id, category_idqaq