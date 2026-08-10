import { ConfirmingPayment } from './ConfirmingPayment';

type PageParams = { orderNumber: string };

export default async function ConfirmingPaymentPage({ params }: { params: Promise<PageParams> }) {
  const { orderNumber } = await params;
  return <ConfirmingPayment orderNumber={orderNumber} />;
}
