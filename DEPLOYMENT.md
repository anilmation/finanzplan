# Finanzplan — Web Deployment Guide

## Sicherheitsübersicht

Nach diesem Hardening sind folgende Schutzmassnahmen aktiv:

- ✅ Security Headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Rate Limiting auf API-Routen (60 req/min pro IP)
- ✅ Input Validierung (Zod) auf allen API-Endpoints
- ✅ Row Level Security (Supabase) — User sieht nur eigene Daten
- ✅ JWT-Token Validierung mit Format-Check
- ✅ Next.js 14.2.29 (gepatchte Version)
- ✅ HTTPS erzwungen via HSTS
- ✅ Kein SQL-Injection-Risiko (Prisma ORM mit Prepared Statements)

## MFA einrichten (Google Authenticator)

MFA wird über **Supabase Auth** konfiguriert:

### 1. MFA in Supabase aktivieren

Gehe zu: Supabase Dashboard → Authentication → Sign In Methods → Multi Factor Authentication

- **TOTP** aktivieren (Time-based One-Time Password = Google Authenticator)
- "Allow users to enroll MFA" aktivieren

### 2. MFA-Enrollment UI hinzufügen

In der App unter Einstellungen → Sicherheit kannst du MFA einrichten.
Supabase stellt dafür die nötigen Funktionen bereit:

```typescript
// MFA Setup starten
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'Google Authenticator'
})
// data.totp.qr_code → QR-Code anzeigen
// data.totp.secret → manueller Code

// MFA verifizieren
const { data, error } = await supabase.auth.mfa.challengeAndVerify({
  factorId: data.id,
  code: '123456' // vom Authenticator
})
```

### 3. MFA beim Login erzwingen

Nach Login prüfen ob MFA-Challenge nötig ist:

```typescript
const { data: { user } } = await supabase.auth.getUser()
const { data: factors } = await supabase.auth.mfa.listFactors()

if (factors?.totp?.length > 0) {
  // MFA-Challenge anzeigen
  const { data } = await supabase.auth.mfa.challenge({
    factorId: factors.totp[0].id
  })
}
```

---

## Web-Deployment Optionen

### Option A: Vercel + Supabase (empfohlen, einfachste)

**Kosten**: Vercel Free (bis 100GB Bandwidth), Supabase Free (bis 500MB DB)

1. Code auf GitHub pushen:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/DEIN_USER/finanzplan.git
git push -u origin main
```

2. Auf [vercel.com](https://vercel.com) → "Import Project" → GitHub-Repo wählen

3. Environment Variables in Vercel setzen:
```
NEXT_PUBLIC_SUPABASE_URL=https://khtfnertusegemqornmj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

4. Deploy klicken → App ist live unter `https://finanzplan.vercel.app`

5. Custom Domain (optional): Vercel → Settings → Domains → `finanzplan.deine-domain.ch` hinzufügen

---

### Option B: Railway (einfach, alles in einem)

**Kosten**: ~$5/Monat (PostgreSQL + App)

1. Account auf [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. PostgreSQL-Datenbank hinzufügen → Connection String kopieren
4. Environment Variables setzen
5. Automatisch deployed bei jedem Git-Push

---

### Option C: Hetzner VPS (günstigste für CH)

**Kosten**: ~€4/Monat für CX11 (2GB RAM)

1. VPS bei [hetzner.com](https://hetzner.com) mieten (Ubuntu 22.04)
2. Gleiche Docker-Konfiguration wie auf NAS verwenden
3. Nginx als Reverse Proxy mit SSL (Let's Encrypt):

```nginx
server {
    listen 80;
    server_name finanzplan.deine-domain.ch;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name finanzplan.deine-domain.ch;

    ssl_certificate /etc/letsencrypt/live/finanzplan.deine-domain.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/finanzplan.deine-domain.ch/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

SSL-Zertifikat automatisch:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d finanzplan.deine-domain.ch
```

---

### Option D: NAS mit Domain (aktuelle Lösung verbessern)

Du hast bereits das NAS — einfach erreichbar machen:

1. **DynDNS** einrichten (Synology hat das eingebaut):
   - DSM → Systemsteuerung → Externer Zugriff → DDNS
   - Synology-Konto: `dein-name.synology.me`

2. **Port-Forwarding** am Router: Port 443 → NAS IP 192.168.1.140:443

3. **Reverse Proxy** in Synology:
   - DSM → Systemsteuerung → Anmeldungsportal → Erweitert → Reverse Proxy
   - Quelle: HTTPS Port 443, `finanzplan.dein-name.synology.me`
   - Ziel: HTTP, localhost, Port 3000

4. **SSL-Zertifikat** via Synology Let's Encrypt:
   - DSM → Systemsteuerung → Sicherheit → Zertifikat → Hinzufügen → Let's Encrypt

---

## Migrations-Checkliste für Web

- [ ] Next.js auf neueste Version updaten
- [ ] Starkes DB-Passwort setzen
- [ ] ANTHROPIC_API_KEY nur wenn PDF-Feature gewünscht
- [ ] Supabase MFA aktivieren
- [ ] Custom Domain einrichten
- [ ] SSL/HTTPS erzwingen
- [ ] Backups auf externen Storage (z.B. Backblaze B2)
- [ ] Monitoring einrichten (z.B. UptimeRobot, kostenlos)

## Empfehlung für deinen Fall

Da du bereits Supabase nutzt: **Option A (Vercel)** ist am einfachsten.
Die App ist in 30 Minuten live, kostenlos, und skaliert automatisch.

Wenn du die Daten lieber selbst hostest: **Option D (NAS mit Domain)** ist bereits 80% fertig.
