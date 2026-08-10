/** Mongoose validator for ADR-001 (docs/ADR.md) — money is always integer paisa. */
export const isInteger = {
  validator: (v: number | null | undefined) => v == null || Number.isInteger(v),
  message: '{PATH} must be an integer number of paisa (see docs/ADR.md ADR-001)',
};
