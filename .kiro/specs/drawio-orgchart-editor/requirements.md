# Document de Cerințe

## Introducere

Înlocuirea componentei actuale de organigramă (DeterministicOrgChart.jsx) cu un editor de tip canvas liber, inspirat din draw.io. Editorul actual folosește un algoritm de layout determinist care poziționează automat unitățile, cauzând probleme de layout (unități împinse la stânga/dreapta, referințe circulare, pierderea controlului asupra poziționării). Noul editor va oferi control complet manual asupra poziționării tuturor elementelor pe un canvas infinit cu grid snapping, păstrând toate funcționalitățile existente (versiuni, ierarhie, culori, statistici, snapshot-uri).

**Principiu fundamental**: Pozițiile existente ale unităților (custom_x, custom_y, custom_width, custom_height) din baza de date reprezintă layout-ul corect și trebuie respectate exact. Noul editor NU va folosi niciun algoritm de auto-layout. Ierarhia vizuală (Consiliu → Director General → Direcții → Servicii → Compartimente) trebuie păstrată exact ca în starea curentă, cu aceleași proporții, spațieri și aranjament. Editorul doar citește pozițiile din DB și le afișează fidel, iar modificările se fac exclusiv prin drag & drop manual.

## Glosar

- **Canvas**: Suprafața de lucru infinită pe care se plasează unitățile organizatorice, cu suport pentru pan și zoom
- **Editor**: Componenta React principală care înlocuiește DeterministicOrgChart.jsx
- **Unitate**: O unitate organizatorică (OrgUnit) reprezentată vizual ca un dreptunghi pe canvas
- **Conector**: Linia de legătură vizuală între o unitate părinte și unitățile copil
- **Grid**: Grila de aliniere de 20px folosită pentru snap-ul pozițiilor
- **Nod_Fix**: Element special pe canvas care nu face parte din ierarhia de unități (Consiliu de Conducere, Director General, Legendă, titluri)
- **Panoul_Lateral**: Panoul din dreapta care se deschide la selectarea unei unități pentru editare
- **Versiune**: O versiune a organigramei (draft, pending_approval, approved, archived)
- **Minimap**: O reprezentare miniaturală a întregului canvas, afișată într-un colț, pentru navigare rapidă
- **Batch_Save**: Mecanism de salvare care trimite toate pozițiile modificate într-un singur request API

## Cerințe

### Cerința 1: Canvas Infinit cu Pan și Zoom

**User Story:** Ca editor, vreau un canvas infinit cu pan și zoom, astfel încât să pot naviga liber prin organigramă indiferent de dimensiunea acesteia.

#### Criterii de Acceptare

1. THE Canvas SHALL afișa o grilă de fundal cu celule de 20px, vizibilă la toate nivelurile de zoom
2. WHEN utilizatorul ține apăsat click-ul stâng pe o zonă goală a canvas-ului și mișcă mouse-ul, THE Canvas SHALL deplasa vizualizarea (pan) în direcția mișcării mouse-ului
3. WHEN utilizatorul folosește scroll-ul mouse-ului, THE Canvas SHALL modifica nivelul de zoom centrat pe poziția cursorului
4. THE Canvas SHALL limita nivelul de zoom între 0.1 (10%) și 3.0 (300%)
5. WHEN utilizatorul apasă combinația Ctrl+0, THE Canvas SHALL reseta zoom-ul la 100% și centrarea la originea canvas-ului
6. WHEN utilizatorul apasă combinația Ctrl+1, THE Canvas SHALL face fit-to-content, ajustând zoom-ul și pan-ul pentru a afișa toate unitățile vizibile

### Cerința 2: Randare Unități pe Canvas

**User Story:** Ca editor, vreau ca unitățile organizatorice să fie afișate ca dreptunghiuri pe canvas la pozițiile lor custom_x/custom_y, astfel încât să văd organigrama exact cum a fost aranjată manual.

