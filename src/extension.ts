// extension.ts
import * as vscode from "vscode";
import { t } from "./i18n";
import { ChatMonitor, ChatMonitorConfig } from "./chatMonitor";

let continueInterval: NodeJS.Timeout | undefined;
let isRunning = false;
let treeDataProvider: GoAutoContinueTreeProvider;
let chatMonitor: ChatMonitor;

export function activate(context: vscode.ExtensionContext) {
  console.log(t("extension.activated"));

  // Инициализируем ChatMonitor
  const monitorConfig: ChatMonitorConfig = {
    checkInterval: 5, // Проверяем каждые 5 секунд
    pauseThreshold: 10, // Пауза 10 секунд считается бездействием
    continueMessage: "continue",
    enableLogging: true,
  };

  chatMonitor = new ChatMonitor(context, monitorConfig);

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

  // Команда для запуска нового мониторинга чата
  const startMonitorCommand = vscode.commands.registerCommand(
    "goAutoContinue.startMonitor",
    () => {
      chatMonitor.start();
      treeDataProvider.refresh();
    }
  );

  const stopMonitorCommand = vscode.commands.registerCommand(
    "goAutoContinue.stopMonitor",
    () => {
      chatMonitor.stop();
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
    startMonitorCommand,
    stopMonitorCommand,
    openSettingsCommand
  );

  // Слушатель изменений настроек
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration("goAutoContinue")) {
        treeDataProvider.refresh();

        // Обновляем конфигурацию мониторинга
        const config = vscode.workspace.getConfiguration("goAutoContinue");
        const newMonitorConfig: ChatMonitorConfig = {
          checkInterval: config.get<number>("monitorInterval", 5),
          pauseThreshold: config.get<number>("pauseThreshold", 10),
          continueMessage: config.get<string>("message", "continue"),
          enableLogging: config.get<boolean>("enableLogging", true),
        };
        chatMonitor.updateConfig(newMonitorConfig);

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

    // Главная кнопка управления старого режима
    if (isRunning) {
      items.push(
        new GoAutoContinueItem(
          t("button.stop"),
          t("tooltip.stop"),
          vscode.TreeItemCollapsibleState.None,
          {
            command: "goAutoContinue.stop",
            title: t("action.stop"),
          }
        )
      );
    } else {
      items.push(
        new GoAutoContinueItem(
          t("button.start"),
          t("tooltip.start"),
          vscode.TreeItemCollapsibleState.None,
          {
            command: "goAutoContinue.start",
            title: t("action.start"),
          }
        )
      );
    }

    // Разделитель
    items.push(
      new GoAutoContinueItem(
        "── Умный мониторинг ──",
        "Новый режим мониторинга чата через workbench.action.chat.export",
        vscode.TreeItemCollapsibleState.None,
        undefined
      )
    );

    // Кнопки для нового мониторинга чата
    if (chatMonitor && chatMonitor.isActive()) {
      items.push(
        new GoAutoContinueItem(
          "🛑 Остановить мониторинг",
          `Остановить умный мониторинг чата. Статус: ${chatMonitor.getStatus()}`,
          vscode.TreeItemCollapsibleState.None,
          {
            command: "goAutoContinue.stopMonitor",
            title: "Остановить мониторинг",
          }
        )
      );
    } else {
      items.push(
        new GoAutoContinueItem(
          "🤖 Запустить мониторинг",
          "Запустить умный мониторинг чата с использованием workbench.action.chat.export",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "goAutoContinue.startMonitor",
            title: "Запустить мониторинг",
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
        t("button.settings"),
        t("tooltip.settings", intervalSeconds.toString(), message),
        vscode.TreeItemCollapsibleState.None,
        {
          command: "goAutoContinue.openSettings",
          title: t("action.openSettings"),
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
    t("message.started", message, intervalSeconds.toString())
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

  vscode.window.showInformationMessage(t("message.stopped"));
  treeDataProvider.refresh();
}

export function deactivate() {
  stopContinueMode();
  if (chatMonitor) {
    chatMonitor.dispose();
  }
  console.log(t("extension.deactivated"));
}
