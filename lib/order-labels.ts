/** Client-safe order status labels (mirrors lib/orders.ts). */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting payment',
  processing: 'Processing',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};
