// extension.ts
import * as vscode from "vscode";

let continueInterval: NodeJS.Timeout | undefined;
let isRunning = false;
let treeDataProvider: AutoContinueTreeProvider;
let messageCount = 0;
let startTime: Date | undefined;

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

    // Статус с дополнительной информацией
    if (isRunning && startTime) {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;

      items.push(
        new AutoContinueItem(
          "🟢 РАБОТАЕТ",
          `Время работы: ${minutes}м ${seconds}с | Отправлено сообщений: ${messageCount}`,
          vscode.TreeItemCollapsibleState.None
        )
      );
    } else {
      items.push(
        new AutoContinueItem(
          "⭕ ОСТАНОВЛЕН",
          "Нажмите 'ЗАПУСТИТЬ' чтобы начать",
          vscode.TreeItemCollapsibleState.None
        )
      );
    }

    // Крупный статус с цветной индикацией
    items.push(
      new AutoContinueItem(
        isRunning ? "🟢 АКТИВЕН" : "⭕ ОСТАНОВЛЕН",
        isRunning
          ? "Автоматическое продолжение диалога работает"
          : "Автоматическое продолжение диалога остановлено",
        vscode.TreeItemCollapsibleState.None
      )
    );

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

    // Настройки (будущее улучшение)
    items.push(
      new AutoContinueItem(
        "⚙️ Настройки",
        "Интервал: 10 секунд (кликните для изменения)",
        vscode.TreeItemCollapsibleState.None
      )
    );

    // Помощь
    items.push(
      new AutoContinueItem(
        "❓ Как это работает?",
        "Расширение автоматически отправляет 'continue' в чат каждые 10 секунд",
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

// Улучшенные функции с лучшей обратной связью
function startContinueMode() {
  if (isRunning) {
    vscode.window.showWarningMessage("⚠️ Авто продолжение уже запущено!");
    return;
  }

  isRunning = true;
  messageCount = 0;
  startTime = new Date();

  // Показать прогресс запуска
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "🚀 Запуск авто продолжения...",
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 50, message: "Инициализация..." });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      continueInterval = setInterval(() => {
        vscode.commands.executeCommand(
          "workbench.action.chat.open",
          "continue"
        );
        messageCount++;
        treeDataProvider.refresh(); // Обновить счетчик
      }, 10000);

      // Обновлять время каждую секунду
      setInterval(() => {
        if (isRunning) {
          treeDataProvider.refresh();
        }
      }, 1000);

      progress.report({ increment: 50, message: "Готово!" });
    }
  );

  vscode.window.showInformationMessage(
    "✅ Авто продолжение запущено! Команда 'continue' будет отправляться каждые 10 секунд.",
    "Понятно"
  );
}

function stopContinueMode() {
  if (!isRunning) {
    vscode.window.showWarningMessage("⚠️ Авто продолжение уже остановлено!");
    return;
  }

  isRunning = false;
  if (continueInterval) {
    clearInterval(continueInterval);
    continueInterval = undefined;
  }

  vscode.window.showInformationMessage(
    "🛑 Авто продолжение остановлено!",
    "Понятно"
  );
}

export function deactivate() {
  stopContinueMode();
  console.log("Auto Continue extension deactivated");
}
