import { defaultLocale } from './i18n.js';
import { foldText } from './tree-data.js';

// Emoji data for EmojiPicker: a selection of about 500 common emojis with German and English names and search words,
// grouped by category. Skin tones are left out (the default yellow). Own data replaces or extends it (EmojiPicker
// `emojis`); language modules add names and search words of further languages (`emojiPicker.emojis`).

export type EmojiCategory =
    'recent' | 'smileys' | 'people' | 'nature' | 'food' | 'travel' | 'activities' | 'objects' | 'symbols';

export interface EmojiData {
    emoji: string;
    /** Name, also the accessible name of its button */
    name: string;
    /** Further search words */
    keywords?: string[];
    category: Exclude<EmojiCategory, 'recent'>;
}

// "emoji Name|Suchwörter" per line – compact to keep the bundle small
const raw: Record<Exclude<EmojiCategory, 'recent'>, string> = {
    smileys: `😀 Grinsendes Gesicht|lachen freude fröhlich
😃 Grinsen mit großen Augen|lachen freude
😄 Lachendes Gesicht|lachen freude glücklich
😁 Strahlendes Gesicht|grinsen zähne
😆 Lachen mit zugekniffenen Augen|lachen lustig
😅 Lachen mit Schweißtropfen|erleichtert puh
🤣 Vor Lachen auf dem Boden|lachen lol lustig
😂 Tränen vor Lachen|lachen lustig weinen
🙂 Leicht lächelndes Gesicht|lächeln
🙃 Umgekehrtes Gesicht|ironie albern
😉 Zwinkerndes Gesicht|zwinkern scherz
😊 Lächeln mit lachenden Augen|freundlich erröten
😇 Lächeln mit Heiligenschein|engel unschuldig
🥰 Lächeln mit Herzen|verliebt liebe
😍 Herzaugen|verliebt liebe toll
🤩 Sternaugen|begeistert wow
😘 Kuss zuwerfen|kuss liebe
😋 Lecker|genießen essen zunge
😛 Zunge herausstrecken|frech
😜 Zwinkern mit Zunge|albern frech
🤪 Verrücktes Gesicht|albern verrückt
🤑 Geldgesicht|geld reich
🤗 Umarmung|umarmen danke
🤭 Hand vor dem Mund|kichern hoppla
🤫 Pst|leise geheim ruhe
🤔 Nachdenkliches Gesicht|denken überlegen hmm
🤐 Reißverschlussmund|schweigen geheim
🤨 Hochgezogene Augenbraue|skeptisch zweifel
😐 Neutrales Gesicht|neutral egal
😑 Ausdrucksloses Gesicht|genervt egal
😶 Gesicht ohne Mund|sprachlos
😏 Süffisantes Lächeln|grinsen schelmisch
😒 Gelangweiltes Gesicht|unzufrieden genervt
🙄 Augenrollen|genervt
😬 Grimasse|peinlich angespannt
😌 Erleichtertes Gesicht|zufrieden ruhig
😔 Nachdenklich traurig|traurig
😪 Müdes Gesicht|schläfrig
😴 Schlafendes Gesicht|schlafen müde zzz
😷 Gesicht mit Maske|krank maske
🤒 Gesicht mit Thermometer|krank fieber
🤢 Übelkeit|krank übel
🤧 Niesendes Gesicht|schnupfen erkältung
🥵 Heißes Gesicht|hitze schwitzen
🥶 Kaltes Gesicht|kalt frieren
😵 Benommenes Gesicht|schwindelig
🤯 Explodierender Kopf|überwältigt wow
🤠 Cowboy|hut
🥳 Partygesicht|feiern party geburtstag
😎 Sonnenbrille|cool lässig
🤓 Strebergesicht|nerd brille
🧐 Gesicht mit Monokel|prüfen genau
😕 Verwirrtes Gesicht|unsicher
😟 Besorgtes Gesicht|sorge
🙁 Leicht trauriges Gesicht|traurig
😮 Offener Mund|überrascht staunen
😲 Erstauntes Gesicht|überrascht schock
😳 Errötetes Gesicht|peinlich verlegen
🥺 Flehendes Gesicht|bitte bettelnd
😨 Ängstliches Gesicht|angst
😰 Besorgt mit Schweiß|angst stress
😢 Weinendes Gesicht|traurig träne
😭 Laut weinend|traurig weinen
😱 Schreiendes Gesicht|angst schock horror
😖 Verwirrtes Gesicht|frustriert
😞 Enttäuschtes Gesicht|enttäuscht traurig
😓 Niedergeschlagen mit Schweiß|stress
😩 Erschöpftes Gesicht|müde fertig
😫 Müde|erschöpft
🥱 Gähnendes Gesicht|gähnen müde langweilig
😤 Triumphierendes Gesicht|schnauben stolz
😡 Wütendes Gesicht|wut ärger
😠 Verärgertes Gesicht|ärger böse
🤬 Fluchendes Gesicht|schimpfen wut
😈 Lachender Teufel|teufel frech
💀 Totenkopf|tot schädel
💩 Kothaufen|lustig
🤡 Clown|clownsgesicht
👻 Gespenst|geist halloween
👽 Außerirdischer|alien ufo
🤖 Roboter|bot maschine ki
😺 Lachende Katze|katze
😻 Katze mit Herzaugen|katze verliebt
🙈 Nichts sehen|affe peinlich
🙉 Nichts hören|affe
🙊 Nichts sagen|affe geheim`,
    people: `👋 Winkende Hand|hallo tschüss winken
🤚 Erhobene Hand|stopp melden
✋ Hand|stopp halt fünf
🖖 Vulkanischer Gruß|spock
👌 OK-Zeichen|ok gut perfekt
🤌 Zusammengelegte Finger|italienisch was
✌️ Victory-Zeichen|sieg frieden
🤞 Gekreuzte Finger|glück daumen drücken
🤟 Ich liebe dich|liebe geste
🤘 Teufelsgruß|rock metal
🤙 Ruf mich an|telefon
👈 Zeigefinger links|links zeigen
👉 Zeigefinger rechts|rechts zeigen
👆 Zeigefinger nach oben|oben
👇 Zeigefinger nach unten|unten
☝️ Zeigefinger|eins hinweis
👍 Daumen hoch|gut ja zustimmung like
👎 Daumen runter|schlecht nein ablehnung
✊ Erhobene Faust|faust solidarität
👊 Faust|faustschlag
👏 Klatschende Hände|applaus bravo klatschen
🙌 Erhobene Hände|feiern hurra
👐 Offene Hände|umarmung
🤲 Handflächen nach oben|bitten
🤝 Handschlag|vereinbarung deal partner
🙏 Gefaltete Hände|bitte danke beten
✍️ Schreibende Hand|schreiben notiz
💪 Bizeps|stark kraft muskel
🧠 Gehirn|denken klug
👀 Augen|schauen sehen
👁️ Auge|sehen
👄 Mund|lippen
👶 Baby|kind säugling
🧒 Kind|kind
👦 Junge|kind
👧 Mädchen|kind
🧑 Person|mensch
👨 Mann|mensch
👩 Frau|mensch
🧓 Ältere Person|alt senior
👮 Polizist|polizei
🕵️ Detektiv|spion ermittler
👷 Bauarbeiter|baustelle helm
🧑‍💻 Person am Computer|programmieren entwickler technik
🧑‍🏫 Lehrkraft|lehrer schule
🧑‍⚕️ Ärztin oder Arzt|medizin gesundheit
🧑‍🍳 Koch|kochen küche
🦸 Superheld|held
🙋 Person mit erhobener Hand|melden frage hallo
🤷 Schulterzucken|egal weiß nicht
🤦 Hand vor die Stirn|facepalm oh nein
🙇 Verbeugung|entschuldigung danke
💁 Infoschalter-Person|info hilfe
🏃 Laufende Person|laufen rennen sport
🚶 Gehende Person|gehen spazieren
💃 Tanzende Frau|tanzen party
🕺 Tanzender Mann|tanzen party
👨‍👩‍👧 Familie|eltern kind
👥 Silhouetten|gruppe team leute
🗣️ Sprechender Kopf|sprechen reden`,
    nature: `🐶 Hundegesicht|hund haustier
🐱 Katzengesicht|katze haustier
🐭 Mausgesicht|maus
🐹 Hamster|haustier
🐰 Hasengesicht|hase kaninchen ostern
🦊 Fuchs|fuchs
🐻 Bär|bär
🐼 Panda|bär
🐨 Koala|bär
🐯 Tigergesicht|tiger
🦁 Löwe|löwe
🐮 Kuhgesicht|kuh
🐷 Schweinegesicht|schwein
🐸 Frosch|frosch
🐵 Affengesicht|affe
🐔 Huhn|huhn vogel
🐧 Pinguin|vogel
🐦 Vogel|vogel
🦆 Ente|vogel
🦅 Adler|vogel
🦉 Eule|vogel nacht
🐝 Biene|honig insekt
🐛 Raupe|insekt
🦋 Schmetterling|insekt
🐌 Schnecke|langsam
🐞 Marienkäfer|glück insekt
🐢 Schildkröte|langsam
🐍 Schlange|reptil
🐙 Oktopus|krake meer
🐠 Tropischer Fisch|fisch meer
🐬 Delfin|meer
🐳 Wal|meer
🦈 Hai|meer
🐊 Krokodil|reptil
🦒 Giraffe|tier
🐘 Elefant|tier
🐴 Pferdegesicht|pferd
🦄 Einhorn|fantasie
🐾 Pfotenabdrücke|tier spuren
💐 Blumenstrauß|blumen geschenk
🌸 Kirschblüte|blume frühling
🌹 Rose|blume liebe
🌻 Sonnenblume|blume sommer
🌷 Tulpe|blume frühling
🌱 Keimling|pflanze wachsen
🌲 Nadelbaum|baum wald
🌳 Laubbaum|baum
🌴 Palme|urlaub strand
🌵 Kaktus|wüste pflanze
🍀 Kleeblatt|glück
🍁 Ahornblatt|herbst
🍂 Herbstlaub|herbst blätter
🌍 Weltkugel Europa und Afrika|erde welt global
🌙 Mondsichel|mond nacht
⭐ Stern|stern
🌟 Leuchtender Stern|stern glanz
⚡ Blitz|strom energie schnell
🔥 Feuer|heiß flamme trend
🌈 Regenbogen|farben
☀️ Sonne|sonnig wetter
⛅ Sonne hinter Wolke|wetter wolkig
☁️ Wolke|wetter
🌧️ Regenwolke|regen wetter
❄️ Schneeflocke|schnee winter kalt
💧 Tropfen|wasser
🌊 Welle|meer wasser`,
    food: `🍏 Grüner Apfel|obst
🍎 Roter Apfel|obst
🍐 Birne|obst
🍊 Mandarine|obst orange
🍋 Zitrone|obst sauer
🍌 Banane|obst
🍉 Wassermelone|obst sommer
🍇 Trauben|obst wein
🍓 Erdbeere|obst
🍒 Kirschen|obst
🍑 Pfirsich|obst
🥭 Mango|obst
🍍 Ananas|obst
🥥 Kokosnuss|obst
🥝 Kiwi|obst
🍅 Tomate|gemüse
🥑 Avocado|gemüse
🥦 Brokkoli|gemüse
🥕 Karotte|möhre gemüse
🌽 Maiskolben|mais gemüse
🌶️ Peperoni|scharf
🥔 Kartoffel|gemüse
🍄 Pilz|pilz
🥜 Erdnüsse|nüsse
🍞 Brot|bäckerei
🥐 Croissant|frühstück
🥨 Brezel|bayern
🧀 Käse|käse
🥚 Ei|frühstück
🍳 Spiegelei|frühstück braten
🥞 Pfannkuchen|frühstück
🥓 Speck|frühstück
🍔 Hamburger|burger fastfood
🍟 Pommes|fastfood
🍕 Pizza|italienisch
🌭 Hotdog|würstchen
🥪 Sandwich|brot
🌮 Taco|mexikanisch
🥗 Salat|gesund
🍝 Spaghetti|nudeln pasta
🍜 Nudelsuppe|ramen
🍣 Sushi|japanisch fisch
🍦 Softeis|eis dessert
🍩 Donut|süß
🍪 Keks|süß
🎂 Geburtstagskuchen|geburtstag torte feiern
🍰 Kuchenstück|kuchen torte
🧁 Cupcake|kuchen süß
🍫 Schokolade|süß
🍬 Bonbon|süß
🍯 Honigtopf|honig
☕ Heißgetränk|kaffee tee pause
🍵 Tee|tee
🥤 Becher mit Strohhalm|getränk
🍺 Bier|getränk prost
🍻 Anstoßende Biergläser|prost feiern
🍷 Weinglas|wein getränk
🥂 Sektgläser|anstoßen feiern prost
🍾 Sektflasche|feiern
🍽️ Teller mit Besteck|essen mahlzeit`,
    travel: `🚗 Auto|fahrzeug
🚕 Taxi|fahrzeug
🚌 Bus|fahrzeug verkehr
🚑 Krankenwagen|notfall
🚒 Feuerwehrauto|feuerwehr
🚓 Polizeiauto|polizei
🚚 Lieferwagen|lieferung lkw versand
🚜 Traktor|landwirtschaft
🚲 Fahrrad|rad
🛴 Tretroller|roller
🏍️ Motorrad|fahrzeug
🚂 Lokomotive|zug bahn
🚆 Zug|bahn reise
🚇 U-Bahn|bahn
✈️ Flugzeug|fliegen reise urlaub
🛫 Abflug|fliegen reise
🛬 Landung|fliegen ankunft
🚀 Rakete|start launch schnell
🛸 Ufo|außerirdisch
🚁 Hubschrauber|fliegen
⛵ Segelboot|boot segeln
🚢 Schiff|boot reise
⚓ Anker|schiff
⛽ Zapfsäule|tanken benzin
🚦 Ampel|verkehr
🚧 Baustelle|arbeit sperrung
🗺️ Weltkarte|karte reise
🧭 Kompass|richtung navigation
🏔️ Schneebedeckter Berg|berg
🏖️ Strand mit Sonnenschirm|urlaub strand
🏝️ Insel|urlaub
🏠 Haus|zuhause heim
🏡 Haus mit Garten|zuhause
🏢 Bürogebäude|büro firma arbeit
🏥 Krankenhaus|klinik
🏦 Bank|geld
🏨 Hotel|reise übernachtung
🏫 Schule|bildung
🏭 Fabrik|industrie
🏰 Schloss|burg
⛪ Kirche|religion
🗼 Turm|tokio
🗽 Freiheitsstatue|new york
🎡 Riesenrad|kirmes
🌃 Nacht mit Sternen|stadt nacht
🌅 Sonnenaufgang|morgen
⏰ Wecker|zeit wecker morgen
⌛ Sanduhr|zeit warten
⏱️ Stoppuhr|zeit messen
🕐 Ein Uhr|uhr zeit`,
    activities: `⚽ Fußball|sport ball
🏀 Basketball|sport ball
🏈 Football|sport ball
⚾ Baseball|sport ball
🎾 Tennis|sport ball
🏐 Volleyball|sport ball
🏓 Tischtennis|sport
🏸 Badminton|sport
🥅 Tor|sport
⛳ Golffahne|golf sport
🎣 Angel|angeln fisch
🎿 Ski|wintersport
🏂 Snowboarder|wintersport
🏊 Schwimmer|schwimmen sport
🚴 Radfahrer|fahrrad sport
🏆 Pokal|sieg gewinner preis
🥇 Goldmedaille|erster sieg gewinner
🥈 Silbermedaille|zweiter
🥉 Bronzemedaille|dritter
🏅 Sportmedaille|medaille preis
🎖️ Orden|auszeichnung
🎫 Eintrittskarte|ticket
🎟️ Ticket|eintritt
🎭 Theatermasken|theater kultur
🎨 Farbpalette|kunst malen design
🎬 Filmklappe|film kino
🎤 Mikrofon|singen karaoke
🎧 Kopfhörer|musik hören
🎵 Musiknote|musik
🎶 Musiknoten|musik
🎹 Klaviatur|klavier musik
🎸 Gitarre|musik
🎮 Videospiel|spielen gaming controller
🕹️ Joystick|spielen gaming
🎲 Würfel|spiel glück
🧩 Puzzleteil|puzzle lösung
♟️ Schachfigur|schach strategie
🎯 Volltreffer|ziel treffer
🎳 Bowling|spiel
🎉 Konfettibombe|feiern party glückwunsch
🎊 Konfettiball|feiern party
🎈 Luftballon|party geburtstag
🎁 Geschenk|geburtstag überraschung
🎄 Weihnachtsbaum|weihnachten
🎃 Kürbislaterne|halloween
✨ Funkeln|glanz neu magie`,
    objects: `⌚ Armbanduhr|uhr zeit
📱 Mobiltelefon|handy smartphone
💻 Laptop|computer rechner arbeit
⌨️ Tastatur|computer tippen
🖥️ Bildschirm|computer monitor
🖨️ Drucker|drucken
🖱️ Computermaus|maus klicken
💾 Diskette|speichern
💿 CD|daten musik
📷 Kamera|foto
📹 Videokamera|video
📞 Telefonhörer|telefon anrufen
☎️ Telefon|anrufen
📺 Fernseher|tv
📻 Radio|musik
🔋 Batterie|akku energie
🔌 Stecker|strom
💡 Glühbirne|idee licht tipp
🔦 Taschenlampe|licht
🕯️ Kerze|licht
🗑️ Papierkorb|löschen müll
💰 Geldsack|geld reich
💳 Kreditkarte|bezahlen geld
💶 Euroschein|geld euro
🧾 Beleg|quittung rechnung
✉️ Briefumschlag|brief post mail
📧 E-Mail|mail nachricht
📨 Eingehender Umschlag|mail empfangen
📦 Paket|versand lieferung
📮 Briefkasten|post
📝 Notiz|schreiben memo
✏️ Bleistift|schreiben bearbeiten
🖊️ Kugelschreiber|schreiben
📁 Ordner|datei ablage
📂 Geöffneter Ordner|datei
📄 Dokument|datei seite
📊 Balkendiagramm|statistik daten chart
📈 Steigender Trend|wachstum statistik
📉 Fallender Trend|rückgang statistik
📅 Kalender|datum termin
📆 Abreißkalender|datum termin
📌 Pinnnadel|merken wichtig
📍 Stecknadel|ort standort
📎 Büroklammer|anhang
📏 Lineal|messen
✂️ Schere|schneiden
🔒 Geschlossenes Schloss|sicher gesperrt privat
🔓 Offenes Schloss|entsperrt
🔑 Schlüssel|passwort zugang
🔨 Hammer|werkzeug bauen
🛠️ Werkzeuge|reparieren einstellungen
⚙️ Zahnrad|einstellungen technik
🧰 Werkzeugkasten|werkzeug
🧲 Magnet|anziehen
🧪 Reagenzglas|labor test chemie
🔬 Mikroskop|wissenschaft forschung
🔭 Teleskop|astronomie
💊 Tablette|medizin
🩺 Stethoskop|arzt medizin
🛒 Einkaufswagen|einkaufen shop
🎒 Rucksack|schule
👓 Brille|lesen
📚 Bücher|lesen lernen bibliothek
📖 Offenes Buch|lesen
🔍 Lupe|suchen suche
🔔 Glocke|benachrichtigung
📣 Megafon|ankündigung
🏷️ Etikett|tag label preis
🔗 Link|verknüpfung kette`,
    symbols: `❤️ Rotes Herz|liebe herz
🧡 Oranges Herz|herz
💛 Gelbes Herz|herz
💚 Grünes Herz|herz
💙 Blaues Herz|herz
💜 Lila Herz|herz
🖤 Schwarzes Herz|herz
🤍 Weißes Herz|herz
💔 Gebrochenes Herz|trauer liebe
💕 Zwei Herzen|liebe
💯 Hundert Punkte|perfekt voll
💢 Ärger-Symbol|wut
💥 Zusammenstoß|knall boom
💫 Schwindelig|sterne
💬 Sprechblase|nachricht kommentar chat
💭 Gedankenblase|denken
💤 Schlafen|zzz müde
✅ Weißes Häkchen auf Grün|erledigt ja fertig ok
☑️ Abgehaktes Kästchen|erledigt
✔️ Häkchen|ok richtig
❌ Kreuz|nein falsch fehler löschen
❎ Kreuz-Schaltfläche|nein
➕ Plus|hinzufügen mehr
➖ Minus|weniger entfernen
❓ Fragezeichen|frage hilfe
❗ Ausrufezeichen|wichtig achtung
⚠️ Warnung|achtung vorsicht
⛔ Zutritt verboten|stopp verbot
🚫 Verboten|nein verbot
♻️ Recycling|umwelt
✳️ Achtzackiger Stern|stern
🆕 Neu|neu
🆗 OK|ok
🆘 SOS|hilfe notfall
🔴 Roter Kreis|rot punkt
🟠 Oranger Kreis|orange punkt
🟡 Gelber Kreis|gelb punkt
🟢 Grüner Kreis|grün punkt
🔵 Blauer Kreis|blau punkt
🟣 Lila Kreis|lila punkt
⚫ Schwarzer Kreis|schwarz punkt
⚪ Weißer Kreis|weiß punkt
🔺 Rotes Dreieck|nach oben
🔻 Rotes Dreieck nach unten|nach unten
⬆️ Pfeil nach oben|oben hoch
⬇️ Pfeil nach unten|unten runter
⬅️ Pfeil nach links|links zurück
➡️ Pfeil nach rechts|rechts weiter
🔄 Pfeile gegen den Uhrzeigersinn|aktualisieren neu laden
🔁 Wiederholen|schleife
▶️ Wiedergabe|abspielen play
⏸️ Pause|pause
⏹️ Stopp|stopp
🔇 Stumm|ton aus
🔊 Lautsprecher laut|ton an
©️ Copyright|recht
®️ Eingetragene Marke|marke
™️ Markenzeichen|marke
#️⃣ Raute|hashtag nummer
🔢 Zahlen|nummer
ℹ️ Information|info hinweis
🏁 Zielflagge|ziel rennen fertig
🚩 Dreiecksflagge|markierung warnung
🏳️ Weiße Flagge|aufgeben
🇩🇪 Flagge Deutschland|deutschland
🇦🇹 Flagge Österreich|österreich
🇨🇭 Flagge Schweiz|schweiz
🇪🇺 Flagge Europäische Union|eu europa`,
};

