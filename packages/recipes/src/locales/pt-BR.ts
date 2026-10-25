// Brazilian Portuguese (pt-BR) texts of the components – the European Portuguese texts of ./pt.ts with every section
// overridden where Brazilian UI wording differs. Not built in, so they cost nothing until imported:
// registerLocale('pt-BR', ptBR) at app start (a region takes precedence over 'pt'), or
// <LocaleProvider locale="pt-BR" :translations="ptBR">.
// Written for natural UI wording; should be proofread by a native speaker before release.
import { pluralText, type PluralForms, type Translations } from '../i18n.js';
import { pt } from './pt.js';

type CalendarView = 'day' | 'month' | 'year';

/** The form for the count in Brazilian Portuguese plural rules (Intl.PluralRules), "{count}" replaced by the number */
const plural = (count: number, forms: PluralForms) => pluralText(forms, count, 'pt-BR');

const characters: PluralForms = { one: '{count} caractere', other: '{count} caracteres' };

const next: Record<CalendarView, string> = { day: 'Próximo mês', month: 'Próximo ano', year: 'Próxima década' };
const viewNames: Record<CalendarView, string> = { day: 'dias', month: 'meses', year: 'anos' };

// Ordinals without the period: "2ª segunda-feira", "3º dia"
const brazilianOrdinal = (text: string) => text.replace(/\.(?=[ºª])/g, '');

