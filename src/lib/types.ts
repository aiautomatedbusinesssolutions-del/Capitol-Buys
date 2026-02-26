export type Party = "D" | "R" | "I";
export type Chamber = "Senate" | "House";
export type TransactionType = "buy" | "sell";
export type OwnerType = "Self" | "Spouse" | "Joint";

export type DataSource = "quiver" | "public" | "mock";

export interface Trade {
  id: string;
  politicianName: string;
  party: Party;
  chamber: Chamber;
  state: string;

  ticker: string;
  company: string;
  sector: string;

  type: TransactionType;
  amountRange: string;
  amountMidpoint: number;
  ownerType: OwnerType;

  transactionDate: string; // ISO date
  disclosureDate: string; // ISO date
  daysSinceTrade: number; // computed: days from transactionDate to today
  daysToDisclose: number; // computed: days from transactionDate to disclosureDate

  committees: string[];
  convictionScore: number; // 0–100
  sectorInsight: string;
  source: DataSource;
}

export type ConvictionTier = "high" | "medium" | "low";

export interface ConvictionBadge {
  tier: ConvictionTier;
  label: string;
  color: "emerald" | "amber" | "rose";
}
