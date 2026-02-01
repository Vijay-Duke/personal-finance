# Personal Finance Tracker

A self-hosted personal finance management application with AI-powered insights, real-time asset tracking, and comprehensive financial planning tools.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Astro](https://img.shields.io/badge/built%20with-astro-orange)
![React](https://img.shields.io/badge/react-19-blue)

## Features

### Core Financial Management
- **Multi-Account Tracking** - Monitor bank accounts, investments, real estate, superannuation, crypto, and personal/business assets
- **Transaction Management** - Import, categorize, and track all financial transactions
- **Budget Planning** - Create and monitor budgets with category-based allocation
- **Financial Goals** - Set savings goals and track progress over time
- **Cash Flow Analysis** - Visualize income vs expenses with detailed analytics

### AI-Powered Insights
- **AI Chat Assistant** - Get personalized financial advice using OpenAI or Anthropic models
- **Spending Analysis** - AI-driven categorization and spending pattern detection
- **Smart Recommendations** - Automated suggestions for budget optimization
- **Secure AI Integration** - Encrypted API key storage for AI providers

### Asset Tracking
- **Real Estate** - Track property values and mortgage details
- **Stock Portfolio** - Monitor stock holdings with price updates
- **Cryptocurrency** - Track crypto holdings with live price feeds
- **Superannuation** - Monitor retirement account balances
- **Insurance** - Track insurance policies and premiums

### Data Import & Export
- **CSV Import** - Bulk import transactions from bank statements
- **Category Rules** - Auto-categorize transactions based on custom rules
- **Data Export** - Export financial data in multiple formats (CSV, JSON, Excel)
- **Multi-Currency** - Support for multiple currencies with exchange rate conversion

### Security & Authentication
- **Passkey Authentication** - Modern, passwordless authentication using WebAuthn
- **Session Management** - Secure session handling with Better Auth
- **Data Privacy** - Self-hosted - your data stays on your infrastructure

### Progressive Web App
- **Offline Support** - Service worker enables offline functionality
- **Mobile Responsive** - Optimized for desktop, tablet, and mobile devices
- **Installable** - Add to home screen on mobile devices
- **Push Notifications** - Get notified about budget alerts and financial insights

## Tech Stack

- **Framework**: [Astro](https://astro.build/) 5.2+ with Server-Side Rendering
- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Database**: SQLite with Better-sqlite3
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth with WebAuthn/Passkey support
- **AI Integration**: AI SDK with OpenAI and Anthropic support
- **PWA**: Vite PWA Plugin with Workbox

## Prerequisites

- Node.js 22 or higher
- npm 10 or higher
- SQLite 3

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd personal-finance
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required: Database path
DATABASE_URL=./data/finance.db

# Required: Better Auth secret (generate a secure random string)
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-long-here
BETTER_AUTH_URL=http://localhost:4321
PUBLIC_BETTER_AUTH_URL=http://localhost:4321

# Required: Passkey configuration
PASSKEY_RP_ID=localhost
PASSKEY_ORIGIN=http://localhost:4321

# Required: AI encryption key (generate a secure random string)
ENCRYPTION_KEY=your-32-character-minimum-encryption-key-here

# Optional: AI Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Initialize Database

```bash
# Create data directory
mkdir -p data

# Run database migrations
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:4321`.

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Create environment file**:

```bash
cp .env.example .env
# Edit .env with your production values
```

2. **Start the application**:

```bash
docker-compose up -d
```

3. **Run database migrations**:

```bash
docker-compose exec app npx drizzle-kit migrate
```

4. **Access the application**:

Open `http://localhost:4321` in your browser.

### Docker Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# With backup service
docker-compose --profile backup up -d
```

### Manual Docker Build

```bash
# Build image
docker build -t personal-finance .

# Run container
docker run -d \
  --name personal-finance \
  -p 4321:4321 \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  personal-finance
```

## Environment Variables

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Path to SQLite database | `./data/finance.db` |
| `BETTER_AUTH_SECRET` | Secret key for authentication (min 32 chars) | - |
| `BETTER_AUTH_URL` | Base URL for auth callbacks | `http://localhost:4321` |
| `PUBLIC_BETTER_AUTH_URL` | Public auth URL | `http://localhost:4321` |
| `PASSKEY_RP_ID` | Relying Party ID for passkeys | `localhost` |
| `PASSKEY_ORIGIN` | Origin for passkey authentication | `http://localhost:4321` |
| `ENCRYPTION_KEY` | Key for encrypting AI credentials (min 32 chars) | - |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI features |
| `NODE_ENV` | Environment mode (`development`, `production`) |
| `HOST` | Server host binding | `0.0.0.0` |
| `PORT` | Server port | `4321` |

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Database operations
npm run db:generate    # Generate migrations
npm run db:migrate     # Run migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio
```

### Project Structure

```
personal-finance/
├── src/
│   ├── components/      # React components
│   │   ├── accounts/    # Account management components
│   │   ├── ai/          # AI-related components
│   │   ├── auth/        # Authentication forms
│   │   ├── budget/      # Budget components
│   │   ├── charts/      # Data visualization
│   │   ├── dashboard/   # Dashboard widgets
│   │   ├── goals/       # Financial goals
│   │   ├── import/      # Data import
│   │   ├── insurance/   # Insurance tracking
│   │   ├── layout/      # Layout components
│   │   ├── notifications/ # Notification system
│   │   ├── profile/     # User profile
│   │   ├── settings/    # Settings components
│   │   └── transactions/# Transaction management
│   ├── layouts/         # Astro layouts
│   ├── lib/             # Utility libraries
│   │   ├── ai/          # AI integration
│   │   ├── auth/        # Authentication
│   │   ├── db/          # Database schema & client
│   │   ├── integrations/# External API integrations
│   │   └── utils/       # Helper functions
│   ├── pages/           # Astro pages
│   │   ├── accounts/    # Account pages
│   │   ├── api/         # API endpoints
│   │   ├── auth/        # Auth pages
│   │   └── ...          # Other pages
│   └── hooks/           # React hooks
├── data/                # SQLite database files
├── drizzle/             # Database migrations
├── public/              # Static assets
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
└── README.md            # This file
```

### Database Schema

The application uses SQLite with the following main entities:

- **Users** - User accounts and authentication
- **Accounts** - Financial accounts (bank, investment, real estate, etc.)
- **Transactions** - Financial transactions
- **Categories** - Transaction categories
- **Budgets** - Budget definitions
- **Goals** - Financial goals
- **AI Providers** - Configured AI provider credentials (encrypted)
- **Notifications** - User notifications

## API Endpoints

### Authentication
- `POST /api/auth/*` - Better Auth endpoints

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/[id]` - Get account details
- `PUT /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `POST /api/import/csv` - Import CSV transactions

### AI
- `POST /api/ai/chat` - AI chat endpoint
- `GET /api/ai/providers` - List configured AI providers
- `POST /api/ai/providers` - Add AI provider

### Data Export
- `GET /api/export` - Export data in various formats

## Security Considerations

1. **Change default secrets** - Always change `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY` in production
2. **Use HTTPS** - Deploy behind a reverse proxy with SSL/TLS
3. **Backup data** - Regularly backup the SQLite database
4. **Access control** - The app is designed for single-user or trusted multi-user scenarios
5. **API keys** - AI provider API keys are encrypted at rest

## Troubleshooting

### Database Issues

```bash
# Reset database (WARNING: deletes all data)
rm data/finance.db
npm run db:migrate
```

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Docker Issues

```bash
# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [Astro](https://astro.build/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication by [Better Auth](https://better-auth.com/)
- Database ORM by [Drizzle](https://orm.drizzle.team/)
