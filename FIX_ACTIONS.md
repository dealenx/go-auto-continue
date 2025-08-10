# 🔧 Исправление ошибки GitHub Actions

## ✅ Что я исправил:

1. **Добавил разрешения в workflow** - теперь Actions может создавать релизы
2. **Обновил action до версии v2** - более стабильная версия
3. **Добавил токен в правильные места** - для push и создания релизов
4. **Обновил версию до 0.0.3** - для тестирования

## 🚀 Что нужно сделать в GitHub:

### 1. Настроить разрешения Actions:
1. Идите в **Settings** → **Actions** → **General**
2. В **Workflow permissions** выберите:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Нажмите **Save**

### 2. Закоммитить изменения и создать тег:
```bash
git add .
git commit -m "fix: GitHub Actions permissions and release workflow"
git push origin main

# Создать тег для тестирования
git tag v0.0.3
git push origin v0.0.3
```

### 3. Проверить работу:
- После push тега должен автоматически запуститься workflow
- Если всё настроено правильно, создастся GitHub Release

## 🔐 Для публикации в Marketplace:
Создайте секрет `VSCE_PAT` (инструкции в `.github/RELEASE_SETUP.md`)

## 🆘 Если всё ещё не работает:
Проверьте логи в Actions и убедитесь, что:
- Разрешения настроены правильно
- Workflow имеет доступ к GITHUB_TOKEN
- Тег создан корректно (должен начинаться с 'v')
