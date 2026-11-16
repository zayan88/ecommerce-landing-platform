/** Manual payment methods the customer sees at checkout. Only ENABLED methods with a number/address are public. */
export interface PublicPayments {
  vodafone_cash?: { number: string; holder: string };
  instapay?: { address: string; holder: string };
}

export function publicPayments(pm: any): PublicPayments {
  const out: PublicPayments = {};
  if (pm?.vodafone_cash?.enabled && pm.vodafone_cash.number) {
    out.vodafone_cash = { number: String(pm.vodafone_cash.number), holder: String(pm.vodafone_cash.holder || "") };
  }
  if (pm?.instapay?.enabled && pm.instapay.address) {
    out.instapay = { address: String(pm.instapay.address), holder: String(pm.instapay.holder || "") };
  }
  return out;
}