// The same emojis in English ("emoji Name|search words" per line)
const rawEnglish = `😀 Grinning face|smile happy joy
😃 Grinning face with big eyes|smile happy
😄 Grinning face with smiling eyes|laugh happy
😁 Beaming face|grin teeth
😆 Grinning squinting face|laugh funny
😅 Grinning face with sweat|relief phew
🤣 Rolling on the floor laughing|rofl lol funny
😂 Face with tears of joy|laugh funny lol
🙂 Slightly smiling face|smile
🙃 Upside-down face|irony silly
😉 Winking face|wink joke
😊 Smiling face with smiling eyes|friendly blush
😇 Smiling face with halo|angel innocent
🥰 Smiling face with hearts|love adore
😍 Heart eyes|love crush
🤩 Star-struck|excited wow
😘 Face blowing a kiss|kiss love
😋 Yum|delicious tongue food
😛 Face with tongue|cheeky
😜 Winking face with tongue|silly cheeky
🤪 Zany face|crazy silly
🤑 Money-mouth face|money rich
🤗 Hugging face|hug thanks
🤭 Hand over mouth|giggle oops
🤫 Shushing face|quiet secret
🤔 Thinking face|think hmm
🤐 Zipper-mouth face|silence secret
🤨 Raised eyebrow|skeptical doubt
😐 Neutral face|meh
😑 Expressionless face|annoyed meh
😶 Face without mouth|speechless
😏 Smirking face|smirk smug
😒 Unamused face|bored annoyed
🙄 Rolling eyes|eye roll annoyed
😬 Grimacing face|awkward tense
😌 Relieved face|calm content
😔 Pensive face|sad
😪 Sleepy face|tired
😴 Sleeping face|sleep tired zzz
😷 Face with medical mask|sick mask
🤒 Face with thermometer|sick fever ill
🤢 Nauseated face|sick nausea
🤧 Sneezing face|sneeze cold
🥵 Hot face|heat sweat
🥶 Cold face|freezing
😵 Dizzy face|dazed
🤯 Exploding head|mind blown shocked
🤠 Cowboy hat face|cowboy
🥳 Partying face|party celebrate birthday
😎 Smiling face with sunglasses|cool
🤓 Nerd face|geek
🧐 Face with monocle|inspect
😕 Confused face|confused
😟 Worried face|worry
🙁 Slightly frowning face|sad
😮 Face with open mouth|surprised
😲 Astonished face|amazed shocked
😳 Flushed face|embarrassed
🥺 Pleading face|please puppy eyes
😨 Fearful face|scared afraid
😰 Anxious face with sweat|nervous
😢 Crying face|cry sad tear
😭 Loudly crying face|sob sad
😱 Face screaming in fear|scream scared
😖 Confounded face|frustrated
😞 Disappointed face|disappointed sad
😓 Downcast face with sweat|stress
😩 Weary face|exhausted
😫 Tired face|tired
🥱 Yawning face|yawn bored
😤 Face with steam from nose|triumph angry
😡 Pouting face|angry rage
😠 Angry face|angry mad
🤬 Face with symbols on mouth|swearing cursing
😈 Smiling face with horns|devil evil
💀 Skull|dead
💩 Pile of poo|poop
🤡 Clown face|clown
👻 Ghost|halloween spooky
👽 Alien|ufo extraterrestrial
🤖 Robot|bot
😺 Grinning cat|cat smile
😻 Cat with heart eyes|cat love
🙈 See-no-evil monkey|monkey
🙉 Hear-no-evil monkey|monkey
🙊 Speak-no-evil monkey|monkey
👋 Waving hand|wave hello bye
🤚 Raised back of hand|hand
✋ Raised hand|hand stop high five
🖖 Vulcan salute|spock
👌 OK hand|ok perfect
🤌 Pinched fingers|italian
✌️ Victory hand|peace
🤞 Crossed fingers|luck hope
🤟 Love-you gesture|love
🤘 Sign of the horns|rock
🤙 Call me hand|call phone
👈 Backhand index pointing left|left point
👉 Backhand index pointing right|right point
👆 Backhand index pointing up|up point
👇 Backhand index pointing down|down point
☝️ Index pointing up|up attention
👍 Thumbs up|like yes good
👎 Thumbs down|dislike no bad
✊ Raised fist|power
👊 Oncoming fist|punch fist bump
👏 Clapping hands|applause clap bravo
🙌 Raising hands|hooray celebrate
👐 Open hands|hands
🤲 Palms up together|prayer
🤝 Handshake|deal agreement
🙏 Folded hands|please thanks pray
✍️ Writing hand|write
💪 Flexed biceps|strong muscle
🧠 Brain|smart think
👀 Eyes|look see
👁️ Eye|look see
👄 Mouth|lips
👶 Baby|child
🧒 Child|kid
👦 Boy|child
👧 Girl|child
🧑 Person|human
👨 Man|male
👩 Woman|female
🧓 Older person|old elderly
👮 Police officer|police cop
🕵️ Detective|spy
👷 Construction worker|builder
🧑‍💻 Technologist|developer computer programmer
🧑‍🏫 Teacher|school
🧑‍⚕️ Health worker|doctor nurse
🧑‍🍳 Cook|chef
🦸 Superhero|hero
🙋 Person raising hand|question
🤷 Person shrugging|shrug dunno
🤦 Person facepalming|facepalm
🙇 Person bowing|bow sorry
💁 Person tipping hand|information
🏃 Person running|run
🚶 Person walking|walk
💃 Woman dancing|dance
🕺 Man dancing|dance
👨‍👩‍👧 Family|parents child
👥 Busts in silhouette|people users team
🗣️ Speaking head|speak talk
🐶 Dog face|dog puppy
🐱 Cat face|cat kitten
🐭 Mouse face|mouse
🐹 Hamster|pet
🐰 Rabbit face|rabbit bunny
🦊 Fox|animal
🐻 Bear|animal
🐼 Panda|animal
🐨 Koala|animal
🐯 Tiger face|tiger
🦁 Lion|animal
🐮 Cow face|cow
🐷 Pig face|pig
🐸 Frog|animal
🐵 Monkey face|monkey
🐔 Chicken|hen
🐧 Penguin|bird
🐦 Bird|animal
🦆 Duck|bird
🦅 Eagle|bird
🦉 Owl|bird
🐝 Honeybee|bee insect
🐛 Bug|caterpillar insect
🦋 Butterfly|insect
🐌 Snail|slow
🐞 Lady beetle|ladybug insect
🐢 Turtle|slow
🐍 Snake|animal
🐙 Octopus|sea
🐠 Tropical fish|fish
🐬 Dolphin|sea
🐳 Spouting whale|whale sea
🦈 Shark|fish sea
🐊 Crocodile|animal
🦒 Giraffe|animal
🐘 Elephant|animal
🐴 Horse face|horse
🦄 Unicorn|magic
🐾 Paw prints|paw pet
💐 Bouquet|flowers
🌸 Cherry blossom|flower spring
🌹 Rose|flower love
🌻 Sunflower|flower
🌷 Tulip|flower
🌱 Seedling|plant grow
🌲 Evergreen tree|tree
🌳 Deciduous tree|tree
🌴 Palm tree|tree beach
🌵 Cactus|plant desert
🍀 Four leaf clover|luck clover
🍁 Maple leaf|autumn fall
🍂 Fallen leaf|autumn fall
🌍 Globe showing Europe-Africa|earth world
🌙 Crescent moon|moon night
⭐ Star|favorite
🌟 Glowing star|star shine
⚡ High voltage|lightning electric fast
🔥 Fire|hot lit
🌈 Rainbow|weather
☀️ Sun|sunny weather
⛅ Sun behind cloud|weather
☁️ Cloud|weather
🌧️ Cloud with rain|rain weather
❄️ Snowflake|snow cold winter
💧 Droplet|water drop
🌊 Water wave|wave sea ocean
🍏 Green apple|fruit
🍎 Red apple|fruit
🍐 Pear|fruit
🍊 Tangerine|orange fruit
🍋 Lemon|fruit
🍌 Banana|fruit
🍉 Watermelon|fruit
🍇 Grapes|fruit
🍓 Strawberry|fruit
🍒 Cherries|fruit
🍑 Peach|fruit
🥭 Mango|fruit
🍍 Pineapple|fruit
🥥 Coconut|fruit
🥝 Kiwi fruit|fruit
🍅 Tomato|vegetable
🥑 Avocado|fruit
🥦 Broccoli|vegetable
🥕 Carrot|vegetable
🌽 Ear of corn|corn maize
🌶️ Hot pepper|chili spicy
🥔 Potato|vegetable
🍄 Mushroom|fungus
🥜 Peanuts|nuts
🍞 Bread|loaf
🥐 Croissant|bakery
🥨 Pretzel|bakery
🧀 Cheese wedge|cheese
🥚 Egg|breakfast
🍳 Cooking|fried egg breakfast
🥞 Pancakes|breakfast
🥓 Bacon|breakfast
🍔 Hamburger|burger
🍟 French fries|fries chips
🍕 Pizza|food
🌭 Hot dog|sausage
🥪 Sandwich|food
🌮 Taco|mexican
🥗 Green salad|salad healthy
🍝 Spaghetti|pasta
🍜 Steaming bowl|noodles ramen soup
🍣 Sushi|japanese
🍦 Soft ice cream|ice cream dessert
🍩 Doughnut|donut dessert
🍪 Cookie|biscuit
🎂 Birthday cake|cake birthday
🍰 Shortcake|cake dessert
🧁 Cupcake|cake
🍫 Chocolate bar|chocolate
🍬 Candy|sweet
🍯 Honey pot|honey
☕ Hot beverage|coffee tea
🍵 Teacup without handle|tea
🥤 Cup with straw|drink soda
🍺 Beer mug|beer
🍻 Clinking beer mugs|cheers beer
🍷 Wine glass|wine
🥂 Clinking glasses|cheers champagne toast
🍾 Bottle with popping cork|champagne celebrate
🍽️ Fork and knife with plate|dinner meal
🚗 Automobile|car
🚕 Taxi|cab
🚌 Bus|public transport
🚑 Ambulance|emergency
🚒 Fire engine|fire truck
🚓 Police car|police
🚚 Delivery truck|truck shipping
🚜 Tractor|farm
🚲 Bicycle|bike
🛴 Kick scooter|scooter
🏍️ Motorcycle|motorbike
🚂 Locomotive|train steam
🚆 Train|railway
🚇 Metro|subway underground
✈️ Airplane|plane flight
🛫 Airplane departure|takeoff flight
🛬 Airplane arrival|landing flight
🚀 Rocket|launch space
🛸 Flying saucer|ufo
🚁 Helicopter|flight
⛵ Sailboat|boat
🚢 Ship|boat cruise
⚓ Anchor|ship
⛽ Fuel pump|gas petrol
🚦 Vertical traffic light|traffic light
🚧 Construction|roadworks
🗺️ World map|map
🧭 Compass|navigation
🏔️ Snow-capped mountain|mountain
🏖️ Beach with umbrella|beach vacation
🏝️ Desert island|island
🏠 House|home
🏡 House with garden|home
🏢 Office building|office
🏥 Hospital|health
🏦 Bank|money
🏨 Hotel|travel
🏫 School|education
🏭 Factory|industry
🏰 Castle|palace
⛪ Church|religion
🗼 Tokyo tower|tower
🗽 Statue of Liberty|new york
🎡 Ferris wheel|fair
🌃 Night with stars|night city
🌅 Sunrise|morning
⏰ Alarm clock|alarm time
⌛ Hourglass done|time wait
⏱️ Stopwatch|timer time
🕐 One o’clock|time clock
⚽ Soccer ball|football sport
🏀 Basketball|sport
🏈 American football|sport
⚾ Baseball|sport
🎾 Tennis|sport
🏐 Volleyball|sport
🏓 Ping pong|table tennis sport
🏸 Badminton|sport
🥅 Goal net|goal sport
⛳ Flag in hole|golf
🎣 Fishing pole|fishing
🎿 Skis|ski winter
🏂 Snowboarder|winter sport
🏊 Person swimming|swim
🚴 Person biking|cycling bike
🏆 Trophy|win prize
🥇 1st place medal|gold winner
🥈 2nd place medal|silver
🥉 3rd place medal|bronze
🏅 Sports medal|medal
🎖️ Military medal|medal honour
🎫 Ticket|admission
🎟️ Admission tickets|ticket
🎭 Performing arts|theatre masks
🎨 Artist palette|art paint
🎬 Clapper board|film movie
🎤 Microphone|sing karaoke
🎧 Headphone|music audio
🎵 Musical note|music
🎶 Musical notes|music
🎹 Musical keyboard|piano
🎸 Guitar|music
🎮 Video game|game controller
🕹️ Joystick|game
🎲 Game die|dice
🧩 Puzzle piece|jigsaw
♟️ Chess pawn|chess
🎯 Bullseye|target dart
🎳 Bowling|sport
🎉 Party popper|party celebrate tada
🎊 Confetti ball|party celebrate
🎈 Balloon|party birthday
🎁 Wrapped gift|present gift
🎄 Christmas tree|christmas
🎃 Jack-o-lantern|halloween pumpkin
✨ Sparkles|shine magic new
⌚ Watch|time
📱 Mobile phone|smartphone
💻 Laptop|computer
⌨️ Keyboard|computer type
🖥️ Desktop computer|monitor screen
🖨️ Printer|print
🖱️ Computer mouse|mouse click
💾 Floppy disk|save
💿 Optical disk|cd
📷 Camera|photo
📹 Video camera|video
📞 Telephone receiver|phone call
☎️ Telephone|phone
📺 Television|tv
📻 Radio|music
🔋 Battery|power
🔌 Electric plug|plug power
💡 Light bulb|idea
🔦 Flashlight|torch light
🕯️ Candle|light
🗑️ Wastebasket|trash delete bin
💰 Money bag|money
💳 Credit card|payment
💶 Euro banknote|money euro
🧾 Receipt|invoice bill
✉️ Envelope|letter mail
📧 E-mail|email mail
📨 Incoming envelope|mail inbox
📦 Package|box parcel
📮 Postbox|mailbox
📝 Memo|note write
✏️ Pencil|write edit
🖊️ Pen|write
📁 File folder|folder
📂 Open file folder|folder
📄 Page facing up|document file
📊 Bar chart|chart statistics
📈 Chart increasing|trend up growth
📉 Chart decreasing|trend down
📅 Calendar|date
📆 Tear-off calendar|date
📌 Pushpin|pin
📍 Round pushpin|location pin
📎 Paperclip|attachment
📏 Straight ruler|ruler measure
✂️ Scissors|cut
🔒 Locked|lock secure
🔓 Unlocked|unlock open
🔑 Key|password
🔨 Hammer|tool
🛠️ Hammer and wrench|tools
⚙️ Gear|settings
🧰 Toolbox|tools
🧲 Magnet|attract
🧪 Test tube|science lab
🔬 Microscope|science
🔭 Telescope|space
💊 Pill|medicine
🩺 Stethoscope|doctor health
🛒 Shopping cart|shop
🎒 Backpack|school bag
👓 Glasses|eyeglasses
📚 Books|library read
📖 Open book|read
🔍 Magnifying glass|search find
🔔 Bell|notification
📣 Megaphone|announcement
🏷️ Label|tag
🔗 Link|chain url
❤️ Red heart|love
🧡 Orange heart|love
💛 Yellow heart|love
💚 Green heart|love
💙 Blue heart|love
💜 Purple heart|love
🖤 Black heart|love
🤍 White heart|love
💔 Broken heart|heartbreak sad
💕 Two hearts|love
💯 Hundred points|100 perfect
💢 Anger symbol|angry
💥 Collision|boom
💫 Dizzy|stars
💬 Speech balloon|comment chat message
💭 Thought balloon|think
💤 Zzz|sleep
✅ Check mark button|done yes ok
☑️ Check box with check|done
✔️ Check mark|done yes
❌ Cross mark|no wrong
❎ Cross mark button|no
➕ Plus|add
➖ Minus|subtract remove
❓ Question mark|question help
❗ Exclamation mark|important
⚠️ Warning|caution
⛔ No entry|forbidden
🚫 Prohibited|forbidden no
♻️ Recycling symbol|recycle
✳️ Eight-spoked asterisk|asterisk
🆕 New button|new
🆗 OK button|ok
🆘 SOS button|help
🔴 Red circle|red
🟠 Orange circle|orange
🟡 Yellow circle|yellow
🟢 Green circle|green
🔵 Blue circle|blue
🟣 Purple circle|purple
⚫ Black circle|black
⚪ White circle|white
🔺 Red triangle pointed up|up
🔻 Red triangle pointed down|down
⬆️ Up arrow|up
⬇️ Down arrow|down
⬅️ Left arrow|left
➡️ Right arrow|right
🔄 Counterclockwise arrows|refresh reload sync
🔁 Repeat button|repeat loop
▶️ Play button|play
⏸️ Pause button|pause
⏹️ Stop button|stop
🔇 Muted speaker|mute
🔊 Speaker high volume|sound loud
©️ Copyright|copyright
®️ Registered|trademark
™️ Trade mark|trademark
#️⃣ Keycap number sign|hash number
🔢 Input numbers|numbers 1234
ℹ️ Information|info
🏁 Chequered flag|finish race
🚩 Triangular flag|flag
🏳️ White flag|surrender
🇩🇪 Flag Germany|germany
🇦🇹 Flag Austria|austria
🇨🇭 Flag Switzerland|switzerland
🇪🇺 Flag European Union|eu europe`;