export const ptBR: Translations = {
    ...pt,
    common: { ...pt.common, loading: 'Carregando' },
    confirm: {
        ...pt.confirm,
        typeToConfirm: (text) => `Digite “${text}” para confirmar`,
    },
    breadcrumb: { ...pt.breadcrumb, label: 'Trilha de navegação' },
    pagination: { ...pt.pagination, nextTriggerLabel: 'Próxima página' },
    saveStatus: { ...pt.saveStatus, saving: 'Salvando…', saved: 'Salvo', error: 'Falha ao salvar' },
    passwordInput: {
        visibilityTrigger: (visible) => (visible ? 'Ocultar senha' : 'Mostrar senha'),
    },
    datePicker: {
        ...pt.datePicker,
        nextTrigger: (view) => next[view],
        viewTrigger: (_view, nextView) => (nextView ? `Mostrar ${viewNames[nextView]}` : 'Mudar visualização'),
    },
    quarterPicker: { ...pt.quarterPicker, nextYear: 'Próximo ano' },
    timeGrid: { ...pt.timeGrid, loading: 'Carregando horários' },
    miniCalendar: { ...pt.miniCalendar, next: 'Próximos dias' },
    passwordStrength: {
        levels: ['Muito curta', 'Fraca', 'Razoável', 'Boa', 'Forte'],
        label: (level) => `Força da senha: ${level}`,
    },
    textarea: {
        ...pt.textarea,
        remaining: (remaining, max) => {
            const limit = plural(max, characters);
            return remaining <= 0
                ? `Limite de ${limit} atingido`
                : `${plural(remaining, { one: 'Resta {count}', other: 'Restam {count}' })} de ${limit}`;
        },
    },
    passwordRequirements: { label: 'Requisitos da senha', met: 'atendido', unmet: 'não atendido' },
    dataView: {
        ...pt.dataView,
        layout: 'Visualização',
        grid: 'Grade',
        loading: 'Carregando itens',
        shown: (count, total) => `Mostrando ${count} de ${total}`,
    },
    orderList: { ...pt.orderList, bottom: 'Mover para o final' },
    pickList: {
        ...pt.pickList,
        moved: (count, target) =>
            `${plural(count, { one: '{count} item movido', other: '{count} itens movidos' })} para “${target}”`,
        dropHint: (list) => `Soltar aqui: ${list}`,
    },
    appShell: { ...pt.appShell, skipLink: 'Pular para o conteúdo' },
    commandPalette: { ...pt.commandPalette, placeholder: 'Pesquise ou digite um comando…' },
    tagsInput: {
        ...pt.tagsInput,
        tagEdited: (value) => `Editando ${value}`,
        tagSelected: (value) => `${value} selecionado, pressione Backspace para remover`,
    },
    megaMenu: { ...pt.megaMenu, featuredLink: 'Saiba mais' },
    result: {
        ...pt.result,
        error: 'Algo deu errado',
        '500': 'Erro no servidor',
        description403: 'Você não tem permissão para ver esta página.',
    },
    tour: { ...pt.tour, nextStep: 'Próximo', close: 'Encerrar tour', skip: 'Pular' },
    navigationProgress: { label: 'Carregando a página' },
    scheduler: {
        ...pt.scheduler,
        next: 'Próximo',
        view: 'Visualização',
        views: { ...pt.scheduler.views, timeline: 'Linha do tempo' },
        allDay: 'Dia inteiro',
        seriesQuestion: (title) => `“${title}” faz parte de uma série. O que você deseja alterar?`,
        rejected: (title, reason) => `Não é possível soltar ${title} aqui: ${reason}`,
        overlaps: (title) => `se sobrepõe a ${title}`,
        closed: 'Fora do horário comercial',
        loading: 'Carregando eventos',
    },
    recurrence: {
        ...pt.recurrence,
        nthWeekday: (nth, weekday) => brazilianOrdinal(pt.recurrence.nthWeekday(nth, weekday)),
        monthDay: (day) => brazilianOrdinal(pt.recurrence.monthDay(day)),
    },
    gantt: { ...pt.gantt, linked: (from, to) => `${to} agora depende de ${from}` },
    codeHighlight: { ...pt.codeHighlight, files: 'Arquivos' },
    splitter: { resize: (panel) => `Redimensionar “${panel}”` },
    image: { ...pt.image, rotate: 'Girar' },
    blockUi: { label: 'Carregando' },
    stepper: {
        ...pt.stepper,
        next: 'Próximo',
        status: { done: 'concluída', active: 'etapa atual', todo: 'pendente' },
        progress: (step, count) => `Etapa ${step} de ${count}`,
    },
    dataTable: {
        ...pt.dataTable,
        matchModes: { ...pt.dataTable.matchModes, startsWith: 'Começa com', endsWith: 'Termina com' },
        matchAll: 'Todas as condições atendidas',
        matchAny: 'Qualquer condição atendida',
        sortAscending: 'Classificar em ordem crescente',
        sortDescending: 'Classificar em ordem decrescente',
        clearSort: 'Remover classificação',
        resetFilters: 'Redefinir filtros',
        sortPriority: (position, desc) => `nível de classificação ${position}, ${desc ? 'decrescente' : 'crescente'}`,
        pinEnd: 'Fixar no final',
        columnMoved: (header, position, count) => `${header} agora é a coluna ${position} de ${count}`,
        fullscreen: 'Tela cheia',
        exitFullscreen: 'Sair da tela cheia',
        rowNumber: 'Nº',
        rowMoved: (row, position, count) => `${row} agora está na posição ${position} de ${count}`,
        saveRow: (row) => `Salvar ${row}`,
        saveChanges: 'Salvar',
        changesSaved: (count) => plural(count, { one: '{count} alteração salva', other: '{count} alterações salvas' }),
        undo: 'Desfazer',
        undone: (count) => plural(count, { one: '{count} célula revertida', other: '{count} células revertidas' }),
        rowMovedToGroup: (row, group, position, count) =>
            `${row} agora está em ${group}, posição ${position} de ${count}`,
        findNext: 'Próximo resultado',
    },
    dataSource: {
        ...pt.dataSource,
        loading: 'Carregando',
        minSearch: (count) => `Digite pelo menos ${plural(count, characters)}`,
        loadingMore: 'Carregando mais itens',
    },
    carousel: { ...pt.carousel, nextTrigger: 'Próxima imagem' },
    chart: {
        ...pt.chart,
        share: 'Participação',
        target: 'Meta',
        bulletValue: (value, max, target) => (target ? `${value} de ${max}, meta ${target}` : `${value} de ${max}`),
    },
    editor: {
        ...pt.editor,
        strike: 'Tachado',
        bulletList: 'Lista com marcadores',
        link: 'Link',
        undo: 'Desfazer',
        linkUrl: 'Endereço do link',
        linkRemove: 'Remover link',
        imageUpload: 'Escolher arquivo',
        tableActions: {
            ...pt.editor.tableActions,
            deleteRow: 'Excluir linha',
            deleteColumn: 'Excluir coluna',
            mergeOrSplit: 'Mesclar/dividir células',
            deleteTable: 'Excluir tabela',
        },
        taskItem: (text, checked) => `${text || 'Tarefa vazia'}, ${checked ? 'concluída' : 'pendente'}`,
        alignCenter: 'Centralizar',
        colorDefault: 'Padrão',
        subscript: 'Subscrito',
        superscript: 'Sobrescrito',
        details: 'Seção expansível',
        detailsToggle: (open) => (open ? 'Recolher seção' : 'Expandir seção'),
        characters: (count, limit) =>
            limit === undefined ? plural(count, characters) : `${count} de ${plural(limit, characters)}`,
        imageUploading: 'Enviando a imagem…',
        imageFailed: 'Não foi possível enviar a imagem',
    },
    gallery: {
        ...pt.gallery,
        fullscreen: 'Tela cheia',
        close: 'Sair da tela cheia',
        rotate: 'Girar',
        download: 'Baixar',
        screen: 'Ajustar à tela',
        exitScreen: 'Deixar de ajustar à tela',
        shortcuts: 'Teclas de seta: mudar de imagem · + e −: zoom · 0: tamanho real · R: girar · F: ajustar à tela',
    },
    colorPicker: { ...pt.colorPicker, eyeDropper: 'Capturar uma cor da tela' },
    tree: {
        ...pt.tree,
        loadingRow: 'Carregando…',
        loadingNode: (label) => `${label}: carregando`,
        cut: (label) => `${label} recortado – cole-o em outro nó com Ctrl+V`,
        cutCancelled: 'Recorte cancelado',
    },
    timeline: { ...pt.timeline, loading: 'Carregando itens mais antigos' },
    orgChart: {
        expand: (label) => `Mostrar a equipe de ${label}`,
        collapse: (label) => `Ocultar a equipe de ${label}`,
        loading: (label) => `${label}: carregando`,
        retry: (label) => `${label}: falha ao carregar – tentar novamente`,
    },
    fileUpload: {
        ...pt.fileUpload,
        dropzone: 'Soltar arquivos',
        itemPreview: (file) => `Visualização de ${file.name}`,
        dropzoneText: (multiple) => (multiple ? 'Arraste arquivos para cá ou' : 'Arraste um arquivo para cá ou'),
        trigger: (multiple) => (multiple ? 'Escolher arquivos' : 'Escolher arquivo'),
        errors: {
            TOO_MANY_FILES: 'Arquivos demais',
            FILE_INVALID_TYPE: 'Tipo de arquivo não permitido',
            FILE_TOO_LARGE: 'O arquivo é muito grande',
            FILE_TOO_SMALL: 'O arquivo é muito pequeno',
            FILE_INVALID: 'O arquivo é inválido',
            FILE_EXISTS: 'O arquivo já está selecionado',
        },
        upload: 'Enviar',
        uploadAll: 'Enviar todos',
        cancel: (file) => `Cancelar o envio de ${file.name}`,
        retry: (file) => `Enviar ${file.name} novamente`,
        status: {
            pending: 'Pronto para enviar',
            uploading: (percent) => `Enviando… ${percent}%`,
            done: 'Enviado',
            error: 'Falha no envio',
            cancelled: 'Cancelado',
        },
        uploaded: (file) => `${file.name} enviado`,
        failed: (file) => `Não foi possível enviar ${file.name}`,
        dropAccept: (multiple) => (multiple ? 'Solte para adicionar os arquivos' : 'Solte para adicionar o arquivo'),
        dropReject: 'Esses arquivos não são permitidos aqui',
        fullscreen: 'Solte arquivos em qualquer lugar',
        /** React Native: where FileUpload takes files from */
        sources: { documents: 'Escolher documento', photos: 'Escolher das fotos', camera: 'Tirar foto' },
        pasted: (count) => plural(count, { one: '{count} arquivo colado', other: '{count} arquivos colados' }),
    },
    statistic: { loading: 'Carregando' },
    hotkeys: { ...pt.hotkeys, keys: { ...pt.hotkeys.keys, backspace: 'Backspace', delete: 'Delete' } },
    inlineEdit: { ...pt.inlineEdit, save: 'Salvar', saving: 'Salvando…' },
    filterChips: { ...pt.filterChips, reset: 'Redefinir tudo' },
    conditionBuilder: {
        ...pt.conditionBuilder,
        all: 'Todas as condições atendidas',
        any: 'Qualquer condição atendida',
    },
    wizard: { ...pt.wizard, validating: 'Verificando…', invalid: 'Verifique os dados desta etapa' },
    aiLabel: {
        ...pt.aiLabel,
        explanation: 'Este conteúdo foi criado com inteligência artificial. Verifique-o antes de usá-lo.',
        help: 'O que significa “gerado por IA”?',
    },
    qrCode: {
        label: (value) => `QR Code: ${value}`,
        downloadPng: 'Baixar como PNG',
        downloadSvg: 'Baixar como SVG',
    },
    signaturePad: {
        ...pt.signaturePad,
        control: 'Campo de assinatura – assine com o mouse, a caneta ou o dedo',
        undo: 'Desfazer',
        type: 'Digitar assinatura',
    },
    imageCropper: {
        ...pt.imageCropper,
        loading: 'Carregando a imagem',
        instructions:
            'As teclas de seta movem a área de recorte, Alt e as teclas de seta a redimensionam, mais e menos aplicam zoom.',
        selectionValue: (width, height, x, y) => `${width} × ${height} pixels, posição ${x}, ${y}`,
        rotateLeft: 'Girar para a esquerda',
        rotateRight: 'Girar para a direita',
        reset: 'Redefinir',
    },
    floatingPanel: {
        ...pt.floatingPanel,
        hint: 'Alt e as teclas de seta movem a janela; Alt, Shift e as teclas de seta a redimensionam.',
    },
    downloadTrigger: { label: 'Baixar' },
    emojiPicker: {
        ...pt.emojiPicker,
        categories: { ...pt.emojiPicker.categories, travel: 'Viagens e lugares' },
    },
    sortable: {
        ...pt.sortable,
        instructions:
            'Pressione Espaço ou Enter para pegar. Depois mova com as teclas de seta, pressione Espaço para soltar ou Escape para cancelar. Com o mouse: arraste, ou clique e clique novamente no destino.',
        empty: 'Nenhum item – mova para cá',
        picked: (item, position, count) => `${item} pego, posição ${position} de ${count}.`,
        dropped: (item, position, count) => `${item} solto, posição ${position} de ${count}.`,
    },
    logViewer: {
        ...pt.logViewer,
        label: 'Log',
        search: 'Pesquisar no log',
    },
    kanban: { ...pt.kanban, empty: 'Nenhum cartão – mova um para cá' },
    chatMessage: {
        ...pt.chatMessage,
        status: { ...pt.chatMessage.status, sending: 'Enviando' },
        writing: 'Escrevendo uma resposta',
    },
    chatPrompt: { ...pt.chatPrompt, placeholder: 'Digite uma mensagem…', attach: 'Anexar arquivo' },
    chatToolCall: { ...pt.chatToolCall, status: { ...pt.chatToolCall.status, running: 'Executando…' } },
    chatThinking: {
        ...pt.chatThinking,
        active: 'Pensando…',
        duration: (seconds) => `Pensou por ${seconds} s`,
    },
    authForm: {
        titles: { signIn: 'Entrar', signUp: 'Criar conta', reset: 'Redefinir senha', code: 'Inserir código' },
        descriptions: {
            signIn: 'Com seu e-mail e senha',
            signUp: 'Sua própria conta em poucas etapas',
            reset: 'Enviaremos um link para você redefini-la.',
            code: 'Insira o código do e-mail ou do aplicativo autenticador',
        },
        submit: { signIn: 'Entrar', signUp: 'Cadastrar', reset: 'Enviar link', code: 'Confirmar' },
        name: 'Nome',
        email: 'E-mail',
        password: 'Senha',
        passwordHint: (min) => `Pelo menos ${plural(min, characters)}`,
        code: 'Código de uso único',
        remember: 'Manter conectado',
        forgot: 'Esqueceu a senha?',
        or: 'ou',
        providers: 'Entrar com',
        noAccount: 'Ainda não tem uma conta?',
        signUpLink: 'Cadastre-se',
        hasAccount: 'Já tem uma conta?',
        signInLink: 'Entrar',
        back: 'Voltar para o login',
        resetSent: 'Se houver uma conta com esse endereço, um link está a caminho.',
        sending: 'Enviando…',
    },
    sessionTimeout: {
        ...pt.sessionTimeout,
        title: 'Sua sessão vai expirar em breve',
        description:
            'Por segurança, você será desconectado após um período de inatividade. Deseja continuar conectado?',
        extend: 'Continuar conectado',
        signOut: 'Sair',
        expired: 'Você foi desconectado por segurança.',
    },
    validation: {
        ...pt.validation,
        email: 'Insira um e-mail válido',
        url: 'Insira um endereço válido (https://…)',
        minLength: (min) => `Pelo menos ${plural(min, characters)}`,
        maxLength: (max) => `No máximo ${plural(max, characters)}`,
        length: (min, max) => `Entre ${min} e ${plural(max, characters)}`,
        number: 'Insira um número',
        integer: 'Insira um número inteiro',
        iban: 'Insira um IBAN válido',
        phone: 'Insira um número de telefone válido',
    },
    pdfViewer: {
        ...pt.pdfViewer,
        searchField: 'Pesquisar no documento',
        searching: 'Pesquisando…',
        rotate: 'Girar no sentido horário',
        download: 'Baixar',
        printing: (page, count) => `Preparando a impressão: página ${page} de ${count}`,
        fullscreen: 'Tela cheia',
        loading: 'Carregando o PDF',
        invalid: 'O arquivo não é um PDF válido ou está danificado.',
        passwordDescription: 'Digite a senha para abrir o documento.',
        passwordLabel: 'Senha',
        passwordWrong: 'A senha está incorreta. Tente novamente.',
        passwordRequired: 'O PDF não pode ser aberto sem senha.',
        wrappedTop: 'continua a partir do final',
    },
};

export default ptBR;
