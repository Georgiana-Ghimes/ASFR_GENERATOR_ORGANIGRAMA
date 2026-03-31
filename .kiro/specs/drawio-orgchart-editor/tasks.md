# Plan de Implementare: drawio-orgchart-editor

## Prezentare Generală

Înlocuirea componentei monolitice `DeterministicOrgChart.jsx` (~2300 linii) cu un editor de canvas modular SVG, inspirat din draw.io. Implementarea se face incremental, pornind de la funcțiile utilitare și hook-uri, apoi componente vizuale, și în final integrarea completă. Limbajul de implementare este JavaScript/JSX (conform stack-ului existent). Testele property-based folosesc `fast-check` cu Vitest.

## Sarcini

- [x] 1. Configurare proiect și funcții utilitare de bază
  - [x] 1.1 Instalare dependință `fast-check` pentru teste property-based
    - Rulare `npm install --save-dev fast-check vitest @testing-library/react @testing-library/jest-dom jsdom` 
    - Configurare `vitest.config.js` cu environment jsdom
    - _Cerințe: toate proprietățile de corectitudine_

  - [x] 1.2 Creare modul de constante și funcții utilitare `src/components/canvas-editor/utils/canvasUtils.js`
    - Definire constante: `GRID_SIZE`, `DEFAULT_UNIT_WIDTH`, `DEFAULT_UNIT_HEIGHT`, `MIN_UNIT_WIDTH`, `MIN_UNIT_HEIGHT`, `ZOOM_MIN`, `ZOOM_MAX`, `ZOOM_STEP`, `SMART_GUIDE_THRESHOLD`, `CONNECTOR_VERTICAL_GAP`, `NEW_UNIT_VERTICAL_OFFSET`, `NEW_UNIT_HORIZONTAL_GAP`
    - Implementare `snapToGrid(value)` — returnează cel mai apropiat multiplu de 20
    - Implementare `screenToCanvas(screenX, screenY, viewport)` — conversie coordonate ecran → canvas
    - Implementare `canvasToScreen(canvasX, canvasY, viewport)` — conversie coordonate canvas → ecran
    - Implementare `calculateBoundingBox(units)` — bounding box al tuturor unităților
    - Implementare `calculateNewUnitPosition(parentUnit, siblingUnits, viewport)` — poziție pentru unitate nouă
    - Implementare `isFullColor(color)` — verifică dacă culoarea se termină cu "-full"
    - Implementare `calculateBoxHeight(unitName)` — înălțime bazată pe lungimea textului
    - Implementare `detectOverlap(rectA, rectB)` — detectare suprapunere dreptunghiuri
    - _Cerințe: 2.1, 2.2, 2.4, 2.7, 3.2, 3.6, 12.1, 12.2, 12.3_

  - [ ]* 1.3 Teste property-based pentru funcțiile utilitare (Proprietățile 2, 8, 12)
    - **Proprietatea 2: Snap la grid produce multipli de 20**
    - **Validează: Cerințe 3.2, 4.3**
    - **Proprietatea 8: Culoarea determină modul de afișare (strip vs full)**
    - **Validează: Cerințe 2.4**
    - **Proprietatea 12: Detectarea suprapunerii funcționează corect**
    - **Validează: Cerințe 3.6**

  - [x] 1.4 Creare modul de conectori `src/components/canvas-editor/utils/connectorUtils.js`
    - Implementare `generateConnectorPath(parent, child)` — path SVG pentru conector ortogonal între părinte și copil
    - Implementare `generateGroupedConnectorPaths(parent, children)` — path-uri SVG pentru conectori grupați (linie orizontală comună)
    - _Cerințe: 5.1, 5.3, 5.5, 5.6_

  - [ ]* 1.5 Teste property-based pentru conectori (Proprietățile 9, 10)
    - **Proprietatea 9: Conectorii au endpoint-uri corecte și segmente ortogonale**
    - **Validează: Cerințe 5.1, 5.3**
    - **Proprietatea 10: Conectorii grupați partajează o linie orizontală comună**
    - **Validează: Cerințe 5.5**

