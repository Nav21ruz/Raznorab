import { useState } from 'react'
import { Send, Copy, Check, Unlink, MessageCircleMore } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '../components/shared/Navbar'
import { Button } from '../components/shared/Button'
import { Spinner } from '../components/shared/Spinner'
import { useTelegramLink, useCreateLinkCode, useUnlinkTelegram } from '../hooks/useTelegramLink'

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined

export function TelegramPage() {
  const { data: link, isLoading } = useTelegramLink()
  const { mutateAsync: createCode, data: codeData, isPending } = useCreateLinkCode()
  const { mutateAsync: unlink, isPending: unlinking } = useUnlinkTelegram()
  const [copied, setCopied] = useState(false)

  const deepLink = codeData && BOT_USERNAME ? `https://t.me/${BOT_USERNAME}?start=${codeData.code}` : null

  const copyCode = () => {
    if (!codeData) return
    navigator.clipboard.writeText(codeData.code)
    setCopied(true)
    toast.success('Код скопирован')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Telegram-бот</h1>
          <p className="text-sm text-gray-500 mt-1">Учёт расходов и смен прямо из чата</p>
        </div>

        {isLoading && <Spinner className="mt-12" />}

        {!isLoading && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            {link ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center">
                  <MessageCircleMore className="w-7 h-7 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-100">Telegram привязан</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Отправляйте расходы и смены в бота — они появятся на сайте
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  loading={unlinking}
                  onClick={async () => {
                    await unlink(link.id)
                    toast.success('Telegram отвязан')
                  }}
                >
                  <Unlink className="w-4 h-4" /> Отвязать аккаунт
                </Button>
              </div>
            ) : codeData ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <p className="text-sm text-gray-400">Код действителен 10 минут</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold tracking-[0.3em] text-orange-400 bg-gray-800 border border-gray-700 rounded-xl px-5 py-3">
                    {codeData.code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-400 hover:text-gray-200 transition-all"
                    title="Скопировать"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {deepLink ? (
                  <a href={deepLink} target="_blank" rel="noreferrer" className="w-full">
                    <Button className="w-full justify-center">
                      <Send className="w-4 h-4" /> Открыть бота в Telegram
                    </Button>
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">
                    Откройте бота в Telegram и отправьте команду <code className="text-orange-400">/link {codeData.code}</code>
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center">
                  <Send className="w-6 h-6 text-orange-400" />
                </div>
                <p className="text-sm text-gray-400 max-w-xs">
                  Привяжите Telegram, чтобы добавлять расходы и смены сообщениями прямо из чата с ботом
                </p>
                <Button loading={isPending} onClick={() => createCode()}>
                  Получить код для привязки
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
