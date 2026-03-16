# ZK UI - Timesheet Tracker

A responsive web application for tracking timesheets with integrated day tracking. Works in browsers and as a native mobile app (iOS/Android).

## Features

- **Timesheet Management**: View and manage weekly timesheet entries
- **Day Tracking**: Track your daily work activities with push/pop/pause functionality
- **Azure AD Authentication**: Device code flow for secure login
- **Local Day Storage**: Works offline with local SQLite database
- **Mobile App**: Native iOS and Android apps via Capacitor

## Tech Stack

- **Frontend**: React 19 + Vite
- **Local Database**: sql.js (SQLite)
- **Mobile**: Capacitor
- **Auth**: Azure AD Device Code Flow

## Getting Started (Web)

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
cd zkui-frontend
npm install
```

### Development

```bash
npm run dev
```

Opens at http://localhost:5173

### Production Build

```bash
npm run build
npm start
```

Server runs on port 3131

## Mobile App

### Prerequisites

- Node.js 18+
- For Android: Android SDK
- For iOS: Xcode (macOS only)

### Setup

```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Add Android SDK path
echo "sdk.dir=/path/to/android-sdk" > android/local.properties

# Sync and build
npx cap sync android
cd android && ./gradlew assembleDebug
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`

### iOS

```bash
npx cap sync ios
cd ios/App
xcodebuild -scheme App -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 16' build
```

## Architecture

### Web Mode
- Uses Vite dev server / Express proxy
- API calls proxied through server
- Local DB stored in browser localStorage

### Mobile Mode (Capacitor)
- Native WebView
- Direct API calls (bypasses CORS)
- Local DB stored in app documents directory
- Tokens stored in Capacitor Preferences

## Project Structure

```
zkui-frontend/
├── src/
│   ├── App.jsx           # Main React application
│   ├── authService.js   # Azure AD authentication
│   ├── configService.js # App configuration
│   └── services/
│       ├── ApiService.js    # API client (platform-aware)
│       └── LocalDbService.js # Local SQLite operations
├── android/              # Android native project
├── ios/                  # iOS native project
└── capacitor.config.json # Capacitor configuration
```

## Configuration

The app expects an `appsettings.json` at the API endpoint with:

```json
{
  "AzureAD": {
    "Authority": "https://login.microsoftonline.com/{tenant-id}",
    "ClientId": "{client-id}"
  },
  "ExposeAPI": {
    "Scope": "api://{client-id}/access_as_user"
  }
}
```

## License

MIT
