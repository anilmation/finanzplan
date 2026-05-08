// Schweizer Budget-Vorlage für das erste Jahr
// Fiktive Beträge als Ausgangspunkt

export interface TemplateCategory {
  name: string
  color: string
  icon: string
}

export interface TemplateExpense {
  name: string
  amount: number
  frequency: 'monthly' | 'yearly' | 'once'
  type: 'fixed' | 'estimate' | 'savings'
  categoryName: string
}

export interface TemplateIncome {
  name: string
  amount100Pct: number
  employmentPct: number
  frequency: 'monthly' | 'yearly' | 'once'
  type: 'salary' | 'other'
}

export const SWISS_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { name: 'Wohnen', color: '#f59e0b', icon: 'home' },
  { name: 'Krankenversicherung', color: '#8b5cf6', icon: 'insurance' },
  { name: 'Transport', color: '#84cc16', icon: 'train' },
  { name: 'Lebenshaltung', color: '#3b82f6', icon: 'food' },
  { name: 'Versicherungen', color: '#14b8a6', icon: 'tax' },
  { name: 'Steuern', color: '#eab308', icon: 'bank' },
  { name: 'Sparen & Investieren', color: '#ec4899', icon: 'savings' },
  { name: 'Freizeit', color: '#ef4444', icon: 'entertainment' },
]

export const SWISS_TEMPLATE_EXPENSES: TemplateExpense[] = [
  // Wohnen
  { name: 'Miete', amount: 1800, frequency: 'monthly', type: 'fixed', categoryName: 'Wohnen' },
  { name: 'Nebenkosten', amount: 150, frequency: 'monthly', type: 'fixed', categoryName: 'Wohnen' },
  { name: 'Hausrat & Haftpflicht', amount: 350, frequency: 'yearly', type: 'fixed', categoryName: 'Versicherungen' },
  // Krankenkasse
  { name: 'Krankenkasse (Grundversicherung)', amount: 450, frequency: 'monthly', type: 'fixed', categoryName: 'Krankenversicherung' },
  { name: 'Selbstbehalt & Franchise', amount: 1500, frequency: 'yearly', type: 'estimate', categoryName: 'Krankenversicherung' },
  // Transport
  { name: 'GA oder Halbtax', amount: 3860, frequency: 'yearly', type: 'fixed', categoryName: 'Transport' },
  { name: 'Benzin / ÖV Einzelbillette', amount: 100, frequency: 'monthly', type: 'estimate', categoryName: 'Transport' },
  // Lebenshaltung
  { name: 'Lebensmittel & Haushalt', amount: 800, frequency: 'monthly', type: 'estimate', categoryName: 'Lebenshaltung' },
  { name: 'Restaurants & Ausgang', amount: 300, frequency: 'monthly', type: 'estimate', categoryName: 'Lebenshaltung' },
  { name: 'Kleider & Schuhe', amount: 150, frequency: 'monthly', type: 'estimate', categoryName: 'Lebenshaltung' },
  // Steuern
  { name: 'Einkommenssteuer', amount: 8000, frequency: 'yearly', type: 'estimate', categoryName: 'Steuern' },
  // Versicherungen
  { name: 'Rechtsschutzversicherung', amount: 300, frequency: 'yearly', type: 'fixed', categoryName: 'Versicherungen' },
  // Sparen
  { name: 'Säule 3a', amount: 7258, frequency: 'yearly', type: 'savings', categoryName: 'Sparen & Investieren' },
  { name: 'ETF / Wertschriften', amount: 200, frequency: 'monthly', type: 'savings', categoryName: 'Sparen & Investieren' },
  { name: 'Notgroschen', amount: 100, frequency: 'monthly', type: 'savings', categoryName: 'Sparen & Investieren' },
  // Freizeit
  { name: 'Ferien & Reisen', amount: 4000, frequency: 'yearly', type: 'estimate', categoryName: 'Freizeit' },
  { name: 'Sport & Hobbys', amount: 100, frequency: 'monthly', type: 'estimate', categoryName: 'Freizeit' },
  { name: 'Streaming & Abos', amount: 50, frequency: 'monthly', type: 'fixed', categoryName: 'Freizeit' },
]

export const SWISS_TEMPLATE_INCOMES: TemplateIncome[] = [
  { name: 'Lohn (100%)', amount100Pct: 7000, employmentPct: 100, frequency: 'monthly', type: 'salary' },
]
