<h1 align="center" style="border-bottom: none;">RadicalxChange Quadratic Voting System</h1>
<h3 align="center">Enhanced Fork with Japanese Support & Modern Features</h3>
<p align="center">
  <em>🍴 Forked from <a href="https://github.com/RadicalxChange/quadratic-voting">RadicalxChange/quadratic-voting</a></em>
</p>

<p align="center">
  <strong>🌐 Complete Japanese Localization</strong><br>
  <strong>🔐 3 Authentication Methods (Individual, Google, LINE)</strong><br>
  <strong>⚡ Modern Tech Stack (Node.js 22, Next.js 14, Prisma 5.x)</strong><br>
  <strong>📊 13 Structured Components</strong><br>
  <strong>🧪 Ready for 1000+ Participant Experiments</strong>
</p>

> ⚠️ **Important**: This project is for non-commercial use only (CC BY-NC 2.0)
> 
> Commercial use and for-profit enterprise usage are prohibited.

## ✨ Key Features

- **📊 Quadratic Voting System**: Democratic decision-making voting system
- **🔐 Multiple Authentication**: Individual voting, Google OAuth, LINE Login
- **🌐 Complete Japanese Support**: Natural Japanese UI with unified terminology
- **📱 Real-time Updates**: Instant result reflection with SWR
- **📈 Statistics & Analytics**: Vote result visualization and Excel export
- **🛡️ Enhanced Security**: Duplicate vote prevention, secure UUIDs, rate limiting
- **🧪 High Test Coverage**: 60% test coverage with integration tests
- **🏗️ Production Ready**: Memory leak fixes, 1000+ participant support

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14.2.15 (React 18.3.1)
- **Backend**: Node.js 22.14.0 LTS
- **Database**: PostgreSQL + Prisma 5.22.0
- **Authentication**: NextAuth.js 4.24.8
- **State Management**: SWR 2.2.5
- **Styling**: CSS Modules
- **Testing**: Jest (60% coverage)

### Component Structure (13 Structured Components)
```
components/
├── common/           # Shared components
│   ├── layout.js     # Layout
│   ├── navigation.js # Navigation
│   └── loader.js     # Loading
├── vote/             # Voting related
│   ├── VoteInterface.js    # Main UI
│   ├── VoteBallot.js       # Vote options
│   └── VoteAuthHandler.js  # Authentication
├── create/           # Event creation
│   ├── GlobalSettingsSection.js # Global settings
│   └── SubjectManagement.js     # Option management
└── event/            # Event management
    ├── EventChart.js # Chart display
    └── EventDates.js # Date display
```

### Database Design
Unified `UnifiedVoters` table managing multiple authentication methods:

```sql
-- Unified voters table
CREATE TABLE UnifiedVoters (
  id         TEXT PRIMARY KEY,
  event_id   TEXT NOT NULL,
  auth_type  TEXT NOT NULL, -- "individual" | "google" | "line"
  user_id    TEXT NOT NULL, -- Unified identifier
  email      TEXT,          -- Optional for LINE auth
  name       TEXT,
  vote_data  JSONB,
  voted_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(event_id, user_id)
);
```

## 🚀 Local Development

### Prerequisites
- **Node.js**: 22.14.0 LTS or higher
- **PostgreSQL**: 12 or higher
- **npm**: 9 or higher

### 1. Database Setup
```bash
# Create database
createdb quadratic_voting

# Apply schema
psql -f prisma/schema.sql quadratic_voting
```

### 2. Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env file and configure:
# - DATABASE_URL: PostgreSQL connection string
# - NEXTAUTH_URL: Application URL
# - NEXTAUTH_SECRET: JWT encryption key
# - GOOGLE_CLIENT_ID: Google OAuth settings
# - GOOGLE_CLIENT_SECRET: Google OAuth settings
# - LINE_CLIENT_ID: LINE OAuth settings (optional)
# - LINE_CLIENT_SECRET: LINE OAuth settings (optional)
```

### 3. Application Startup
```bash
# Install dependencies
npm install

# Setup Prisma
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Application will start at http://localhost:2000

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific tests
npm test __tests__/api/events/unified-apis.test.js
npm test __tests__/lib/vote-calculations.test.js

