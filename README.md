# Разнораб

Журнал стройобъекта: объекты, ежедневные записи, фото, PDF-отчёты, шаринг — плюс учёт расходов и выплат рабочим, в том числе через Telegram-бота.

## Учёт расходов и смен

- В карточке объекта появился блок «Финансы»: расходы (материалы/инструменты/транспорт/…) и смены рабочих с суммой, статусом оплаты и итогами.
- Всё то же самое можно вести из Telegram: кнопками или обычным текстом («купил цемент 5 мешков за 4500») — сообщение разбирает Claude. См. [`bot/README.md`](./bot/README.md).
- Перед использованием выполните обновлённый `supabase/schema.sql` в SQL Editor вашего проекта — он добавляет таблицы `expenses`, `shifts`, `telegram_links`, `telegram_link_codes` к уже существующим.
- Чтобы привязать бота, зайдите в приложении в раздел «Telegram» и получите код; для кнопки мгновенного перехода в бота задайте `VITE_TELEGRAM_BOT_USERNAME` в `.env` (см. `.env.example`).

## Стек

React + TypeScript + Vite, Supabase (Postgres/Auth/Storage), деплой веб-части на GitHub Pages. Бот — отдельный Node.js-процесс (`bot/`) на Telegraf.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