/** Order of the categories (recently used first) */
export const emojiCategories: EmojiCategory[] = [
    'recent',
    'smileys',
    'people',
    'nature',
    'food',
    'travel',
    'activities',
    'objects',
    'symbols',
];

let parsed: EmojiData[] | undefined;

/** The built-in emojis (parsed once) */
export function defaultEmojis(): EmojiData[] {
    parsed ??= (Object.entries(raw) as [EmojiData['category'], string][]).flatMap(([category, lines]) =>
        lines.split('\n').map((line) => {
            const space = line.indexOf(' ');
            const [name, words = ''] = line.slice(space + 1).split('|');
            return { emoji: line.slice(0, space), name: name!, keywords: words.split(' ').filter(Boolean), category };
        })
    );
    return parsed;
}

/** Lines "😀 Name|search words" → emoji → name and words */
function parseEmojiTexts(lines: string) {
    const texts = new Map<string, { name: string; keywords: string[] }>();
    for (const line of lines.split('\n')) {
        const space = line.indexOf(' ');
        if (space < 1) continue;
        const [name = '', words = ''] = line.slice(space + 1).split('|');
        if (name) texts.set(line.slice(0, space), { name, keywords: words.split(' ').filter(Boolean) });
    }
    return texts;
}

let english: Map<string, { name: string; keywords: string[] }> | undefined;
const byLocale = new Map<string, EmojiData[]>();

