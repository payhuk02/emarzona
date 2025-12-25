/**
 * Hook useSpeechSynthesis - Synthèse vocale
 * Fournit une API simple pour la synthèse vocale (text-to-speech)
 * 
 * @example
 * ```tsx
 * const { speak, isSpeaking, stop, pause, resume } = useSpeechSynthesis({
 *   language: 'fr-FR',
 *   pitch: 1,
 *   rate: 1,
 *   volume: 1,
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface UseSpeechSynthesisOptions {
  /**
   * Langue de synthèse
   * @default 'fr-FR'
   */
  language?: string;
  /**
   * Hauteur de la voix (0.1 à 2)
   * @default 1
   */
  pitch?: number;
  /**
   * Vitesse de lecture (0.1 à 10)
   * @default 1
   */
  rate?: number;
  /**
   * Volume (0 à 1)
   * @default 1
   */
  volume?: number;
  /**
   * Voix à utiliser
   */
  voice?: SpeechSynthesisVoice | null;
  /**
   * Callback appelé quand la lecture démarre
   */
  onStart?: () => void;
  /**
   * Callback appelé quand la lecture se termine
   */
  onEnd?: () => void;
  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Error) => void;
}

export interface UseSpeechSynthesisReturn {
  /**
   * Indique si la synthèse vocale est en cours
   */
  isSpeaking: boolean;
  /**
   * Indique si la synthèse vocale est supportée
   */
  isSupported: boolean;
  /**
   * Liste des voix disponibles
   */
  voices: SpeechSynthesisVoice[];
  /**
   * Lire un texte
   */
  speak: (text: string) => void;
  /**
   * Arrêter la lecture
   */
  stop: () => void;
  /**
   * Mettre en pause la lecture
   */
  pause: () => void;
  /**
   * Reprendre la lecture
   */
  resume: () => void;
}

/**
 * Hook pour gérer la synthèse vocale
 */
export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const {
    language = 'fr-FR',
    pitch = 1,
    rate = 1,
    volume = 1,
    voice,
    onStart,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Vérifier le support et charger les voix
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);

    if (supported) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      // Arrêter toute lecture en cours
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.volume = volume;

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        logger.error('Speech synthesis error', { error: event.error });
        onError?.(new Error(event.error));
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, language, pitch, rate, volume, voice, onStart, onEnd, onError]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    window.speechSynthesis.pause();
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    window.speechSynthesis.resume();
  }, [isSupported, isSpeaking]);

  return {
    isSpeaking,
    isSupported,
    voices,
    speak,
    stop,
    pause,
    resume,
  };
}

