---
title: "Blog #8 - Menší rantík o Xiaomi"
date: "2025-08-01T18:57:39.599Z"
updated: "2025-08-01T18:57:54.617Z"
categories: ["BLOG"]
author: "mxnticek"
featured: true
permalink: "/blog-8-mensi-rantik-o-xiaomi/"
publiiId: 42
templateEngineOverride: "md"
---

# Blog #8 - Menší rantík o Xiaomi

Čauko, vítejte u dalšího, tentokrát trochu netradičního blogového příspěvku. Dnes nebudeme řešit servery ani sítě, ale ponoříme se do hardwaru, specificky do záchrany telefonu, což se nečekaně zvrtlo v menší osobní křížovou výpravu. Celý příběh se točí kolem telefonu **Redmi Note 13 Pro (5G)**. Abychom si to ujasnili hned na začátku: tenhle telefon není můj. Půjčil mi ho kamarád Jakub (na GitHubu ho najdete jako **thejakubruzicka**), se kterým jsme mimochodem s pomocí AI dali dohromady jeho fajn projekt [MNotes](https://thejakubruzicka.github.io/MNotes/). Mým úkolem je tedy provést technologickou resuscitaci a pokusit se o nemožné.

## 1. Stav pacienta: Diagnóza "Hard Brick"

Když říkám, že je telefon potřeba zachránit, nemyslím tím, že se sekal nebo měl plnou paměť. Telefon jsem převzal v úterý 29. července a od té doby se v podstatě jen snažím pochopit, jak hluboko v křemíkovém pekle se nachází. Jeho stav se odborně nazývá "hard brick". Pro laiky: představte si, že váš počítač nejenže nenabootuje Windows, ale ani se nedostane do BIOSu. Je to v podstatě jen kus hardwaru bez duše.

Jediné známky života, které projevuje, jsou:
* **Fastboot režim:** Základní servisní rozhraní, které je v tomto stavu ale prakticky k ničemu.
* **EDL režim (Emergency Download Mode):** Absolutně poslední záchrana. Do tohoto stavu se telefon dostane jen po připojení speciálním kabelem (nebo zkratováním testpointů na desce). Ve Správci zařízení v PC se ohlásí jako `Qualcomm HS-USB QDLoader 9008`, což je signál pro servisáky, že ještě existuje naděje.

Jakýkoliv pokus o spuštění systému nebo vstup do recovery menu končí chladnou a nekompromisní hláškou na displeji: "**The system has been destroyed**". A tady začíná můj rant. V normálním světě by oprava softwaru měla být základním právem uživatele. U Xiaomi je to ale byznys. Oficiální cesta vyžaduje autorizovaný servisní účet, za který si nechávají platit nehorázné sumy. Je to uměle vytvořená bariéra, která nutí lidi buď zaplatit, nebo telefon vyhodit. To je přesně ten přístup, který mě vytáčí a motivuje hledat alternativy.

## 2. Cesta do temných zákoutí internetu: Xiaomi Fire Tool

Standardní postupy selhaly, a tak začala má pouť po pochybných zákoutích internetu. Hodiny strávené na XDA fórech, proklikávání se vlákny v lámané angličtině, sledování tutoriálů z Indie a stahování desítek gigabajtů různých verzí ROMek. Nakonec jsem narazil na nástroj, který se zdál být odpovědí na mé modlitby: **Xiaomi Fire Tool**.

Tento software vypadal neuvěřitelně slibně. Dokázal telefon v EDL režimu správně detekovat a dokonce v sobě měl potřebný "firehose" program – malý kousek kódu, který slouží jako klíč k odemčení paměti telefonu pro nahrání nového systému. Už jsem se radoval, že mám vyhráno, ale pak přišla studená sprcha. Paywall.

Program mi oznámil, že ačkoliv ví, co dělat, samotnou operaci flashe mi nepovolí, dokud si nekoupím kredity.
* **Investice:** **2 kredity** za zhruba **8$** (cca 200 Kč). Nebyla to velká částka, ale ten princip mě štval. Platit neznámé entitě na internetu za odemčení funkce, která by měla být volně dostupná.
* **Riziko:** Obrovské. Kromě ztráty peněz a času stále hrozilo, že telefon zůstane cihlou. A samozřejmě, pravděpodobnost, že jsem si společně s nástrojem do počítače stáhl i nějaký malware, není zrovna nulová. Ale co, pro záchranu hardwaru se musí riskovat, #kekw.

## 3. Co dál? Sbírka trofejí a malý byznys?

Pokud se tahle mise podaří a telefon ožije, bude to víc než jen opravený kus elektroniky. Bude to důkaz konceptu. A to mě přivádí k myšlence, co dál. Tou "sbírkou", o které jsem přemýšlel, jsem nemyslel soubory, ale spíš telefony.

Láká mě představa vytvořit si malou **sbírku trofejí** – aktivně vyhledávat na online bazarech další zamčené, bricknuté nebo jinak softwarově poškozené Xiaomi telefony za pár korun. Lidé se jich zbavují, protože si myslí, že jsou na odpis. S tímto know-how bych je mohl vrátit do života. Nejenže by to byl skvělý způsob, jak si hrát s hardwarem a zachraňovat elektroniku před zbytečným vyhozením, ale možná by se na tom dal postavit i malý vedlejší příjem. Opravit a s čistým svědomím a menším ziskem poslat dál.

## Podpora a závěr

Celý tenhle experiment samozřejmě něco stojí – nejen čas a nervy, ale i reálné peníze za kredity. Pokud vás podobné technické dobrodružství baví, fandíte myšlence "práva na opravu" a chtěli byste podpořit mé projekty nebo mi přispět na další podobné pokusy, všechny možnosti najdete na **donate.odjezdy.online**. Každý příspěvek pomůže financovat nejen jednorázové akce, jako je tato, ale třeba i nákup prvního "pacienta" do plánované sbírky.

Teď už ale nezbývá než držet palce, ať se z tohoto kousku křemíku zase stane chytrý telefon a ne jen designové těžítko na stole mého kamaráda.
