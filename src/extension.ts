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

  // Команда для открытия настроек
  const openSettingsCommand = vscode.commands.registerCommand(
    "autoContinue.openSettings",
    () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "autoContinue"
      );
    }
  );

  context.subscriptions.push(
    startCommand,
    stopCommand,
    toggleCommand,
    openSettingsCommand
  );

  // Слушатель изменений настроек
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration("autoContinue")) {
        treeDataProvider.refresh();

        // Если режим запущен, перезапускаем с новыми настройками
        if (isRunning) {
          stopContinueMode();
          startContinueMode();
        }
      }
    }
  );

  context.subscriptions.push(configChangeListener);
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
    const config = vscode.workspace.getConfiguration("autoContinue");
    const intervalSeconds = config.get<number>("interval", 10);
    const message = config.get<string>("message", "расскажи еще");

    items.push(
      new AutoContinueItem(
        "⚙️ Настройки",
        `Интервал: ${intervalSeconds}с | Фраза: "${message}" | Нажмите для изменения`,
        vscode.TreeItemCollapsibleState.None,
        {
          command: "autoContinue.openSettings",
          title: "Открыть настройки",
        }
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

  // Получаем настройки
  const config = vscode.workspace.getConfiguration("autoContinue");
  const intervalSeconds = config.get<number>("interval", 10);
  const message = config.get<string>("message", "расскажи еще");

  isRunning = true;
  continueInterval = setInterval(() => {
    vscode.commands.executeCommand("workbench.action.chat.open", message);
  }, intervalSeconds * 1000); // Конвертируем секунды в миллисекунды

  vscode.window.showInformationMessage(
    `🚀 Auto Continue запущен! Фраза "${message}" будет отправляться каждые ${intervalSeconds} секунд.`
  );
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
