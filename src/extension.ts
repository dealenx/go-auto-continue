// extension.ts
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("HELLLLO WORLD");
  // Команда без аргумента
  // vscode.commands.executeCommand("workbench.action.chat.open");

  vscode.commands.executeCommand("workbench.action.chat.open", "Hello");

  // Команда с промптом
  // const openChatWithPrompt = vscode.commands.registerCommand(
  //   "myext.openChatWithPrompt",
  //   async () => {
  //     const prompt = await vscode.window.showInputBox({
  //       prompt: "Введите промпт для Copilot",
  //     });
  //     if (prompt) {
  //       vscode.commands.executeCommand("workbench.action.chat.open", prompt);
  //     }
  //   }
  // );

  // context.subscriptions.push(openChat, openChatWithPrompt);
}

export function deactivate() {
  console.log("Text Trigger extension is now deactivated");
}
