# Auto-Continue Extension for VS Code

# Quick Install Instructions for Auto-Continue Extension

1. **Download the files** from the gist (extension.ts, package.json, and README.md)

2. **Create a new VS Code extension project**:
   ```bash
   npm init vscode-extension
   # Choose TypeScript when prompted
   ```

3. **Replace the files**:
   - Replace the generated `extension.ts` with the one from the gist
   - Replace the generated `package.json` with the one from the gist
   - (Keep the README.md for reference)

4. **Install dependencies and build**:
   ```bash
   npm install
   npm run compile
   ```

5. **Test in development mode**:
   - Press F5 in VS Code to launch a new window with the extension
   - The extension will automatically detect AI pause messages and insert "continue"

6. **To install permanently**:
   ```bash
   npm install -g vsce
   vsce package
   code --install-extension text-trigger-0.0.1.vsix
   ```

That's it! Now the extension will automatically help you continue AI conversations when they hit limitations.
========================

> A lightweight VS Code/Cursor extension that automatically helps you continue AI conversations when they hit limitations or pause.

## Problem Statement

When working with AI coding assistants like Cursor, you may encounter common limitations:

- **Tool Call Limits**: Messages like "I've reached my tool call limit of 25" or "I need to pause execution"
- **Token Limitations**: When the AI needs to break up responses due to length constraints
- **Generation Pauses**: When the AI stops mid-generation and needs a prompt to continue

These interruptions disrupt your workflow, requiring manual intervention to type "continue" or similar phrases.

## Solution

This simple extension watches your editor content for specific trigger phrases (like error messages about tool call limits) and automatically inserts the text "continue" into your chat window, allowing the AI to resume operation without manual intervention.

## Installation

1. Clone this repository or create the files from scratch:
   ```bash
   git clone https://github.com/yourusername/cursor-continue-extension.git
   cd cursor-continue-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run compile
   ```

4. To test in development mode:
   - Press F5 in VS Code with this project open
   - This launches a new Extension Development Host window with the extension loaded

5. To install for regular use:
   - Package the extension: `vsce package`
   - Install the generated .vsix file: `code --install-extension text-trigger-0.0.1.vsix`

## Usage

Once installed, the extension automatically watches your editor content for trigger phrases.

### Default Triggers

| Trigger Text | Response |
|--------------|----------|
| "I've reached my tool call limit of 25" | "continue" |
| "I need to pause execution" | "continue" |
| "To proceed with the remaining" | "continue" |
| "Would you like me to continue" | "Yes, please continue" |

### How It Works

The extension:
1. Polls the active editor content every 500ms
2. Checks for any of the trigger phrases
3. When detected, automatically replaces the trigger with the corresponding response
4. The AI detects this as user input and continues its operation

### Example Scenarios

#### Cursor Tool Call Limits

When Cursor outputs:
```
I've reached my tool call limit of 25. Would you like me to continue?
```

The extension will automatically replace this with:
```
continue
```

Allowing Cursor to immediately resume execution.

#### Long Generation Splits

When the AI says:
```
This is a complex task. To proceed with the remaining steps, please let me know.
```

The extension will automatically insert "continue", prompting the AI to continue with the next part of the response.

## Customization

You can easily add your own triggers by modifying the `triggerResponses` object in `extension.ts`:

```typescript
const triggerResponses: { [key: string]: string } = {
    "I've reached my tool call limit of 25": "continue",
    "I need to pause execution": "continue",
    "To proceed with the remaining": "continue",
    "Would you like me to continue": "Yes, please continue",
    // Add your custom triggers here
    "Your custom trigger phrase": "Your custom response"
};
```

## Configuration

This extension is intentionally minimal with no external configuration. Customize by directly editing the source code.

## Limitations

- The polling approach (checking every 500ms) is simple but may miss very fast interactions
- Only works in the active editor window
- May not work with all AI interfaces depending on how they handle text input

## License

MIT

## Contributing

Pull requests welcome! This is an intentionally minimal tool that solves a specific pain point.

---

*Note: This extension is not officially affiliated with Cursor, Anthropic, or any other AI assistant provider.*