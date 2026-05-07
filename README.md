# Finanzplan

Persönliche Budget-App mit KI-gestützter Bankbeleg-Analyse.

## Features

- **Planungs-Modus**: Ausgaben & Einnahmen erfassen (monatlich / jährlich / einmalig)
- **Schnelleingabe**: Name → Enter → Betrag → Enter → Häufigkeit → Enter → Fertig
- **Kategorisierung**: Hierarchische Kategorien mit Farbcodierung, nachträglich zuweisbar
- **Ausgaben-Typen**: Fixkosten · Prognose · Sparen (Sparausgaben separat ausgewiesen)
- **Lohn-Funktion**: Anstellungsprozent anpassbar — Berechnung automatisch
- **Jahresverwaltung**: Neue Jahre erstellen, Ausgaben aus Vorjahr kopieren
- **Dashboard**: Monatliche & jährliche Übersicht, Diagramme
- **Realitäts-Modus**: Postfinance PDF hochladen → KI analysiert → Plan vs. Realität
- **Hell / Dunkel Modus**
- **Sicher**: Jeder User sieht nur seine eigenen Daten (Supabase RLS)

---

## Tech Stack

| Layer | Technologie |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| Authentifizierung | Supabase Auth |
| Datenbank | Supabase PostgreSQL + Prisma ORM |
| KI-Analyse | Anthropic Claude API |
| Deployment | Vercel |

---

## Setup

### 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. Notiere dir:
   - Project URL
   - anon key (Settings → API)
   - Database password

### 2. Repository klonen & Dependencies installieren

```bash
git clone <dein-repo>
cd finanzplan
npm install
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env.local
```

Fülle `.env.local` mit deinen Supabase-Daten:

```env
NEXT_PUBLIC_SUPABASE_URL=https://DEIN_PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein_anon_key
DATABASE_URL=postgresql://postgres:PASSWORD@db.DEIN_PROJEKT.supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:PASSWORD@db.DEIN_PROJEKT.supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-...
```

**Anthropic API Key**: Auf [console.anthropic.com](https://console.anthropic.com) erstellen.

### 4. Datenbank aufsetzen

```bash
# Prisma Schema in Supabase pushen
npm run db:push

# Prisma Client generieren
npm run db:generate
```

### 5. Row Level Security aktivieren

Öffne den SQL Editor in Supabase und führe den Inhalt von `supabase/rls.sql` aus.

### 6. App starten

```bash
npm run dev
```

Die App läuft auf http://localhost:3000

---

## Deployment auf Vercel

1. Repo auf GitHub pushen
2. Neues Projekt auf [vercel.com](https://vercel.com) aus dem Repo erstellen
3. Environment Variables in Vercel hinzufügen (gleiche wie `.env.local`)
4. Deploy!

---

## Projektstruktur

```
finanzplan/
├── app/
│   ├── auth/login/          # Login-Seite
│   ├── dashboard/           # Hauptseite (Übersicht + Planung)
│   ├── realitaet/           # PDF-Upload + Vergleich
│   ├── api/
│   │   ├── budget/
│   │   │   ├── expenses/    # CRUD Ausgaben
│   │   │   ├── incomes/     # CRUD Einnahmen
│   │   │   └── year/        # Jahresverwaltung
│   │   └── analyse/         # KI-Analyse Route
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── budget/
│   │   ├── DashboardClient.tsx   # Haupt-Client-Komponente
│   │   ├── QuickEntry.tsx         # Schnelleingabe
│   │   ├── ExpenseList.tsx        # Ausgaben-Liste mit Edit
│   │   ├── IncomeList.tsx         # Einnahmen-Liste mit Edit
│   │   ├── SummaryCards.tsx       # Übersichtskarten
│   │   ├── NewYearModal.tsx       # Jahreserstellung
│   │   └── RealitaetClient.tsx    # Realitäts-Check
│   ├── charts/
│   │   └── BudgetCharts.tsx       # Recharts Diagramme
│   └── layout/
│       └── Sidebar.tsx            # Navigation
├── lib/
│   ├── budget.ts            # Berechnungslogik
│   ├── prisma.ts            # DB Client
│   ├── store.ts             # Zustand Store
│   └── supabase/            # Auth Clients
├── prisma/
│   └── schema.prisma        # Datenmodell
├── supabase/
│   └── rls.sql              # Row Level Security
└── types/
    └── index.ts             # TypeScript Typen
```

---

## Postfinance PDF-Analyse

Der Realitäts-Modus funktioniert so:

1. Du lädst einen Kontoauszug von Postfinance (PDF) hoch
2. Claude liest das PDF und extrahiert alle Transaktionen
3. Transaktionen werden automatisch kategorisiert und mit deinen geplanten Ausgaben verglichen
4. Du siehst: Hast du mehr oder weniger ausgegeben als geplant?

**Datenschutz**: PDFs werden nicht persistent gespeichert. Nur die extrahierten Transaktionsdaten (Datum, Beschreibung, Betrag, Kategorie) werden in der Datenbank gesichert.

---

## Nächste Schritte / Erweiterungen

- [ ] Kategorie-Verwaltung UI (erstellen, bearbeiten, Farben)
- [ ] Monatliche Detailansicht (welche Monate überschritten?)
- [ ] Export als Excel/PDF
- [ ] Budget-Ziele und Warnungen
- [ ] Mobile App (React Native / Capacitor)
- [ ] Mehrwährungs-Support
