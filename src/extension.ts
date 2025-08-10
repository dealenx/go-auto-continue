// extension.ts
import * as vscode from "vscode";

let continueInterval: NodeJS.Timeout | undefined;
let isRunning = false;
let treeDataProvider: GoAutoContinueTreeProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log("Go Auto Continue extension activated");

  // Создать Tree View Provider
  treeDataProvider = new GoAutoContinueTreeProvider();
  vscode.window.createTreeView("goAutoContinueView", {
    treeDataProvider: treeDataProvider,
  });

  // Команды для управления режимом
  const startCommand = vscode.commands.registerCommand(
    "goAutoContinue.start",
    () => {
      startContinueMode();
      treeDataProvider.refresh();
    }
  );

  const stopCommand = vscode.commands.registerCommand(
    "goAutoContinue.stop",
    () => {
      stopContinueMode();
      treeDataProvider.refresh();
    }
  );

  // Команда для переключения режима
  const toggleCommand = vscode.commands.registerCommand(
    "goAutoContinue.toggle",
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
    "goAutoContinue.openSettings",
    () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "goAutoContinue"
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
      if (event.affectsConfiguration("goAutoContinue")) {
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
class GoAutoContinueTreeProvider
  implements vscode.TreeDataProvider<GoAutoContinueItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    GoAutoContinueItem | undefined | null | void
  > = new vscode.EventEmitter<GoAutoContinueItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    GoAutoContinueItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: GoAutoContinueItem): vscode.TreeItem {
    return element;
  }

  getChildren(): GoAutoContinueItem[] {
    const items: GoAutoContinueItem[] = [];

    // Главная кнопка управления
    if (isRunning) {
      items.push(
        new GoAutoContinueItem(
          "🛑 ОСТАНОВИТЬ",
          "Нажмите, чтобы остановить автоматическое продолжение",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "goAutoContinue.stop",
            title: "Остановить",
          }
        )
      );
    } else {
      items.push(
        new GoAutoContinueItem(
          "🚀 ЗАПУСТИТЬ",
          "Нажмите, чтобы начать автоматическое продолжение диалога",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "goAutoContinue.start",
            title: "Запустить",
          }
        )
      );
    }

    // Настройки
    const config = vscode.workspace.getConfiguration("goAutoContinue");
    const intervalSeconds = config.get<number>("interval", 10);
    const message = config.get<string>("message", "continue");

    items.push(
      new GoAutoContinueItem(
        "⚙️ Настройки",
        `Интервал: ${intervalSeconds}с | Фраза: "${message}" | Нажмите для изменения`,
        vscode.TreeItemCollapsibleState.None,
        {
          command: "goAutoContinue.openSettings",
          title: "Открыть настройки",
        }
      )
    );

    return items;
  }
}

class GoAutoContinueItem extends vscode.TreeItem {
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
  const config = vscode.workspace.getConfiguration("goAutoContinue");
  const intervalSeconds = config.get<number>("interval", 10);
  const message = config.get<string>("message", "continue");

  isRunning = true;
  continueInterval = setInterval(() => {
    vscode.commands.executeCommand("workbench.action.chat.open", message);
  }, intervalSeconds * 1000); // Конвертируем секунды в миллисекунды

  vscode.window.showInformationMessage(
    `🚀 Go Auto Continue запущен! Фраза "${message}" будет отправляться каждые ${intervalSeconds} секунд.`
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

  vscode.window.showInformationMessage("Go Auto Continue mode stopped!");
  treeDataProvider.refresh();
}

export function deactivate() {
  stopContinueMode();
  console.log("Go Auto Continue extension deactivated");
}
