import React from 'react';
import { Globe, Monitor, Moon, Sun } from 'lucide-react';
import type { UiConfig } from '../types';
import { RequirementList } from './RequirementList';
import AdminControls from './AdminControls';
import { PauseControlsWidget } from './AdminWidgets';
import { THEME_PREFERENCES, useTheme } from '../contexts/ThemeContext';
import type { ThemePreference } from '../contexts/ThemeContext';
import { useTranslation, type Language } from '../i18n/config';

const THEME_OPTIONS: Record<ThemePreference, { label: string; hint: string; Icon: typeof Sun }> = {
  light: { label: 'Light', hint: 'High-contrast light palette', Icon: Sun },
  dark: { label: 'Dark', hint: 'Default dark palette', Icon: Moon },
  system: { label: 'System', hint: 'Follow the operating system', Icon: Monitor },
};

/** Persistent light / dark / system selector backed by ThemeContext. */
const ThemeSelector: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="glass-card p-8">
      <h3 className="mb-1 text-xl font-bold">{t('settings.appearance')}</h3>
      <p className="mb-4 text-sm text-slate-400">
        {t('settings.appearanceSubtitle', { theme: resolvedTheme })}
      </p>
      <div role="radiogroup" aria-label={t('settings.theme')} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {THEME_PREFERENCES.map((preference) => {
          const { label, hint, Icon } = THEME_OPTIONS[preference];
          const selected = theme === preference;

          return (
            <button
              key={preference}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(preference)}
              className={`action-button flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-text ${
                selected
                  ? 'border-primary bg-primary/10 text-slate-100'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon size={16} aria-hidden="true" />
                {label}
              </span>
              <span className="text-xs">{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** Language switcher supporting English, Spanish, Portuguese, French, and RTL stubbed languages (Arabic, Hebrew). */
export const LanguageSelector: React.FC = () => {
  const { language, changeLanguage, isRtl, t } = useTranslation();

  const LANGUAGE_OPTIONS: { code: Language; label: string; nativeName: string; isRtl?: boolean }[] = [
    { code: 'en', label: t('language.en'), nativeName: 'English' },
    { code: 'es', label: t('language.es'), nativeName: 'Español' },
    { code: 'pt', label: t('language.pt'), nativeName: 'Português' },
    { code: 'fr', label: t('language.fr'), nativeName: 'Français' },
    { code: 'ar', label: t('language.ar'), nativeName: 'العربية', isRtl: true },
    { code: 'he', label: t('language.he'), nativeName: 'עברית', isRtl: true },
  ];

  return (
    <div className="glass-card p-8">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xl font-bold">{t('settings.language')}</h3>
        {isRtl && (
          <span
            data-testid="rtl-badge"
            className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary-text"
          >
            {t('language.rtlNotice')}
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-slate-400">
        {t('settings.languageSubtitle')}
      </p>
      <div
        role="radiogroup"
        aria-label={t('settings.language')}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {LANGUAGE_OPTIONS.map(({ code, label, nativeName, isRtl: optionRtl }) => {
          const selected = language === code;

          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${label} (${nativeName})`}
              onClick={() => changeLanguage(code)}
              className={`action-button flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-text ${
                selected
                  ? 'border-primary bg-primary/10 text-slate-100'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Globe size={16} aria-hidden="true" />
                {label}
              </span>
              <span className="text-xs text-slate-400">
                {nativeName} {optionRtl ? '(RTL)' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface SettingsViewProps {
  uiConfig: UiConfig;
  apiBaseUrl: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ uiConfig, apiBaseUrl }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <ThemeSelector />
        <LanguageSelector />
        <div className="glass-card p-8">
          <h3 className="mb-4 text-xl font-bold">{t('settings.branding')}</h3>
          <div className="space-y-6">
            <div>
              <label htmlFor="brand-name" className="mb-2 block text-sm font-medium text-slate-400">
                {t('settings.brandName')}
              </label>
              <input
                id="brand-name"
                type="text"
                value={uiConfig.brandName}
                readOnly
                aria-readonly="true"
                className="input-field w-full"
              />
            </div>
            <div>
              <label htmlFor="logo-url" className="mb-2 block text-sm font-medium text-slate-400">
                {t('settings.logoUrl')}
              </label>
              <input
                id="logo-url"
                type="text"
                value={uiConfig.logoUrl ?? t('settings.notConfigured')}
                readOnly
                aria-readonly="true"
                className="input-field w-full"
              />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="primary-color-hex" className="mb-2 block text-sm font-medium text-slate-400">
                  {t('settings.primaryColor')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={uiConfig.primaryColor}
                    readOnly
                    aria-label={`Primary color preview: ${uiConfig.primaryColor}`}
                    className="h-10 w-10 cursor-default border-0 bg-transparent"
                  />
                  <input
                    id="primary-color-hex"
                    type="text"
                    value={uiConfig.primaryColor}
                    readOnly
                    aria-readonly="true"
                    className="input-field flex-1"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="accent-color-hex" className="mb-2 block text-sm font-medium text-slate-400">
                  {t('settings.accentColor')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={uiConfig.accentColor}
                    readOnly
                    aria-label={`Accent color preview: ${uiConfig.accentColor}`}
                    className="h-10 w-10 cursor-default border-0 bg-transparent"
                  />
                  <input
                    id="accent-color-hex"
                    type="text"
                    value={uiConfig.accentColor}
                    readOnly
                    aria-readonly="true"
                    className="input-field flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <AdminControls apiBaseUrl={apiBaseUrl} />
        <PauseControlsWidget apiBaseUrl={apiBaseUrl} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RequirementList
          title="Deposit Fields"
          fields={uiConfig.fieldRequirements.deposit}
        />
        <RequirementList
          title="Withdrawal Fields"
          fields={uiConfig.fieldRequirements.withdraw}
        />
      </div>
    </div>
  );
};

export default SettingsView;
