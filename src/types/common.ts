/**
 * Types communs pour remplacer les `any` fréquents
 * Date: Janvier 2025
 * 
 * Ce fichier contient des types génériques réutilisables pour éviter l'utilisation de `any`
 */

/**
 * Type pour les objets génériques avec clés string
 */
export type RecordString = Record<string, unknown>;

/**
 * Type pour les objets génériques avec valeurs de type T
 */
export type RecordOf<T> = Record<string, T>;

/**
 * Type pour les fonctions génériques
 */
export type GenericFunction = (...args: unknown[]) => unknown;

/**
 * Type pour les callbacks génériques
 */
export type GenericCallback<T = unknown> = (value: T) => void;

/**
 * Type pour les erreurs génériques
 */
export type GenericError = Error | { message: string; code?: string; status?: number };

/**
 * Type pour les réponses API génériques
 */
export interface GenericApiResponse<T = unknown> {
  data?: T;
  error?: GenericError;
  success?: boolean;
  message?: string;
}

/**
 * Type pour les options génériques
 */
export type GenericOptions = RecordString & {
  [key: string]: unknown;
};

/**
 * Type pour les métadonnées génériques
 */
export type GenericMetadata = RecordString & {
  [key: string]: unknown;
};

/**
 * Type pour les paramètres de requête génériques
 */
export interface GenericQueryParams {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filter?: RecordString;
  [key: string]: unknown;
}

/**
 * Type pour les résultats paginés génériques
 */
export interface GenericPaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Type pour les événements génériques
 */
export type GenericEvent = Event | { type: string; [key: string]: unknown };

/**
 * Type pour les handlers d'événements
 */
export type GenericEventHandler = (event: GenericEvent) => void;

/**
 * Type pour les valeurs JSON sérialisables
 */
export type JSONValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JSONValue[] 
  | { [key: string]: JSONValue };

/**
 * Type pour les objets JSON
 */
export type JSONObject = { [key: string]: JSONValue };

/**
 * Type pour les valeurs primitives
 */
export type Primitive = string | number | boolean | null | undefined;

/**
 * Type pour les valeurs non-null
 */
export type NonNull<T> = T extends null | undefined ? never : T;

/**
 * Type pour rendre les propriétés optionnelles
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type pour rendre les propriétés requises
 */
export type RequiredBy<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Type pour les valeurs de formulaire
 */
export type FormValue = string | number | boolean | File | File[] | null | undefined;

/**
 * Type pour les données de formulaire
 */
export type FormData = Record<string, FormValue>;

/**
 * Type pour les erreurs de validation
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Type pour les résultats de validation
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

/**
 * Type pour les callbacks de succès
 */
export type SuccessCallback<T = unknown> = (data: T) => void;

/**
 * Type pour les callbacks d'erreur
 */
export type ErrorCallback = (error: GenericError) => void;

/**
 * Type pour les promesses avec typage
 */
export type TypedPromise<T> = Promise<T>;

/**
 * Type pour les fonctions asynchrones
 */
export type AsyncFunction<T = unknown, R = unknown> = (args: T) => Promise<R>;

/**
 * Type pour les configurations génériques
 */
export interface GenericConfig {
  [key: string]: unknown;
}

/**
 * Type pour les paramètres d'URL
 */
export type URLParams = Record<string, string | number | boolean | undefined>;

/**
 * Type pour les headers HTTP
 */
export type HTTPHeaders = Record<string, string>;

/**
 * Type pour les options de requête HTTP
 */
export interface HTTPRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: HTTPHeaders;
  body?: unknown;
  params?: URLParams;
  timeout?: number;
}

/**
 * Type pour les réponses HTTP
 */
export interface HTTPResponse<T = unknown> {
  status: number;
  statusText: string;
  data: T;
  headers: HTTPHeaders;
}







