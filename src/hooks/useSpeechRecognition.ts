/**
 * Hook useSpeechRecognition - Reconnaissance vocale
 * Fournit une API simple pour la reconnaissance vocale
 * 
 * @example
 * ```tsx
 * const { transcript, isListening, startListening, stopListening } = useSpeechRecognition({
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface UseSpeechRecognitionOptions {
  /**
   * Langue de reconnaissance
   * @default 'fr-FR'
   */
  language?: string;
  /**
   * Activer la reconnaissance continue
   * @default false
   */
  continuous?: boolean;
  /**
   * Activer les résultats intermédiaires
   * @default false
   */
  interimResults?: boolean;
  /**
   * Callback appelé avec le texte reconnu
   */
  onResult?: (text: string) => void;
  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Error) => void;
  /**
   * Callback appelé quand la reconnaissance démarre
   */
  onStart?: () => void;
  /**
   * Callback appelé quand la reconnaissance s'arrête
   */
  onEnd?: () => void;
}

export interface UseSpeechRecognitionReturn {
  /**
   * Texte transcrit
   */
  transcript: string;
  /**
   * Indique si la reconnaissance est en cours
   */
  isListening: boolean;
  /**
   * Indique si la reconnaissance vocale est supportée
   */
  isSupported: boolean;
  /**
   * Démarrer la reconnaissance
   */
  startListening: () => void;
  /**
   * Arrêter la reconnaissance
   */
  stopListening: () => void;
  /**
   * Réinitialiser la transcription
   */
  reset: () => void;
}

/**
 * Hook pour gérer la reconnaissance vocale
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    language = 'fr-FR',
    continuous = false,
    interimResults = false,
    onResult,
    onError,
    onStart,
    onEnd,
  } = options;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Vérifier le support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => {
        setIsListening(true);
        onStart?.();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let  finalTranscript= '';
        let  interimTranscript= '';

        for (let  i= event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const newTranscript = finalTranscript || interimTranscript;
        setTranscript((prev) => prev + newTranscript);
        onResult?.(newTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        logger.error('Speech recognition error', { error: event.error });
        setIsListening(false);
        onError?.(new Error(event.error));
      };

      recognition.onend = () => {
        setIsListening(false);
        onEnd?.();
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, onResult, onError, onStart, onEnd]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current || isListening) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      logger.error('Error starting speech recognition', { error });
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      logger.error('Error stopping speech recognition', { error });
    }
  }, [isListening]);

  const reset = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    reset,
  };
}







