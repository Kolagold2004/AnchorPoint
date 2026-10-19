import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsView, { LanguageSelector } from './SettingsView';
import { I18nProvider } from '../i18n/config';
import { ThemeProvider } from '../contexts/ThemeContext';
import type { UiConfig } from '../types';

const mockUiConfig: UiConfig = {
  brandName: 'TestAnchor',
  primaryColor: '#3b82f6',
  accentColor: '#10b981',
  supportEmail: 'support@example.com',
  fieldRequirements: {
    deposit: [{ key: 'amount', label: 'Amount', required: true }],
    withdraw: [{ key: 'iban', label: 'IBAN', required: true }],
    kyc: [],
  },
};

describe('SettingsView and LanguageSelector', () => {
  beforeEach(() => {
    document.documentElement.dir = 'ltr';
    vi.restoreAllMocks();
  });

  it('renders LanguageSelector with available language choices', () => {
    render(
      <I18nProvider>
        <ThemeProvider>
          <LanguageSelector />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Language' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /English/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Español/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /العربية/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /עברית/ })).toBeTruthy();
  });

  it('switches to Spanish in settings', () => {
    render(
      <I18nProvider>
        <ThemeProvider>
          <LanguageSelector />
        </ThemeProvider>
      </I18nProvider>,
    );

    const spanishRadio = screen.getByRole('radio', { name: /Español/ });
    fireEvent.click(spanishRadio);

    expect(spanishRadio.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('heading', { name: 'Idioma' })).toBeTruthy();
  });

  it('activates RTL mode and displays RTL badge when Arabic is selected', () => {
    render(
      <I18nProvider>
        <ThemeProvider>
          <LanguageSelector />
        </ThemeProvider>
      </I18nProvider>,
    );

    const arabicRadio = screen.getByRole('radio', { name: /العربية/ });
    fireEvent.click(arabicRadio);

    expect(arabicRadio.getAttribute('aria-checked')).toBe('true');
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByTestId('rtl-badge')).toBeTruthy();
  });

  it('renders complete SettingsView with branding configuration', () => {
    render(
      <I18nProvider>
        <ThemeProvider>
          <SettingsView uiConfig={mockUiConfig} apiBaseUrl="http://localhost:3002" />
        </ThemeProvider>
      </I18nProvider>,
    );

    expect(screen.getByDisplayValue('TestAnchor')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Appearance' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Language' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Branding Configuration' })).toBeTruthy();
  });
});