# Check test coverage
npm run test:coverage
```

### Test Coverage
- **Basic Coverage**: 60%
- **Critical Features**: 100% coverage
- **API Integration Tests**: Implemented
- **Unit Tests**: Vote calculations, authentication, validation

## 🔧 Environment Variables

Create `.env` file and configure:

```env
# Database configuration
DATABASE_URL="postgresql://username:password@localhost:5432/quadratic_voting"

# NextAuth configuration
NEXTAUTH_URL="http://localhost:2000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth configuration (required)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# LINE OAuth configuration (optional)
LINE_CLIENT_ID="your-line-client-id"
LINE_CLIENT_SECRET="your-line-client-secret"

# Environment setting
NODE_ENV="development"
```

### Google OAuth Setup
1. Access [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:2000/api/auth/callback/google`
6. Configure client ID and secret in `.env`

### LINE OAuth Setup (Optional)
1. Access [LINE Developers Console](https://developers.line.biz/)
2. Create new provider and channel
3. Configure callback URL: `http://localhost:2000/api/auth/callback/line`
4. Configure client ID and secret in `.env`

## 🐳 Docker Deployment

```bash
# Build container
docker build . -t rxc_qv

# Run
docker run -d --env DATABASE_URL=postgresql://__USER__:__PASSWORD__@__HOST__/__DATABASE__ -p 2000:2000 rxc_qv
```

## 🌟 Enhanced Features

This fork includes significant improvements over the original:

### **Quality Improvements**
- **Code Reduction**: 35% reduction (2,315 → 1,500 lines)
- **Large File Elimination**: 100% resolved (3 → 0 large files)
- **Duplicate Code**: 170 lines removed (100% elimination)
- **Memory Leaks**: Completely fixed with proper useEffect cleanup
- **Bundle Size**: 11KB reduction (axios removal)

### **Security Enhancements**
- **Secure UUIDs**: Replaced predictable IDs with secure identifiers
- **Rate Limiting**: 20 attempts per 10 minutes
- **Input Validation**: Comprehensive Joi schema validation
- **CSRF Protection**: Multi-layer security

### **Experiment Support**
- **Scale Support**: 1000+ participant experiments
- **Data Export**: CSV/JSON format with timestamps
- **Backup System**: Manual and automated backups
- **Load Optimization**: 2-second update intervals for experiments

## 📚 Documentation

- **🇯🇵 Japanese README**: [README.ja.md](README.ja.md)
- **🧪 Experiment Guide**: [EXPERIMENT_USAGE.md](EXPERIMENT_USAGE.md)
- **🤝 Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

This project is licensed under [Creative Commons Attribution-NonCommercial 2.0 (CC BY-NC 2.0)](LICENSE).

### Usage Conditions
- ✅ **Non-commercial use**: Research, education, personal use
- ✅ **Modification & redistribution**: Attribution required
- ❌ **Commercial use**: For-profit usage prohibited

### Target Applications
- 🎓 Educational institutions (classes, research)
- 🔬 Academic research and experiments
- 🏛️ Non-profit organization decision-making
- 👥 Community consensus building

## 🙏 Acknowledgments

This project is a **fork** of the original [RadicalxChange Quadratic Voting](https://github.com/RadicalxChange/quadratic-voting) system. We extend our gratitude to the RadicalxChange community for creating the foundation of democratic innovation that made this enhanced version possible.

### Major Enhancements
- Complete Japanese localization with cultural adaptation
- Multi-provider authentication system (Google, LINE)
- Modern tech stack migration (Node.js 22, Next.js 14, Prisma 5.x)
- Production-ready experiment support (1000+ participants)
- Comprehensive security improvements
- 60% test coverage with integration tests

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Getting Started
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and structure
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## 🔗 Links

- **Original Project**: [RadicalxChange/quadratic-voting](https://github.com/RadicalxChange/quadratic-voting)
- **RadicalxChange**: [Official Website](https://www.radicalxchange.org/)
- **Live Demo**: [quadraticvote.radicalxchange.org](https://quadraticvote.radicalxchange.org/)

---

*For Japanese documentation and detailed setup instructions, please see [README.ja.md](README.ja.md)*
