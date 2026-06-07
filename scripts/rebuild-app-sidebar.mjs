import fs from 'fs';

const lines = fs.readFileSync('src/components/AppSidebar.tsx', 'utf8').split(/\r?\n/);
const tail = lines.slice(1226).join('\n');

const header = `import { LayoutDashboard, LogOut, Search, Check, Plus } from '@/components/icons';
import { Clock3, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { PremiumLangSwitcher } from '@/components/landing/premium/PremiumLangSwitcher';
import { SidebarCollapsibleSection } from '@/components/sidebar/SidebarCollapsibleSection';
import { SidebarNavCommandPalette } from '@/components/sidebar/SidebarNavCommandPalette';
import { SidebarPersonaSwitch } from '@/components/sidebar/SidebarPersonaSwitch';
import { NAV_LINK_ACTIVE, NAV_LINK_INACTIVE } from '@/components/sidebar/sidebar-nav-shared';
import {
  DEFAULT_OPEN_SECTION_LABELS,
  enrichNavSections,
  filterNavSections,
  flattenNavSections,
  sectionContainsPath,
} from '@/config/navigation.enrich';
import { adminMenuSections, userMenuSections } from '@/config/navigation.menus';
import { getNavItemPath, isNavItemActive, parseNavTo } from '@/config/navigation.helpers';
import type { NavSection, SidebarPersona } from '@/config/navigation.types';
import { useSidebarPersona } from '@/hooks/useSidebarPersona';
import { recordNavClick, sortEntriesByNavFrequency } from '@/hooks/useNavigationAnalytics';
import { isNavFeatureEnabled } from '@/lib/navigation/feature-flags';
import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useStoreContext } from '@/contexts/StoreContext';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import {
  hasPhysicalFeatureAccess,
  requiredPlanForFeature,
  type PhysicalPlanSlug,
} from '@/lib/billing/physical-plan-capabilities';
import { requiredPhysicalFeatureForPath } from '@/lib/billing/physical-route-capabilities';
import { logger } from '@/lib/logger';

`;

const updatedTail = tail
  .replace(/enrichNavSections\(menuSections\)/g, 'enrichNavSections(userMenuSections)')
  .replace(
    /flattenNavSections\(commandPaletteSections\)\.map\(entry => \(\{/,
    'sortEntriesByNavFrequency(flattenNavSections(commandPaletteSections)).map(entry => ({'
  );

fs.writeFileSync('src/components/AppSidebar.tsx', header + updatedTail);
console.log('AppSidebar rebuilt', (header + updatedTail).split('\n').length, 'lines');
