---
title: "OMSI - Jak používat letecké mapy z mapy.com v OMSI"
date: "2024-07-13T14:59:32.398Z"
updated: "2026-06-19T17:19:37.000Z"
categories: ["OMSI"]
author: "mxnticek"
featured: true
image: 
  src: "/media/posts/24/OMSI2_20240706_165830.jpg"
  caption: "Sprinter v zastávce Česká Lípa, aut. nádr."
  credits: "Vlastimil Novotný 2024"
permalink: "/omsi-mapy-cz-aerial/"
publiiId: 24
templateEngineOverride: "md"
---

# [OMSI - Tutoriál na aerial podklady od mapy.com](https://www.youtube.com/watch?v=9Irvyj0MyVc)

**Shrnutí videa:**
Video tutoriál názorně ukazuje proces integrace leteckých snímků z Mapy.com do OMSI 2 editoru. Autor provádí diváka následujícími kroky:
* Registrace na portálu pro vývojáře Mapy.com a vytvoření projektu pro získání unikátního API klíče.
* Úprava konfiguračního souboru `options.cfg` ve složce s hrou, kam se vkládá odkaz na mapové podklady.
* Praktická ukázka v editoru: aktivace volby "Use tile aerials" a stažení dlaždic pro aktuální polohu.
* *Důležitý tip z konce videa [04:26]*: Pokud toto děláte poprvé, je nutné ve složce `Maps` ručně vytvořit složku `aerials`, aby editor nehlásil chybu.

---

## Tento tutoriál vás provede získáním a nastavením leteckých map z mapy.cz do simulátoru OMSI.

## Krok 1: Získání API klíče

1. Navštivte [mapy.com developerskou stránku](https://developer.mapy.com).
2. Zaregistrujte se a přihlaste se do svého účtu.
3. Vytvořte nový projekt a získejte API klíč.


## Krok 2: URL pro mapové dlaždice

Použijte následující URL formáty s vaším API klíčem pro různé typy mapových dlaždic:

- **Basic**: `https://api.mapy.com/v1/maptiles/basic/256/~z/~x/~y?apikey=YOUR_API_KEY`
- **Outdoor**: `https://api.mapy.com/v1/maptiles/outdoor/256/~z/~x/~y?apikey=YOUR_API_KEY`
- **Winter**: `https://api.mapy.com/v1/maptiles/winter/256/~z/~x/~y?apikey=YOUR_API_KEY`
- **Aerial**: `https://api.mapy.com/v1/maptiles/aerial/256/~z/~x/~y?apikey=YOUR_API_KEY`

## Krok 3: Nastavení OMSI

### Příprava adresáře

1. Otevřete složku `/OMSI 2/maps/`.
2. Vytvořte nový adresář nazvaný `aerials`.

### Úprava souboru `options.cfg`

1. Otevřete soubor `/OMSI 2/options.cfg`.
2. Na konec souboru přidejte následující řádek:
```cfg
[Editor_LinkAerial]
https://api.mapy.com/v1/maptiles/aerial/256/~z/~x/~y?apikey=YOUR_API_KEY
```

### Aktivace leteckých map v editoru

1. Spusťte OMSI editor a otevřete nebo vytvořte novou mapu.
2. Přejděte na záložku "Tiles" a zaškrtněte "Use tile aerials".
3. Klikněte na "Dnl. current Tile" pro stažení aktuální dlaždice.

### Uložení a kontrola

1. Uložte změny a zkontrolujte, zda se letecké snímky správně zobrazují na mapě.

## Původní GitHub Issue

Pro původní GitHub issue ohledně mapy.cz / .com a jejich podkladů naleznete [zde](https://github.com/TomasMahdal/MapyCZAerials/issues/5).

## Další odkazy

Další informace, postupy a případné fixy můžete najít také na [FellowsFilm fóru](https://fellowsfilm.com/threads/editor-aerial-imagery.614/).
