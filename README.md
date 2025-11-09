# WealthoMeter - Family Wealth Aggregator MVP

A comprehensive platform to track and manage net worth, holdings, and cashflow across an entire family.

## Features

- **Account Aggregation**: Link bank accounts, credit cards, FDs, mutual funds, and stock broker accounts
- **Family Management**: Shared views with role-based permissions (owner/editor/viewer/advisor)
- **Net Worth Dashboard**: Real-time net worth tracking, asset allocation, and alerts
- **Transaction Management**: Transaction-level drilldown with categorization
- **Export & Reports**: Monthly family net-worth PDF and CSV exports
- **Security**: 2FA, encrypted credentials, Account Aggregator compliance

## Tech Stack

- **Backend**: Python + FastAPI
- **Frontend**: React
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: OAuth + JWT with 2FA
- **Hosting**: AWS (KMS, Secrets Manager, RDS)

## Project Structure

```
WealthoMeter/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── docker-compose.yml # Local development setup
└── README.md
```

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Database Setup

```bash
docker-compose up -d postgres redis
alembic upgrade head
```

## Environment Variables

See `.env.example` files in backend and frontend directories.

## Deployment

For free deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md) or [QUICK_DEPLOY.md](./QUICK_DEPLOY.md).

## License

Proprietary