- [x] 2. Checkpoint — Verificare funcții utilitare
  - Asigurați-vă că toate testele trec, întrebați utilizatorul dacă apar întrebări.

- [x] 3. Implementare hook-uri de interacțiune
  - [x] 3.1 Implementare hook `useViewport` în `src/components/canvas-editor/hooks/useViewport.js`
    - State: `panX`, `panY`, `zoom`
    - Handler `onWheel` — zoom centrat pe cursor cu clamp [0.1, 3.0]
    - Handler-e `onMouseDown/Move/Up` — pan pe canvas (click stâng pe zonă goală)
    - Acțiuni: `resetZoom` (Ctrl+0), `fitToContent` (Ctrl+1), `zoomIn`, `zoomOut`, `panTo`
    - Proprietate calculată `svgTransform` — string `"translate(panX, panY) scale(zoom)"`
    - _Cerințe: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 3.2 Teste property-based pentru viewport (Proprietățile 3, 4, 5)
    - **Proprietatea 3: Zoom-ul este întotdeauna în intervalul [0.1, 3.0]**
    - **Validează: Cerințe 1.4**
    - **Proprietatea 4: Zoom centrat pe cursor păstrează punctul fix**
    - **Validează: Cerințe 1.3**
    - **Proprietatea 5: Fit-to-content include toate unitățile în viewport**
    - **Validează: Cerințe 1.6, 11.3**

  - [x] 3.3 Implementare hook `useSelection` în `src/components/canvas-editor/hooks/useSelection.js`
    - State: `selectedUnitId`
    - Funcții: `select(unitId)`, `deselect()`
    - Handler tastatură: Escape → deselect
    - _Cerințe: 6.1, 6.2, 6.3_

  - [x] 3.4 Implementare hook `useDrag` în `src/components/canvas-editor/hooks/useDrag.js`
    - State: `isDragging`, `unitId`, `startPos`, `currentPos`, `offset`
    - Handler-e: `onNodeMouseDown`, `onCanvasMouseMove`, `onCanvasMouseUp`
    - Funcție `getNodePosition(unitId)` — returnează poziția curentă (temporară în timpul drag sau din DB)
    - Snap la grid la finalizare, salvare prin API PATCH, rollback la eroare
    - Dezactivare completă când `isReadOnly === true`
    - _Cerințe: 3.1, 3.2, 3.4, 3.5, 9.1, 9.2, 9.3_

  - [ ]* 3.5 Teste property-based pentru drag (Proprietățile 6, 14)
    - **Proprietatea 6: Operațiile de editare sunt activate doar pentru versiuni draft**
    - **Validează: Cerințe 3.5, 7.1, 7.2**
    - **Proprietatea 14: Rollback la eroare de salvare restaurează poziția originală**
    - **Validează: Cerințe 9.3**

  - [x] 3.6 Implementare hook `useResize` în `src/components/canvas-editor/hooks/useResize.js`
    - State: `isResizing`, `unitId`, `handle`, `startSize`, `currentSize`
    - Handler-e: `onHandleMouseDown`, `onMouseMove`, `onMouseUp`
    - Funcție `getNodeSize(unitId, defaultSize)` — returnează dimensiunea curentă
    - Clamp la dimensiuni minime (100px lățime, 40px înălțime), snap la grid
    - Salvare prin API PATCH la finalizare
    - Dezactivare completă când `isReadOnly === true`
    - _Cerințe: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 3.7 Teste property-based pentru resize (Proprietatea 13)
    - **Proprietatea 13: Redimensionarea respectă dimensiunile minime**
    - **Validează: Cerințe 4.2, 4.4**

- [x] 4. Checkpoint — Verificare hook-uri
  - Asigurați-vă că toate testele trec, întrebați utilizatorul dacă apar întrebări.

