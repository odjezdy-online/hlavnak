---
title: "Blog #7 / Info"
date: "2025-07-22T15:57:20.644Z"
updated: "2025-07-22T15:57:42.444Z"
categories: ["BLOG","Info / Update"]
author: "mxnticek"
permalink: "/blog-7-info/"
publiiId: 41
templateEngineOverride: "md"
---

# Blog #7 / Info - Upgrade serverů a změny v síti

Čauko, je čas na další rychlý update, co se děje v zákulisí mých projektů. Tentokrát se to točí hlavně kolem hardwaru a síťové infrastruktury. V posledních týdnech jsem provedl několik zásadních změn, které by měly vést k lepší stabilitě a organizaci. Pojďme na to.

## 1. Přestavba serverové flotily

V mé malé serverovně došlo k velkým změnám. Hlavní novinkou je nasazení nového stroje, který přebírá část zátěže, a přesun jednoho z veteránů na zasloužený odpočinek.

  * **Nový server: CZ03 (iMac mid-2011, 21.5")**
    Tenhle jablečný veterán dostal druhý život a stal se klíčovou součástí mého domácího setupu. Díky slušnému výkonu a spolehlivosti nyní hostuje několik důležitých služeb.

  * **Server CZ01 je v důchodu**
    Můj starý dobrý server **CZ01 (Core 2 Duo)** je nyní v režimu "standby". Jediné, co na něm stabilně poběží, je můj Discord AI chatbot **Tessy J. Elliot**. Zaslouží si odpočinek, ale úplně ho vypínat nechci.

## 2. Nová organizace sítě a proxy

S novým hardwarem přišla i nutnost překopat, jak funguje síť. Vše teď řídí **NGINX Proxy Manager**, který běží na novém serveru **CZ03**.

  * Všechny mé domácí služby jsou nyní proxovány přes něj. Pro představu:
      * **amz.odjezdy.online** je směrováno z **CZ03** na server **CZ02**, kde je služba reálně hostována.
      * **goto.cyn.cz** je naopak hostováno přímo na **CZ03**.

A co zbytek? Většina mých veřejných služeb je stále proxována přes můj hlavní server **DE01** v Německu. Proč není ve veřejných statistikách? Protože jsem línej to nastavit. :)

## 3. Specifikace a benchmarky serverů

A teď to, na co mnozí z vás čekají (nemyslím si) – přehledné shrnutí specifikací a výkonu všech mých strojů.

-----

### DE01 (Contabo - Düsseldorf, DE)

*Hlavní veřejný server, přes který běží většina webů.*

  * **CPU:** AMD EPYC 9224 (6 Cores @ 2.5 GHz)
  * **RAM:** 16 GB
  * **Disk:** ~618 GB NVMe
  * **OS:** Ubuntu 22.04.5 LTS
  * **Geekbench 6:** 1184 (Single-Core) / 2480 (Multi-Core)
  * **Celý YABS výpis:** [Zobrazit zde](https://amz.odjezdy.online/yabs/view.php?id=6700669426a38)

-----

### CZ03 (iMac 21.5" mid-2011)

*Nový hlavní domácí server a proxy.*

  * **CPU:** Intel Core i5-2500S (4 Cores @ 2.7 GHz)
  * **RAM:** 14 GB
  * **Disk:** ~480 GB HDD
  * **OS:** Arch Linux
  * **Geekbench 6:** 649 (Single-Core) / 1581 (Multi-Core)
  * **Celý YABS výpis:** [Zobrazit zde](https://amz.odjezdy.online/yabs/view.php?id=687faf888bb7e)

-----

### CZ02 (Acer Aspire 5)

*Hlavní aplikační server doma.*

  * **CPU:** Intel Core i3-6006U (4 Cores @ 2.0 GHz)
  * **RAM:** 12 GB
  * **Disk:** ~81 GB SSD
  * **OS:** Ubuntu 24.04.2 LTS
  * **Geekbench 6:** 603 (Single-Core) / 1199 (Multi-Core)
  * **Celý YABS výpis:** [Zobrazit zde](https://amz.odjezdy.online/yabs/view.php?id=687faecbc3c8b)

-----

### CZ01 (Core 2 Duo PC)

*Server ve standby režimu.*

  * **CPU:** Intel Core2 CPU 6600 (2 Cores @ 2.4 GHz)
  * **RAM:** 3 GB
  * **Disk:** ~152 GB HDD
  * **OS:** Linux Mint 22.1
  * **Geekbench 6:** 218 (Single-Core) / 461 (Multi-Core)
  * **Celý YABS výpis:** [Zobrazit zde](https://amz.odjezdy.online/yabs/view.php?id=687fb392561c1)
