// This is a minimal VS Code extension that watches for trigger text and inserts predefined text
// File: extension.ts

import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("Text Trigger extension is now active");

  // Store the last known text to detect changes
  let lastText = "";

  // Define your trigger text and response
  const triggerResponses: { [key: string]: string } = {
    "!hello": "Hello there! How can I help you today?",
    "!template":
      '```typescript\nfunction example() {\n  console.log("This is a template");\n}\n```',
    "!date": new Date().toLocaleDateString(),
    "I've reached my tool call limit of 25": "continue",
    "I need to pause execution": "continue",
    "To proceed with the remaining": "continue",
    "Would you like me to continue": "Yes, please continue",
    // Add your custom triggers here
    "I've reached my tool call limit": "continue",
    "I've hit the tool call limit": "continue",
    "Tool call limit reached": "continue",
    "Maximum tool calls exceeded": "continue",
    "I've used all available tool calls": "continue",
    "Reached the maximum number of function calls": "continue",
    "Pausing execution here": "continue",
    "I'll pause here": "continue",
    "Execution paused": "continue",
    "Let me pause the execution": "continue",
    "I'm pausing the workflow": "continue",
    "To continue with the next steps": "continue",
    "Should I continue": "Yes, please continue",
    "Shall I proceed": "Yes, please proceed",
    "Continue with the next part?": "Yes, continue",
    "Ready to continue?": "Yes, continue",
    "This is a long response": "continue",
    "The response is quite lengthy": "continue",
    "Due to length constraints": "continue",
    "Given the extensive nature": "continue",
    "This requires a detailed explanation": "continue",
    "Copilot has been working on this problem for a while. It can continue to iterate, or you can send a new message to refine your prompt.":
      "continue",
    "Continue to iterate": "continue",
    "Sorry, no response was returned.": "continue",
    "Sorry, no response was returned": "continue",
  };

  // Create a function that checks the editor content
  function checkForTriggers() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const text = document.getText();

    // Only process if text has changed
    if (text === lastText) return;
    lastText = text;

    // Check for each trigger
    for (const trigger in triggerResponses) {
      if (text.includes(trigger)) {
        // Replace the trigger with the response
        editor.edit((editBuilder) => {
          // Find the trigger position
          const triggerPos = text.lastIndexOf(trigger);
          const startPos = document.positionAt(triggerPos);
          const endPos = document.positionAt(triggerPos + trigger.length);

          // Replace the trigger with the response
          editBuilder.replace(
            new vscode.Range(startPos, endPos),
            triggerResponses[trigger]
          );
        });

        // Only handle one trigger at a time
        break;
      }
    }
  }

  // Set up a timer to check for triggers periodically
  const interval = setInterval(checkForTriggers, 500);

  // Clean up when the extension is deactivated
  context.subscriptions.push({
    dispose: () => clearInterval(interval),
  });
}

export function deactivate() {
  console.log("Text Trigger extension is now deactivated");
}