#### Criterii de Acceptare

1. WHEN canvas-ul se încarcă, THE Editor SHALL poziționa fiecare Unitate la coordonatele custom_x și custom_y din baza de date, fără nicio recalculare sau ajustare automată
2. IF o Unitate nu are custom_x sau custom_y definite, THEN THE Editor SHALL poziționa Unitatea sub unitatea părinte (dacă există) sau la coordonatele (100, 100), și o va marca vizual ca nepoziționată (border punctat)
3. THE Editor SHALL afișa pe fiecare Unitate: codul STAS, numele unității, numărul de posturi de conducere și numărul de posturi de execuție
4. THE Editor SHALL aplica culoarea unității ca bandă colorată pe marginea stângă a dreptunghiului (mod strip), sau ca fundal complet (mod full) conform câmpului color al unității
5. WHEN o Unitate are câmpul is_rotated setat pe true, THE Editor SHALL randa Unitatea rotită la 90 de grade
6. THE Editor SHALL afișa Nodurile_Fixe (Consiliu de Conducere, Director General, Legendă) ca elemente distincte pe canvas, cu stilizare specifică fiecărui tip
7. THE Editor SHALL respecta dimensiunile custom_width și custom_height din baza de date; dacă nu sunt definite, va folosi dimensiunile implicite (320px lățime, 45px înălțime)
8. THE Editor SHALL păstra exact stilizarea vizuală actuală a unităților (fonturi, borduri, culori, strip lateral cu numere posturi) pentru a asigura continuitate vizuală cu layout-ul existent

### Cerința 3: Drag & Drop Manual al Unităților

**User Story:** Ca editor, vreau să pot muta unitățile prin drag & drop pe canvas, astfel încât să am control complet asupra layout-ului organigramei.

#### Criterii de Acceptare

1. WHEN utilizatorul ține apăsat click-ul stâng pe o Unitate și mișcă mouse-ul, THE Editor SHALL muta Unitatea urmărind cursorul
2. WHEN utilizatorul eliberează click-ul după drag, THE Editor SHALL alinia (snap) poziția finală a Unității la cea mai apropiată intersecție a Grid-ului de 20px
3. WHILE utilizatorul face drag pe o Unitate, THE Editor SHALL afișa ghidaje vizuale (linii punctate) când Unitatea se aliniază orizontal sau vertical cu alte unități din apropiere
4. WHEN utilizatorul finalizează un drag, THE Editor SHALL salva noile coordonate custom_x și custom_y ale Unității prin API-ul PATCH /units/{id}
5. WHILE versiunea selectată nu este în starea draft, THE Editor SHALL dezactiva funcționalitatea de drag & drop pentru toate unitățile
6. THE Editor SHALL preveni suprapunerea completă a unităților prin afișarea unui indicator vizual de avertizare când o Unitate este plasată peste o altă Unitate

### Cerința 4: Redimensionare Unități

**User Story:** Ca editor, vreau să pot redimensiona unitățile prin handle-uri de resize, astfel încât să pot ajusta dimensiunile fiecărei unități individual.

#### Criterii de Acceptare

1. WHEN utilizatorul selectează o Unitate, THE Editor SHALL afișa handle-uri de redimensionare pe cele 4 colțuri și pe cele 4 laturi ale Unității
2. WHEN utilizatorul trage un handle de redimensionare, THE Editor SHALL modifica dimensiunile Unității urmărind cursorul
3. WHEN utilizatorul finalizează redimensionarea, THE Editor SHALL alinia dimensiunile finale la multipli de 20px (Grid)
4. THE Editor SHALL impune o dimensiune minimă de 100px lățime și 40px înălțime pentru orice Unitate
5. WHEN utilizatorul finalizează redimensionarea, THE Editor SHALL salva noile valori custom_width și custom_height prin API-ul PATCH /units/{id}

### Cerința 5: Conectori între Unități

