# UNIMARKET Backend

A robust Node.js backend application built with Express, TypeScript, and PostgreSQL. Features include authentication, file uploads, real-time communication, and cloud storage integration.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with access/refresh tokens
- **Database** - PostgreSQL with Drizzle ORM
- **File Upload & Storage** - AWS S3-compatible storage (DigitalOcean Spaces)
- **Image Processing** - Sharp for image optimization
- **Real-time Communication** - Socket.IO integration
- **Email Service** - Resend API integration
- **Type Safety** - Full TypeScript support
- **Data Validation** - Zod schema validation
- **Testing** - Vitest testing framework
- **Development Tools** - ESLint, Prettier, hot reload

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm (v10.6.5+)
- Docker & Docker Compose
- PostgreSQL

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fyp-backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   
   Create `.env` file in the root directory:
   ```env
   PORT=4000
   DB_URL=postgresql://username:password@localhost:5432/database_name
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   POSTGRES_USER=your_postgres_user
   POSTGRES_PASSWORD=your_postgres_password
   POSTGRES_DB=your_database_name
   NODE_ENV=development
   APP_ORIGIN=http://localhost:3000
   RESEND_API_KEY=your_resend_api_key
   SPACES_ENDPOINT=your_spaces_endpoint
   SPACES_KEY=your_spaces_key
   SPACES_SECRET=your_spaces_secret
   SPACES_REGION=your_spaces_region
   BUCKET_NAME=your_bucket_name
   EMAIL_SENDER=your_email@domain.com
   ```

   For testing, create `.env.test.local`:
   ```env
   # Same as above but with test database configurations
   DB_URL=postgresql://username:password@localhost:5433/test_database
   POSTGRES_DB=test_database
   # ... other test-specific variables
   ```

## 🚀 Getting Started

### Development

1. **Start the development database**
   ```bash
   pnpm run db:dev:up
   ```

2. **Run database migrations**
   ```bash
   pnpm run drizzle:dev:migrate
   ```

3. **Seed the database (optional)**
   ```bash
   pnpm run db:dev:seed
   ```

4. **Start the development server**
   ```bash
   pnpm run dev
   ```

The server will start on `http://localhost:4000` with hot reload enabled.

### Production

1. **Build the application**
   ```bash
   pnpm run build
   ```

2. **Start the production server**
   ```bash
   pnpm start
   ```

## 📊 Database Management

### Development Database

- **Start database**: `pnpm run db:dev:up`
- **Remove database**: `pnpm run db:dev:rm`
- **Restart database**: `pnpm run db:dev:restart`
- **Open Drizzle Studio**: `pnpm run db:studio`

### Database Migrations

- **Generate migration**: `pnpm run drizzle:dev:generate`
- **Apply migrations**: `pnpm run drizzle:dev:migrate`
- **Push schema changes**: `pnpm run drizzle:dev:deploy`

### Test Database

- **Start test database**: `pnpm run db:test:up`
- **Remove test database**: `pnpm run db:test:rm`
- **Restart test database**: `pnpm run db:test:restart`



## 🔧 Development Tools

### Code Quality

```bash
# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format code
pnpm run format
```


## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `DB_URL` | PostgreSQL connection string | Yes |
| `ACCESS_TOKEN_SECRET` | JWT access token secret | Yes |
| `REFRESH_TOKEN_SECRET` | JWT refresh token secret | Yes |
| `POSTGRES_USER` | PostgreSQL username | Yes |
| `POSTGRES_PASSWORD` | PostgreSQL password | Yes |
| `POSTGRES_DB` | PostgreSQL database name | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `APP_ORIGIN` | Frontend application URL | Yes |
| `RESEND_API_KEY` | Resend email service API key | Yes |
| `SPACES_ENDPOINT` | DigitalOcean Spaces endpoint | Yes |
| `SPACES_KEY` | DigitalOcean Spaces access key | Yes |
| `SPACES_SECRET` | DigitalOcean Spaces secret key | Yes |
| `SPACES_REGION` | DigitalOcean Spaces region | Yes |
| `BUCKET_NAME` | Storage bucket name | Yes |
| `EMAIL_SENDER` | Email sender address | Yes |

## 🔌 API Endpoints

The application provides RESTful APIs for:

- **Authentication** - Login, register, token refresh
- **User Management** - Profile management, user operations
- **File Upload** - Image upload and processing
- **Real-time Features** - WebSocket connections via Socket.IO
- **Email Services** - Transactional emails via Resend

## 🏗️ Tech Stack

### Core
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript

### Database
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database toolkit
- **Docker** - Database containerization

### Authentication & Security
- **JWT** - JSON Web Tokens
- **Argon2** - Password hashing
- **CORS** - Cross-origin resource sharing

### File Handling
- **Multer** - File upload middleware
- **Sharp** - Image processing
- **AWS SDK** - S3-compatible storage

### Communication
- **Socket.IO** - Real-time communication
- **Resend** - Email service

### Development & Testing
- **Vitest** - Testing framework
- **Pactum** - API testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **tsx** - TypeScript execution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Scripts Reference

| Script | Description |
|--------|-------------|
| `dev` | Start development server with hot reload |
| `build` | Build for production |
| `start` | Start production server |
| `test` | Run test suite |
| `lint` | Run ESLint |
| `lint:fix` | Fix ESLint issues |
| `format` | Format code with Prettier |
| `db:dev:up` | Start development database |
| `db:dev:restart` | Restart development database |
| `db:studio` | Open Drizzle Studio |
| `drizzle:dev:migrate` | Run database migrations |
| `drizzle:dev:generate` | Generate new migration |
| `db:dev:seed` | Seed database with initial data |

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Yusf Nuru Yesuf**

---

For more information or support, please refer to the project documentation or create an issue in the repository.