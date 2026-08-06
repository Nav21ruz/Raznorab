import { useState } from 'react'
import { Wallet, Clock, User, Flag } from 'lucide-react'
import { CardShell } from './CardShell'
import { ReportModal } from './ReportModal'
import type { BuilderProfile, Profile } from '../../types/marketplace'

function formatPrice(bp: BuilderProfile) {
  if (!bp.price_from && !bp.price_to) return 'Цена по договорённости'
  if (bp.price_from && bp.price_to) return `${bp.price_from.toLocaleString('ru-RU')} – ${bp.price_to.toLocaleString('ru-RU')} ₽`
  if (bp.price_from) return `от ${bp.price_from.toLocaleString('ru-RU')} ₽`
  return `до ${bp.price_to!.toLocaleString('ru-RU')} ₽`
}

export function BuilderCandidateCard({ profile, builderProfile }: { profile: Profile; builderProfile: BuilderProfile | null }) {
  const photo = builderProfile?.portfolio_photos[0] ?? profile.photo_url
  const [showReport, setShowReport] = useState(false)

  return (
    <CardShell>
      <div className="relative h-56 bg-gray-800 flex items-center justify-center shrink-0">
        {photo ? (
          <img src={photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="w-14 h-14 text-gray-700" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-900 to-transparent" />
        <button
          type="button"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setShowReport(true) }}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-gray-950/60 backdrop-blur-sm flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
          aria-label="Пожаловаться на пользователя"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1 overflow-y-auto">
        <div>
          <h3 className="text-lg font-bold text-white leading-snug">{profile.first_name} {profile.last_name}</h3>
          {profile.city && <p className="text-sm text-gray-500">{profile.city}</p>}
        </div>

        {builderProfile && (
          <>
            <div className="flex flex-wrap gap-2">
              {builderProfile.specialties.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300">{s}</span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-orange-400" />
                {formatPrice(builderProfile)}
              </span>
              {builderProfile.experience_years !== null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  Опыт {builderProfile.experience_years} лет
                </span>
              )}
            </div>

            {builderProfile.about && (
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{builderProfile.about}</p>
            )}
          </>
        )}
      </div>

      <ReportModal open={showReport} onClose={() => setShowReport(false)} targetType="profile" targetId={profile.id} />
    </CardShell>
  )
}
