/**
 * Script pour migrer les sidebars vers le nouveau système responsive
 * Usage: node scripts/migrate-sidebars.js
 */

const fs = require('fs');
const path = require('path');

// Liste des sidebars simples à migrer (sans groupes)
const simpleSidebars = [
  'EmailsSidebar',
  'AnalyticsSidebar',
  'StoreSidebar',
  'PromotionsSidebar',
  'FinanceSidebar',
  'BookingsSidebar',
  'InventorySidebar',
  'ShippingSidebar',
  'CoursesSidebar',
  'AffiliateSidebar',
  'DigitalPortalSidebar',
  'PhysicalPortalSidebar',
];

// Template pour la migration
const migrationTemplate = (sidebarName, navItemsName, breadcrumbLogic) => `
/**
 * ${sidebarName} - Sidebar contextuelle responsive et professionnelle
 */

import { useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';
import { BaseContextSidebar } from './BaseContextSidebar';
import { ContextSidebarNavItem } from './ContextSidebarNavItem';

${breadcrumbLogic}

export const ${sidebarName} = () => {
  const location = useLocation();
  
  ${breadcrumbLogic.includes('getActiveSection') ? '' : `const breadcrumbItems: BreadcrumbItem[] = [
    { label: '...', path: '...' },
    { label: '...' },
  ];`}

  return (
    <BaseContextSidebar breadcrumbItems={breadcrumbItems}>
      <nav className="space-y-1" aria-label="Navigation">
        {${navItemsName}.map((item) => {
          const isActive = location.pathname === item.path || 
                         location.pathname.startsWith(item.path + '/');
          
          return (
            <ContextSidebarNavItem
              key={item.path}
              label={item.label}
              path={item.path}
              icon={item.icon}
              isActive={isActive}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setTimeout(() => {
                    const event = new Event('close-mobile-sidebar');
                    window.dispatchEvent(event);
                  }, 100);
                }
              }}
            />
          );
        })}
      </nav>
    </BaseContextSidebar>
  );
};
`;

console.log('Script de migration créé. Migration manuelle recommandée pour plus de contrôle.');

