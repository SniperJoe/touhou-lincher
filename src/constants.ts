import { GameName, SupportedLang, ThcrapProfileData } from './data-types';

export const thcrapGameNames: {[gameName in GameName] : string} = {
    hrtp: 'th01',
    soew: 'th02',
    podd: 'th03',
    lls: 'th04',
    ms: 'th05',
    eosd: 'th06',
    pcb: 'th07',
    in: 'th08',
    pofv: 'th09',
    mof: 'th10',
    sa: 'th11',
    ufo: 'th12',
    td: 'th13',
    ddc: 'th14',
    lolk: 'th15',
    hsifs: 'th16',
    wbawc: 'th17',
    um: 'th18',
    iamp: 'th75',
    swr: 'th105',
    soku: 'th123',
    hm: 'th135',
    ulil: 'th145',
    aocf: 'th155',
    stb: 'th95',
    ds: 'th125',
    gfw: 'th128',
    isc: 'th143',
    vd: 'th165'
} as const;
export const gameTitles: {[gameName in GameName] : string} = {
    hrtp: 'Highly Responsive to Prayers',
    soew: 'Story of Eastern Wonderland',
    podd: 'Phantasmagoria of Dim. Dream',
    lls: 'Lotus Land Story',
    ms: 'Mystic Square',
    eosd: 'Embodiment of Scarlet Devil',
    pcb: 'Perfect Cherry Blossom',
    in: 'Imperishable Night',
    pofv: 'Phantasmagoria of Flower View',
    mof: 'Mountain of Faith',
    sa: 'Subterranean Animism',
    ufo: 'Undefined Fantastic Object',
    td: 'Ten Desires',
    ddc: 'Double Dealing Character',
    lolk: 'Legacy of Lunatic Kingdom',
    hsifs: 'Hidden Star in Four Seasons',
    wbawc: 'Wily Beast and Weakest Creature',
    um: 'Unconnected Marketeers',
    iamp: 'Immaterial and Missing Power',
    swr: 'Scarlet Weather Rhapsody',
    soku: 'Hisotensoku',
    hm: 'Hopeless Masquerade',
    ulil: 'Urban Legend in Limbo',
    aocf: 'Antinomy of Common Flowers',
    stb: 'Shoot the Bullet',
    ds: 'Double Spoiler',
    gfw: 'Great Fairy Wars',
    isc: 'Impossible Spell Card',
    vd: 'Violet Detector'
};
export const shortGameTitles: {[gameName in GameName] : string} = {
    hrtp: 'HRtP',
    soew: 'SoEW',
    podd: 'PoDD',
    lls: 'LLS',
    ms: 'MS',
    eosd: 'EoSD',
    pcb: 'PCB',
    in: 'IN',
    pofv: 'PoFV',
    mof: 'MoF',
    sa: 'SA',
    ufo: 'UFO',
    td: 'TD',
    ddc: 'DDC',
    lolk: 'LoLK',
    hsifs: 'HSiFS',
    wbawc: 'WBaWC',
    um: 'UM',
    iamp: 'IaMP',
    swr: 'SWR',
    soku: 'Hisotensoku',
    hm: 'HM',
    ulil: 'ULiL',
    aocf: 'AoCF',
    stb: 'StB',
    ds: 'DS',
    gfw: 'GFW',
    isc: 'ISC',
    vd: 'VD'
};
export const defaultThcrapProfileData: ThcrapProfileData = {
    console: false,
    dat_dump: false,
    patches: []
};
export const categories: Record<'mainGames' | 'fightingGames' | 'otherGames', GameName[]> = {
    mainGames: ['hrtp', 'soew', 'podd', 'lls', 'ms', 'eosd', 'pcb', 'in', 'pofv', 'mof', 'sa', 'ufo', 'td', 'ddc', 'lolk', 'hsifs', 'wbawc', 'um'],
    fightingGames: ['iamp', 'swr', 'soku', 'hm', 'ulil', 'aocf'],
    otherGames: ['stb', 'ds', 'gfw', 'isc', 'vd']
};
export const categoryTitles: Record<keyof typeof categories, Record<SupportedLang, string>> = {
    mainGames: {
        en: 'Main Games',
        ru: 'Основные игры',
        jp: ''
    },
    fightingGames: {
        en: 'Fighting Games',
        ru: 'Файтинги',
        jp: ''
    },
    otherGames: {
        en: 'Other Games',
        ru: 'Другие игры',
        jp: ''
    }
};
