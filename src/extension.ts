// extension.ts
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("HELLLLO WORLD");
  // Команда без аргумента
  // vscode.commands.executeCommand("workbench.action.chat.open");

  setInterval(() => {
    vscode.commands.executeCommand("workbench.action.chat.open", "Hello");
  }, 10000);
}

export function deactivate() {
  console.log("Text Trigger extension is now deactivated");
}