- [x] 5. Implementare componente vizuale SVG
  - [x] 5.1 Implementare `UnitNode` în `src/components/canvas-editor/UnitNode.jsx`
    - Randare `<g>` SVG cu `<rect>` principal, strip lateral stâng colorat, texte (cod STAS, nume, posturi)
    - Suport culoare strip vs full (bazat pe `isFullColor`)
    - Suport `is_rotated` prin `transform="rotate(90)"`
    - Handle-uri de resize vizibile doar când selectat și nu read-only
    - Props: `unit`, `aggregates`, `isSelected`, `isDragging`, `isReadOnly`, `position`, `onMouseDown`, `onContextMenu`
    - _Cerințe: 2.1, 2.3, 2.4, 2.5, 2.7, 2.8, 4.1_

  - [ ]* 5.2 Teste property-based pentru UnitNode (Proprietățile 1, 7)
    - **Proprietatea 1: Pozițiile și dimensiunile din DB sunt respectate fidel**
    - **Validează: Cerințe 2.1, 2.7**
    - **Proprietatea 7: Unitățile fără poziție custom primesc poziție de fallback**
    - **Validează: Cerințe 2.2**

  - [x] 5.3 Implementare `FixedNode` în `src/components/canvas-editor/FixedNode.jsx`
    - Randare elemente speciale: Consiliu de Conducere, mini-legendă Director General, Legendă, titluri header
    - Stilizare specifică fiecărui tip
    - Props: `type`, `unit`, `position`, `isReadOnly`, `onMouseDown`, `onClick`
    - _Cerințe: 2.6_

  - [x] 5.4 Implementare `ConnectorLayer` în `src/components/canvas-editor/ConnectorLayer.jsx`
    - Randare SVG `<path>` pentru toți conectorii
    - Folosire `generateConnectorPath` și `generateGroupedConnectorPaths` din connectorUtils
    - Z-index inferior unităților (randat înaintea nodurilor)
    - Actualizare în timp real la drag
    - _Cerințe: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 5.5 Implementare `SmartGuides` în `src/components/canvas-editor/SmartGuides.jsx`
    - Afișare linii punctate orizontale/verticale la aliniere
    - Detectare aliniere centru-centru și margine-margine cu threshold de 5px
    - Props: `draggedUnit`, `allUnits`, `threshold`
    - _Cerințe: 3.3_

  - [ ]* 5.6 Teste property-based pentru SmartGuides (Proprietatea 11)
    - **Proprietatea 11: Ghidajele de aliniere detectează alinierea corectă**
    - **Validează: Cerințe 3.3**

- [x] 6. Checkpoint — Verificare componente vizuale
  - Asigurați-vă că toate testele trec, întrebați utilizatorul dacă apar întrebări.

- [x] 7. Implementare componente de navigare și toolbar
  - [x] 7.1 Implementare `Minimap` în `src/components/canvas-editor/Minimap.jsx`
    - Randare miniaturală a tuturor unităților (dreptunghiuri proporționale)
    - Dreptunghi semi-transparent pentru zona vizibilă curentă
    - Click pe minimap → pan canvas la zona selectată
    - Drag pe dreptunghiul de vizibilitate → pan în timp real
    - Dimensiune fixă 200x150px, poziționat în colțul dreapta-jos
    - _Cerințe: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 7.2 Teste property-based pentru Minimap (Proprietatea 15)
    - **Proprietatea 15: Minimap — conversia coordonatelor canvas ↔ minimap este consistentă**
    - **Validează: Cerințe 10.2, 10.3, 10.4, 10.5**

  - [x] 7.3 Implementare `CanvasToolbar` în `src/components/canvas-editor/CanvasToolbar.jsx`
    - Butoane: Zoom In, Zoom Out, Fit to Content, Reset Zoom
    - Afișare procentaj zoom curent
    - Buton "Adaugă Unitate" vizibil doar în mod draft
    - Toolbar flotant în partea de sus a canvas-ului
    - _Cerințe: 11.1, 11.2, 11.3, 11.4_

  - [x] 7.4 Implementare `ContextMenu` în `src/components/canvas-editor/ContextMenu.jsx`
    - Meniu contextual la click-dreapta pe unitate
    - Opțiuni: Editare, Adaugă Copil, Șterge, Rotire
    - Ascundere opțiuni de editare în mod read-only
    - _Cerințe: 6.4, 6.5, 6.6_