/**
 * The built-in emojis for a locale: German names in German, English ones otherwise. `texts` – lines "😀 Name|search
 * words", e.g. `emojiPicker.emojis` of a language module – give names and search words of another language. The
 * English name and words always find an emoji as well (and in German the German ones).
 */
export function localeEmojis(locale = defaultLocale, texts = ''): EmojiData[] {
    const german = locale.split('-')[0]!.toLowerCase() === 'de';
    const key = `${german ? 'de' : 'other'}\n${texts}`;
    let result = byLocale.get(key);
    if (result) return result;
    english ??= parseEmojiTexts(rawEnglish);
    const own = parseEmojiTexts(texts);
    result = defaultEmojis().map((entry) => {
        const en = english!.get(entry.emoji);
        const local = own.get(entry.emoji) ?? (german ? { name: entry.name, keywords: entry.keywords ?? [] } : en);
        if (!local) return entry;
        const extra = local === en || !en ? [] : [...en.name.toLowerCase().split(' '), ...en.keywords];
        return { ...entry, name: local.name, keywords: [...new Set([...local.keywords, ...extra])] };
    });
    byLocale.set(key, result);
    return result;
}

/**
 * Emojis whose name or search words contain every word of the query (case and accents ignored); names that
 * start with the query come first.
 */
