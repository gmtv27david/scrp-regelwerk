# Southern California Roleplay

Statische, deutschsprachige FiveM-Community-Website. Kein Framework, kein Build-Schritt und kein Formular-Backend erforderlich.

## Seiten

- `index.html`: Landingpage, Community, staatliche Fraktionen, Einstieg, Galerie, FAQ und Verbindungsbereich.
- `regelwerk.html`: Vollständiges Regelwerk mit zwölf Kapiteln und lokaler Suche.
- `impressum.html`, `datenschutz.html`: ausdrücklich unvollständige Entwürfe, **nicht zur Veröffentlichung freigegeben**.
- `assets/css/site.css`: gemeinsame Gestaltung und reduzierte Bewegung.
- `assets/js/config.js`: Discord-, Server- und Social-Media-Ziele.
- `assets/js/site.js`: progressive Navigation, Regelsuche, Szenenwechsel, Galerie und Legacy-Anker.

Die Startseite bietet drei manuell wählbare Spieleindrücke, Galerie-Pfeile und native FAQ-Aufklapper. Community-Grundsätze, Fraktionsregeln, drei bebilderte Einstiegshilfen und ein Support-Leitfaden nutzen die bisherigen Leerflächen. Inhalte erläutern vorhandene Regeln; sie versprechen keine unbekannten Serverfunktionen oder Bewerbungsverfahren. Die Scrollstrecke und Abschnittsabstände sind kompakter, die fotografische Gestaltung bleibt erhalten. Es gibt keinen automatischen Bildwechsel und keinen Scroll-Zwang. Bilder, Flächen und Bedienelemente sind auf Wunsch abgerundet.

`assets/js/motion.js` ergänzt die Startseite um eine kurze, bildfüllende Sticky-Kamerafahrt: Das Spielbild zoomt hinein, der gerundete Rahmen zieht sich zurück und die Überschrift bewegt sich räumlich getrennt. Fraktionsbilder stehen versetzt und reagieren auf Desktop-Mausbewegungen mit einer leichten 3D-Neigung. Dazu kommen seitliche, gestaffelte Einblendungen und scrollabhängiger Bild-Zoom mit Tiefenbewegung. Die Eröffnungssequenz dauert weniger als einen zusätzlichen Bildschirm; auf kleinen Höhen entfällt das Pinning. Die Apple-Inspiration betrifft die ruhige Bewegungsführung, nicht Logos, Produktinhalte oder eine Übernahme der Markenidentität. SCRP-Schrift, Farben und Rundungen bleiben erhalten. Native Scroll-/Wischgesten werden nicht abgefangen; animiert werden nur sichtbare Medien per `requestAnimationFrame`. Bei reduziertem Bewegungsempfinden wird die Erweiterung deaktiviert, auch beim Wechsel der Einstellung während des Besuchs. Während Pinch-Zooms pausieren die Bewegungen. Ohne JavaScript bleiben alle Inhalte sichtbar. Regelwerk und rechtliche Seiten erhalten keine Scroll-Inszenierung.

## Lokal ansehen

Node.js 22 oder neuer:

```sh
node tools/serve.mjs
```

Dann `http://127.0.0.1:5173/scrp-regelwerk/` öffnen. Auch `/` funktioniert. Der Vorschau-Server bindet nur an den eigenen Rechner und ist kein Produktionsserver. Alternativer Port: Umgebungsvariable `PORT` setzen. Das direkte Öffnen von `index.html` funktioniert ebenfalls; HTTP ist für die realistische Prüfung vorzuziehen.

## Links konfigurieren

In `assets/js/config.js`:

- Discord ist `https://discord.gg/sVNPNm3pQf`.
- `server` ist bewusst leer. Erst einen echten `https://cfx.re/join/...`- oder `fivem://connect/...`-Link eintragen. Ohne gültiges Ziel führt die Aktion zum sichtbaren Hinweis, nicht zu einer erfundenen Verbindung.
- `socials.instagram`, `socials.tiktok` und `socials.youtube` bleiben bis zu echten HTTPS-Adressen leer. Unkonfigurierte Einträge sind Textplatzhalter, keine vorgetäuschten Links.

Discord-Links stehen als nutzbarer No-JavaScript-Fallback auch direkt im HTML. Wenn die Einladung geändert wird, zusätzlich die alten Einladungsadressen in allen vier Seiten ersetzen. Änderungen am Serverstart oder Einstiegsablauf auch im FAQ nachziehen.

## Inhalte

Das bisherige Regelwerk wurde vollständig übertragen und sprachlich geglättet. Geändert wurden:

- Der PED-/Model-Vorgabenblock wurde entfernt.
- Staatliche Fraktionen: LAPD, LAFD und UCLA. Die Bedeutung oder Aufgaben von UCLA werden nicht erfunden.
- Beide pauschalen Fahrzeugdiebstahlverbote wurden ersetzt: Diebstahl von Fraktionsfahrzeugen nur bei einer konkreten, nachvollziehbar rechtfertigenden RP-Situation. Kein willkürlicher Spaßdiebstahl.
- Das gesonderte Diebstahl-/Weitergabeverbot für Ausrüstung und Gegenstände bleibt erhalten.
- Veraltete LAPS-/OPG-Verweise wurden entfernt; die Holster-Regel nennt statt der alten Polizei-/Security-Ausnahme nur LAPD.
- Sanktionen, das Null-Verwarnungs-Prinzip, 30-Minuten-NLR, 15-/30-Minuten-Neustartsperren und 4-/6-Personenlimits bleiben bestehen.

