import type { Metadata } from 'next';
import { BasketView } from './BasketView';

export const metadata: Metadata = { title: 'Your basket', robots: { index: false } };

export default function BasketPage() {
  return <BasketView />;
}
