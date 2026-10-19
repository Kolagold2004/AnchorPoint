import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider, useTranslation, isRtlLanguage } from './config';

const LocaleSwitcherProbe = () => {
  const { t, language, changeLanguage, direction, isRtl } = useTranslation();

  return (
    <div>
      <span data-testid="current-language">{language}</span>
      <span data-testid="current-direction">{direction}</span>
      <span data-testid="is-rtl">{String(isRtl)}</span>
      <p data-testid="deposit-submit">{t('deposit.submit')}</p>
      <p data-testid="kyc-title">{t('kyc.title')}</p>
      <p data-testid="staking-title">{t('staking.title')}</p>
      <p data-testid="settings-language">{t('settings.language')}</p>
      <p data-testid="interpolated">{t('deposit.errors.summary', { count: 2, s: 's' })}</p>
      <button type="button" onClick={() => changeLanguage('es')}>
        Español
      </button>
      <button type="button" onClick={() => changeLanguage('fr')}>
        Français
      </button>
      <button type="button" onClick={() => changeLanguage('ar')}>
        العربية
      </button>
      <button type="button" onClick={() => changeLanguage('he')}>
        עברית
      </button>
      <button type="button" onClick={() => changeLanguage('en')}>
        English
      </button>
    </div>
  );
};

describe('i18n locale switching and RTL support', () => {
  it('renders English by default with LTR direction', () => {
    render(
      <I18nProvider>
        <LocaleSwitcherProbe />
      </I18nProvider>,
    );

    expect(screen.getByTestId('current-language').textContent).toBe('en');
    expect(screen.getByTestId('current-direction').textContent).toBe('ltr');
    expect(screen.getByTestId('is-rtl').textContent).toBe('false');
    expect(screen.getByTestId('deposit-submit').textContent).toBe('Continue to Verification');
    expect(screen.getByTestId('kyc-title').textContent).toBe('Customer Details');
    expect(screen.getByTestId('staking-title').textContent).toBe('Live Staking Position');
    expect(screen.getByTestId('settings-language').textContent).toBe('Language');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('switches user-facing text when the locale changes to Spanish and French', () => {
    render(
      <I18nProvider>
        <LocaleSwitcherProbe />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getByTestId('current-language').textContent).toBe('es');
    expect(screen.getByTestId('current-direction').textContent).toBe('ltr');
    expect(screen.getByTestId('is-rtl').textContent).toBe('false');
    expect(screen.getByTestId('deposit-submit').textContent).toBe('Continuar a la verificación');
    expect(screen.getByTestId('kyc-title').textContent).toBe('Datos del cliente');
    expect(screen.getByTestId('staking-title').textContent).toBe('Posición de Staking en Tiempo Real');
    expect(screen.getByTestId('settings-language').textContent).toBe('Idioma');

    fireEvent.click(screen.getByRole('button', { name: 'Français' }));

    expect(screen.getByTestId('current-language').textContent).toBe('fr');
    expect(screen.getByTestId('deposit-submit').textContent).toBe('Continuer vers la vérification');
    expect(screen.getByTestId('kyc-title').textContent).toBe('Coordonnées du client');
  });

  it('switches to RTL direction when Arabic or Hebrew is selected', () => {
    render(
      <I18nProvider>
        <LocaleSwitcherProbe />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'العربية' }));

    expect(screen.getByTestId('current-language').textContent).toBe('ar');
    expect(screen.getByTestId('current-direction').textContent).toBe('rtl');
    expect(screen.getByTestId('is-rtl').textContent).toBe('true');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.getAttribute('data-direction')).toBe('rtl');

    fireEvent.click(screen.getByRole('button', { name: 'עברית' }));

    expect(screen.getByTestId('current-language').textContent).toBe('he');
    expect(screen.getByTestId('current-direction').textContent).toBe('rtl');
    expect(screen.getByTestId('is-rtl').textContent).toBe('true');
    expect(document.documentElement.dir).toBe('rtl');

    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(screen.getByTestId('current-language').textContent).toBe('en');
    expect(screen.getByTestId('current-direction').textContent).toBe('ltr');
    expect(screen.getByTestId('is-rtl').textContent).toBe('false');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('correctly identifies RTL languages helper', () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('he')).toBe(true);
    expect(isRtlLanguage('en')).toBe(false);
    expect(isRtlLanguage('es')).toBe(false);
    expect(isRtlLanguage('pt')).toBe(false);
    expect(isRtlLanguage('fr')).toBe(false);
  });

  it('falls back to the key when a translation is missing in all locales', () => {
    const MissingKeyProbe = () => <p>{useTranslation().t('nav.thisKeyDoesNotExist')}</p>;

    render(
      <I18nProvider>
        <MissingKeyProbe />
      </I18nProvider>,
    );

    expect(screen.getByText('nav.thisKeyDoesNotExist')).toBeTruthy();
  });

  it('interpolates parameters into translated templates', () => {
    render(
      <I18nProvider>
        <LocaleSwitcherProbe />
      </I18nProvider>,
    );

    expect(screen.getByTestId('interpolated').textContent).toBe(
      'Please fix 2 validation errors before continuing.',
    );
  });
});
