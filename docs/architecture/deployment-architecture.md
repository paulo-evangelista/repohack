# Deployment Architecture

## Next.js Backend Configuration
```json
{
  "env": {
    "NODE_ENV": "production",
    "MAX_REPO_SIZE": "104857600"
  }
}
```

## Environment Variables
- `NODE_ENV`: Environment (development/production)
- `MAX_REPO_SIZE`: Maximum repository size in bytes
- `NPM_REGISTRY`: npm registry URL (optional)
- `LOG_LEVEL`: Logging verbosity

## Build & Deployment
1. **Build Process**: Next.js build with TypeScript compilation
2. **Dependency Installation**: pnpm install with production dependencies
3. **Static Assets**: Optimized CSS and JavaScript bundles
4. **Backend Processing**: Next.js API routes and server actions for scanning
5. **Deployment**: Automatic deployment on Git push to main branch
