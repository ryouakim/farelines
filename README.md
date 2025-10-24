# Farelines - Flight Fare Monitoring Application

A professional flight fare monitoring web application that tracks booked flights and alerts users when prices drop.

## Features

- 🔍 **Smart Price Tracking** - Monitors your exact fare class across all booking sites
- 📧 **Instant Alerts** - Email notifications when prices drop below your threshold
- 📊 **Price History** - Track historical price trends for your flights
- 🔗 **Google Flights Integration** - Import trips directly from Google Flights URLs
- 📄 **PDF Upload** - Upload confirmation PDFs for automatic trip creation
- 🔐 **Secure Authentication** - OAuth login with Google (Apple & Microsoft coming soon)
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🌙 **Dark Mode** - Automatic theme switching based on system preferences

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Authentication**: NextAuth.js with OAuth providers
- **Database**: MongoDB with native driver
- **Email**: Nodemailer with Gmail/SendGrid
- **Charts**: Recharts
- **State Management**: Zustand
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- Google OAuth credentials
- Gmail app password or SendGrid API key

## Environment Setup

1. Copy the environment template:
```bash
cp .env.local.example .env.local
```

2. Configure your environment variables:

```env
# Application
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB
MONGO_URI=mongodb://localhost:27017/farelines
DB_NAME=farelines

# Email
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Optional: SendGrid
SENDGRID_API_KEY=your-sendgrid-key
```

## Installation

```bash
# Install dependencies
npm install

# Run database migrations/setup
npm run setup-db

# Seed sample data (optional)
npm run seed

# Start development server
npm run dev
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://farelines.com/api/auth/callback/google`

## Project Structure

```
farelines/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/             # API routes
│   │   ├── app/             # Authenticated app pages
│   │   ├── auth/            # Authentication pages
│   │   └── (marketing)/     # Public pages
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   └── layout/         # Layout components
│   ├── lib/                # Utility functions
│   │   ├── mongodb.ts      # Database connection
│   │   ├── email.ts        # Email service
│   │   ├── queue.ts        # Worker queue helpers
│   │   └── utils.ts        # Utility functions
│   └── types/              # TypeScript types
├── public/                 # Static assets
└── scripts/               # Build and utility scripts
```

## API Routes

### Trips
- `GET /api/trips` - List user's trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/[id]` - Get trip details
- `PATCH /api/trips/[id]` - Update trip
- `DELETE /api/trips/[id]` - Archive trip
- `POST /api/trips/[id]/check` - Manual price check

### User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile
- `POST /api/user/delete` - Delete account

## Worker Integration

The app integrates with an existing Node.js worker (`fareMonitor.js`) for price checking:

1. New/updated trips are flagged with `needsCheck: true`
2. Worker queue items are created for processing
3. Worker processes trips and updates prices
4. Email alerts are sent when prices drop

## Development

```bash
# Run development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
# Build image
docker build -t farelines .

# Run container
docker run -p 3000:3000 --env-file .env.local farelines
```

## Database Schema

The application uses MongoDB with the following collections:

- **trips** - User trip data with flight details
- **users** - User profiles and preferences
- **priceAlerts** - Sent price drop notifications
- **workerQueue** - Queue for price check jobs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For support, email support@farelines.com or open an issue on GitHub.

## License

This project is proprietary software. All rights reserved.

## Acknowledgments

- Built with Next.js and shadcn/ui
- Icons from Lucide React
- Charts powered by Recharts