**User Story:** Ca editor, vreau ca liniile de conexiune între unitățile părinte și copil să fie desenate automat, astfel încât ierarhia organizatorică să fie vizibilă.

#### Criterii de Acceptare

1. THE Editor SHALL desena un Conector de la centrul marginii inferioare a unității părinte la centrul marginii superioare a fiecărei unități copil
2. WHEN o Unitate este mutată prin drag, THE Editor SHALL actualiza în timp real toate Conectorii asociați (atât cei de la părinte, cât și cei către copii)
3. THE Editor SHALL desena Conectorii folosind linii ortogonale (doar segmente orizontale și verticale) cu colțuri la 90 de grade
4. THE Editor SHALL desena Conectorii cu un z-index inferior unităților, astfel încât liniile să fie vizibile dar să nu acopere conținutul unităților
5. WHEN mai multe unități copil au același părinte, THE Editor SHALL grupa Conectorii printr-o linie orizontală comună de la care pleacă linii verticale către fiecare copil
6. THE Editor SHALL desena Conectorii exact în stilul actual: linie de la marginea stângă a părintelui, linie verticală de distribuție, și ramuri orizontale către fiecare copil (pattern-ul existent din DeterministicOrgChart)

### Cerința 6: Selectare și Editare Unități

**User Story:** Ca editor, vreau să pot selecta unități prin click și să le editez prin panoul lateral, astfel încât să pot modifica proprietățile fiecărei unități.

#### Criterii de Acceptare

1. WHEN utilizatorul face click pe o Unitate, THE Editor SHALL marca Unitatea ca selectată (evidențiere vizuală cu border albastru) și va deschide Panoul_Lateral cu detaliile unității
2. WHEN utilizatorul face click pe o zonă goală a canvas-ului, THE Editor SHALL deselecta Unitatea curentă și va închide Panoul_Lateral
3. WHEN utilizatorul apasă tasta Escape, THE Editor SHALL deselecta Unitatea curentă și va închide Panoul_Lateral
4. WHEN utilizatorul face click-dreapta pe o Unitate, THE Editor SHALL afișa un meniu contextual cu opțiunile: Editare, Adaugă Copil, Șterge, Rotire
5. WHEN utilizatorul selectează opțiunea Rotire din meniul contextual, THE Editor SHALL comuta starea is_rotated a Unității și va salva prin API
6. WHEN utilizatorul apasă tasta R cu o Unitate selectată, THE Editor SHALL comuta starea is_rotated a Unității (shortcut de la tastatură)

### Cerința 7: Compatibilitate cu Sistemul de Versiuni

**User Story:** Ca editor, vreau ca editorul de canvas să respecte starea versiunii (draft/approved), astfel încât versiunile aprobate să fie protejate de modificări accidentale.

#### Criterii de Acceptare

1. WHILE versiunea selectată are starea approved, THE Editor SHALL afișa canvas-ul în mod read-only (fără drag, resize, sau editare)
2. WHILE versiunea selectată are starea draft, THE Editor SHALL permite toate operațiunile de editare (drag, resize, adăugare, ștergere)
3. WHEN utilizatorul schimbă versiunea din VersionSelector, THE Editor SHALL reîncărca toate unitățile și pozițiile pentru noua versiune
4. WHEN utilizatorul aprobă o versiune, THE Editor SHALL captura un snapshot al canvas-ului și îl va salva prin API-ul POST /versions/{id}/snapshot
5. THE Editor SHALL afișa componenta VersionSelector existentă în header-ul paginii, fără modificări ale funcționalității de versiuni

### Cerința 8: Panoul de Statistici

**User Story:** Ca utilizator, vreau să văd statisticile agregate ale organigramei (total unități, posturi conducere, posturi execuție), astfel încât să am o imagine de ansamblu rapidă.

#### Criterii de Acceptare

