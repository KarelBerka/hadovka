# 🎮 HAD // NEON_ARENA

Moderní, plně přizpůsobitelná hra Had běžící přímo ve vašem webovém prohlížeči. Hra podporuje lokální hru pro až 8 hráčů na jedné klávesnici, inteligentní AI boty s volitelnou obtížností, dva odlišné grafické režimy (Cyber-Neon a Retro Lesní Pixel), integrovaný editor vlastních map, portály a přetrvávající Síň slávy!

👉 **[Zde si můžete hru zahrát online!](https://KarelBerka.github.io/hadovka/)** *(Po aktivaci GitHub Pages, viz návod níže)*

---

## 🚀 Hlavní vlastnosti

1. **Ovládání pouze 2 klávesami (Relativní zatáčení):**
   Had se pohybuje automaticky vpřed. Hráč pouze koriguje směr zatáčením doleva nebo doprava vzhledem ke směru hlavy hada.
2. **Lokální multiplayer až pro 8 hráčů:**
   Libovolná kombinace lidských hráčů (s možností přemapovat jakoukoli klávesu) a AI botů.
3. **Inteligentní AI Boti (3 úrovně obtížnosti):**
   *   *Snadná:* Boti se vyhýbají překážkám, ale dělají náhodné tahy a ignorují bodovou hodnotu ovoce.
   *   *Střední:* Standardní hra se základní vyhodnocovací užitkovou funkcí.
   *   *Těžká:* Agresivní point-hunting cesta k ovoci, 2-taktový lookahead výpočet bezpečných únikových cest a okamžité požíraní okolních plodů.
4. **Portály v aréně:**
   Možnost zapnout dvojici telepatických portálů (Blue & Orange), které okamžitě přenesou hada na druhý konec mapy za doprovodu syntezátorových efektů a částic.
5. **Editor vlastních map (Map Creator):**
   Interaktivní canvas mřížka přímo v lobby, ve které si můžete nakreslit libovolné překážky a ty následně hrát na typu mapy "Vlastní".
6. **Síň slávy (Hall of Fame):**
   Top 10 nejlepších skóre ukládaných trvale do prohlížeče (`localStorage`).
7. **Dva vizuální styly:**
   *   **Neonový Cyberpunk:** Tmavá zářící neonová aréna se stíny, pulzováním a částicovými explozemi.
   *   **Retro Pixel Les:** Změní hru na 8-bitový lesní trávník s pixel-art stromy, texturovanými šupinatými hady, otáčejícíma se očima a klasickým ovocem.

---

## 🛠️ Jak zprovoznit na GitHub Pages (github.io)

Abyste mohli hru hrát online přímo na odkazu `https://KarelBerka.github.io/hadovka/`, postupujte podle těchto jednoduchých kroků:

1. Otevřete si váš repozitář na GitHubu: **https://github.com/KarelBerka/hadovka**
2. V horním menu klikněte na položku **Settings** (Nastavení) ⚙️.
3. V levém menu pod sekcí *Code and automation* klikněte na **Pages**.
4. V sekci **Build and deployment**:
   *   U položky **Source** ponechte vybrané `Deploy from a branch`.
   *   U položky **Branch** změňte hodnotu z `None` na **`main`**.
   *   Položku složky ponechte jako **`/ (root)`**.
5. Klikněte na tlačítko **Save** (Uložit).

Během necelé minuty GitHub na pozadí připraví stránku a v horní části této obrazovky se vám zobrazí zelená zpráva s odkazem: 
> *Your site is live at https://KarelBerka.github.io/hadovka/*

Následně stačí na odkaz kliknout a můžete hrát!
