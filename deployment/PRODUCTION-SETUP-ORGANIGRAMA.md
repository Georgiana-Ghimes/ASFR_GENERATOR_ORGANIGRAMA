# 🚀 Ghid Complet Production Setup - ASFR Generator Organigramă

## Cuprins
1. [Pregătire VM Ubuntu](#1-pregătire-vm-ubuntu)
2. [Instalare dependențe](#2-instalare-dependențe)
3. [Configurare PostgreSQL](#3-configurare-postgresql)
4. [Configurare aplicație](#4-configurare-aplicație)
5. [Configurare Nginx](#5-configurare-nginx)
6. [Configurare systemd (Process Manager)](#6-configurare-systemd)
7. [CI/CD cu GitHub Actions](#7-cicd-cu-github-actions)
8. [Zero-downtime deployment](#8-zero-downtime-deployment)
9. [Backup automat bază de date](#9-backup-automat-bază-de-date)
10. [Logging și monitorizare](#10-logging-și-monitorizare)
11. [Checklist final](#11-checklist-final)
12. [Troubleshooting](#12-troubleshooting)

---

> **Context:** Această aplicație este a treia pe VM-ul `10.10.20.186`.
> - LPAD (Liste Autorizații) → port Nginx **8080**, backend Node.js pe **3001**
> - App2 → port Nginx **8081**
> - **Generator Organigramă** → port Nginx **8082**, backend Python/FastAPI pe **8000**

---

## 1. Pregătire VM Ubuntu

### 1.1 Conectare SSH la VM
```bash
ssh georgiana@10.10.20.186
su - asfr
```

> Userul `asfr` ar trebui să existe deja de la setup-ul LPAD. Dacă nu, creează-l:
> ```bash
> sudo adduser asfr && sudo usermod -aG sudo asfr
> ```

---

## 2. Instalare dependențe

### 2.1 Instalare Python 3.11+ și pip
```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version   # trebuie să fie 3.11+
```

### 2.2 Instalare Node.js 20 (pentru frontend build)
> Dacă e deja instalat de la LPAD, sari peste acest pas.
```bash
node --version   # verifică dacă există
# Dacă nu:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2.3 Nginx și PostgreSQL
> Ar trebui să fie deja instalate de la LPAD. Verifică:
```bash
nginx -v
psql --version
```

---

## 3. Configurare PostgreSQL

### 3.1 Creare user și bază de date
```bash
sudo -u postgres psql
```

```sql
CREATE USER organigrama_user WITH PASSWORD 'Feroviar_Org_2026!';
CREATE DATABASE organigrama_db OWNER organigrama_user;
GRANT ALL PRIVILEGES ON DATABASE organigrama_db TO organigrama_user;
\q
```

### 3.2 Configurare acces local
```bash
# Editează pg_hba.conf (înlocuiește XX cu versiunea PostgreSQL)
sudo nano /etc/postgresql/XX/main/pg_hba.conf
```

Adaugă (dacă nu există deja o regulă generică):
```
host    all   organigrama_user   127.0.0.1/32   md5
```

```bash
sudo systemctl restart postgresql
```

### 3.3 Test conexiune
```bash
psql -U organigrama_user -d organigrama_db -h 127.0.0.1
\q
```

---

## 4. Configurare aplicație

### 4.1 Structura de directoare
```bash
sudo mkdir -p /var/www/organigrama
sudo chown asfr:asfr /var/www/organigrama
```

Structura finală:
```
/var/www/organigrama/
├── current/          ← versiunea activă (symlink)
├── releases/
│   └── v1.0.0/
├── shared/
│   ├── backend.env   ← variabile backend
│   └── frontend.env  ← variabile frontend (VITE_API_URL)
├── venv/             ← Python virtual environment (persistent)
└── backups/          ← backup-uri bază de date
```

### 4.2 Creare structură
```bash
mkdir -p /var/www/organigrama/releases
mkdir -p /var/www/organigrama/shared
mkdir -p /var/www/organigrama/backups
```

### 4.3 Creare Python virtual environment (o singură dată)
```bash
python3 -m venv /var/www/organigrama/venv
```

### 4.4 Configurare fișiere .env

```bash
nano /var/www/organigrama/shared/backend.env
```

Conținut `backend.env`:
```env
DATABASE_URL=postgresql://organigrama_user:Feroviar_Org_2026!@127.0.0.1:5432/organigrama_db
SECRET_KEY=organigrama_jwt_secret_sigurantaferoviara_2026_cheie_foarte_lunga
TURNSTILE_SECRET_KEY=0x4AAAAAAChSWpW5VGcjCW6vmJbhoVmkzzs
```

```bash
nano /var/www/organigrama/shared/frontend.env
```

Conținut `frontend.env`:
```env
VITE_API_URL=http://10.10.20.186:8082/api
```

> ⚠️ `VITE_API_URL` e injectat la **build time**. Dacă schimbi portul/domeniul, trebuie rebuild.

### 4.5 Primul deploy manual (bootstrap)
```bash
cd /var/www/organigrama/releases
git clone https://github.com/Georgiana-Ghimes/ASFR_GENERATOR_ORGANIGRAMA.git v1.0.0
cd v1.0.0

# Link fișiere shared
ln -sf /var/www/organigrama/shared/frontend.env .env
ln -sf /var/www/organigrama/shared/backend.env backend/.env

# Instalare dependențe backend
source /var/www/organigrama/venv/bin/activate
cd backend
pip install -r requirements.txt
cd ..

# Instalare dependențe frontend și build
npm ci
npm run build

# Activare versiune
ln -sfn /var/www/organigrama/releases/v1.0.0 /var/www/organigrama/current
```

### 4.6 Inițializare bază de date

Rulează migrările SQL manual:
```bash
cd /var/www/organigrama/current/backend

# Aplică fiecare migrare în ordine
for f in migrations/*.sql; do
    echo "Aplicare: $f"
    PGPASSWORD='Feroviar_Org_2026!' psql -U organigrama_user -h 127.0.0.1 -d organigrama_db -f "$f"
done
```

Verificare:
```bash
PGPASSWORD='Feroviar_Org_2026!' psql -U organigrama_user -h 127.0.0.1 -d organigrama_db \
  -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
```

### 4.7 Restaurare date din backup (opțional)

Dacă ai un backup `.dump` de pe mașina locală:
```bash
# Copiază backup-ul pe VM (de pe mașina locală)
scp backend/backups/organigrama_backup_2026-03-31.dump asfr@10.10.20.186:/var/www/organigrama/backups/

# Pe VM, restaurează
PGPASSWORD='Feroviar_Org_2026!' pg_restore \
    --host=127.0.0.1 --port=5432 \
    --username=organigrama_user \
    --dbname=organigrama_db \
    --clean --if-exists --no-owner --no-privileges \
    /var/www/organigrama/backups/organigrama_backup_2026-03-31.dump
```

---

## 5. Configurare Nginx

### 5.1 Creare configurație site
```bash
sudo nano /etc/nginx/sites-available/organigrama
```

Conținut:
```nginx
server {
    listen 8082;
    server_name 10.10.20.186;

    access_log /var/log/nginx/organigrama_access.log;
    error_log  /var/log/nginx/organigrama_error.log;

    client_max_body_size 50M;

    # Frontend - fișiere statice
    location / {
        root /var/www/organigrama/current/dist;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API (FastAPI pe port 8000)
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### 5.2 Activare site
```bash
sudo ln -s /etc/nginx/sites-available/organigrama /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Configurare systemd

> Backend-ul e Python/FastAPI, deci folosim **systemd** în loc de PM2.

### 6.1 Creare serviciu systemd
```bash
sudo nano /etc/systemd/system/organigrama.service
```

Conținut:
```ini
[Unit]
Description=ASFR Generator Organigrama Backend
After=network.target postgresql.service

[Service]
Type=simple
User=asfr
Group=asfr
WorkingDirectory=/var/www/organigrama/current/backend
EnvironmentFile=/var/www/organigrama/shared/backend.env
ExecStart=/var/www/organigrama/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

# Logging
StandardOutput=append:/var/log/organigrama/backend-out.log
StandardError=append:/var/log/organigrama/backend-error.log

[Install]
WantedBy=multi-user.target
```

### 6.2 Creare director logs
```bash
sudo mkdir -p /var/log/organigrama
sudo chown asfr:asfr /var/log/organigrama
```

### 6.3 Pornire serviciu
```bash
sudo systemctl daemon-reload
sudo systemctl enable organigrama
sudo systemctl start organigrama
```

### 6.4 Verificare
```bash
sudo systemctl status organigrama
curl -s http://127.0.0.1:8000/health
# Trebuie să returneze: {"status":"ok"}

# Test prin Nginx
curl -s http://127.0.0.1:8082/api/health
```

---

## 7. CI/CD cu GitHub Actions

### 7.1 GitHub Secrets

> Dacă secretele `VM_HOST`, `VM_USER`, `VM_SSH_KEY`, `VM_PORT` sunt deja configurate pe alt repo de pe același VM, poți reutiliza aceleași valori.

Pe `https://github.com/Georgiana-Ghimes/ASFR_GENERATOR_ORGANIGRAMA` → Settings → Secrets → Actions:

| Name | Valoare |
|------|---------|
| `VM_HOST` | `10.10.20.186` |
| `VM_USER` | `asfr` |
| `VM_SSH_KEY` | cheia privată `~/.ssh/github_actions` |
| `VM_PORT` | `22` |

### 7.2 Creare workflow
Creează `.github/workflows/deploy.yml` în repository:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VM
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USER }}
          key: ${{ secrets.VM_SSH_KEY }}
          port: ${{ secrets.VM_PORT }}
          script: |
            /var/www/organigrama/deploy.sh ${{ github.sha }}
```

---

## 8. Zero-downtime deployment

### 8.1 Script de deploy
```bash
nano /var/www/organigrama/deploy.sh
chmod +x /var/www/organigrama/deploy.sh
```

Conținut:
```bash
#!/bin/bash
set -e

COMMIT_SHA=${1:-$(date +%Y%m%d_%H%M%S)}
RELEASE_DIR="/var/www/organigrama/releases/${COMMIT_SHA}"
SHARED_DIR="/var/www/organigrama/shared"
CURRENT_LINK="/var/www/organigrama/current"
VENV="/var/www/organigrama/venv"
REPO_URL="https://github.com/Georgiana-Ghimes/ASFR_GENERATOR_ORGANIGRAMA.git"

echo "🚀 [$(date)] Deploy commit: ${COMMIT_SHA}"

# 1. Backup DB
echo "📦 Backup bază de date..."
/var/www/organigrama/backup.sh

# 2. Clone
echo "📥 Clone repository..."
git clone --depth 1 "${REPO_URL}" "${RELEASE_DIR}"
cd "${RELEASE_DIR}"

# 3. Link shared
echo "🔗 Link fișiere shared..."
ln -sf "${SHARED_DIR}/frontend.env" .env
ln -sf "${SHARED_DIR}/backend.env" backend/.env

# 4. Backend dependencies
echo "📦 Instalare dependențe backend..."
source "${VENV}/bin/activate"
cd backend && pip install -r requirements.txt --quiet && cd ..

# 5. Frontend build
echo "📦 Instalare dependențe frontend..."
npm ci --production=false

echo "🔨 Build frontend..."
npm run build

# 6. Migrări SQL (aplică doar cele noi)
echo "🗄️ Verificare migrări..."
cd "${RELEASE_DIR}/backend"
for f in migrations/*.sql; do
    echo "  Aplicare: $(basename $f)"
    PGPASSWORD='Feroviar_Org_2026!' psql -U organigrama_user -h 127.0.0.1 -d organigrama_db -f "$f" 2>/dev/null || true
done
cd "${RELEASE_DIR}"

# 7. Activare versiune
echo "🔄 Activare versiune..."
ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

# 8. Restart backend
echo "♻️ Restart backend..."
sudo systemctl restart organigrama

# 9. Reload Nginx
echo "🌐 Reload Nginx..."
sudo systemctl reload nginx

# 10. Curățare (păstrează ultimele 5)
echo "🧹 Curățare versiuni vechi..."
cd /var/www/organigrama/releases
ls -t | tail -n +6 | xargs -r rm -rf

echo "✅ [$(date)] Deploy finalizat! Versiune: ${COMMIT_SHA}"
```

### 8.2 Configurare sudo fără parolă
```bash
sudo visudo
```

Adaugă (dacă nu există deja):
```
asfr ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart organigrama, /usr/bin/systemctl reload nginx
```

### 8.3 Script rollback
```bash
nano /var/www/organigrama/rollback.sh
chmod +x /var/www/organigrama/rollback.sh
```

Conținut:
```bash
#!/bin/bash
RELEASES_DIR="/var/www/organigrama/releases"
CURRENT_LINK="/var/www/organigrama/current"
PREVIOUS=$(ls -t "${RELEASES_DIR}" | sed -n '2p')

if [ -z "${PREVIOUS}" ]; then
    echo "❌ Nu există versiune anterioară!"
    exit 1
fi

echo "⏪ Rollback la: ${PREVIOUS}"
ln -sfn "${RELEASES_DIR}/${PREVIOUS}" "${CURRENT_LINK}"
sudo systemctl restart organigrama
sudo systemctl reload nginx
echo "✅ Rollback finalizat!"
```

---

## 9. Backup automat bază de date

### 9.1 Script backup
```bash
nano /var/www/organigrama/backup.sh
chmod +x /var/www/organigrama/backup.sh
```

Conținut:
```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/www/organigrama/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql.gz"

echo "📦 [$(date)] Backup organigrama_db..."

PGPASSWORD='Feroviar_Org_2026!' pg_dump \
    -U organigrama_user -h 127.0.0.1 -d organigrama_db \
    --no-password | gzip > "${BACKUP_FILE}"

echo "✅ Backup: ${BACKUP_FILE} ($(du -sh ${BACKUP_FILE} | cut -f1))"

# Păstrează ultimele 30 zile
find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +30 -delete
```

### 9.2 Cron zilnic
```bash
crontab -e
```

Adaugă:
```cron
# Backup organigrama zilnic la 02:30
30 2 * * * /var/www/organigrama/backup.sh >> /var/log/organigrama/backup.log 2>&1
```

---

## 10. Logging și monitorizare

### 10.1 Loguri
```bash
# Backend live
sudo journalctl -u organigrama -f

# Sau din fișier
tail -f /var/log/organigrama/backend-out.log
tail -f /var/log/organigrama/backend-error.log

# Nginx
tail -f /var/log/nginx/organigrama_access.log
tail -f /var/log/nginx/organigrama_error.log
```

### 10.2 Health check automat
```bash
nano /var/www/organigrama/healthcheck.sh
chmod +x /var/www/organigrama/healthcheck.sh
```

Conținut:
```bash
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/health 2>/dev/null)
if [ "$response" != "200" ]; then
    echo "[$(date)] ❌ API DOWN (HTTP: ${response}) - Restart..." >> /var/log/organigrama/healthcheck.log
    sudo systemctl restart organigrama
else
    echo "[$(date)] ✅ OK" >> /var/log/organigrama/healthcheck.log
fi
```

```bash
crontab -e
```

Adaugă:
```cron
*/5 * * * * /var/www/organigrama/healthcheck.sh
```

### 10.3 Logrotate
```bash
sudo nano /etc/logrotate.d/organigrama
```

Conținut:
```
/var/log/organigrama/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 asfr asfr
}
```

---

## 11. Checklist final

### Prima instalare
- [ ] Python 3.11+ instalat
- [ ] Node.js 20 instalat (pentru build)
- [ ] PostgreSQL: user `organigrama_user` și DB `organigrama_db` create
- [ ] Structura `/var/www/organigrama/` creată
- [ ] Python venv creat în `/var/www/organigrama/venv/`
- [ ] Fișiere `.env` configurate în `shared/`
- [ ] Primul deploy manual rulat
- [ ] Migrări SQL aplicate
- [ ] Nginx configurat pe port **8082**
- [ ] Serviciu systemd `organigrama` creat și pornit
- [ ] GitHub Secrets configurate
- [ ] GitHub Actions workflow creat
- [ ] Script `deploy.sh` creat și testat
- [ ] Script `rollback.sh` creat
- [ ] Backup automat configurat (cron)
- [ ] Health check configurat (cron)

### Comenzi utile
```bash
# Status
sudo systemctl status organigrama

# Loguri live
sudo journalctl -u organigrama -f

# Restart manual
sudo systemctl restart organigrama

# Rollback
/var/www/organigrama/rollback.sh

# Backup manual
/var/www/organigrama/backup.sh

# Test API
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8082/api/health
```

---

## 12. Troubleshooting

### Backend nu pornește
```bash
sudo systemctl status organigrama
sudo journalctl -u organigrama --lines 50

# Cauze comune:
# 1. Venv nu are dependențele instalate
source /var/www/organigrama/venv/bin/activate
cd /var/www/organigrama/current/backend
pip install -r requirements.txt

# 2. DATABASE_URL greșit
cat /var/www/organigrama/shared/backend.env

# 3. Port 8000 ocupat
sudo lsof -i :8000
```

### 502 Bad Gateway
```bash
# Backend rulează?
curl http://127.0.0.1:8000/health

# Nginx configurat corect?
sudo nginx -t
cat /etc/nginx/sites-enabled/organigrama
```

### Frontend 404
```bash
# Build-ul există?
ls /var/www/organigrama/current/dist/index.html

# Dacă nu:
cd /var/www/organigrama/current
npm run build
sudo systemctl reload nginx
```

### DB conexiune eșuează
```bash
PGPASSWORD='Feroviar_Org_2026!' psql -U organigrama_user -h 127.0.0.1 -d organigrama_db -c "SELECT 1;"
```

---

## Rezumat porturi pe VM

| Aplicație | Backend port | Nginx port | Repo |
|-----------|-------------|------------|------|
| LPAD (Liste) | 3001 (Node.js) | 8080 | ASFR-Sistem-Gestionare-Liste-Atestate |
| App2 | 3002 | 8081 | — |
| **Organigrama** | **8000 (Python)** | **8082** | **ASFR_GENERATOR_ORGANIGRAMA** |