- [x] 8. Implementare componenta principală CanvasEditor
  - [x] 8.1 Implementare `CanvasViewport` în `src/components/canvas-editor/CanvasViewport.jsx`
    - Element SVG principal cu `viewBox` și transformare `translate/scale`
    - Grilă de fundal cu celule de 20px
    - Integrare hook `useViewport` pentru pan/zoom
    - Randare: ConnectorLayer → UnitNode-uri → FixedNode-uri → SmartGuides (ordinea z-index)
    - _Cerințe: 1.1, 1.2, 1.3_

  - [x] 8.2 Implementare `CanvasEditor` în `src/components/canvas-editor/CanvasEditor.jsx`
    - Componenta principală care orchestrează toate sub-componentele
    - Fetch unități cu TanStack Query (`useQuery` pentru GET /units?version_id=X)
    - Fetch layout data pentru agregate
    - Integrare hook-uri: `useViewport`, `useSelection`, `useDrag`, `useResize`
    - Integrare componente: `CanvasViewport`, `CanvasToolbar`, `Minimap`, `ContextMenu`
    - Callback `onSelectUnit` pentru deschiderea panoului lateral
    - Callback `onDragEnd` cu PATCH API + toast eroare + rollback
    - Callback `onResizeEnd` cu PATCH API + toast eroare
    - Suport keyboard shortcuts: Escape (deselect), R (rotate), Ctrl+0 (reset zoom), Ctrl+1 (fit-to-content)
    - _Cerințe: 1.5, 1.6, 2.1, 3.4, 4.5, 6.1, 6.2, 6.3, 6.5, 6.6, 9.1, 9.2, 9.3_

  - [ ]* 8.3 Teste property-based pentru plasarea unităților noi (Proprietatea 16)
    - **Proprietatea 16: Plasarea unităților noi respectă regulile de poziționare**
    - **Validează: Cerințe 12.1, 12.2, 12.3**

- [x] 9. Integrare în pagina OrgChart și înlocuire DeterministicOrgChart
  - [x] 9.1 Modificare `src/pages/OrgChart.jsx` pentru a folosi `CanvasEditor` în loc de `DeterministicOrgChart`
    - Import `CanvasEditor` în loc de `DeterministicOrgChart`
    - Transmitere props: `versionId`, `onSelectUnit`, `isReadOnly`
    - Păstrare integrare cu `VersionSelector`, `StatsPanel`, `UnitForm` (componente existente)
    - Păstrare logică de versiuni (approve, clone, unapprove)
    - Păstrare panou lateral cu slide-in animation
    - Actualizare snapshot capture la aprobare versiune (folosind SVG-ul din canvas)
    - _Cerințe: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2_

  - [x] 9.2 Creare fișier index `src/components/canvas-editor/index.js` pentru export-uri curate
    - Export `CanvasEditor` ca default
    - _Cerințe: toate_

- [x] 10. Checkpoint final — Verificare integrare completă
  - Asigurați-vă că toate testele trec, întrebați utilizatorul dacă apar întrebări.

## Note

- Sarcinile marcate cu `*` sunt opționale și pot fi omise pentru un MVP mai rapid
- Fiecare sarcină referențiază cerințe specifice pentru trasabilitate
- Checkpoint-urile asigură validare incrementală
- Testele property-based validează proprietăți universale de corectitudine cu fast-check
- Testele unitare validează exemple specifice și cazuri limită
- Componentele existente (`VersionSelector`, `StatsPanel`, `UnitForm`, `apiClient`) se reutilizează fără modificări
- Backend-ul nu necesită modificări — se folosește API-ul PATCH /units/{id} existent
