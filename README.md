# Memorii tehnice & SSI

Aplicație web pentru memorii tehnice (CU, DTAC, PT), scenarii de securitate la incendiu (OMAI 180/2022, Anexele 4 și 5), documentație de protecție civilă, programe de execuție și caiet de sarcini, adaptate funcțiunii conform CATUC (Legea 169/2026) și P 118/1-2025.

Rulează din orice browser, de pe orice calculator. Datele echipei stau în Supabase; aplicația stă pe GitHub Pages. Citirea documentelor și a planșelor folosește API-ul Anthropic (cheie proprie, opțional).

## Instalare (o singură dată, ~15 minute)

### 1. Supabase (baza de date)
1. Cont gratuit pe https://supabase.com → **New project** (regiune EU – Frankfurt).
2. **SQL Editor → New query** → lipește tot conținutul din `supabase/schema.sql` → **Run**.
3. **Project Settings → API**: copiază **Project URL** și cheia **anon public**.
4. (Opțional) scrie-le în `config.js`, ca să nu le mai introduci pe fiecare calculator.

### 2. GitHub Pages (aplicația)
1. Pe https://github.com → **New repository** (ex. `memorii-tehnice`, Public).
2. **Add file → Upload files** → încarcă TOT conținutul acestui folder (inclusiv `files/`, `supabase/`, `.nojekyll`) → **Commit**.
3. **Settings → Pages** → Source: *Deploy from a branch*, Branch: `main` / `(root)` → **Save**.
4. După 1–2 minute aplicația e la `https://<utilizator>.github.io/memorii-tehnice/`.

### 3. Prima pornire, pe fiecare calculator
- URL-ul și cheia Supabase (dacă nu sunt în `config.js`).
- **Codul echipei**: primul utilizator apasă „Creez o echipă nouă” și trimite codul colegilor; ceilalți îl introduc pe al lor. Cine are codul vede proiectele echipei.
- **Cheia API Anthropic** (opțional, de pe https://console.anthropic.com): necesară pentru „Completează centralizatorul cu Claude” și citirea planșelor. Rămâne doar în browserul acelui calculator. Costul se facturează contului Anthropic al cheii.
- Totul se poate schimba din butonul **Setări** din stânga jos.

### 4. Aplicație Windows (opțional)
`windows/Instaleaza Memorii tehnice.bat` → cere adresa GitHub Pages și creează scurtătura „Memorii tehnice” pe Desktop și în meniul Start (fereastră proprie, se poate fixa în bara de activități). `Dezinstaleaza Memorii tehnice.bat` o scoate; datele nu sunt afectate.

## Structură
- `index.html`, `app.js` – interfața (piese scrise și centralizator, piese desenate, date lipsă, documente, legislație, decizii).
- `lib.js` – legislație, profiluri de funcțiune P 118/1-2025, Tabelul 2.
- `tpl.js` – șabloanele memoriilor și scenariilor; `docx.js` – generarea .docx.
- `files/` – șabloanele .docx (base64) și indexul articolelor P 118/1-2025.
- `shim.js` – legătura cu Supabase și API-ul Anthropic când aplicația nu rulează în Claude.
- Tabelul Supabase `memorii_docs(ws, col, id, data)`: colecțiile `projects` (fișele) și `sources` (textul documentelor și al planșelor citite).

## Securitate
Accesul e limitat la rândurile cu codul echipei (RLS pe antetul `x-ws`). Codul are minimum 20 de caractere aleatorii; tratează-l ca pe o parolă. Pentru autentificare completă pe email se poate adăuga ulterior Supabase Auth.