export function searchEmojis(emojis: readonly EmojiData[], query: string): EmojiData[] {
    const words = foldText(query).split(/\s+/).filter(Boolean);
    if (!words.length) return [...emojis];
    const scored: [EmojiData, number][] = [];
    for (const entry of emojis) {
        const name = foldText(entry.name);
        const text = `${name} ${foldText((entry.keywords ?? []).join(' '))}`;
        if (!words.every((word) => text.includes(word))) continue;
        scored.push([entry, name.startsWith(words[0]!) ? 0 : 1]);
    }
    return scored.sort((a, b) => a[1] - b[1]).map(([entry]) => entry);
}

/** Puts the emoji first in the recently used list (no duplicates, at most `max`) */
export function addRecentEmoji(recent: readonly string[], emoji: string, max = 24): string[] {
    return [emoji, ...recent.filter((entry) => entry !== emoji)].slice(0, max);
}

/**
 * Next index in a grid of `count` cells with `columns` per row for a key (arrows, Home/End in the row,
 * Ctrl+Home/End for the first/last cell, PageUp/PageDown by `pageRows` rows); undefined for other keys.
 * Left/right are swapped right-to-left.
 */
export function gridIndexForKey(
    key: string,
    index: number,
    count: number,
    columns: number,
    options: { ctrl?: boolean; rtl?: boolean; pageRows?: number } = {}
): number | undefined {
    const last = count - 1;
    const rowStart = index - (index % columns);
    const forward = options.rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = options.rtl ? 'ArrowRight' : 'ArrowLeft';
    const page = columns * (options.pageRows ?? 4);
    switch (key) {
        case forward:
            return Math.min(last, index + 1);
        case backward:
            return Math.max(0, index - 1);
        case 'ArrowDown':
            return index + columns <= last ? index + columns : index;
        case 'ArrowUp':
            return index - columns >= 0 ? index - columns : index;
        case 'Home':
            return options.ctrl ? 0 : rowStart;
        case 'End':
            return options.ctrl ? last : Math.min(last, rowStart + columns - 1);
        case 'PageDown':
            return Math.min(last, index + page);
        case 'PageUp':
            return Math.max(0, index - page);
        default:
            return undefined;
    }
}
