// Минимальное расширение VS Code для вывода Hello World
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("Hello World 3");

  // Показать уведомление с Hello World
  vscode.window.showInformationMessage("Hello World! 1");

  // Каждые 5 секунд показывать сообщение
  const interval = setInterval(() => {
    vscode.window.showInformationMessage("Hello World! 2");
  }, 5000);

  // Очистка таймера при деактивации
  context.subscriptions.push({
    dispose: () => clearInterval(interval),
  });
}

export function deactivate() {
  console.log("Extension deactivated");
}
