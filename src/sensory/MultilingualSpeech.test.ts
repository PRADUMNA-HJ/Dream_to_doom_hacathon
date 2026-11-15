import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SUPPORTED_LANGUAGES } from './types/speech.types';
import { speechController } from './SpeechController';

describe('Multilingual Speech Recognition Configuration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('contains all required languages with valid codes and native labels', () => {
    const languageCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(languageCodes).toContain('en-US');
    expect(languageCodes).toContain('ta-IN');
    expect(languageCodes).toContain('kn-IN');
    expect(languageCodes).toContain('te-IN');
    expect(languageCodes).toContain('mr-IN');
    expect(languageCodes).toContain('bn-IN');
    expect(languageCodes).toContain('ml-IN');
    expect(languageCodes).toContain('hi-IN');

    // Ensure every language option has non-empty labels
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(lang.code).toBeTruthy();
      expect(lang.label).toBeTruthy();
      expect(lang.nativeLabel).toBeTruthy();
    });
  });

  it('verifies Kannada, Telugu, Marathi, Bengali, Malayalam specific configurations', () => {
    const kannada = SUPPORTED_LANGUAGES.find((l) => l.code === 'kn-IN');
    expect(kannada).toBeDefined();
    expect(kannada?.label).toBe('Kannada (India)');
    expect(kannada?.nativeLabel).toBe('ಕನ್ನಡ (ಭಾರತ)');

    const telugu = SUPPORTED_LANGUAGES.find((l) => l.code === 'te-IN');
    expect(telugu).toBeDefined();
    expect(telugu?.label).toBe('Telugu (India)');
    expect(telugu?.nativeLabel).toBe('తెలుగు (భారతదేశం)');

    const marathi = SUPPORTED_LANGUAGES.find((l) => l.code === 'mr-IN');
    expect(marathi).toBeDefined();
    expect(marathi?.label).toBe('Marathi (India)');
    expect(marathi?.nativeLabel).toBe('मराठी (भारत)');

    const bengali = SUPPORTED_LANGUAGES.find((l) => l.code === 'bn-IN');
    expect(bengali).toBeDefined();
    expect(bengali?.label).toBe('Bengali (India)');
    expect(bengali?.nativeLabel).toBe('বাংলা (ভারত)');

    const malayalam = SUPPORTED_LANGUAGES.find((l) => l.code === 'ml-IN');
    expect(malayalam).toBeDefined();
    expect(malayalam?.label).toBe('Malayalam (India)');
    expect(malayalam?.nativeLabel).toBe('മലയാളം (ഇന്ത്യ)');
  });

  it('allows switching language dynamically on speechController', () => {
    speechController.setLanguage('kn-IN');
    expect(speechController.getLanguage()).toBe('kn-IN');

    speechController.setLanguage('te-IN');
    expect(speechController.getLanguage()).toBe('te-IN');

    speechController.setLanguage('mr-IN');
    expect(speechController.getLanguage()).toBe('mr-IN');

    speechController.setLanguage('bn-IN');
    expect(speechController.getLanguage()).toBe('bn-IN');

    speechController.setLanguage('ml-IN');
    expect(speechController.getLanguage()).toBe('ml-IN');

    speechController.setLanguage('en-US');
    expect(speechController.getLanguage()).toBe('en-US');
  });
});