Der bisherige Satz „Imitation von Strafverfolgung / Nur Staff“ bleibt inhaltlich erhalten. Seine Abgrenzung zu regulärem Fraktions-RP sollte vor der Freigabe vom Team geklärt werden. „Geldtransport (SAPS)“ bleibt der bisherige Name einer kriminellen Aktivität und wird nicht als zusätzliche staatliche Fraktion aufgeführt.

Alte Links wie `index.html#k6` und `index.html#op-k6` führen mit JavaScript zu `regelwerk.html#k6`. Ohne JavaScript steht der normale Regelwerk-Link zur Verfügung. Die historischen Ordner `v1/` bis `v6/` sind unverändert; sie enthalten alte Regeln und sind keine aktuellen Einstiegsseiten. Vor Veröffentlichung bewusst entscheiden, ob sie weiter öffentlich erreichbar bleiben sollen. Sie werden nicht automatisch gelöscht oder umgeschrieben.

## Datenschutz und Freigabe

Der neue Website-Code verwendet keine Tracker, Widgets, extern geladenen Fonts, Cookies oder Browser-Speicher. Die Suche läuft ausschließlich im Browser. Ausgehende Links laden den Drittanbieter erst bei bewusster Navigation. Hosting-Logs und die Verarbeitung im Discord-/Spielbetrieb sind davon getrennt zu prüfen.

Vor öffentlichem Betrieb:

- Tatsächlichen Betreiber, ladungsfähige Anschrift, erreichbare E-Mail und gegebenenfalls weitere Pflichtangaben ergänzen. Discord allein ersetzt die E-Mail nach § 5 DDG nicht, soweit die Vorschrift anwendbar ist.
- Hosting, Empfänger, Verarbeitungszwecke, Rechtsgrundlagen, Speicherfristen und mögliche Drittlandverarbeitung prüfen und in den Datenschutzhinweisen konkretisieren.
- Rechtliche Entwürfe fachlich prüfen lassen und erst dann Entwurfshinweise/`noindex` entfernen. Es wird keine Rechtsgarantie abgegeben.
- Echten FiveM-Link sowie erforderliche Social-Ziele ergänzen und manuell prüfen. Discord-Einladung auf Gültigkeit prüfen.
- Nutzungsrechte für vorhandenes Logo, Spielszenen, Fahrzeugdarstellungen und gegebenenfalls Markenbezeichnungen klären. Der Unabhängigkeitshinweis ist keine Lizenz.
- Historische Versionsseiten bewusst behandeln; sie sind weiterhin direkt erreichbar.

## Bilder und Schrift

Es wurden **keine neuen Webbilder** verwendet. Alle Bilder stammen aus den bereits vorhandenen Projektdateien `img/11.jpg` bis `img/22.jpg` und `img/logo.png`; Urheberschaft/Lizenz ist im Bestand nicht dokumentiert und muss vor Livegang bestätigt werden. Die Beschreibungen kennzeichnen den Spielkontext. Keine echten Einsatz- oder Behördenaufnahmen werden behauptet.

Montserrat bleibt als bestehende Markenschrift erhalten und wird lokal ausgeliefert. Bezugsquelle: Google Fonts, Montserrat v31 (`fonts.gstatic.com`); Lizenz: SIL Open Font License 1.1, vollständig unter `assets/fonts/montserrat/OFL.txt`. Die drei eingebundenen Schnitte sind Regular, SemiBold und ExtraBold.

## Prüfung

JavaScript-Syntax:

```sh
node --check assets/js/site.js
node --check assets/js/config.js
```

Für die Browser-Smoke-Tests einen vorhandenen kompatiblen Chrome/Edge-CDP-Treiber übergeben, etwa den mit dem Design-Skill installierten `scripts/lib/cdp.mjs`:

```sh
node tools/browser-check.mjs "<Pfad-zum-Design-Skill>/scripts/lib/cdp.mjs"
```

Der Test benötigt Node.js 22+ und installiertes Chrome/Edge. Er startet eine kurzlebige lokale Vorschau und prüft alle Seiten, Links, Ressourcen, Überläufe bei 320/390/768/1440 px, Regelsuche, Legacy-Hashes, mobile Navigation, Galeriedialog, No-JS, reduzierte Bewegung und Verbindungs-Konfiguration. Dabei werden keine echten Serververbindungen oder Social-Beiträge ausgelöst.

GitHub Pages: `.nojekyll` und relative URLs bleiben erhalten. Root- oder Projekt-Unterpfad-Hosting ist möglich. Veröffentlichungsziel: `https://gmtv27david.github.io/scrp-regelwerk/`. Eine Veröffentlichung des Entwicklungsstands ist keine rechtliche Freigabe: Impressum und Datenschutz behalten ihre Entwurfskennzeichnung, bis alle tatsächlichen Angaben ergänzt und geprüft sind.
