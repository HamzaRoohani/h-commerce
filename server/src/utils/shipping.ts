const FLAT_SHIPPING_PAISA = 20000; // Rs 200
const FREE_SHIPPING_THRESHOLD_PAISA = 500000; // Rs 5,000

export function calculateShippingPaisa(subtotalPaisa: number): number {
  return subtotalPaisa >= FREE_SHIPPING_THRESHOLD_PAISA ? 0 : FLAT_SHIPPING_PAISA;
}
