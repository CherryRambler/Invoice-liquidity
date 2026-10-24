# Invoice Liquidity

Businesses often wait 30–90 days for clients to pay their invoices. Invoice Liquidity lets a business turn an unpaid invoice into a token that investors fund **today** at a discount. When the client pays, investors get back the full invoice value, and the difference is their return.

## How it works

```text
 Business                         Investors                      Client
    │                                 │                             │
    │ 1. Submit invoice (GSTIN,       │                             │
    │    amount, due date)            │                             │
    │ 2. Verify  ── GSTIN format,     │                             │
    │               future due date   │                             │
    │ 3. Tokenize ── token created    │                             │
    │    at 95% of face value ──────► │ 4. Invest (whole rupees)    │
    │                                 │    until fully funded       │
    │ 5. Receive funds ◄── UPI payout │                             │
    │    of the amount raised         │                             │
    │                                 │                             │
    │ 6. Repayment ◄──────────────────┼──────── client pays ────────┤
    │    investors paid face value ─► │                             │
```

An invoice moves through these statuses, one step at a time:

`pending` → `verified` → `tokenized` → `funded` → `repaid`

### The numbers

Tokens are priced at a **5% discount** (`DISCOUNT_RATE` in [invoiceController.js](backend/src/controllers/invoiceController.js)).

| | Example |
| --- | --- |
| Invoice face value | ₹1,00,000 |
| Funding target (95%) | ₹95,000 — what investors put in and the business receives now |
| Paid back at repayment | ₹1,00,000 — split between investors in proportion to what they invested |
| Investor return | ≈ 5.26% |

An investor who puts in ₹9,500 receives ₹10,000 at repayment.

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React 19, Vite, Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| Auth | JWT (7-day tokens), bcrypt password hashing |
| Payments | Simulated UPI service (no real money moves) |

## Project structure

```text
invoice-liquidity/
├── backend/
│   └── src/
│       ├── app.js              Express app and server start-up
│       ├── config/db.js        MongoDB connection
│       ├── controllers/        Request handlers (auth, invoices, investing)
│       ├── middleware/auth.js  JWT check and role guard
│       ├── models/             User, Invoice, Token
│       ├── routes/             /api/auth, /api/invoices, /api/investors
│       └── services/           Simulated UPI payments
├── frontend/
│   └── src/
│       ├── App.jsx             Login state and role-based dashboard
│       ├── api/client.js       Axios client that attaches the JWT
│       └── pages/              AuthPage, BusinessDashboard, InvestorDashboard
├── chaincode/                  Placeholder for on-chain tokens (not implemented yet)
└── docs/                       Placeholder for architecture notes and demo script
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- A MongoDB database — a local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/invoiceLiquidity
JWT_SECRET=replace-with-a-long-random-string
```

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign login tokens. The server refuses to start without it. |
| `PORT` | No | Port for the API. Defaults to `5000`. |

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Start the API:

```bash
npm run dev     # restarts on file changes (nodemon)
# or
npm start
```

You should see `MongoDB connected successfully` and `Server is running on http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

The frontend calls `http://localhost:5000/api` by default. To point it elsewhere, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Both `.env` files are git-ignored. Never commit them.

### 3. Try the full flow

1. **Register a business account** and submit an invoice with a valid GSTIN (for example `27AAPFU0939F1ZV`) and a due date in the future.
2. Click **Verify invoice**, then **Tokenize invoice**.
3. In a private window, **register an investor account** and invest in the token until it is fully funded. You can split the amount across several investors.
4. Back as the business, click **Receive funds**, then **Simulate client repayment**.
5. As the investor, the token now shows **repaid** along with your payout.

## API reference

All endpoints are under `/api`. Except for register and login, every request needs an `Authorization: Bearer <token>` header. Errors are returned as `{ "message": "..." }`.

### Auth

| Method | Path | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | `name`, `email`, `password` (8–72 chars), `role` (`business` or `investor`) | Create an account. Returns `{ token, user }`. |
| `POST` | `/auth/login` | `email`, `password` | Returns `{ token, user }`. |
| `GET` | `/auth/me` | — | The logged-in user. |

### Invoices — business accounts only

A business can only see and act on its own invoices.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/invoices` | Create an invoice. Body: `gstin`, `invoiceAmount` (≥ ₹1), `dueDate`. |
| `GET` | `/invoices` | List your invoices, newest first, each with `funding` progress once tokenized. |
| `POST` | `/invoices/:id/verify` | `pending` → `verified`. Checks the GSTIN format and that the due date is in the future. |
| `POST` | `/invoices/:id/tokenize` | `verified` → `tokenized`. Creates a token at 95% of face value. |
| `POST` | `/invoices/:id/payout` | `tokenized` → `funded`. Requires a fully funded token; pays the business over UPI. |
| `POST` | `/invoices/:id/repay` | `funded` → `repaid`. Pays each investor their share of the face value. |

### Investing — investor accounts only

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/investors/tokens` | List all tokens. Each includes only your own investments. |
| `POST` | `/investors/tokens/:id/invest` | Body: `amount` (whole rupees). Fails if it would exceed what the token still needs. |

Status changes are atomic, so a double-click or two simultaneous requests can never run a payout or repayment twice. A second request gets `409 Conflict`.

## Current limitations

- **Payments are simulated.** [upiService.js](backend/src/services/upiService.js) waits 800 ms and returns a fake transaction ID.
- **GSTIN is checked for format only**, not against the GST portal.
- **The blockchain layer is not built yet.** `chaincode/` holds empty placeholder files; tokens currently live in MongoDB.
- **No automated tests yet.**
- The API allows requests from any origin (`cors()`), which suits local development. Restrict it before deploying.
