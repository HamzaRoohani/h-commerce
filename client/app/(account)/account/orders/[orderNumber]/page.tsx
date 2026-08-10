import { OrderDetail } from './OrderDetail';

type PageParams = { orderNumber: string };

export default async function OrderDetailPage({ params }: { params: Promise<PageParams> }) {
  const { orderNumber } = await params;
  return <OrderDetail orderNumber={orderNumber} />;
}
