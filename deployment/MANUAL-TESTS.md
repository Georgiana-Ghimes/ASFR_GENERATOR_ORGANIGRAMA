# 🧪 Plan Complet de Teste Manuale — ASFR Generator Organigramă

## Cuprins
1. [Smoke Tests (Verificare rapidă)](#1-smoke-tests)
2. [Autentificare și Autorizare](#2-autentificare-și-autorizare)
3. [Organigramă Codificare — Canvas](#3-organigramă-codificare--canvas)
4. [Organigramă Codificare — Unități](#4-organigramă-codificare--unități)
5. [Organigramă Codificare — Elemente Fixe](#5-organigramă-codificare--elemente-fixe)
6. [Organigramă Codificare — Conectori](#6-organigramă-codificare--conectori)
7. [Organigramă la Anexa OMTI](#7-organigramă-la-anexa-omti)
8. [Versiuni](#8-versiuni)
9. [Snapshot / Imagine](#9-snapshot--imagine)
10. [Unități Organizaționale (pagina separată)](#10-unități-organizaționale)
11. [Setări](#11-setări)
12. [Teste de Limită (Edge Cases)](#12-teste-de-limită)
13. [Teste de Regresie](#13-teste-de-regresie)
14. [Teste Cross-Browser / Responsive](#14-teste-cross-browser--responsive)
15. [Teste de Performanță](#15-teste-de-performanță)

---

## 1. Smoke Tests

> Verificare rapidă că aplicația funcționează. Rulează-le PRIMELE după fiecare deploy.

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| S1 | Pagina se încarcă | Accesează `http://localhost:5173` | Pagina de login apare | |
| S2 | Login funcționează | Introdu email + parolă validă | Redirect la Organigramă codificare | |
| S3 | Organigrama se încarcă | Navighează la Organigramă codificare | Unitățile apar pe canvas | |
| S4 | OMTI se încarcă | Navighează la Organigramă la anexa OMTI | Aceeași organigramă, read-only | |
| S5 | Versiuni se încarcă | Navighează la Versiuni | Tabelul cu versiuni apare | |
| S6 | API health | Accesează `http://localhost:8000/health` | `{"status":"ok"}` | |
| S7 | Sidebar navigare | Click pe fiecare meniu din sidebar | Fiecare pagină se încarcă fără erori | |

---

## 2. Autentificare și Autorizare

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| A1 | Login valid | Email + parolă corectă → Login | Redirect la organigramă | |
| A2 | Login invalid | Email corect + parolă greșită | Mesaj de eroare | |
| A3 | Login email inexistent | Email inexistent → Login | Mesaj de eroare | |
| A4 | Logout | Click pe avatar → Deconectare | Redirect la login | |
| A5 | Acces fără login | Accesează direct `/OrgChart` fără login | Redirect la login | |
| A6 | Sesiune persistentă | Login → Închide tab → Redeschide | Rămâne logat | |
| A7 | Roluri — viewer | Login ca viewer → Organigramă | Nu poate edita (read-only) | |
| A8 | Roluri — editor | Login ca editor → Organigramă | Poate muta/edita unități | |
| A9 | Roluri — admin | Login ca admin → Versiuni | Poate șterge versiuni | |

---

## 3. Organigramă Codificare — Canvas

### 3.1 Pan & Zoom

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| C1 | Pan canvas | Click stânga pe zonă goală + drag | Canvas-ul se mișcă | |
| C2 | Zoom scroll | Scroll mouse pe canvas | Zoom in/out centrat pe cursor | |
| C3 | Zoom butoane | Click pe Mărire / Micșorare din toolbar | Zoom crește/scade cu 10% | |
| C4 | Încadrare | Click pe butonul Încadrare | Toate elementele vizibile pe ecran | |
| C5 | Resetare zoom | Click pe Resetare zoom | Revine la 100% | |
| C6 | Ctrl+0 | Apasă Ctrl+0 | Resetare zoom la 100% | |
| C7 | Ctrl+1 | Apasă Ctrl+1 | Fit-to-content (încadrare) | |
| C8 | Zoom limită min | Zoom out repetat | Nu scade sub 10% | |
| C9 | Zoom limită max | Zoom in repetat | Nu depășește 300% | |
| C10 | Procentaj zoom | Zoom la diferite niveluri | Procentajul din toolbar se actualizează corect | |

### 3.2 Toolbar

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| T1 | Toolbar vizibil | Deschide organigrama | Toolbar-ul apare centrat sus | |
| T2 | Ascunde toolbar | Click pe săgeata de sub toolbar | Toolbar-ul se ascunde cu animație | |
| T3 | Arată toolbar | Click pe săgeata (când e ascuns) | Toolbar-ul reapare | |
| T4 | Hover texte | Hover pe fiecare buton | Textele sunt în română | |
| T5 | Adaugă Unitate | Click pe "Adaugă Unitate" | Se deschide panoul lateral cu "Unitate Nouă" | |
| T6 | Adaugă Unitate — anulare | Deschide formular → ESC | Panoul se închide, unitatea NU se creează | |
| T7 | Salvează imagine | Click pe butonul cameră | Se descarcă PNG + se salvează pe server | |

### 3.3 Minimap

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| M1 | Minimap vizibil | Deschide organigrama | Minimap apare în colțul dreapta-jos | |
| M2 | Minimap click | Click pe o zonă din minimap | Canvas-ul se centrează pe acea zonă | |
| M3 | Minimap drag | Drag pe dreptunghiul albastru din minimap | Canvas-ul se mișcă în timp real | |
| M4 | Minimap rotație | Unități rotite pe canvas | Apar rotite și în minimap | |
| M5 | Minimap actualizare | Mută o unitate pe canvas | Minimap-ul se actualizează | |

---

## 4. Organigramă Codificare — Unități

### 4.1 Drag & Drop

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| U1 | Drag unitate | Click stânga pe unitate + drag | Unitatea urmărește cursorul | |
| U2 | Snap la grid | Drag + eliberare | Poziția finală e multiplu de 20px | |
| U3 | Salvare poziție | Drag unitate → eliberare → refresh | Poziția se păstrează | |
| U4 | Opacitate drag | În timpul drag-ului | Unitatea devine semi-transparentă (0.7) | |
| U5 | Cursor drag | Hover pe unitate | Cursor: move | |
| U6 | Nu selectează text | Drag pe unitate cu text | Textul NU se selectează cu albastru | |

### 4.2 Redimensionare

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| R1 | Resize handle vizibil | Hover pe unitate (mod draft) | Triunghi colorat în colțul dreapta-jos | |
| R2 | Resize drag | Drag pe triunghi | Unitatea se redimensionează | |
| R3 | Resize snap | Redimensionare + eliberare | Dimensiunile sunt multiplu de 20px | |
| R4 | Resize min width | Redimensionare foarte mică | Lățimea nu scade sub 100px | |
| R5 | Resize min height | Redimensionare foarte mică | Înălțimea nu scade sub 40px | |
| R6 | Resize salvare | Redimensionare → refresh | Dimensiunile se păstrează | |

### 4.3 Selectare și Editare

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| E1 | Click selectare | Click pe unitate | Border albastru (5px), panou lateral se deschide | |
| E2 | Click deselectare | Click pe zonă goală | Border revine la negru, panou se închide | |
| E3 | ESC deselectare | Selectează unitate → ESC | Deselectare + panou se închide | |
| E4 | Click dreapta | Click dreapta pe unitate | Meniu contextual apare la poziția click-ului | |
| E5 | Meniu — Editare | Click dreapta → Editare | Panoul lateral se deschide | |
| E6 | Meniu — Adaugă Copil | Click dreapta → Adaugă Copil | Copil creat sub unitate, cu culoarea părintelui | |
| E7 | Meniu — Rotire | Click dreapta → Rotire | Unitatea se rotește 90° | |
| E8 | Meniu — Șterge | Click dreapta → Șterge | Unitatea dispare | |
| E9 | Tasta R | Selectează unitate → R | Toggle rotire | |
| E10 | Editare panou | Modifică nume în panou → Salvează | Numele se actualizează pe canvas | |

### 4.4 Vizualizare unitate (cele 3 căsuțe)

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| V1 | Cod STAS | Verifică coloana 1 | Codul STAS rotit -90° | |
| V2 | Nr. conducere | Verifică coloana 2 | Numărul de posturi conducere | |
| V3 | Total recursiv | Verifică coloana 3 | Totalul recursiv al sub-arborelui | |
| V4 | Nume unitate | Verifică zona de text | Numele unității cu font dinamic | |
| V5 | Culoare strip | Unitate cu culoare (ex: #86C67C) | Strip colorat pe stânga | |
| V6 | Culoare full | Unitate cu culoare-full (ex: #86C67C-full) | Fundal complet colorat | |
| V7 | Unitate rotită | Unitate cu is_rotated=true | Apare rotită 90° | |
| V8 | Director General | Verifică DG | Coloana 3 = total recursiv - conducere proprie | |

---

## 5. Organigramă Codificare — Elemente Fixe

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| F1 | Legenda totaluri | Verifică stânga-sus | TOTAL POSTURI, conducere, execuție afișate corect | |
| F2 | Legenda 3 coloane | Verifică sub legenda totaluri | "Legendă" cu 3 coloane rotite | |
| F3 | Consiliu de Conducere | Verifică centru-sus | Text bold, border negru | |
| F4 | Director General mini | Verifică dreapta-sus | Titlu + nume director | |
| F5 | Header ASFR | Verifică centru-sus | "AUTORITATEA DE SIGURANȚĂ FEROVIARĂ ROMÂNĂ - ASFR" | |
| F6 | Header titlu | Verifică sub header ASFR | Titlul editabil al versiunii | |
| F7 | Drag elemente fixe | Drag pe orice element fix | Se mișcă cu snap la grid | |
| F8 | Resize elemente fixe | Drag pe triunghiul de resize | Se redimensionează, text se scalează | |
| F9 | Click pe fixe | Click pe legendă/consiliu | NU deschide panoul de editare | |
| F10 | Editare titlu | Click pe header titlu | Input apare pe aceeași linie, editabil | |
| F11 | Editare titlu — Enter | Editează titlu → Enter | Se salvează | |
| F12 | Editare titlu — ESC | Editează titlu → ESC | Se anulează | |
| F13 | Persistență poziții | Mută element fix → refresh | Poziția se păstrează (localStorage) | |

---

## 6. Organigramă Codificare — Conectori

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| L1 | Consiliu → DG | Verifică linia | Linie verticală de la consiliu la DG | |
| L2 | DG → copii stânga | Verifică copiii din stânga DG | Linii de la LEFT DG, distribuție verticală, branch-uri la RIGHT copil | |
| L3 | DG → copii dreapta | Verifică copiii din dreapta DG | Linii de la RIGHT DG, distribuție verticală, branch-uri la LEFT copil | |
| L4 | DG → copii jos | Verifică copiii de jos | Linii de la BOTTOM DG, distribuție orizontală, branch-uri verticale | |
| L5 | Conectori la drag | Mută o unitate | Conectorii se actualizează în timp real | |
| L6 | Fără dublare | Verifică liniile de distribuție | Nu există linii duplicate/suprapuse | |
| L7 | Copii adăugați | Adaugă copil la o unitate | Conectorul pleacă de la unitatea părinte, nu de la DG | |
| L8 | Referințe circulare | Verifică că nu există bucle | Aplicația nu se blochează | |

---

## 7. Organigramă la Anexa OMTI

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| O1 | Read-only | Deschide OMTI | Nu poți muta/edita unități | |
| O2 | Fără highlight | Click pe unitate | NU se selectează, NU se deschide panou | |
| O3 | Fără context menu | Click dreapta pe unitate | NU apare meniu contextual | |
| O4 | Fără cod STAS | Verifică unitățile | Doar 2 coloane (conducere + total), fără cod STAS | |
| O5 | Director legend | Verifică dreapta-sus | "ANEXA / LA ORDINUL MINISTRULUI... / NR. ... din ..." | |
| O6 | Director legend drag | Drag pe textul ANEXA | Se poate muta (singura excepție de la read-only) | |
| O7 | Fără header2 | Verifică | Titlul editabil NU apare | |
| O8 | Consistență text | Compară 1051 pe codificare vs OMTI | Textul e pe același număr de rânduri | |
| O9 | Pan & Zoom | Scroll + drag pe zonă goală | Funcționează normal | |
| O10 | Snapshot OMTI | Click pe butonul cameră | Se descarcă PNG + se salvează în tab OMTI din Versiuni | |

---

## 8. Versiuni

### 8.1 Tab Versiuni Organigramă

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| VR1 | Lista versiuni | Deschide Versiuni | Tabel cu toate versiunile | |
| VR2 | Preview thumbnail | Verifică coloana Preview | Imagine mică a organigramei (dacă există snapshot) | |
| VR3 | Previzualizare | Click pe ochi | Dialog cu imaginea mare | |
| VR4 | Descărcare | Click pe butonul download | Se descarcă PNG | |
| VR5 | Editare date validitate | Click pe calendar De la / Până la | Calendar apare, data se salvează | |
| VR6 | Resetare aprobare | Aprobă versiune → Click resetare | Versiunea revine la draft | |
| VR7 | Resetare — doar ultima | Creează versiune nouă | Butonul de resetare dispare de pe versiunea veche | |
| VR8 | Revenire la versiune | Aprobă → Modifică → Click revenire | Warning clar → Unitățile revin la starea de la aprobare | |
| VR9 | Ștergere versiune | Click pe coșul roșu | Dialog confirmare → Versiune ștearsă | |
| VR10 | Ultima versiune | Când e o singură versiune | Butonul de ștergere NU apare | |

### 8.2 Tab Imagini Generate OMTI

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| VO1 | Lista goală | Fără snapshot-uri OMTI | Mesaj "Nu există imagini OMTI generate" | |
| VO2 | După snapshot | Generează snapshot din OMTI → Versiuni | Imaginea apare în tabel cu preview, dată, acțiuni | |
| VO3 | Previzualizare | Click pe ochi | Dialog cu imaginea mare | |
| VO4 | Descărcare | Click pe download | Se descarcă PNG | |
| VO5 | Ștergere | Click pe coșul roșu | Imaginea dispare din tabel | |
| VO6 | Data/ora | Verifică coloana dată | Format: "dd MMM yyyy, HH:mm" | |

### 8.3 Flux Versiuni

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| VF1 | Aprobare | Organigramă → Aprobă | Status devine "Aprobat", canvas read-only | |
| VF2 | Versiune nouă | Aprobă → "Versiune Nouă" | Noua versiune e draft, clonată din snapshot | |
| VF3 | Editare nume | Click pe creion lângă dropdown | Input editabil, Enter salvează | |
| VF4 | Schimbare versiune | Selectează altă versiune din dropdown | Canvas se reîncarcă cu unitățile versiunii | |

---

## 9. Snapshot / Imagine

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| SN1 | Generare codificare | Click cameră pe codificare | PNG descărcat + salvat pe server | |
| SN2 | Generare OMTI | Click cameră pe OMTI | PNG descărcat + salvat în tab OMTI | |
| SN3 | Conținut complet | Verifică PNG-ul descărcat | Toate unitățile, legendele, headerele vizibile | |
| SN4 | Fără resize handles | Verifică PNG-ul | Triunghiurile de resize NU apar | |
| SN5 | Font corect | Verifică textul din PNG | Același font ca pe canvas | |
| SN6 | Text pe rânduri | Verifică unitățile cu text lung | Același număr de rânduri ca pe canvas | |
| SN7 | Unități rotite | Verifică unitățile rotite | Apar rotite corect în PNG | |
| SN8 | OMTI text ANEXA | Verifică colțul dreapta-sus | Textul "ANEXA..." nu e tăiat | |

---

## 10. Unități Organizaționale

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| UO1 | Lista unități | Deschide pagina | Tabel cu toate unitățile versiunii | |
| UO2 | Selectare versiune | Schimbă versiunea din dropdown | Unitățile se actualizează | |
| UO3 | Editare unitate | Click pe unitate → Modifică → Salvează | Datele se actualizează | |
| UO4 | Adaugă unitate | Click "Adaugă" → Completează → Salvează | Unitate nouă apare în tabel | |
| UO5 | Șterge unitate | Click pe unitate → Șterge | Unitatea dispare | |
| UO6 | Read-only aprobat | Selectează versiune aprobată | Nu poți edita/adăuga/șterge | |

---

## 11. Setări

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| ST1 | Lista tipuri | Deschide Setări | Tabel cu tipurile de unitate | |
| ST2 | Adaugă tip | Click "Adaugă" → Completează cod + etichetă | Tip nou apare în tabel | |
| ST3 | Editează tip | Click editare pe un tip → Modifică → Salvează | Eticheta se actualizează | |
| ST4 | Șterge tip | Click ștergere pe un tip non-system | Tipul dispare | |
| ST5 | Tip system | Verifică tipurile system | Nu pot fi șterse | |
| ST6 | Fără coloana ordine | Verifică tabelul | Coloana "Ordine" NU apare | |

---

## 12. Teste de Limită (Edge Cases)

| # | Test | Pași | Rezultat așteptat | ✅/❌ |
|---|------|------|-------------------|------|
| LM1 | Nume foarte lung | Creează unitate cu nume de 200+ caractere | Textul se micșorează automat, nu depășește caseta | |
| LM2 | Cod STAS gol | Creează unitate fără cod STAS | Se salvează (cod gol permis) | |
| LM3 | Drag în afara canvas | Drag unitate foarte departe | Unitatea rămâne accesibilă (pan/zoom) | |
| LM4 | Zoom extrem | Zoom la 10% | Toate unitățile vizibile, text mic dar lizibil | |
| LM5 | Zoom extrem mare | Zoom la 300% | O singură unitate vizibilă, text mare | |
| LM6 | Multe unități | Adaugă 50+ unități | Canvas-ul rămâne responsive | |
| LM7 | Refresh în timpul drag | Drag unitate → F5 | Poziția revine la ultima salvată | |
| LM8 | Două tab-uri | Deschide organigrama în 2 tab-uri | Modificările din tab 1 apar în tab 2 la refresh | |
| LM9 | Versiune fără unități | Creează versiune goală (dacă posibil) | Canvas gol, toolbar funcțional | |
| LM10 | Caractere speciale | Nume unitate cu ăîșțâ, &, <, > | Se afișează corect, fără XSS | |
| LM11 | Resize la minim | Redimensionează unitate la 100x40 | Nu scade mai jos, textul se adaptează | |
| LM12 | Copil fără părinte | Adaugă unitate din toolbar (fără părinte) | Apare în centrul viewport-ului | |
| LM13 | Ștergere unitate cu copii | Șterge o unitate care are copii | Copiii rămân (devin orfani) sau se șterg cascadat | |

---

## 13. Teste de Regresie

> Rulează după FIECARE modificare majoră.

| # | Test | Ce verifici | ✅/❌ |
|---|------|-------------|------|
| RG1 | Totaluri corecte | Legenda: TOTAL POSTURI = 230, Conducere = 18, Execuție = 212 | |
| RG2 | KPI cards | Cardurile de sus: Total Posturi = 230, Conducere = 18, Execuție = 212 | |
| RG3 | DG coloana 3 | Director General arată 1 și 230 (nu 231) | |
| RG4 | Consistență codificare/OMTI | Aceleași numere pe ambele organigrame | |
| RG5 | Conectori după drag | Mută unitate → conectorii se actualizează corect | |
| RG6 | Snapshot complet | Generează snapshot → verifică că include tot | |
| RG7 | Versiune nouă din aprobată | Aprobă → Versiune Nouă → verifică unitățile | |
| RG8 | Revenire la versiune | Aprobă → Modifică → Revenire → verifică restaurarea | |
| RG9 | Poziții fixe persistente | Mută legendă → schimbă versiune → revino → verifică poziția | |
| RG10 | OMTI read-only complet | Pe OMTI: nu poți muta, selecta, edita, context menu | |

---

## 14. Teste Cross-Browser / Responsive

| # | Browser/Dispozitiv | Ce verifici | ✅/❌ |
|---|-------------------|-------------|------|
| CB1 | Chrome (desktop) | Toate funcționalitățile | |
| CB2 | Firefox (desktop) | Pan, zoom, drag, snapshot | |
| CB3 | Edge (desktop) | Pan, zoom, drag, snapshot | |
| CB4 | Chrome (laptop 13") | Încadrare funcționează, totul vizibil | |
| CB5 | Monitor extern (27") | Încadrare funcționează, proporții corecte | |
| CB6 | Rezoluție 1366x768 | Toolbar, minimap, panou lateral încap | |
| CB7 | Rezoluție 1920x1080 | Layout corect, fără spații goale excesive | |
| CB8 | Rezoluție 2560x1440 | Zoom și încadrare funcționează | |

---

## 15. Teste de Performanță

| # | Test | Criteriu | ✅/❌ |
|---|------|---------|------|
| P1 | Încărcare inițială | Organigrama se încarcă în < 3 secunde | |
| P2 | Drag fluent | Drag pe unitate fără lag vizibil | |
| P3 | Zoom fluent | Scroll zoom fără sacadări | |
| P4 | Snapshot generare | Snapshot se generează în < 5 secunde | |
| P5 | Schimbare versiune | Versiunea se încarcă în < 2 secunde | |
| P6 | Salvare poziție | După drag, salvarea e < 1 secundă | |
| P7 | Minimap actualizare | Minimap-ul se actualizează instant la drag | |

---

## Notă finală

- Testele marcate cu ✅ au trecut
- Testele marcate cu ❌ au eșuat — documentează problema
- Rulează **Smoke Tests** (secțiunea 1) după fiecare deploy
- Rulează **Teste de Regresie** (secțiunea 13) după modificări majore
- Rulează **toate testele** înainte de aprobare versiune în producție
