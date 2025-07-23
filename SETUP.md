# Quick Setup Guide

## Prerequisites
- Node.js 18.0.0 or higher
- A Discord application and bot token

## Setup Instructions

### 1. Environment Configuration
```bash
# Copy environment template
npm run setup
# OR manually:
cp .env.example .env
```

### 2. Required Configuration
Edit the `.env` file and set these required values:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
OWNER_IDS=your_discord_user_id
```

### 3. Getting Discord Values

#### Bot Token:
1. Go to https://discord.com/developers/applications
2. Create a new application or select existing one
3. Go to "Bot" section
4. Copy the token (keep this secret!)

#### Client ID:
1. In the same application
2. Go to "General Information"
3. Copy the "Application ID"

#### Your User ID:
1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click your username and select "Copy User ID"

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Bot
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

### 6. Invite Bot to Server
1. Go to https://discord.com/developers/applications
2. Select your application
3. Go to "OAuth2" > "URL Generator"
4. Select scopes: `bot` and `applications.commands`
5. Select permissions based on your needs
6. Use the generated URL to invite the bot

## Optional Configuration

### Channel IDs (for logging)
- `ERROR_CHANNEL_ID` - Where error logs are sent
- `LOG_CHANNEL_ID` - Where command usage is logged  
- `BACKUP_CHANNEL_ID` - Where database backups are sent

### Feature Flags
- `BACKUP_ENABLED=false` - Disable database backups

### Development Settings
- `NODE_ENV=production` - Set for production deployment
- `DEBUG=false` - Disable debug logging in production

## Troubleshooting

### Bot won't start
- Check that `DISCORD_TOKEN` and `CLIENT_ID` are correct
- Ensure Node.js version is 18.0.0 or higher
- Verify all required environment variables are set

### Commands not working
- Run `!updateslash` (owner only) to register slash commands
- Check bot permissions in the server
- Verify the bot has the necessary intents

### Need help?
- Check the full documentation in `docs/`
- Review the configuration in `src/config/config.js`
- Check logs for error messages