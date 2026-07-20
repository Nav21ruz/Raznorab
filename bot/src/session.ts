import type { ExpenseCategory } from './types.js'

export type WizardState =
  | { step: 'expense_category' }
  | { step: 'expense_details'; category: ExpenseCategory }
  | {
      step: 'expense_confirm'
      amount: number
      category: ExpenseCategory
      description: string | null
      date: string
    }
  | { step: 'shift_worker' }
  | { step: 'shift_details'; workerName: string }
  | {
      step: 'shift_confirm'
      workerName: string
      amount: number
      hours: number | null
      date: string
    }
  | { step: 'switch_object' }

// В памяти процесса: состояние мастера ввода теряется при рестарте бота,
// что приемлемо — пользователь просто начинает шаг заново.
const wizards = new Map<number, WizardState>()

export function getWizard(chatId: number): WizardState | undefined {
  return wizards.get(chatId)
}

export function setWizard(chatId: number, state: WizardState): void {
  wizards.set(chatId, state)
}

export function clearWizard(chatId: number): void {
  wizards.delete(chatId)
}
