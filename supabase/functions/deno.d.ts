/// <reference types="https://deno.land/x/types/index.d.ts" />

declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
  }
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Déclaration pour les imports Deno HTTP
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Promise<Response> | Response
  ): void;
}

