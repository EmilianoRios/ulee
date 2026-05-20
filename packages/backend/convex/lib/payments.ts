export type PaymentMethod = 'online' | 'cash'

export function resolvePaymentType(
  currentStatus: string,
): 'deposit' | 'balance' | 'full' {
  if (currentStatus === 'deposit_paid') return 'balance'
  return 'full'
}

export const PAYMENT_METHOD_MAP: Record<string, PaymentMethod> = {
  mercadopago: 'online', // legacy DB records written before schema migration
  online:      'online',
  cash:        'cash',
}

export function normalizeMethod(raw: string): PaymentMethod {
  return PAYMENT_METHOD_MAP[raw] ?? 'cash'
}

export interface PaymentSummary {
  online:       number
  cash:         number
  total:        number
  depositTotal: number  // sum of completed payments where type='deposit'
  paymentType:  'deposit' | 'balance' | 'full' | 'mixed' | 'none'
}

export function aggregatePayments(
  payments: Array<{ type: string; method: string; amount: number; status: string }>
): PaymentSummary {
  let online       = 0
  let cash         = 0
  let depositTotal = 0
  const types      = new Set<string>()

  for (const p of payments) {
    if (p.status !== 'completed') continue
    const method = normalizeMethod(p.method)
    if (method === 'online') online += p.amount
    else                     cash   += p.amount
    if (p.type === 'deposit') depositTotal += p.amount
    types.add(p.type)
  }

  if (types.size === 0) {
    return { online: 0, cash: 0, total: 0, depositTotal: 0, paymentType: 'none' }
  }

  const hasDeposit = types.has('deposit')
  const hasBalance = types.has('balance')
  const hasFull    = types.has('full')

  let paymentType: PaymentSummary['paymentType']
  if (hasFull && !hasDeposit && !hasBalance)       paymentType = 'full'
  else if (hasDeposit && !hasBalance && !hasFull)  paymentType = 'deposit'
  else if (hasBalance && !hasDeposit && !hasFull)  paymentType = 'balance'
  else                                             paymentType = 'mixed'

  return { online, cash, total: online + cash, depositTotal, paymentType }
}