1. THE Editor SHALL afișa componenta StatsPanel existentă în header-ul paginii, alimentată cu datele de layout și unitățile versiunii curente
2. WHEN o Unitate este adăugată, modificată sau ștearsă, THE Editor SHALL actualiza datele din StatsPanel prin reîncărcarea datelor de la API

### Cerința 9: Salvare Batch a Pozițiilor

**User Story:** Ca editor, vreau ca pozițiile modificate prin drag & drop să fie salvate eficient, astfel încât să nu se facă un request API pentru fiecare mișcare intermediară.

#### Criterii de Acceptare

1. WHEN utilizatorul finalizează un drag (mouse up), THE Editor SHALL salva imediat noua poziție a Unității prin API-ul PATCH /units/{id}
2. WHILE utilizatorul face drag pe o Unitate, THE Editor SHALL actualiza doar starea locală (fără request-uri API intermediare)
3. IF salvarea poziției eșuează, THEN THE Editor SHALL afișa o notificare de eroare prin Sonner toast și va reveni la poziția anterioară a Unității

### Cerința 10: Minimap pentru Navigare

**User Story:** Ca utilizator, vreau o minimap în colțul canvas-ului care să arate o vedere de ansamblu a întregii organigrame, astfel încât să pot naviga rapid la diferite zone.

#### Criterii de Acceptare

1. THE Editor SHALL afișa un Minimap în colțul din dreapta-jos al canvas-ului, cu dimensiunea de 200x150px
2. THE Minimap SHALL afișa o reprezentare miniaturală a tuturor unităților de pe canvas, cu dreptunghiuri proporționale
3. THE Minimap SHALL afișa un dreptunghi semi-transparent care indică zona vizibilă curentă a canvas-ului
4. WHEN utilizatorul face click pe Minimap, THE Editor SHALL deplasa canvas-ul pentru a centra vizualizarea pe zona selectată
5. WHEN utilizatorul face drag pe dreptunghiul de vizibilitate din Minimap, THE Editor SHALL deplasa canvas-ul în timp real

### Cerința 11: Toolbar pentru Acțiuni Canvas

**User Story:** Ca editor, vreau o bară de instrumente cu acțiuni rapide pentru canvas, astfel încât să pot accesa funcționalitățile frecvente.

#### Criterii de Acceptare

1. THE Editor SHALL afișa un Toolbar flotant în partea de sus a canvas-ului cu butoanele: Zoom In, Zoom Out, Fit to Content, Reset Zoom
2. THE Toolbar SHALL afișa procentajul curent de zoom
3. WHEN utilizatorul apasă butonul Fit to Content, THE Editor SHALL ajusta zoom-ul și pan-ul pentru a afișa toate unitățile pe ecran
4. WHILE versiunea este în starea draft, THE Toolbar SHALL afișa un buton de Adaugă Unitate care deschide un dialog de creare

### Cerința 12: Plasare Inteligentă a Unităților Noi

**User Story:** Ca editor, vreau ca atunci când adaug o unitate nouă, aceasta să fie plasată automat într-o poziție logică lângă unitatea părinte, astfel încât să nu trebuiască să o caut pe canvas.

#### Criterii de Acceptare

1. WHEN o Unitate nouă este creată cu un parent_unit_id specificat, THE Editor SHALL poziționa noua Unitate sub unitatea părinte, decalată vertical cu 100px și centrată orizontal
2. IF există deja alte unități copil ale aceluiași părinte, THEN THE Editor SHALL poziționa noua Unitate la dreapta ultimului copil existent, cu un spațiu orizontal de 40px
3. WHEN o Unitate nouă este creată fără parent_unit_id, THE Editor SHALL poziționa Unitatea în centrul vizibil al canvas-ului
4. THE Editor SHALL salva imediat coordonatele custom_x și custom_y ale noii Unități prin API
5. THE Editor SHALL face scroll automat (pan) către noua Unitate după creare, pentru a o aduce în vizualizarea curentă
