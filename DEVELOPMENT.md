# Development Guide - VPN Exit Controller Raycast Extension

This guide is for developers who want to contribute to or customize the VPN Exit Controller Raycast extension.

## Table of Contents
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [API Integration](#api-integration)
- [Adding New Features](#adding-new-features)
- [Release Process](#release-process)
- [Contributing](#contributing)

## Development Setup

### Prerequisites
- Node.js 22.14.0 or higher
- npm 7.0 or higher
- Git
- macOS with Raycast (for testing)
- Visual Studio Code (recommended)

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone git@gitea.rbnk.uk:admin/vpn-controller-raycast.git
   cd vpn-controller-raycast
   ```

2. **Install dependencies**:
   ```bash
   npm install
   
   # Install CLI dependencies
   cd cli && npm install && cd ..
   ```

3. **Set up development environment**:
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Configure your local settings
   vpn-raycast config
   ```

4. **Install VS Code extensions** (recommended):
   - ESLint
   - Prettier
   - TypeScript and JavaScript Language Features
   - Raycast (official extension)

## Project Structure

```
vpn-exit-controller-raycast/
├── src/                      # Extension source code
│   ├── index.tsx            # Main command - VPN Control Center
│   ├── manage-nodes.tsx     # Active nodes management
│   ├── quick-toggle.tsx     # Quick toggle command
│   ├── proxy-info.tsx       # Proxy information display
│   ├── api/                 # API integration
│   │   ├── client.ts        # API client with authentication
│   │   └── types.ts         # TypeScript interfaces
│   ├── components/          # Reusable React components
│   │   ├── StatusBadge.tsx
│   │   └── LoadingView.tsx
│   └── utils/               # Utility functions
│       ├── countries.ts     # Country data and helpers
│       └── storage.ts       # Local storage utilities
├── cli/                     # CLI helper tool
│   ├── index.js            # CLI entry point
│   └── commands/           # CLI commands
├── scripts/                 # Build and release scripts
├── assets/                  # Icons and static resources
├── tests/                   # Test files
├── package.json            # Project configuration
└── tsconfig.json           # TypeScript configuration
```

## Development Workflow

### Running in Development Mode

```bash
# Start development with hot reload
npm run dev

# This will:
# 1. Build the extension
# 2. Watch for file changes
# 3. Automatically rebuild on changes
# 4. Show errors in the terminal
```

### Testing Changes

1. **In Raycast**:
   - Changes reflect immediately with hot reload
   - Press `⌘R` to manually refresh if needed
   - Check Developer Tools: `⌘⌥I`

2. **CLI Testing**:
   ```bash
   # Test CLI commands directly
   ./cli/index.js status
   ./cli/index.js config --show
   ```

### Debugging

1. **Enable debug mode**:
   ```bash
   export DEBUG=vpn-raycast:*
   npm run dev
   ```

2. **VS Code debugging**:
   - Use the included `.vscode/launch.json`
   - Set breakpoints in TypeScript files
   - Press F5 to start debugging

3. **Console logging**:
   ```typescript
   if (environment.isDevelopment) {
     console.log('Debug info:', data);
   }
   ```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Test API integration
npm run test:api

# Test with real API (requires config)
API_URL=https://vpn.rbnk.uk npm run test:integration
```

### Manual Testing Checklist

Before submitting changes, test:
- [ ] All commands load without errors
- [ ] API authentication works
- [ ] Error states are handled gracefully
- [ ] Loading states appear correctly
- [ ] Keyboard shortcuts function
- [ ] Memory usage is reasonable
- [ ] No TypeScript errors: `npm run typecheck`

## Code Style

### TypeScript Guidelines

```typescript
// Use explicit types for function parameters
function startNode(countryCode: string, server?: string): Promise<VPNNode> {
  // Implementation
}

// Use interfaces for complex types
interface NodeMetrics {
  cpu_percent: number;
  memory_mb: number;
  network_rx: number;
  network_tx: number;
}

// Prefer const over let
const nodes = await api.listNodes();

// Use async/await over promises
// Good
const data = await fetchData();

// Avoid
fetchData().then(data => {});
```

### React/Raycast Components

```typescript
// Use functional components with hooks
export default function MyCommand() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Use Raycast's useCachedPromise for data fetching
  const { data, error, revalidate } = useCachedPromise(
    async () => {
      return await api.fetchData();
    },
    [],
    {
      keepPreviousData: true,
    }
  );
  
  return (
    <List isLoading={isLoading}>
      {/* Component content */}
    </List>
  );
}
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## API Integration

### Adding New API Endpoints

1. **Add types** in `src/api/types.ts`:
   ```typescript
   export interface NewFeature {
     id: string;
     name: string;
     enabled: boolean;
   }
   ```

2. **Add client method** in `src/api/client.ts`:
   ```typescript
   async getNewFeature(): Promise<NewFeature> {
     return this.request<NewFeature>('/api/new-feature');
   }
   ```

3. **Use in component**:
   ```typescript
   const { data: feature } = useCachedPromise(
     () => api.getNewFeature(),
     []
   );
   ```

### Error Handling

```typescript
try {
  const result = await api.someMethod();
} catch (error) {
  await showToast({
    style: Toast.Style.Failure,
    title: "Operation Failed",
    message: error instanceof Error ? error.message : "Unknown error",
  });
}
```

## Adding New Features

### Creating a New Command

1. **Create command file** `src/my-new-command.tsx`:
   ```typescript
   import { List } from "@raycast/api";
   
   export default function MyNewCommand() {
     return (
       <List>
         <List.Item title="Hello World" />
       </List>
     );
   }
   ```

2. **Register in package.json**:
   ```json
   {
     "commands": [
       {
         "name": "my-new-command",
         "title": "My New Command",
         "description": "Description of the command",
         "mode": "view"
       }
     ]
   }
   ```

3. **Add keyboard shortcut** (optional):
   ```json
   {
     "preferences": {
       "name": "myCommandShortcut",
       "type": "keyboardShortcut",
       "default": "cmd+shift+m"
     }
   }
   ```

### Creating Reusable Components

```typescript
// src/components/NodeStatus.tsx
import { Color, Icon, List } from "@raycast/api";
import { VPNNode } from "../api/types";

interface NodeStatusProps {
  node: VPNNode;
}

export function NodeStatus({ node }: NodeStatusProps) {
  const color = node.status === "running" ? Color.Green : Color.Red;
  const icon = node.status === "running" ? Icon.CheckCircle : Icon.XMarkCircle;
  
  return (
    <List.Item.Accessory 
      icon={{ source: icon, tintColor: color }}
      text={node.status}
    />
  );
}
```

## Release Process

### Versioning

Follow semantic versioning (SemVer):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backwards compatible
- **Patch** (0.0.1): Bug fixes

### Creating a Release

1. **Update version**:
   ```bash
   npm version patch  # or minor, major
   ```

2. **Run release script**:
   ```bash
   export ZIPLINE_TOKEN="your_token"
   ./scripts/release.sh
   ```

3. **Push changes**:
   ```bash
   git push origin main --tags
   ```

4. **Update Homebrew**:
   ```bash
   # Automatic with release script
   # Or manually:
   ./scripts/update-homebrew.sh 1.2.3 https://url sha256
   ```

### Release Checklist

- [ ] All tests pass
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Build succeeds: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Manual testing completed

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/my-feature
   ```
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Pull Request Guidelines

- **Title**: Clear and descriptive
- **Description**: What, why, and how
- **Testing**: Describe testing performed
- **Screenshots**: For UI changes
- **Breaking changes**: Clearly marked

### Code Review Process

1. Automated checks must pass
2. At least one reviewer approval
3. Address all feedback
4. Squash commits if requested
5. Ensure branch is up to date

### Commit Message Format

```
type(scope): subject

body

footer
```

Examples:
```
feat(api): add speed test endpoint
fix(ui): correct status badge colors
docs(readme): update installation instructions
chore(deps): update dependencies
```

## Resources

### Documentation
- [Raycast API Reference](https://developers.raycast.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Hooks Guide](https://react.dev/reference/react)

### Tools
- [Raycast Extension DevTools](https://www.raycast.com/devtools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Regex101](https://regex101.com/) for regex testing

### Community
- Raycast Slack Community
- GitHub Discussions
- Stack Overflow `[raycast]` tag

---

Happy coding! If you have questions, please open an issue or reach out to the maintainers.