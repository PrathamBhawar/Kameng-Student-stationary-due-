// The add-only ledger. Entries are never edited or deleted once their receipt has been opened:
// any change is a new entry that points at the old one through `refId`.

export type EntryType = 'due' | 'payment' | 'correction' | 'reversal' | 'transfer_out' | 'transfer_in';

export type ReceiptStatus = 'not_sent' | 'opened' | 'sent' | 'no_phone';

export interface ReceiptState {
  status: ReceiptStatus;
  openedAt?: string;
  confirmedAt?: string;
}

export type DisputeReason = 'didnt_buy' | 'wrong_amount' | 'already_paid' | 'card_misused';
export type DisputeOutcome = 'kept' | 'changed' | 'removed' | 'moved';

export interface Dispute {
  status: 'open' | 'resolved';
  reason: DisputeReason;
  openedAt: string;
  resolvedAt?: string;
  outcome?: DisputeOutcome;
  resolutionEntryId?: string;
  /** "Keep it" adds no entry, so its "Confirmed: ₹120 stays" message keeps its receipt status here. */
  keptReceipt?: ReceiptState;
}

export interface Entry {
  id: string;                 // uuid
  receiptNo: string;          // 'SD-1001', sequential per shop, from a persisted counter, never reused
  studentId: string;
  type: EntryType;
  amount: number;             // whole rupees, always positive; the sign comes from the type
  delta?: number;             // corrections only: signed change to the balance (e.g. -60)
  note?: string;              // dues: items or note
  method?: 'UPI' | 'Cash';    // payments
  by: string;                 // who made the entry (owner name for now)
  createdAt: string;          // ISO
  refId?: string;             // correction/reversal/transfer: the entry it changes
  /** Transfers: the other student in the move ("Moved to Rahul Verma"). */
  otherStudentId?: string;
  /** Entries migrated from before receipts existed: no receipt was ever due, so they don't count as unsent. */
  legacy?: boolean;
  receipt: ReceiptState;
  dispute?: Dispute;
}

/** What a receipt message is about: an entry, or the "Keep it" confirmation of a dispute. */
export type ReceiptTarget = { entryId: string; kind: 'entry' | 'kept' };
