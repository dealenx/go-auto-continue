// i18n.ts
import * as vscode from 'vscode';

interface LocalizationStrings {
  'extension.activated': string;
  'extension.deactivated': string;
  'button.stop': string;
  'button.start': string;
  'button.settings': string;
  'tooltip.stop': string;
  'tooltip.start': string;
  'tooltip.settings': string;
  'message.started': string;
  'message.stopped': string;
  'action.stop': string;
  'action.start': string;
  'action.openSettings': string;
}

const en: LocalizationStrings = {
  'extension.activated': 'Go Auto Continue extension activated',
  'extension.deactivated': 'Go Auto Continue extension deactivated',
  'button.stop': '🛑 STOP',
  'button.start': '🚀 START',
  'button.settings': '⚙️ Settings',
  'tooltip.stop': 'Click to stop automatic continuation',
  'tooltip.start': 'Click to start automatic chat continuation',
  'tooltip.settings': 'Interval: {0}s | Phrase: "{1}" | Click to change',
  'message.started': '🚀 Go Auto Continue started! Phrase "{0}" will be sent every {1} seconds.',
  'message.stopped': 'Go Auto Continue mode stopped!',
  'action.stop': 'Stop',
  'action.start': 'Start',
  'action.openSettings': 'Open Settings'
};

const ru: LocalizationStrings = {
  'extension.activated': 'Расширение Go Auto Continue активировано',
  'extension.deactivated': 'Расширение Go Auto Continue деактивировано',
  'button.stop': '🛑 ОСТАНОВИТЬ',
  'button.start': '🚀 ЗАПУСТИТЬ',
  'button.settings': '⚙️ Настройки',
  'tooltip.stop': 'Нажмите, чтобы остановить автоматическое продолжение',
  'tooltip.start': 'Нажмите, чтобы начать автоматическое продолжение диалога',
  'tooltip.settings': 'Интервал: {0}с | Фраза: "{1}" | Нажмите для изменения',
  'message.started': '🚀 Go Auto Continue запущен! Фраза "{0}" будет отправляться каждые {1} секунд.',
  'message.stopped': 'Go Auto Continue остановлен!',
  'action.stop': 'Остановить',
  'action.start': 'Запустить',
  'action.openSettings': 'Открыть настройки'
};

const translations: { [key: string]: LocalizationStrings } = {
  'en': en,
  'ru': ru
};

// Получаем текущий язык из VSCode
function getCurrentLanguage(): string {
  const language = vscode.env.language;
  // Возвращаем поддерживаемый язык или английский по умолчанию
  return translations[language] ? language : 'en';
}

export function t(key: keyof LocalizationStrings, ...args: string[]): string {
  const currentLang = getCurrentLanguage();
  const strings = translations[currentLang] || translations['en'];
  let text = strings[key] || key;
  
  // Простая замена параметров {0}, {1}, etc.
  args.forEach((arg, index) => {
    text = text.replace(`{${index}}`, arg);
  });
  
  return text;
}
