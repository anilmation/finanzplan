# Finanzplan auf Synology NAS installieren

## Voraussetzungen
- Synology NAS mit Docker (Container Manager) installiert
- SSH-Zugang zum NAS aktiviert (Systemsteuerung → Terminal → SSH aktivieren)
- Mindestens 2 GB freier RAM

---

## Schritt 1 — Dateien auf NAS kopieren

Verbinde dich per SSH mit deinem NAS:
```bash
ssh dein-benutzername@NAS-IP-ADRESSE
```
Beispiel: `ssh admin@192.168.1.100`

Erstelle einen Ordner für die App:
```bash
mkdir -p /volume1/docker/finanzplan
cd /volume1/docker/finanzplan
```

Kopiere den Finanzplan-Ordner auf dein NAS. Am einfachsten mit dem Synology File Station:
- Öffne File Station im Synology DSM
- Navigiere zu `docker/`
- Erstelle Ordner `finanzplan`
- Lade den entpackten Projektordner hoch

Oder per SCP von deinem Windows-PC (in PowerShell):
```powershell
scp -r C:\Users\anilu\Downloads\finanzplan\finanzplan\* admin@192.168.1.100:/volume1/docker/finanzplan/
```

---

## Schritt 2 — Umgebungsvariablen konfigurieren

Auf dem NAS (per SSH):
```bash
cd /volume1/docker/finanzplan
cp .env.nas .env
nano .env
```

Die `.env` Datei anpassen:
```
DB_PASSWORD=WähleEinSicheresPasswort
NEXT_PUBLIC_SUPABASE_URL=https://khtfnertusegemqornmj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_U9I8-crIa1OB-cxCECxUaw_o6a76bJg
```

Speichern: `Ctrl+X` → `Y` → Enter

---

## Schritt 3 — Docker Container starten

```bash
cd /volume1/docker/finanzplan
docker compose up -d --build
```

Der erste Start dauert 5–10 Minuten (Node.js App wird gebaut).

Status prüfen:
```bash
docker compose logs -f app
```

Warte bis du siehst: `✓ Ready in Xms`

---

## Schritt 4 — App aufrufen

Öffne im Browser:
```
http://NAS-IP-ADRESSE:3000
```
Beispiel: `http://192.168.1.100:3000`

---

## Von überall erreichbar machen (optional)

### Option A: Synology QuickConnect (einfach)
- DSM → Systemsteuerung → QuickConnect
- QuickConnect aktivieren
- Dann kannst du einen Port-Forwarding-Eintrag für Port 3000 einrichten

### Option B: Synology Reverse Proxy (empfohlen)
- DSM → Systemsteuerung → Anmeldungsportal → Erweitert → Reverse Proxy
- Neue Regel erstellen:
  - Quelle: `finanzplan.deine-domain.ch` Port 443
  - Ziel: `localhost` Port 3000

### Option C: Tailscale (am einfachsten für privaten Zugriff)
- Tailscale auf NAS und Handy/PC installieren
- Dann erreichbar über `http://nas-tailscale-ip:3000`

---

## Nützliche Befehle

```bash
# App neu starten
docker compose restart app

# Logs anzeigen
docker compose logs -f app

# App stoppen
docker compose down

# App aktualisieren (nach Code-Änderungen)
docker compose up -d --build app

# Datenbank-Backup
docker exec finanzplan-db pg_dump -U finanzplan finanzplan > backup.sql
```

---

## Automatischer Start nach NAS-Neustart

Docker Container sind bereits mit `restart: unless-stopped` konfiguriert —
sie starten automatisch wenn das NAS neu startet.
