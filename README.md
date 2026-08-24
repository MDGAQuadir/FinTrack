# FinTrack — Intelligent Personal Finance & Automated Ledger Platform

[![CI/CD Pipeline](https://github.com/MDGAQuadir/FinTrack/actions/workflows/ci.yml/badge.svg)](https://github.com/MDGAQuadir/FinTrack/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/)
[![Spring Boot 3](https://img.shields.io/badge/Spring%20Boot-3.4.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

**FinTrack** is an enterprise-grade, full-stack personal finance platform designed for individuals, freelancers, and teams to automate financial tracking. It features automated PDF/CSV bank statement ingestion, intelligent transaction categorization, duplicate detection, deterministic chronological balance recalculation, real-time payment webhooks (Razorpay, Stripe, UPI), multi-dimensional rate limiting, and disaster recovery.

---

## 👨‍💻 Developer & Maintainer

- **Developer:** Md Gulam Abdul Quadir
- **GitHub:** [https://github.com/MDGAQuadir](https://github.com/MDGAQuadir)
- **LinkedIn:** [https://www.linkedin.com/in/md-gulam-abdul-quadir-554b7a273](https://www.linkedin.com/in/md-gulam-abdul-quadir-554b7a273)
- **Support Desk:** `support@fintrack.app`

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                         │
│   React 19 + TypeScript + Tailwind CSS + Lucide UI     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST API
                            ▼
┌────────────────────────────────────────────────────────┐
│             API GATEWAY & SECURITY LAYER               │
│  Spring Security • JWT • Multi-Dimensional Rate Limiter │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│  AUTOMATION PIPELINE      │ │  FINANCIAL CORE ENGINE   │
│  • Bank Statement Parser  │ │  • Credit / Debit Ledger │
│  • UPI Narration Cleaner  │ │  • Borrow & Lend Tracker │
│  • Webhook Provider Engine│ │  • Chronological Engine  │
│  • Duplicate Detection    │ │  • Smart Categorizer     │
└─────────────┬─────────────┘ └───────────┬──────────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│                  PERSISTENCE LAYER                     │
│  PostgreSQL 16 • Flyway Migrations • Performance Indexes│
└────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. 🏦 Smart Bank Statement Auto-Importer
- **Multi-Format Ingestion**: Ingests PDF and CSV statements from major banks (HDFC, SBI, ICICI, Axis, Kotak) and UPI apps (PhonePe, GPay, Paytm).
- **UPI Narration Cleaner**: Converts complex bank codes (`UPI/52341234/SWIGGY/swiggy@icici/Order123`) into clean merchant names (**Swiggy**).
- **Smart Auto-Categorization**: Rules engine classifies transactions (*Food & Dining, Transport, Utilities, Entertainment, Salary*).
- **Duplicate Prevention**: Detects existing ledger records and **automatically unchecks duplicates** before import.
- **Interactive UI Preview**: Full user control to edit categories, toggle types, and review before batch commit.

### 2. ⚡ Real-Time Payment Webhook Pipeline
- **Provider Adapters**: Isolated adapters for **Razorpay**, **Stripe**, and **Generic UPI**.
- **Cryptographic Security**: Constant-time HMAC-SHA256 signature verification over raw request bytes.
- **Replay Attack Protection**: Stripe timestamp verification with a 300-second freshness window.
- **Database-Level Idempotency**: Unique constraint `(provider, event_id)` prevents duplicate transactions upon event redelivery.
- **Webhook Simulator**: Built-in developer simulator modal with 6 quick presets (*Swiggy Refund, Netflix Charge, Salary Credit*).

### 3. 💰 Deterministic Chronological Ledger
- **Chronological Sequencing**: Sequences all transactions strictly by `Date ASC, CreatedAt ASC`.
- **Cascading Recalculation**: Modifying or deleting an older transaction automatically recalculates all forward running balances.
- **Concurrency & Locking**: Optimistic locking (`@Version`) and user-level synchronized locks prevent balance collisions.

### 4. 🔐 Enterprise Security & Rate Limiting
- **Multi-Dimensional Rate Limiter**:
  - Email Limit: Max 5 OTP requests per 15 minutes.
  - IP Limit: Max 20 requests per 15 minutes.
  - 5-Attempt Lockout: Five consecutive failed attempts invalidates the active OTP.
- **OTP Lifecycle**: Strict 5-minute TTL, single-use destruction, and zero credential exposure in production logs.
- **Stateless JWT**: Signed JWT access tokens with controlled expiration.
- **Security Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `HSTS`.

### 5. 🐘 Flyway Database Migrations
- `V1__initial_schema.sql`: Base tables for users, credits, debits, unified ledger, borrow/lend, and webhook events.
- `V2__performance_indexes.sql`: Composite performance indexes on `(email, date)`, `(email, date, created_at)`, and `(provider, event_id)`.

### 6. 💾 Disaster Recovery
- Automated timestamped gzip backups (`scripts/backup_postgres.sh`) with 7-day retention.
- Automated restore verification test (`scripts/verify_restore.sh`) validating schema and row count integrity (**PASS**).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS, Lucide Icons |
| **Backend** | Java 21, Spring Boot 3.4.3, Spring Security, Spring Data JPA |
| **Database** | PostgreSQL 16, Flyway Migrations, HikariCP |
| **Document Processing** | Apache PDFBox, Apache Commons CSV, iText PDF |
| **Testing** | JUnit 5, Mockito, AssertJ (33 Tests) |
| **Deployment** | Render Cloud (Blueprint `render.yaml`) |

---

## 🧪 Testing & Quality Assurance

FinTrack includes a comprehensive automated test suite with **33 passing tests (100% pass rate)**:

```bash
cd backend
mvn test
```

```
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 -- in com.fintrack.security.RateLimitingServiceTest
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0 -- in com.fintrack.service.BankStatementParserServiceTest
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0 -- in com.fintrack.service.PaymentWebhookServiceTest
[INFO] Results:
[INFO] Tests run: 33, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Java**: JDK 21 or newer
- **Node.js**: 18+ and npm
- **PostgreSQL**: PostgreSQL 16 running locally on `localhost:5432`

### 1. Clone & Configure Environment
```bash
git clone https://github.com/MDGAQuadir/FinTrack.git
cd FinTrack
cp .env.example .env
```

### 2. Run Both Services Concurrently
```bash
npm install
npm run dev
```
- **Frontend App:** `http://localhost:5173`
- **Backend API:** `http://localhost:8080`
- **Health Check:** `http://localhost:8080/actuator/health`

---

## ☁️ 1-Click Deployment on Render

FinTrack is pre-configured with **[render.yaml](render.yaml)** for native deployment on Render:

1. Push your repository to GitHub.
2. Open [Render Dashboard](https://dashboard.render.com/) $\rightarrow$ **New +** $\rightarrow$ **Blueprint**.
3. Select your repository $\rightarrow$ Click **Apply**.
4. Render will automatically provision:
   - **PostgreSQL 16** Managed Database
   - **Spring Boot Java 21** Web Service
   - **React + Vite** Static Site

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
