/**
 * Download Protection & Security Utils
 * Date: 27 octobre 2025
 * 
 * Utilitaires de sécurité pour téléchargements
 */

import { supabase } from '@/lib/supabase';
import * as Sentry from '@sentry/react';

// =====================================================
// RATE LIMITING
// =====================================================

interface RateLimitCheck {
  allowed: boolean;
  retryAfter?: number;
  remainingAttempts?: number;
}

/**
 * Check download rate limit for a user
 */
export const checkDownloadRateLimit = async (
  userId: string,
  maxDownloadsPerHour: number = 10
): Promise<RateLimitCheck> => {
  try {
    // Get downloads from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('digital_product_downloads')
      .select('id')
      .eq('user_id', userId)
      .gte('download_date', oneHourAgo.toISOString());

    if (error) throw error;

    const downloadCount = data?.length || 0;

    if (downloadCount >= maxDownloadsPerHour) {
      return {
        allowed: false,
        retryAfter: 3600, // 1 hour in seconds
        remainingAttempts: 0,
      };
    }

    return {
      allowed: true,
      remainingAttempts: maxDownloadsPerHour - downloadCount,
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      allowed: false,
    };
  }
};

// =====================================================
// FILE INTEGRITY
// =====================================================

/**
 * Verify file integrity using hash
 */
export const verifyFileIntegrity = async (
  file: File,
  expectedHash: string
): Promise<boolean> => {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex === expectedHash;
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
};

/**
 * Generate file hash
 */
export const generateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// =====================================================
// WATERMARKING
// =====================================================

interface WatermarkOptions {
  userId: string;
  licenseKey?: string;
  timestamp: Date;
}

/**
 * Add watermark metadata to download
 */
export const addDownloadWatermark = async (
  downloadId: string,
  options: WatermarkOptions
): Promise<void> => {
  try {
    const watermark = {
      user_id: options.userId,
      license_key: options.licenseKey,
      timestamp: options.timestamp.toISOString(),
      fingerprint: await generateDownloadFingerprint(options.userId),
    };

    await supabase
      .from('digital_product_downloads')
      .update({ metadata: watermark })
      .eq('id', downloadId);
  } catch (error) {
    Sentry.captureException(error);
  }
};

/**
 * Generate unique download fingerprint
 */
const generateDownloadFingerprint = async (userId: string): Promise<string> => {
  const data = `${userId}-${Date.now()}-${Math.random()}`;
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// =====================================================
// SIGNED URLS
// =====================================================

interface SignedUrlOptions {
  expiresIn?: number; // seconds
  maxDownloads?: number;
}

/**
 * Generate secure signed URL for download
 */
export const generateSecureDownloadUrl = async (
  filePath: string,
  options: SignedUrlOptions = {}
): Promise<{ url: string; expiresAt: Date } | null> => {
  try {
    const { expiresIn = 3600 } = options; // 1 hour default

    const { data, error } = await supabase.storage
      .from('products')
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;

    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  } catch (error) {
    Sentry.captureException(error);
    return null;
  }
};

// =====================================================
// IP VALIDATION
// =====================================================

/**
 * Get user IP address
 */
export const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Check if IP is suspicious (too many downloads from different IPs)
 */
export const checkSuspiciousIPActivity = async (
  userId: string
): Promise<boolean> => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('digital_product_downloads')
      .select('ip_address')
      .eq('user_id', userId)
      .gte('download_date', oneDayAgo.toISOString());

    if (error) throw error;

    const uniqueIPs = new Set(data?.map(d => d.ip_address) || []);

    // Suspicious if more than 5 different IPs in 24h
    return uniqueIPs.size > 5;
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
};

// =====================================================
// DOWNLOAD TRACKING
// =====================================================

interface DownloadTrackingData {
  digitalProductId: string;
  fileId?: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  downloadSuccess: boolean;
  errorMessage?: string;
  downloadDurationSeconds?: number;
  fileVersion?: string;
  fileSizeMb?: number;
}

/**
 * Track download attempt
 */
export const trackDownloadAttempt = async (
  data: DownloadTrackingData
): Promise<void> => {
  try {
    await supabase.from('digital_product_downloads').insert({
      digital_product_id: data.digitalProductId,
      file_id: data.fileId,
      user_id: data.userId,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      download_success: data.downloadSuccess,
      error_message: data.errorMessage,
      download_duration_seconds: data.downloadDurationSeconds,
      file_version: data.fileVersion,
      file_size_mb: data.fileSizeMb,
      download_date: new Date().toISOString(),
    });
  } catch (error) {
    Sentry.captureException(error);
  }
};

// =====================================================
// CONCURRENT DOWNLOAD PREVENTION
// =====================================================

/**
 * Check for concurrent downloads
 */
export const checkConcurrentDownloads = async (
  userId: string
): Promise<boolean> => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const { data, error } = await supabase
      .from('digital_product_downloads')
      .select('id')
      .eq('user_id', userId)
      .gte('download_date', fiveMinutesAgo.toISOString())
      .eq('download_success', false);

    if (error) throw error;

    // Allow if less than 3 active downloads
    return (data?.length || 0) < 3;
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
};

// =====================================================
// EXPORT
// =====================================================

export const DownloadProtection = {
  checkRateLimit: checkDownloadRateLimit,
  verifyIntegrity: verifyFileIntegrity,
  generateHash: generateFileHash,
  addWatermark: addDownloadWatermark,
  generateSecureUrl: generateSecureDownloadUrl,
  getUserIP,
  checkSuspiciousIP: checkSuspiciousIPActivity,
  trackDownload: trackDownloadAttempt,
  checkConcurrentDownloads,
};

