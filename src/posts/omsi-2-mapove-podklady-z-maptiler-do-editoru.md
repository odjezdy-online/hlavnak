---
title: "OMSI 2 - Mapové podklady z MapTiler do editoru"
date: "2026-05-17T17:20:26.038Z"
updated: "2026-06-19T14:13:38.000Z"
categories: ["OMSI"]
author: "mxnticek"
description: "Podrobný návod, jak do OMSI 2 editoru vložit mapové podklady ze služby MapTiler. Krok za krokem, včetně správné úpravy URL a řešení problémů s HiDPI. "
metaTitle: "OMSI 2 Návod: Mapové podklady z MapTileru do editoru"
lead: "Chcete stavět reálnou mapu v OMSI? Ukážeme si, jak do editoru snadno natáhnout kvalitní letecké snímky z MapTileru a vyvarovat se chyb s rozlišením."
permalink: "/omsi-2-mapove-podklady-z-maptiler-do-editoru/"
publiiId: 47
templateEngineOverride: "md"
---

# Návod: Mapové podklady z MapTiler do editoru OMSI 2

Tento tutoriál vás provede integrací alternativních mapových podkladů z platformy MapTiler do editoru simulátoru OMSI. MapTiler nabízí širokou škálu mapových stylů, od satelitních snímků až po klasické uliční mapy.

---

## Krok 1: Vytvoření účtu a přihlášení

1. Navštivte domovskou stránku [MapTiler](https://www.maptiler.com/).
2. Klikněte na tlačítko **Create Account** (nebo se přihlaste, pokud již účet máte).
3. Po úspěšné registraci a přihlášení budete přesměrováni do administračního rozhraní MapTiler Cloud.

## Krok 2: Výběr mapového podkladu a pozor na HiDPI

1. V levém menu nebo na hlavní nástěnce přejděte do sekce **Maps** (Moje mapy / Standard maps).
2. Uvidíte galerii různých mapových podkladů (např. *Satellite Hybrid*, *Streets*, *Outdoor*, atd.). Rozklikněte ten styl, který chcete používat.
3. Na stránce detailu mapy sjeďte níže k sekci **Raster Tiles**.
4. Zde si můžete vybrat buď výchozí odkaz (512x512), nebo ten pro kompatibilitu (256x256). Oba v OMSI fungují, ale **DŮLEŽITÉ JE:** ujistěte se, že **nemáte zaškrtnutou volbu HiDPI**.
   *(HiDPI přidává do odkazu parametr `@2x`. Tento parametr způsobuje, že editor OMSI nedokáže dlaždice správně zařadit do mřížky a obrázky se „rozbijí“ a rozhodí po celé mapě!)*
5. Zkopírujte si vybraný odkaz bez HiDPI.

## Krok 3: Úprava URL adresy pro OMSI

Váš zkopírovaný odkaz (například ve verzi 512x512) bude vypadat zhruba takto:
`https://api.maptiler.com/maps/satellite-v4/{z}/{x}/{y}.jpg?key=VAS_API_KLIC`

OMSI ale nepoužívá pro proměnné souřadnic složené závorky `{ }`, nýbrž vlnovky `~`. Musíte tedy ručně přepsat konec adresy:

* **Změňte:** `{z}/{x}/{y}`
* **Na:** `~z/~x/~y`

**Výsledný upravený odkaz připravený pro OMSI bude vypadat takto:**
`https://api.maptiler.com/maps/satellite-v4/~z/~x/~y.jpg?key=VAS_API_KLIC`

*(Poznámka: Nikdy s nikým veřejně nesdílejte svůj osobní API klíč, který se nachází na konci URL).*

## Krok 4: Nastavení OMSI 2

Jakmile máte připravený správný odkaz, postup je stejný jako u jiných poskytovatelů map:

### 1. Úprava souboru options.cfg
1. Otevřete konfigurační soubor `options.cfg`, který se nachází přímo v hlavní složce `\OMSI 2\`.
2. Sjeďte úplně na konec souboru a přidejte následující blok s vaším upraveným odkazem z MapTileru:

```cfg
[Editor_LinkAerial]
https://api.maptiler.com/maps/satellite-v4/~z/~x/~y.jpg?key=VAS_API_KLIC
