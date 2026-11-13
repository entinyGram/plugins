import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    'reg-date': {
      entry: 'src/index.ts',
      manifest: {
        id: 'entinygram.reg-date',
        name: 'Registration Date',
        author: 'entinyGram',
        version: '1.0.0',
        description: {
          en: 'Deprecated. Estimated account registration date in the profile menu',
          uk: 'Застарілий. Орієнтовна дата реєстрації акаунта в меню профілю',
          ru: 'Устарел. Примерная дата регистрации аккаунта в меню профиля',
        },
        icon: 'inu://settings',
        grants: [],
        extra: { 'entiny-tags': 'chat tools' },
      },
    },
  },
})
