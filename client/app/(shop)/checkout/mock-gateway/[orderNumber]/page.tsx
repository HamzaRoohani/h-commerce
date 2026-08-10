import { MockGatewaySimulator } from './MockGatewaySimulator';

type PageParams = { orderNumber: string };

export default async function MockGatewayPage({ params }: { params: Promise<PageParams> }) {
  const { orderNumber } = await params;
  return <MockGatewaySimulator orderNumber={orderNumber} />;
}
