import { defineConfig } from '@inugram/cli'
import { withTags } from '@entiny/sdk'

export default defineConfig({
  plugins: {
    'reg-date': {
      entry: 'src/index.ts',
      manifest: withTags({
        id: 'entinygram.reg-date',
        name: 'Registration Date',
        author: 'entinyGram',
        version: '1.0.0',
        description: {
          en: 'Estimated account registration date in the profile menu',
          uk: 'Орієнтовна дата реєстрації акаунта в меню профілю',
          ru: 'Примерная дата регистрации аккаунта в меню профиля',
        },
        icon: 'inu://settings',
        grants: [],
      }, 'chat', 'tools'),
    },
  },
})
