# Database Migrations

## Add Custom Legend Unit

Pentru a adăuga unitatea Legend editabilă cu 3 coloane:

```bash
cd backend
python apply_legend_migration.py
python add_legend_unit.py
```

Sau manual în PostgreSQL:

```sql
ALTER TYPE unittype ADD VALUE IF NOT EXISTS 'legend';

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS legend_col1 VARCHAR;

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS legend_col2 VARCHAR;

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS legend_col3 VARCHAR;
```

Această migrație adaugă tipul special de unitate "legend" pentru legenda editabilă cu 3 coloane personalizabile.

## Add Director General Fields

Pentru a adăuga câmpurile `director_title` și `director_name` pentru unitatea Director General:

```bash
cd backend
python apply_director_fields_migration.py
```

Sau manual în PostgreSQL:

```sql
ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS director_title VARCHAR;

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS director_name VARCHAR;

UPDATE organizational_units 
SET director_title = 'DIRECTOR GENERAL',
    director_name = 'Petru BOGDAN'
WHERE unit_type = 'director_general' 
  AND (director_title IS NULL OR director_name IS NULL);
```

Această migrație adaugă câmpuri pentru a stoca funcția și numele directorului general, făcând casuta editabilă.

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
