import {
    Activity,
    Archive,
    ArrowLeft,
    ArrowRight,
    Bell,
    Check,
    CheckCheck,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CircleAlert,
    CircleCheck,
    CodeXml,
    Euro,
    GitCommitHorizontal,
    House,
    Info,
    LoaderCircle,
    Mail,
    Megaphone,
    MessageSquare,
    OctagonX,
    Paperclip,
    Pencil,
    Rocket,
    Search,
    SearchX,
    Server,
    Sparkles,
    TrendingDown,
    TrendingUp,
    TriangleAlert,
    Trash2,
    UserRound,
    X,
} from 'lucide-static';

/** Inline Lucide SVG with the given classes, hidden from assistive tech (the control carries the name). */
const icon =
    (svg: string) =>
    (cls = '') =>
        svg
            .replace(/class="[^"]*"/, `class="${cls}" aria-hidden="true"`)
            .replace(/\s*\n\s*/g, ' ')
            .replace(/\s+\/>/g, '/>')
            .replace(/>\s+</g, '><')
            .trim();

export const icons = {
    activity: icon(Activity),
    archive: icon(Archive),
    arrowLeft: icon(ArrowLeft),
    arrowRight: icon(ArrowRight),
    bell: icon(Bell),
    check: icon(Check),
    checkCheck: icon(CheckCheck),
    chevronDown: icon(ChevronDown),
    chevronLeft: icon(ChevronLeft),
    chevronRight: icon(ChevronRight),
    chevronsLeft: icon(ChevronsLeft),
    chevronsRight: icon(ChevronsRight),
    circleAlert: icon(CircleAlert),
    circleCheck: icon(CircleCheck),
    codeXml: icon(CodeXml),
    euro: icon(Euro),
    gitCommit: icon(GitCommitHorizontal),
    house: icon(House),
    info: icon(Info),
    loader: icon(LoaderCircle),
    mail: icon(Mail),
    megaphone: icon(Megaphone),
    messageSquare: icon(MessageSquare),
    octagonX: icon(OctagonX),
    paperclip: icon(Paperclip),
    pencil: icon(Pencil),
    rocket: icon(Rocket),
    search: icon(Search),
    searchX: icon(SearchX),
    server: icon(Server),
    sparkles: icon(Sparkles),
    trendingDown: icon(TrendingDown),
    trendingUp: icon(TrendingUp),
    triangleAlert: icon(TriangleAlert),
    trash: icon(Trash2),
    userRound: icon(UserRound),
    x: icon(X),
};

/** Joins lines of markup (keeps the stories readable) */
export const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((out, part, index) => out + part + (index < values.length ? String(values[index]) : ''), '').trim();
