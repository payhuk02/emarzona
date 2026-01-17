/**
 * Endpoint de santé pour vérifier la disponibilité du backend
 * Utilisé par le système offline-first pour détecter les pannes
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Test de connectivité basique avec Supabase
    const { error } = await supabase
      .from('admin_config')
      .select('count')
      .limit(1)
      .single();

    if (error) {
      logger.warn('Health check failed:', error);
      return res.status(503).json({
        status: 'error',
        message: 'Service indisponible',
        timestamp: new Date().toISOString()
      });
    }

    // Test supplémentaire de performance
    const startTime = Date.now();
    await supabase.from('admin_config').select('key').limit(1);
    const responseTime = Date.now() - startTime;

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      uptime: process.uptime()
    });

  } catch (error) {
    logger.error('Health check exception:', error);

    res.status(503).json({
      status: 'error',
      message: 'Erreur interne',
      timestamp: new Date().toISOString()
    });
  }
}