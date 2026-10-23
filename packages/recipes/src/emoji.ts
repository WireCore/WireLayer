import { foldText } from './tree-data.js';

// Emoji data for EmojiPicker: a selection of about 500 common emojis with English names and search words, grouped by
// category. Skin tones are left out (the default yellow). Own data replaces or extends it (EmojiPicker `emojis`);
// language modules add names and search words of their language (`emojiPicker.emojis`, e.g. German in locales/de).

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

// "emoji Name|search words" per line – compact to keep the bundle small
const raw: Record<Exclude<EmojiCategory, 'recent'>, string> = {
    smileys: `😀 Grinning face|smile happy joy
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
🙊 Speak-no-evil monkey|monkey`,
    people: `👋 Waving hand|wave hello bye
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
🗣️ Speaking head|speak talk`,
    nature: `🐶 Dog face|dog puppy
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
🌊 Water wave|wave sea ocean`,
    food: `🍏 Green apple|fruit
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
🍽️ Fork and knife with plate|dinner meal`,
    travel: `🚗 Automobile|car
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
🕐 One o’clock|time clock`,
    activities: `⚽ Soccer ball|football sport
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
✨ Sparkles|shine magic new`,
    objects: `⌚ Watch|time
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
🔗 Link|chain url`,
    symbols: `❤️ Red heart|love
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
🇪🇺 Flag European Union|eu europe`,
};

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

/** The built-in emojis with their English names (parsed once) */
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

const byTexts = new Map<string, EmojiData[]>();

/**
 * The built-in emojis in a language: `texts` – lines "😀 Name|search words", e.g. `emojiPicker.emojis` of a language
 * module – give names and search words; emojis without a line keep their English name. The English name and words
 * always find an emoji as well.
 */
export function localeEmojis(texts = ''): EmojiData[] {
    let result = byTexts.get(texts);
    if (result) return result;
    const own = parseEmojiTexts(texts);
    result = defaultEmojis().map((entry) => {
        const local = own.get(entry.emoji);
        if (!local) return entry;
        const english = [...entry.name.toLowerCase().split(' '), ...(entry.keywords ?? [])];
        return { ...entry, name: local.name, keywords: [...new Set([...local.keywords, ...english])] };
    });
    byTexts.set(texts, result);
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
