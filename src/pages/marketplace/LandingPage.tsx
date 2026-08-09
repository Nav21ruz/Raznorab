import { useNavigate, Link } from 'react-router-dom'
import { HardHat, Users, Wrench, Search, Handshake, MessageCircle } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { isMockBackend } from '../../lib/api'

const AUDIENCES = [
  { icon: Users, title: 'Заказчик', description: 'Разместите заказ и выбирайте среди тех, кто откликнулся' },
  { icon: HardHat, title: 'Строитель', description: 'Смотрите заказы рядом и откликайтесь на подходящие' },
  { icon: Wrench, title: 'Разнорабочий', description: 'Разовые подработки — от разгрузки до уборки' },
]

const STEPS = [
  { icon: Search, title: 'Разместите заказ или найдите его', description: 'Заказчик описывает задачу, исполнитель просматривает подходящие заказы поблизости' },
  { icon: Handshake, title: 'Выберите друг друга', description: 'Заказчик смотрит отклики и выбирает исполнителя — так же просто, как пролистать карточки' },
  { icon: MessageCircle, title: 'Договоритесь в чате', description: 'После выбора открывается чат — обсудите детали и приступайте к работе' },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-bg-page">
      <div className="max-w-lg mx-auto px-4 pt-10 pb-16">
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="w-16 h-16 bg-copper-500 rounded-2xl flex items-center justify-center shadow-lg shadow-copper-500/30">
            <Handshake className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Briggo</h1>
          <p className="text-text-secondary">Заказы на стройку и разовые подработки — заказчики и исполнители находят друг друга здесь</p>
        </div>

        {isMockBackend && (
          <p className="text-center text-xs text-copper-hover bg-copper-500/10 border border-copper-500/20 rounded-xl px-3 py-2 mb-6">
            Демо-режим: можно попробовать сайт без настоящей регистрации
          </p>
        )}

        <div className="flex flex-col gap-3 mb-10">
          <Button size="lg" className="w-full justify-center" onClick={() => navigate('/auth', { state: { mode: 'register' } })}>
            Начать
          </Button>
          <button
            onClick={() => navigate('/auth', { state: { mode: 'login' } })}
            className="text-sm text-text-muted hover:text-text-secondary text-center"
          >
            Уже есть аккаунт? Войти
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-10">
          {AUDIENCES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="p-3 bg-bg-card border border-border-1 rounded-2xl text-center">
              <div className="w-10 h-10 bg-border-1 rounded-xl flex items-center justify-center mx-auto mb-2.5">
                <Icon className="w-5 h-5 text-copper-hover" />
              </div>
              <p className="font-semibold text-text-primary text-sm mb-1">{title}</p>
              <p className="text-xs text-text-muted leading-snug">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide text-center">Как это работает</h2>
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-bg-card border border-border-1 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-copper-hover" />
              </div>
              <div className="min-w-0 pt-1">
                <p className="font-medium text-text-primary text-sm">{i + 1}. {title}</p>
                <p className="text-sm text-text-muted mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-text-muted text-center mt-12">
          <Link to="/terms" className="hover:text-text-muted">Пользовательское соглашение</Link>
          {' · '}
          <Link to="/privacy" className="hover:text-text-muted">Политика конфиденциальности</Link>
        </p>
      </div>
    </div>
  )
}
