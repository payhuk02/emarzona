import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';

/**
 * Composant de test pour vérifier le routing SPA
 * Affiche des informations sur la route actuelle et permet de tester la navigation
 */
export const RouteTester: React.FC = () => {
  const location = useLocation();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const routes = [
    '/',
    '/auth',
    '/marketplace',
    '/dashboard',
    '/admin',
    '/stores/test-store',
    '/nonexistent-page'
  ];

  const testRoute = async (route: string) => {
    try {
      // Simuler une navigation vers la route
      window.history.pushState({}, '', route);
      
      // Attendre un peu pour que la navigation se fasse
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const currentPath = window.location.pathname;
      const isCorrect = currentPath === route || 
                       (route === '/' && currentPath === '/') ||
                       (route.includes('/stores/') && currentPath.includes('/stores/')) ||
                       (route.includes('/admin') && currentPath.includes('/admin')) ||
                       (route.includes('/dashboard') && currentPath.includes('/dashboard'));
      
      return {
        route,
        success: isCorrect,
        currentPath: window.location.pathname,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        route,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  };

  const runTests = async () => {
    setIsTesting(true);
    const results = [];
    
    for (const route of routes) {
      const result = await testRoute(route);
      results.push(result);
      
      // Attendre entre les tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setTestResults(results);
    setIsTesting(false);
  };

  const testRefresh = () => {
    logger.info('Test du rafraîchissement', { currentPath: location.pathname });
    
    // Simuler un rafraîchissement
    window.location.reload();
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🧪 Test du Routing SPA</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Informations actuelles :</h3>
        <p><strong>Route actuelle :</strong> {location.pathname}</p>
        <p><strong>Hash :</strong> {location.hash}</p>
        <p><strong>Search :</strong> {location.search}</p>
        <p><strong>State :</strong> {JSON.stringify(location.state)}</p>
      </div>

      <div className="mb-4">
        <button
          onClick={runTests}
          disabled={isTesting}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2 disabled:opacity-50"
        >
          {isTesting ? 'Test en cours...' : 'Tester toutes les routes'}
        </button>
        
        <button
          onClick={testRefresh}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Tester le rafraîchissement
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Résultats des tests :</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                <div className="flex justify-between">
                  <span>{result.route}</span>
                  <span>{result.success ? '✅' : '❌'}</span>
                </div>
                {!result.success && (
                  <div className="text-sm mt-1">
                    <p>Attendu: {result.route}</p>
                    <p>Actuel: {result.currentPath}</p>
                    {result.error && <p>Erreur: {result.error}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p><strong>Résumé :</strong></p>
            <p>✅ Succès: {testResults.filter(r => r.success).length}/{testResults.length}</p>
            <p>❌ Échecs: {testResults.filter(r => !r.success).length}/{testResults.length}</p>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-100 rounded">
        <h4 className="font-semibold">💡 Instructions :</h4>
        <ul className="list-disc list-inside text-sm">
          <li>Cliquez sur "Tester toutes les routes" pour vérifier la navigation</li>
          <li>Cliquez sur "Tester le rafraîchissement" pour simuler un F5</li>
          <li>Vérifiez que toutes les routes retournent ✅</li>
          <li>Testez manuellement en naviguant et en appuyant sur F5</li>
        </ul>
      </div>
    </div>
  );
};
