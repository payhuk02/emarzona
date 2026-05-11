// deno.d.ts - Type declarations for Deno runtime in Supabase Edge Functions

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    has(key: string): boolean;
    toObject(): { [key: string]: string };
  }

  export const env: Env;

  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}
