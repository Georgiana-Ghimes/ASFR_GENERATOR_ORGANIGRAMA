# Database Migrations

## Add Chart Title Column

Pentru a adăuga coloana `chart_title` în tabelul `org_versions`, rulează:

```bash
cd backend
python apply_migration.py
```

Sau manual în PostgreSQL:

```sql
ALTER TABLE org_versions 
ADD COLUMN IF NOT EXISTS chart_title VARCHAR DEFAULT 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026';
```

Această coloană stochează titlul personalizabil al organigramei pentru fiecare versiune.
