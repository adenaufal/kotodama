import { ToneAttributes } from '../../types';

export type TonePreset = 'formal' | 'casual' | 'humor' | 'professional';

export const TONE_MODIFIERS: Record<TonePreset, Partial<ToneAttributes>> = {
  formal: { formality: 30, humor: -20, energy: -10 },
  casual: { formality: -30, humor: 20, energy: 15 },
  humor: { humor: 40, formality: -10, authenticity: 15 },
  professional: { formality: 25, technicality: 15, humor: -25, energy: -10 },
};

export function calculateToneAdjustment(activePresets: TonePreset[]): Partial<ToneAttributes> {
  const adjustment: Partial<ToneAttributes> = {
    formality: 0,
    humor: 0,
    technicality: 0,
    empathy: 0,
    energy: 0,
    authenticity: 0,
  };

  activePresets.forEach(preset => {
    const modifier = TONE_MODIFIERS[preset];
    Object.entries(modifier).forEach(([key, value]) => {
      (adjustment[key as keyof ToneAttributes] as number) += value;
    });
  });

  return adjustment;
}
