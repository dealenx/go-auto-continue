// chatMonitor.ts
import * as vscode from "vscode";

export interface ChatMonitorConfig {
  /** Интервал проверки изменений в чате в секундах */
  checkInterval: number;
  /** Время ожидания без изменений перед отправкой сообщения в секундах */
  pauseThreshold: number;
  /** Сообщение для отправки при обнаружении паузы */
  continueMessage: string;
  /** Включить детальное логирование */
  enableLogging: boolean;
}

export class ChatMonitor {
  private checkInterval?: NodeJS.Timeout;
  private lastChatContent?: string;
  private lastChangeTime: number = Date.now();
  private isMonitoring = false;
  private config: ChatMonitorConfig;

  constructor(
    private context: vscode.ExtensionContext,
    config: ChatMonitorConfig
  ) {
    this.config = config;
  }

  private log(message: string) {
    if (this.config.enableLogging) {
      console.log(`[ChatMonitor] ${message}`);
    }
  }

  public start(): void {
    if (this.isMonitoring) {
      this.log("Мониторинг уже запущен");
      return;
    }

    this.isMonitoring = true;
    this.lastChangeTime = Date.now();
    this.lastChatContent = undefined;

    this.log(
      `Запуск мониторинга чата. Интервал проверки: ${this.config.checkInterval}с, порог паузы: ${this.config.pauseThreshold}с`
    );

    this.checkInterval = setInterval(() => {
      this.checkChatChanges();
    }, this.config.checkInterval * 1000);

    vscode.window.showInformationMessage("🤖 Мониторинг чата запущен");
  }

  public stop(): void {
    if (!this.isMonitoring) {
      this.log("Мониторинг уже остановлен");
      return;
    }

    this.isMonitoring = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    this.log("Мониторинг чата остановлен");
    vscode.window.showInformationMessage("🛑 Мониторинг чата остановлен");
  }

  public updateConfig(newConfig: ChatMonitorConfig): void {
    const wasMonitoring = this.isMonitoring;

    if (wasMonitoring) {
      this.stop();
    }

    this.config = newConfig;

    if (wasMonitoring) {
      this.start();
    }

    this.log("Конфигурация обновлена");
  }

  private async checkChatChanges(): Promise<void> {
    try {
      // Пытаемся экспортировать чат в память, используя временный файл
      const tempUri = vscode.Uri.file(
        this.context.globalStorageUri?.fsPath + "/temp-chat-export.json" ||
          "/tmp/temp-chat-export.json"
      );

      // Используем новую функциональность workbench.action.chat.export с путем
      await vscode.commands.executeCommand(
        "workbench.action.chat.export",
        tempUri
      );

      // Читаем содержимое через VS Code API
      try {
        const fileData = await vscode.workspace.fs.readFile(tempUri);
        const chatContent = Buffer.from(fileData).toString("utf8");

        this.log(
          `Проверка изменений чата. Размер: ${chatContent.length} символов`
        );

        if (this.lastChatContent === undefined) {
          // Первая проверка
          this.lastChatContent = chatContent;
          this.lastChangeTime = Date.now();
          this.log("Первоначальное состояние чата зафиксировано");
          return;
        }

        if (this.lastChatContent !== chatContent) {
          // Чат изменился
          this.lastChatContent = chatContent;
          this.lastChangeTime = Date.now();
          this.log("Обнаружены изменения в чате");
          return;
        }

        // Чат не изменился, проверяем время паузы
        const timeSinceLastChange = (Date.now() - this.lastChangeTime) / 1000;
        this.log(`Чат не изменился уже ${timeSinceLastChange.toFixed(1)}с`);

        if (timeSinceLastChange >= this.config.pauseThreshold) {
          this.log(
            `Пауза превысила порог (${this.config.pauseThreshold}с), отправляем сообщение`
          );
          await this.sendContinueMessage();
          // Сбрасываем таймер, чтобы не спамить
          this.lastChangeTime = Date.now();
        }

        // Удаляем временный файл
        try {
          await vscode.workspace.fs.delete(tempUri);
        } catch (deleteError) {
          // Игнорируем ошибки удаления
        }
      } catch (readError) {
        this.log(`Не удалось прочитать экспортированный файл: ${readError}`);
        // Возможно, чат не активен или экспорт не сработал
      }
    } catch (error) {
      this.log(`Ошибка при проверке изменений чата: ${error}`);

      // Если команда не поддерживается, показываем предупреждение
      if (
        error instanceof Error &&
        (error.message.includes("command") ||
          error.message.includes("not found"))
      ) {
        vscode.window.showWarningMessage(
          "⚠️ Команда workbench.action.chat.export не поддерживается в этой версии VS Code. Обновите VS Code до последней версии (1.95+)."
        );
        this.stop();
      }
    }
  }

  private async sendContinueMessage(): Promise<void> {
    try {
      this.log(`Отправка сообщения: "${this.config.continueMessage}"`);
      await vscode.commands.executeCommand(
        "workbench.action.chat.open",
        this.config.continueMessage
      );

      vscode.window.showInformationMessage(
        `💬 Отправлено сообщение в чат: "${this.config.continueMessage}"`
      );
    } catch (error) {
      this.log(`Ошибка при отправке сообщения: ${error}`);
    }
  }

  public isActive(): boolean {
    return this.isMonitoring;
  }

  public getStatus(): string {
    if (!this.isMonitoring) {
      return "Остановлен";
    }

    const timeSinceLastChange = (Date.now() - this.lastChangeTime) / 1000;
    return `Активен (${timeSinceLastChange.toFixed(
      0
    )}с с последнего изменения)`;
  }

  public dispose(): void {
    this.stop();
  }
}
