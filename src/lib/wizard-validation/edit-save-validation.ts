export interface StepValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valide toutes les étapes requises avant sauvegarde (wizards d'édition).
 */
export async function validateRequiredSteps(
  steps: number[],
  validateStep: (step: number) => Promise<StepValidationResult>
): Promise<StepValidationResult> {
  const errors: string[] = [];
  let valid = true;

  for (const step of steps) {
    const result = await validateStep(step);
    if (!result.valid) {
      valid = false;
      errors.push(...result.errors);
    }
  }

  return { valid, errors: [...new Set(errors)] };
}
