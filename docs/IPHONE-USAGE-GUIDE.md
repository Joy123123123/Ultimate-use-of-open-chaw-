# iPhone/iOS Usage Guide - Multi-Agent Orchestration System

> **🤖 Also available:** [Android Usage Guide](./ANDROID-USAGE-GUIDE.md) for Android devices

## Can I Use This on iPhone for Free?

**Yes!** This project is completely free and open-source under the MIT License. You can use it on iPhone/iOS without any cost.

## Understanding What This Software Does

This is a **multi-agent orchestration system** - a TypeScript/JavaScript library that helps coordinate multiple AI agents to work together on complex tasks. Think of it as a team manager for AI assistants.

## How to Use on iPhone

### Option 1: Using a Mobile Development App (Recommended for Beginners)

You can run Node.js and TypeScript code on your iPhone using apps like:

1. **Play.js** (Paid app, but one-time purchase)
   - Download from App Store
   - Supports Node.js and npm packages
   - Can run this project directly

2. **Code App** (Free)
   - Download from App Store
   - Supports Node.js projects
   - Has built-in terminal

### Option 2: Remote Development (Best Experience)

Since this is a developer library, the best way to use it on iPhone is through remote development:

1. **Using GitHub Codespaces** (Free tier available)
   - Open the repository on GitHub in Safari
   - Click "Code" → "Codespaces" → "Create codespace"
   - This gives you a full development environment in your browser
   - Edit and run code directly from your iPhone

2. **Using Replit** (Free tier available)
   - Import the repository to Replit
   - Access via Safari on iPhone
   - Full development environment in browser

### Option 3: SSH to a Server

1. Get a free tier server (AWS, Google Cloud, etc.)
2. Use SSH apps like:
   - **Termius** (Free)
   - **Blink Shell** (Paid)
3. Clone and run the project on the server
4. Access from your iPhone terminal app

## Installation Steps (All Platforms)

### Prerequisites

You need:
- Node.js (version 14 or higher)
- npm (comes with Node.js)
- API keys for AI services (OpenAI or Anthropic Claude)

### Step 1: Clone or Download the Repository

```bash
git clone https://github.com/Joy123123123/Ultimate-use-of-open-chaw-.git
cd Ultimate-use-of-open-chaw-
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build the Project

```bash
npm run build
```

### Step 4: Set Up Your API Keys

You'll need API keys from AI providers. These have free trial options:

**OpenAI:**
- Sign up at https://platform.openai.com/
- Get free trial credits ($5-$18 depending on promotion)
- Create an API key

**Anthropic (Claude):**
- Sign up at https://console.anthropic.com/
- Get free trial credits
- Create an API key

### Step 5: Create Your First Agent

Create a file called `my-first-agent.js`:

```javascript
import { Orchestrator, ClaudeAdapter } from './dist/index.js';

// Set your API key
const apiKey = 'your-api-key-here'; // Replace with your actual key

// Create orchestrator
const orchestrator = new Orchestrator();

// Create a team with up to 2 concurrent agents
const team = orchestrator.createTeam('my-team', 2);

// Create an agent
orchestrator.createAgent('my-team', {
  id: 'assistant-1',
  name: 'My Assistant',
  capabilities: ['general']
}, new ClaudeAdapter({ apiKey }));

// Submit a simple task
orchestrator.submitTaskGraph('my-team', [
  {
    id: 'task-1',
    type: 'general',
    payload: { description: 'Say hello and introduce yourself' },
    dependencies: [],
    status: 'pending',
    priority: 10
  }
]);

// Execute
const results = await orchestrator.executeTeam('my-team');
console.log(results);
```

### Step 6: Run Your Agent

```bash
node my-first-agent.js
```

## Is It Really Free?

**The Software:** Yes, 100% free (MIT License)
- No cost to download
- No cost to use
- No limitations
- You can even modify it and sell your own version

**API Costs:** The AI providers have costs
- Both OpenAI and Anthropic offer free trial credits
- After trial, you pay only for what you use
- Typical costs: $0.002-0.03 per 1000 tokens (very affordable)
- You can use Mock adapter for testing without any API costs

### Using Without API Costs (For Learning/Testing)

```javascript
import { Orchestrator, MockAdapter } from './dist/index.js';

const orchestrator = new Orchestrator();
const team = orchestrator.createTeam('test-team', 2);

// Use Mock adapter - no API keys needed!
orchestrator.createAgent('test-team', {
  id: 'test-agent',
  name: 'Test Agent',
  capabilities: ['testing']
}, new MockAdapter(['Hello!', 'I am a mock agent', 'This is free!']));

// Test without any costs
const results = await orchestrator.executeTeam('test-team');
```

## Common Questions

### Q: Do I need a computer to use this?
A: Technically no, but it's designed for developers. The best experience is either:
- Using a mobile development app on iPhone
- Using cloud development environments (GitHub Codespaces, Replit)
- Remote connecting to a server

### Q: What can I build with this?
A: You can build:
- AI-powered chatbots with multiple specialized agents
- Automated research systems
- Code generation tools
- Task automation systems
- Complex AI workflows

### Q: Is this beginner-friendly?
A: You need basic programming knowledge (JavaScript/TypeScript). If you're new to programming:
1. Learn JavaScript basics first
2. Learn about Node.js
3. Then come back to this project

### Q: Can I use this for commercial projects?
A: Yes! The MIT License allows commercial use, modification, distribution, and private use.

## Support and Resources

- **Documentation:** See the `/docs` folder
- **Examples:** See the `/examples` folder
- **Issues:** Report problems at https://github.com/Joy123123123/Ultimate-use-of-open-chaw-/issues
- **Contributing:** See CONTRIBUTING.md

## Quick Start for iPhone Users

**Easiest Way:**

1. Open Safari on your iPhone
2. Go to https://github.com/Joy123123123/Ultimate-use-of-open-chaw-
3. Click "Code" → "Codespaces" → "Create codespace on main"
4. Wait for environment to load (1-2 minutes)
5. In the terminal, run:
   ```bash
   npm install
   npm run build
   ```
6. Create a test file and start coding!

**Cost:** GitHub Codespaces offers 60 hours/month free for personal accounts.

## License

This project is licensed under the MIT License - see LICENSE file for details.

**In simple terms:** You can do whatever you want with this code, including using it commercially, for free. No strings attached.

---

**Happy coding! 🚀**

Need help? Open an issue on GitHub or check the documentation in the `/docs` folder.
