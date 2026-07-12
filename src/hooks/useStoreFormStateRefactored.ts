/**
 * useStoreFormStateRefactored
 * Refactored version of useStoreFormState using useReducer pattern
 * 
 * This hook provides the same interface as the original but with:
 * - Better performance (fewer re-renders)
 * - Cleaner code (single reducer instead of 60+ useState)
 * - Easier to test and debug
 * 
 * @deprecated Use this new version. Old version will be removed after migration.
 */

import { useReducer, useState, useCallback, useMemo } from 'react';
import { useStore } from './useStore';
import { useStoreContext } from '@/contexts/StoreContext';
import { sanitizeStorePayload } from '@/lib/store-payload-utils';
import { validateStoreStep } from '@/lib/store-validation';
import type { Store } from './useStores';
import type { ExtendedStore, StoreThemeConfig } from '@/components/store/types/store-form';
import {
  storeFormReducer,
  createInitialState,
  storeFormActions,
  type StoreFormState,
  type StoreFormField,
} from './store-form-reducer';

interface UseStoreFormStateOptions {
  store: ExtendedStore;
  currentTab?: string;
  onSave?: (data: any) => Promise<void>;
  onCancel?: () => void;
  onValidationError?: (errors: Record<string, string>) => void;
}

export function useStoreFormStateRefactored({
  store,
  currentTab = 'settings',
  onSave,
  onCancel,
  onValidationError,
}: UseStoreFormStateOptions) {
  // Initialize state with reducer
  const [formState, dispatch] = useReducer(
    storeFormReducer,
    createInitialState(store)
  );

  const { updateStore } = useStore();
  const { refreshStore } = useStoreContext();

  // Track which fields have been touched
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Memoized setters for each field
  const setters = useMemo(() => {
    const createSetter = (field: StoreFormField) => (value: unknown) => {
      dispatch(storeFormActions.setField(field, value));
      setFieldTouched(prev => ({ ...prev, [field]: true }));
      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };

    // Generate setters for all fields
    const settersObj: Record<string, (value: unknown) => void> = {};
    const fields: StoreFormField[] = [
      'name', 'slug', 'description', 'about', 'defaultCurrency',
      'logoUrl', 'bannerUrl', 'faviconUrl', 'appleTouchIconUrl', 'watermarkUrl', 'placeholderImageUrl',
      'contactEmail', 'contactPhone', 'supportEmail', 'salesEmail', 'pressEmail', 'partnershipEmail',
      'supportPhone', 'salesPhone', 'whatsappNumber', 'telegramUsername',
      'facebookUrl', 'instagramUrl', 'twitterUrl', 'linkedinUrl', 'youtubeUrl', 'tiktokUrl',
      'pinterestUrl', 'snapchatUrl', 'discordUrl', 'twitchUrl',
      'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'textColor',
      'textSecondaryColor', 'buttonPrimaryColor', 'buttonPrimaryText', 'buttonSecondaryColor',
      'buttonSecondaryText', 'linkColor', 'linkHoverColor',
      'headingFont', 'bodyFont', 'fontSizeBase', 'headingSizeH1', 'headingSizeH2', 'headingSizeH3',
      'lineHeight', 'letterSpacing',
      'borderRadius', 'shadowIntensity', 'headerStyle', 'footerStyle', 'sidebarEnabled',
      'sidebarPosition', 'productGridColumns', 'productCardStyle', 'navigationStyle',
      'metaTitle', 'metaDescription', 'metaKeywords', 'ogTitle', 'ogDescription', 'ogImage',
      'addressLine1', 'addressLine2', 'city', 'stateProvince', 'postalCode', 'country',
      'latitude', 'longitude', 'timezone', 'openingHours',
      'legalPages', 'marketingContent',
      'googleAnalyticsId', 'googleAnalyticsEnabled', 'facebookPixelId', 'facebookPixelEnabled',
      'googleTagManagerId', 'googleTagManagerEnabled', 'tiktokPixelId', 'tiktokPixelEnabled',
      'customTrackingScripts', 'customScriptsEnabled',
      'infoMessage', 'infoMessageColor', 'infoMessageFont', 'commerceType',
    ];

    fields.forEach(field => {
      // Convert camelCase to setter name (e.g., logoUrl -> setLogoUrl)
      const setterName = 'set' + field.charAt(0).toUpperCase() + field.slice(1);
      settersObj[setterName] = createSetter(field);
    });

    return settersObj;
  }, [validationErrors]);

  // Handle field blur for validation
  const handleFieldBlur = useCallback((fieldName: string) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  // Validate a single field
  const validateField = useCallback(async (fieldName: string, value: string): Promise<string | null> => {
    const stepValidation = validateStoreStep(currentTab, { [fieldName]: value });
    if (stepValidation.success === false && stepValidation.errors[fieldName]) {
      return stepValidation.errors[fieldName];
    }
    return null;
  }, [currentTab]);

  // Apply theme configuration
  const applyConfig = useCallback((config: StoreThemeConfig) => {
    dispatch(storeFormActions.setTheme(config));
  }, []);

  // Build update payload scoped to current tab
  const buildUpdatePayload = useCallback((): any => {
    const tabFieldMap: Record<string, StoreFormField[]> = {
      settings: ['name', 'slug', 'description', 'about', 'contactEmail', 'contactPhone',
                 'supportEmail', 'salesEmail', 'pressEmail', 'partnershipEmail',
                 'supportPhone', 'salesPhone', 'whatsappNumber', 'telegramUsername',
                 'facebookUrl', 'instagramUrl', 'twitterUrl', 'linkedinUrl', 'youtubeUrl',
                 'tiktokUrl', 'pinterestUrl', 'snapchatUrl', 'discordUrl', 'twitchUrl',
                 'infoMessage', 'infoMessageColor', 'infoMessageFont'],
      appearance: ['logoUrl', 'bannerUrl', 'faviconUrl', 'appleTouchIconUrl',
                   'watermarkUrl', 'placeholderImageUrl'],
      theme: ['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor',
              'textColor', 'textSecondaryColor', 'buttonPrimaryColor', 'buttonPrimaryText',
              'buttonSecondaryColor', 'buttonSecondaryText', 'linkColor', 'linkHoverColor',
              'headingFont', 'bodyFont', 'fontSizeBase', 'headingSizeH1', 'headingSizeH2',
              'headingSizeH3', 'lineHeight', 'letterSpacing', 'borderRadius', 'shadowIntensity',
              'headerStyle', 'footerStyle', 'sidebarEnabled', 'sidebarPosition',
              'productGridColumns', 'productCardStyle', 'navigationStyle'],
      seo: ['metaTitle', 'metaDescription', 'metaKeywords', 'ogTitle', 'ogDescription', 'ogImage'],
      location: ['addressLine1', 'addressLine2', 'city', 'stateProvince', 'postalCode',
                 'country', 'latitude', 'longitude', 'timezone', 'openingHours'],
      legal: ['legalPages'],
      marketing: ['marketingContent'],
      analytics: ['googleAnalyticsId', 'googleAnalyticsEnabled', 'facebookPixelId',
                  'facebookPixelEnabled', 'googleTagManagerId', 'googleTagManagerEnabled',
                  'tiktokPixelId', 'tiktokPixelEnabled', 'customTrackingScripts',
                  'customScriptsEnabled'],
    };

    const fields = tabFieldMap[currentTab] || [];
    const payload: any = {};

    fields.forEach(field => {
      if (formState[field] !== undefined) {
        // Convert camelCase back to snake_case for API
        const snakeCaseField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        payload[snakeCaseField] = formState[field];
      }
    });

    return sanitizeStorePayload(payload);
  }, [formState, currentTab]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsSubmitting(true);

    try {
      // Validate current tab
      const validation = validateStoreStep(currentTab, formState);
      if (validation.success === false) {
        setValidationErrors(validation.errors);
        onValidationError?.(validation.errors);
        setIsSubmitting(false);
        return;
      }

      // Build and sanitize payload
      const payload = buildUpdatePayload();

      // Update store
      await updateStore(store.id, payload);
      
      // Refresh store context
      await refreshStore();

      // Update last saved timestamp
      setLastSaved(new Date());

      // Call custom onSave handler
      if (onSave) {
        await onSave(payload);
      }
    } catch (error) {
      console.error('Error saving store:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [currentTab, formState, store.id, updateStore, refreshStore, buildUpdatePayload, onSave, onValidationError]);

  // Handle form cancellation
  const handleCancel = useCallback(() => {
    dispatch(storeFormActions.initFromStore(store));
    setFieldTouched({});
    setValidationErrors({});
    onCancel?.();
  }, [store, onCancel]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    dispatch(storeFormActions.reset(createInitialState(store)));
    setFieldTouched({});
    setValidationErrors({});
  }, [store]);

  // Reset specific section
  const resetSection = useCallback((section: string) => {
    dispatch(storeFormActions.resetSection(section));
  }, []);

  return {
    // State
    formState,
    isSubmitting,
    lastSaved,
    fieldTouched,
    validationErrors,

    // Setters
    setters,

    // Handlers
    handleSubmit,
    handleCancel,
    handleFieldBlur,
    validateField,
    applyConfig,
    resetForm,
    resetSection,

    // Computed
    hasChanges: Object.keys(fieldTouched).length > 0,
  };
}
