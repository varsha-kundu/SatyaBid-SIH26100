import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { CarGame } from './CarGame';
import { BrandMark } from '../common/BrandMark';

export function OfflineScreen() {
  const { t } = useI18n();
  const [showGame, setShowGame] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-navy-950/97 px-6 text-white backdrop-blur-sm">
      <BrandMark size={44} />
      <div className="max-w-md text-center">
        <h2 className="font-display text-2xl font-semibold">{t('offline_title')}</h2>
        <p className="mt-2 text-sm text-white/65">{t('offline_sub')}</p>
      </div>

      {!showGame ? (
        <button
          onClick={() => setShowGame(true)}
          className="rounded-md bg-saffron-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-saffron-600"
        >
          {t('offline_play')}
        </button>
      ) : (
        <CarGame onExit={() => setShowGame(false)} />
      )}
    </div>
  );
}
