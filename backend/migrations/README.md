# Database Migrations

## Add Consiliu Unit Type

Pentru a adăuga valoarea `consiliu` la enum-ul `UnitType` și a crea unitatea Consiliul de Conducere în toate versiunile:

```bash
cd backend
python apply_consiliu_enum_migration.py
python add_consiliu_unit.py
```

Sau manual în PostgreSQL:

```sql
ALTER TYPE unittype ADD VALUE IF NOT EXISTS 'consiliu';
```

Această migrație adaugă tipul special de unitate "consiliu" pentru Consiliul de Conducere, care este o unitate editabilă dar nu se calculează la totaluri.

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
