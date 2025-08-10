// extension.ts
import * as vscode from "vscode";

let continueInterval: NodeJS.Timeout | undefined;
let isRunning = false;
let treeDataProvider: AutoContinueTreeProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log("Auto Continue extension activated");

  // Создать Tree View Provider
  treeDataProvider = new AutoContinueTreeProvider();
  vscode.window.createTreeView("autoContinueView", {
    treeDataProvider: treeDataProvider,
  });

  // Команды для управления режимом
  const startCommand = vscode.commands.registerCommand(
    "autoContinue.start",
    () => {
      startContinueMode();
      treeDataProvider.refresh();
    }
  );

  const stopCommand = vscode.commands.registerCommand(
    "autoContinue.stop",
    () => {
      stopContinueMode();
      treeDataProvider.refresh();
    }
  );

  // Команда для переключения режима
  const toggleCommand = vscode.commands.registerCommand(
    "autoContinue.toggle",
    () => {
      if (isRunning) {
        stopContinueMode();
      } else {
        startContinueMode();
      }
      treeDataProvider.refresh();
    }
  );

  context.subscriptions.push(startCommand, stopCommand, toggleCommand);
}

// Tree View Provider для боковой панели
class AutoContinueTreeProvider
  implements vscode.TreeDataProvider<AutoContinueItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    AutoContinueItem | undefined | null | void
  > = new vscode.EventEmitter<AutoContinueItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AutoContinueItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AutoContinueItem): vscode.TreeItem {
    return element;
  }

  getChildren(): AutoContinueItem[] {
    const items: AutoContinueItem[] = [];

    // Главная кнопка управления
    if (isRunning) {
      items.push(
        new AutoContinueItem(
          "🛑 ОСТАНОВИТЬ",
          "Нажмите, чтобы остановить автоматическое продолжение",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "autoContinue.stop",
            title: "Остановить",
          }
        )
      );
    } else {
      items.push(
        new AutoContinueItem(
          "🚀 ЗАПУСТИТЬ",
          "Нажмите, чтобы начать автоматическое продолжение диалога",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "autoContinue.start",
            title: "Запустить",
          }
        )
      );
    }

    // Настройки
    items.push(
      new AutoContinueItem(
        "⚙️ Настройки",
        "Интервал: 10 секунд",
        vscode.TreeItemCollapsibleState.None
      )
    );

    return items;
  }
}

class AutoContinueItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
    this.command = command;
  }
}

function startContinueMode() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  continueInterval = setInterval(() => {
    vscode.commands.executeCommand(
      "workbench.action.chat.open",
      "расскажи еще"
    );
  }, 10000); // 10 секунд

  vscode.window.showInformationMessage("Auto Continue mode started!");
  treeDataProvider.refresh();
}

function stopContinueMode() {
  if (!isRunning) {
    return;
  }

  isRunning = false;
  if (continueInterval) {
    clearInterval(continueInterval);
    continueInterval = undefined;
  }

  vscode.window.showInformationMessage("Auto Continue mode stopped!");
  treeDataProvider.refresh();
}

export function deactivate() {
  stopContinueMode();
  console.log("Auto Continue extension deactivated");
}
