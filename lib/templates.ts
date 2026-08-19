export type LabelTemplateConfig = {
  bin: {
    pattern: string;
    validation: {
      xxx: { min: number; max: number };
      zzzz: { min: number; max: number };
    };
  };
  cart: {
    pattern: string;
    validation: { xxx: { min: number; max: number } };
  };
  cartbin: {
    pattern: string;
    validation: { xxx: { min: number; max: number } };
  };
};

export const DEFAULT_TEMPLATES: LabelTemplateConfig = {
  bin: {
    pattern: "P-01-A-{xxx}-{y}-{zzzz}",
    validation: { xxx: { min: 101, max: 113 }, zzzz: { min: 1000, max: 1999 } },
  },
  cart: {
    pattern: "CRT-MAN1-{xxx}",
    validation: { xxx: { min: 1, max: 999 } },
  },
  cartbin: {
    pattern: "CRT-MAN1-{xxx}-{y}-{z}",
    validation: { xxx: { min: 1, max: 999 } },
  },
};

export function parseOrgTemplates(raw: unknown): LabelTemplateConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_TEMPLATES;
  const data = raw as Partial<LabelTemplateConfig>;
  return {
    bin: { ...DEFAULT_TEMPLATES.bin, ...data.bin },
    cart: { ...DEFAULT_TEMPLATES.cart, ...data.cart },
    cartbin: { ...DEFAULT_TEMPLATES.cartbin, ...data.cartbin },
  };
}

export function applyPattern(
  pattern: string,
  values: Record<string, string | number>,
): string {
  return pattern.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
