/**
 * The only place paisa gets converted to a display string (ADR-001,
 * docs/ADR.md). Every price arriving from the API is an integer number of
 * paisa — never format currency anywhere else in the client.
 */
export function formatPaisa(paisa: number): string {
  const rupees = paisa / 100;
  return `Rs ${rupees.toLocaleString('en-PK', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
