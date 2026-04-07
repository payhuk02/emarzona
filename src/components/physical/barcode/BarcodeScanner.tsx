/**
 * Composant Scanner de Codes-barres Mobile
 * Date: 28 Janvier 2025
 * Utilise html5-qrcode pour scanner codes-barres et QR codes
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Camera, X, CheckCircle2, AlertCircle, Loader2 } from '@/components/icons';
import { BarcodeScanResult } from '@/hooks/physical/useBarcodeScanner';
import { logger } from '@/lib/logger';

interface BarcodeScannerProps {
  onScanSuccess: (result: BarcodeScanResult) => void;
  onClose?: () => void;
  autoStop?: boolean;
  title?: string;
  description?: string;
}

export function BarcodeScanner({
  onScanSuccess,
  onClose,
  autoStop = true,
  title = 'Scanner de Code-barres',
  description = 'Scannez un code-barres ou QR code avec votre caméra',
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState<BarcodeScanResult | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Vérifier les permissions caméra
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
        setError('Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.');
      }
    };

    checkPermission();
  }, []);

  // Démarrer le scan
  const startScan = async () => {
    if (!hasPermission) {
      setError('Permission caméra requise');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const html5QrCode = new Html5Qrcode('barcode-scanner-viewfinder');
      scannerRef.current = html5QrCode;

      // Configuration pour codes-barres
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          // Codes-barres 1D
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          // QR codes
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
      };

      await html5QrCode.start(
        { facingMode: 'environment' }, // Caméra arrière sur mobile
        config,
        (decodedText, decodedResult) => {
          const  result: BarcodeScanResult = {
            code: decodedText,
            format: decodedResult.result.format?.formatName || 'UNKNOWN',
            timestamp: new Date(),
          };

          setLastScan(result);
          onScanSuccess(result);

          if (autoStop) {
            stopScan();
          }
        },
        (errorMessage) => {
          // Ignorer les erreurs de scan continu (normal pendant la recherche)
        }
      );

      setIsScanning(true);
      setIsInitializing(false);
    } catch ( _err: any) {
      setError(err.message || 'Erreur lors du démarrage du scanner');
      setIsInitializing(false);
      setIsScanning(false);
    }
  };

  // Arrêter le scan
  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        logger.error('Erreur lors de l\'arrêt du scanner', { error: err });
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Nettoyer à la fermeture
  useEffect(() => {
    return () => {
      stopScan();
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer le scanner de code-barres">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {lastScan && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-semibold">Code scanné : {lastScan.code}</p>
                <Badge variant="outline">{lastScan.format}</Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Viewfinder */}
        <div className="relative">
          <div
            id="barcode-scanner-viewfinder"
            className="w-full aspect-square bg-black rounded-lg overflow-hidden"
          />
          {!isScanning && !isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Cliquez sur "Démarrer le scan" pour activer la caméra</p>
              </div>
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScan}
              disabled={hasPermission === false || isInitializing}
              className="flex-1"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initialisation...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Démarrer le scan
                </>
              )}
            </Button>
          ) : (
            <Button onClick={stopScan} variant="destructive" className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Arrêter le scan
            </Button>
          )}
        </div>

        {hasPermission === false && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}






