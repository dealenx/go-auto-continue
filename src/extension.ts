// Минимальное расширение VS Code для вывода Hello World
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("Hello World 3");
}

export function deactivate() {
  console.log("Extension deactivated");
}
