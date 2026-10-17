// Norwegian (bokmål) versions of the home page and the most used tools.
// Each page is paired with its English original through HREFLANG_PAIRS so
// both versions carry reciprocal hreflang links and an x-default.
import { normalizeRoutePath } from './paths.js';

const nbUpdatedDate = '2026-10-17';

export const HREFLANG_PAIRS = Object.freeze([
  { en: '/', nb: '/no' },
  { en: '/tools', nb: '/no/verktoy' },
  { en: '/tools/tap-tempo', nb: '/no/verktoy/tap-tempo' },
  { en: '/tools/bpm-to-ms', nb: '/no/verktoy/bpm-til-ms' },
  { en: '/tools/metronome', nb: '/no/verktoy/metronom' },
  { en: '/tools/bpm-converter', nb: '/no/verktoy/bpm-konverterer' },
]);

export function getHreflangAlternates(path) {
  const normalizedPath = normalizeRoutePath(path);
  const pair = HREFLANG_PAIRS.find(
    (candidate) =>
      candidate.en === normalizedPath || candidate.nb === normalizedPath
  );

  if (!pair) {
    return [];
  }

  return [
    { hreflang: 'en', path: pair.en },
    { hreflang: 'nb', path: pair.nb },
    { hreflang: 'x-default', path: pair.en },
  ];
}

export function isNorwegianPath(path) {
  return path === '/no' || String(path).startsWith('/no/');
}

const tempoLinks = [
  { href: '/bpm/90', label: '90 BPM' },
  { href: '/bpm/120', label: '120 BPM' },
  { href: '/bpm/128', label: '128 BPM' },
  { href: '/bpm/140', label: '140 BPM' },
  { href: '/bpm/174', label: '174 BPM' },
  { href: '/bpm', label: 'Alle tempoer fra 60 til 200 BPM (engelsk)' },
];

export const norwegianPages = Object.freeze([
  {
    "id": "home-nb",
    "lang": "nb",
    "path": "/no",
    "category": "tool",
    "structuredDataType": "WebApplication",
    "title": "Gratis BPM-teller for DJ-er – mål tempoet i sanntid | BPM Techno",
    "description": "Mål tempoet på musikk som spilles i rommet med en BPM-teller som lytter gjennom mikrofonen i nettleseren. Gratis, privat og uten opplasting av lyd.",
    "heading": "Gratis BPM-teller i sanntid",
    "lede": "Finn tempoet på en låt som spilles i rommet, uten å laste opp eller ta opp lyden. BPM Techno analyserer mikrofonsignalet direkte i nettleseren og viser et stabilt anslag for slag per minutt.",
    "updatedDate": "2026-10-17",
    "sections": [
      {
        "heading": "Slik måler du BPM i sanntid",
        "paragraphs": [
          "Start telleren, gi tilgang til mikrofonen og spill en del av låten med et tydelig og jevnt beat. Detektoren lytter etter rytmiske anslag som gjentar seg, og sammenligner flere mulige tempoer før den viser et stabilt resultat.",
          "Et godt utdrag har gjerne trommer eller andre tydelige anslag. Lange intro-partier, breaks, prat, publikumsstøy og mye synkopering gir detektoren mindre å gå på."
        ],
        "steps": [
          "Plasser enheten der den hører musikken godt, men ikke så nær høyttaleren at lyden forvrenges.",
          "Trykk på «Start lytting» og godkjenn tilgang til mikrofonen.",
          "Spill en jevn del av låten og vent til anslaget stabiliserer seg.",
          "Sammenlign tallet med det du hører, og vurder om låten egentlig skal telles i halv eller dobbel takt."
        ]
      },
      {
        "heading": "Hva BPM-tallet betyr",
        "paragraphs": [
          "BPM står for «beats per minute», altså antall taktslag i minuttet. 120 BPM betyr at pulsen gjentas omtrent to ganger i sekundet. Musikk kan ofte telles på mer enn én måte, så en detektor kan vise 70 BPM for en låt som en DJ teller som 140 BPM, eller omvendt.",
          "Bruk resultatet som et godt utgangspunkt, ikke som en erstatning for å lytte. Virker tempoet nøyaktig halvparten eller dobbelt så høyt som du forventet, kan du sammenligne verdiene i konvertereren for halv og dobbel takt."
        ]
      },
      {
        "heading": "Få et mer presist resultat",
        "bullets": [
          "Velg en del med jevn kick, skarptromme, klapp eller hi-hat.",
          "Demp prat, fingertromming og andre lyder i nærheten.",
          "Ikke legg mikrofonen inntil en høyttaler som spiller så høyt at signalet forvrenges.",
          "La detektoren høre flere takter før du stoler på tallet.",
          "Prøv en annen del av låten hvis tempoet eller rytmen endrer seg."
        ]
      },
      {
        "heading": "Personvern og mikrofon",
        "paragraphs": [
          "Lyden fra mikrofonen behandles lokalt med Web Audio API. BPM Techno sender ikke mikrofonlyden til noen server. Nettleseren ber likevel om tillatelse, fordi den beskytter tilgangen til mikrofonen.",
          "Du kan når som helst trekke tilbake mikrofontilgangen i nettleserens innstillinger for nettstedet. «Start på nytt» avslutter lyttingen og nullstiller målingen."
        ]
      },
      {
        "heading": "Flere verktøy på norsk",
        "paragraphs": [
          "Har du funnet tempoet, kan du regne det om til delaytider, starte en metronom på samme tempo eller sjekke halv og dobbel takt. Sidene for hvert enkelt tempo og guidene finnes foreløpig på engelsk."
        ],
        "links": [
          {
            "href": "/no/verktoy/tap-tempo",
            "label": "Tap tempo – finn BPM ved å trykke i takt"
          },
          {
            "href": "/no/verktoy/bpm-til-ms",
            "label": "BPM til millisekunder (delaytider)"
          },
          {
            "href": "/no/verktoy/metronom",
            "label": "Metronom, 30–300 BPM"
          },
          {
            "href": "/no/verktoy/bpm-konverterer",
            "label": "Halv og dobbel takt"
          },
          {
            "href": "/bpm",
            "label": "Tall for hvert tempo fra 60 til 200 BPM (engelsk)"
          }
        ]
      }
    ],
    "faqs": [
      {
        "question": "Hvorfor tar det noen sekunder å finne BPM?",
        "answer": "Et lengre utdrag lar analysen sammenligne flere slagintervaller og forkaste ustabile kandidater. Å vente noen takter gir som regel et mer nyttig resultat enn å stole på det første anslaget."
      },
      {
        "question": "Hvorfor viser telleren halvparten eller det dobbelte av det jeg forventet?",
        "answer": "Mange rytmer har tydelige pulser på mer enn ett nivå. Både 70 og 140 BPM kan beskrive det samme rutenettet, avhengig av om du teller den langsomme pulsen eller hver underdeling."
      }
    ],
    "relatedPageIds": [
      "tap-tempo-nb",
      "metronome-nb",
      "bpm-converter-nb",
      "bpm-to-ms-nb"
    ]
  },
  {
    "id": "tools-hub-nb",
    "lang": "nb",
    "path": "/no/verktoy",
    "category": "hub",
    "structuredDataType": "CollectionPage",
    "title": "Gratis BPM-verktøy for DJ-er og produsenter | BPM Techno",
    "description": "BPM-teller med mikrofon, tap tempo, metronom, BPM til millisekunder og halv/dobbel takt – gratis i nettleseren, uten registrering og uten opplasting av lyd.",
    "heading": "BPM-verktøy",
    "lede": "Alle verktøyene kjører i nettleseren og laster aldri opp lyden din. Velg det som passer spørsmålet du har akkurat nå.",
    "updatedDate": "2026-10-17",
    "sections": [
      {
        "heading": "Finn tempoet på musikk",
        "paragraphs": [
          "Start her når du ikke vet tempoet ennå. Sanntidstelleren lytter gjennom mikrofonen, mens tap tempo gjør trykkene dine om til et BPM-tall."
        ],
        "links": [
          {
            "href": "/no",
            "label": "BPM-teller i sanntid (mikrofon)"
          },
          {
            "href": "/no/verktoy/tap-tempo",
            "label": "Tap tempo"
          }
        ]
      },
      {
        "heading": "Regn om et tempo du allerede kjenner",
        "paragraphs": [
          "Når du har et BPM-tall, gjør disse verktøyene det om til tallene du skriver inn i en delay, en sampler eller et miksoppsett."
        ],
        "links": [
          {
            "href": "/no/verktoy/bpm-til-ms",
            "label": "BPM til millisekunder"
          },
          {
            "href": "/no/verktoy/bpm-konverterer",
            "label": "Halv og dobbel takt"
          },
          {
            "href": "/bpm",
            "label": "Ferdig utregnet for hvert tempo fra 60 til 200 BPM (engelsk)"
          }
        ]
      },
      {
        "heading": "Øv og miks",
        "paragraphs": [
          "Metronomen gir et rent klikk når du øver på beatmatching eller teller fraser. Flere verktøy, som Hz-kalkulator, takter til sekunder og pitch-område, finnes foreløpig bare på engelsk."
        ],
        "links": [
          {
            "href": "/no/verktoy/metronom",
            "label": "Metronom"
          },
          {
            "href": "/tools",
            "label": "Alle verktøy (engelsk)"
          },
          {
            "href": "/guides",
            "label": "Guider (engelsk)"
          }
        ]
      }
    ],
    "relatedPageIds": [
      "home-nb",
      "metronome-nb",
      "tap-tempo-nb"
    ]
  },
  {
    "id": "tap-tempo-nb",
    "lang": "nb",
    "path": "/no/verktoy/tap-tempo",
    "category": "tool",
    "structuredDataType": "WebApplication",
    "title": "Tap tempo – finn BPM ved å trykke i takt | BPM Techno",
    "description": "Trykk i takt med musikken og få BPM regnet ut fra timingen din. Gratis tap tempo-teller i nettleseren, uten mikrofon og uten registrering.",
    "heading": "Tap tempo: finn BPM ved å trykke i takt",
    "lede": "Trykk på knappen i takt med beatet. Verktøyet tar snittet av de siste intervallene og gjør dem om til et BPM-tall – uten å bruke mikrofonen.",
    "updatedDate": "2026-10-17",
    "sections": [
      {
        "heading": "Slik fungerer tap tempo",
        "paragraphs": [
          "Tiden mellom to trykk er ett taktslag. Deler du 60 000 millisekunder på dette intervallet, får du BPM. Ett enkelt intervall er lett å bomme på, derfor regner verktøyet ut snittet av de siste åtte trykkene.",
          "Tar du en pause på mer enn 2,5 sekunder, starter en ny måling automatisk, slik at en gammel runde ikke forstyrrer den neste."
        ]
      },
      {
        "heading": "Slik trykker du jevnt",
        "bullets": [
          "Følg ett element som gjentar seg, for eksempel kicken eller skarptrommen, i stedet for å hoppe mellom instrumenter.",
          "Trykk i minst fire slag; åtte slag gir som regel et roligere snitt.",
          "Bruk samme bevegelse hver gang, og ikke prøv å rette opp et sent trykk med et tidlig.",
          "Nullstill og prøv igjen når låten skifter tempo eller går inn i et break."
        ]
      },
      {
        "heading": "Når det lønner seg å trykke selv",
        "paragraphs": [
          "Tap tempo er nyttig når du ikke kan bruke mikrofonen, når opptaket er støyete, eller når rytmen er tydelig for øret, men vanskelig for automatisk deteksjon. Det er også en rask måte å sjekke om et automatisk resultat bør tolkes i halv eller dobbel takt."
        ]
      },
      {
        "heading": "Når du har funnet tempoet",
        "paragraphs": [
          "Med tallet på plass kan du regne det om til delaytider, starte metronomen på samme tempo eller slå opp tempoet for å se millisekunder, Hz og typiske sjangre."
        ],
        "links": [
          {
            "href": "/no/verktoy/bpm-til-ms",
            "label": "BPM til millisekunder"
          },
          {
            "href": "/no/verktoy/metronom",
            "label": "Metronom"
          },
          {
            "href": "/bpm",
            "label": "Tall for hvert tempo fra 60 til 200 BPM (engelsk)"
          }
        ]
      }
    ],
    "faqs": [
      {
        "question": "Hvor mange trykk trenger jeg?",
        "answer": "To trykk gir et tall, men fire til åtte jevne trykk er mer pålitelig, fordi ett trykk som kommer litt for tidlig eller for sent betyr mindre for snittet."
      },
      {
        "question": "Bruker tap tempo mikrofonen?",
        "answer": "Nei. Verktøyet måler bare tidspunktene for trykkene dine i nettleseren."
      }
    ],
    "relatedPageIds": [
      "home-nb",
      "bpm-converter-nb",
      "metronome-nb"
    ]
  },
  {
    "id": "bpm-to-ms-nb",
    "lang": "nb",
    "path": "/no/verktoy/bpm-til-ms",
    "category": "tool",
    "structuredDataType": "WebApplication",
    "title": "BPM til millisekunder – kalkulator for delaytider | BPM Techno",
    "description": "Regn om BPM til notelengder i millisekunder for tempo-synkronisert delay, modulasjon og sekvensering: hel-, halv- og fjerdedelsnoter, punkterte verdier og trioler.",
    "heading": "BPM til millisekunder",
    "lede": "Skriv inn et tempo og få lengden på hel-, halv-, fjerdedels-, åttendedels- og sekstendedelsnoter, punktert åttendedel og fjerdedelstriol i millisekunder.",
    "updatedDate": "2026-10-17",
    "sections": [
      {
        "heading": "Formelen for BPM til millisekunder",
        "paragraphs": [
          "Ett minutt er 60 000 millisekunder. Deler du 60 000 på BPM, får du lengden på ett taktslag – en fjerdedelsnote i vanlig 4/4-takt. Alle andre noteverdier er enkle multipler eller brøkdeler av dette slaget.",
          "Ved 120 BPM varer en fjerdedel 500 ms, en åttendedel 250 ms og en halvnote 1000 ms. En punktert note varer halvannen gang så lenge, og en triol to tredjedeler så lenge."
        ]
      },
      {
        "heading": "Slik bruker du verdiene i produksjon",
        "bullets": [
          "Sett delayen til en åttendedel eller punktert åttendedel for repetisjoner som følger grooven.",
          "Bruk halv- eller helnoter for romslige ekko og lange automasjonsløkker.",
          "Bruk sekstendedeler til rytmiske gater, tremolo eller rask modulasjon.",
          "Velg trioler når frasen er delt i tre i stedet for rett eller punktert."
        ]
      },
      {
        "heading": "Sync i pluginen eller manuelle millisekunder",
        "paragraphs": [
          "Mange plugins kan synkroniseres direkte til tempoet i DAW-en. Manuelle millisekunder er likevel nyttige når en enhet mangler sync, når maskinvare ikke får MIDI-klokke, eller når du bevisst vil legge timingen litt ved siden av rutenettet.",
          "Ekte enheter kan runde av verdiene, og analoge effekter kan drive. Se på det utregnede tallet som den eksakte verdien i rutenettet, og juster etter øret når musikken tjener på litt bevegelse."
        ]
      },
      {
        "heading": "Ferdig utregnet for hvert tempo",
        "paragraphs": [
          "Vil du ha alle tallene for ett bestemt tempo samlet – også punkterte verdier og trioler for alle notelengder, reverbtider og Hz – har hvert tempo fra 60 til 200 BPM en egen side (på engelsk)."
        ],
        "links": [
          {
            "href": "/bpm/90",
            "label": "90 BPM"
          },
          {
            "href": "/bpm/120",
            "label": "120 BPM"
          },
          {
            "href": "/bpm/128",
            "label": "128 BPM"
          },
          {
            "href": "/bpm/140",
            "label": "140 BPM"
          },
          {
            "href": "/bpm/174",
            "label": "174 BPM"
          },
          {
            "href": "/bpm",
            "label": "Alle tempoer fra 60 til 200 BPM (engelsk)"
          }
        ]
      }
    ],
    "faqs": [
      {
        "question": "Hvor mange millisekunder er én takt ved 120 BPM?",
        "answer": "Én 4/4-takt er fire slag: 4 × 500 ms = 2000 ms, altså 2 sekunder."
      },
      {
        "question": "Hva er en punktert åttendedel?",
        "answer": "En punktert note varer halvannen gang så lenge som den vanlige. En punktert åttendedel ved 120 BPM er 250 ms × 1,5 = 375 ms – en populær delaytid fordi repetisjonene havner mellom slagene."
      }
    ],
    "relatedPageIds": [
      "bpm-converter-nb",
      "metronome-nb",
      "tap-tempo-nb"
    ]
  },
  {
    "id": "metronome-nb",
    "lang": "nb",
    "path": "/no/verktoy/metronom",
    "category": "tool",
    "structuredDataType": "WebApplication",
    "title": "Gratis metronom på nett, 30–300 BPM | BPM Techno",
    "description": "Gratis metronom i nettleseren med betont første slag, 2 til 7 slag per takt, tempo-slider og ±1/±5-knapper. Presis timing via Web Audio API, og den virker uten nett etter første besøk.",
    "heading": "Metronom på nett",
    "lede": "Velg tempo og antall slag per takt, og trykk start. Klikket planlegges av nettleserens lydmotor i stedet for en vanlig timer, så det holder seg stødig selv når fanen har mye å gjøre.",
    "updatedDate": "2026-10-17",
    "sections": [
      {
        "heading": "Slik bruker du metronomen",
        "steps": [
          "Skriv inn BPM eller dra i slideren. Knappene ±1 og ±5 gjør små justeringer enkle på mobilen.",
          "Velg antall slag per takt. Første slag i hver takt får et lysere klikk.",
          "Trykk «Start metronom». På mobil kan første start kreve et ekstra trykk, fordi nettlesere bare spiller lyd etter at du har trykket på siden.",
          "Følg slagindikatoren eller lytt med hodetelefoner mens du øver på å telle takter, trykke i takt eller beatmatche."
        ]
      },
      {
        "heading": "Hvorfor timingen er stødig",
        "paragraphs": [
          "En metronom som bygger på setInterval, driver, fordi JavaScript-timere kommer for sent når nettleseren er opptatt. Denne metronomen bruker i stedet klokken i Web Audio API: en kort løkke planlegger hvert klikk en brøkdel av et sekund før det skal komme, på et eksakt tidspunkt, så avstanden mellom klikkene ikke avhenger av hvor raskt siden kjører.",
          "Lyden lages lokalt, og ingenting tas opp eller sendes noe sted. Når siden er lastet, virker metronomen også uten nettforbindelse."
        ]
      },
      {
        "heading": "Øvingsideer for DJ-er",
        "bullets": [
          "Tell fraser: la klikket gå i samme tempo som en låt, og tell 8, 16 og 32 takter for å lære hvor drop og breaks pleier å komme.",
          "Beatmatch på gehør: spill en låt på én spiller og match den mot metronomen før du prøver med to låter.",
          "Sjekk et tempo du har målt: start klikket på BPM-tallet og hør om det låser seg til musikken, eller glir over i halv eller dobbel takt.",
          "Øv på tap tempo: bruk tap tempo-verktøyet sammen med klikket og se hvor nær trykkene dine treffer."
        ]
      },
      {
        "heading": "Metronom på et bestemt tempo",
        "paragraphs": [
          "Hver temposide fra 60 til 200 BPM har en metronom som starter på akkurat det tempoet, sammen med delaytider og typiske sjangre (på engelsk)."
        ],
        "links": [
          {
            "href": "/bpm/90",
            "label": "90 BPM"
          },
          {
            "href": "/bpm/120",
            "label": "120 BPM"
          },
          {
            "href": "/bpm/128",
            "label": "128 BPM"
          },
          {
            "href": "/bpm/140",
            "label": "140 BPM"
          },
          {
            "href": "/bpm/174",
            "label": "174 BPM"
          },
          {
            "href": "/bpm",
            "label": "Alle tempoer fra 60 til 200 BPM (engelsk)"
          }
        ]
      }
    ],
    "faqs": [
      {
        "question": "Hvorfor hører jeg ingen lyd når jeg trykker start?",
        "answer": "Nettlesere blokkerer lyd til du har trykket på siden, og på noen telefoner styres lyden av lydløs-bryteren. Trykk start én gang til, og sjekk at telefonen ikke står på lydløs og at medievolumet er skrudd opp."
      },
      {
        "question": "Kan jeg bruke tempo med desimaler?",
        "answer": "Ja. Skriv for eksempel 127,5 i tallfeltet. Slideren flytter seg i hele BPM, men tallet du skriver inn, brukes nøyaktig."
      }
    ],
    "relatedPageIds": [
      "tap-tempo-nb",
      "bpm-to-ms-nb",
      "home-nb"
    ]
  },
  {
    "id": "bpm-converter-nb",
    "lang": "nb",
    "path": "/no/verktoy/bpm-konverterer",
    "category": "tool",
    "structuredDataType": "WebApplication",
    "title": "Halv og dobbel takt – BPM-konverterer | BPM Techno",
    "description": "Se halv takt, opprinnelig tempo og dobbel takt side om side, og finn ut hvilket BPM-tall som passer når en låt kan telles på to måter.",
    "heading": "Halv og dobbel takt",
    "lede": "Skriv inn et BPM-tall og se tempoene i halv og dobbel takt som deler det samme rytmiske rutenettet.",
    "updatedDate": "2026-10-17",
    "sections": [
      {
        "heading": "Hvorfor én låt kan ha to riktige BPM-tall",
        "paragraphs": [
          "Tempoet avhenger av hvilket rytmisk nivå du teller. En låt merket 70 BPM kan ha hi-hats eller skarptrommer som får DJ-er og programvare til å telle den som 140 BPM. Ingen av tallene endrer selve timingen i opptaket.",
          "Automatiske detektorer velger den sterkeste pulsen som gjentar seg, og den stemmer ikke alltid med sjangerkonvensjonen eller beatgridet du vil bruke."
        ]
      },
      {
        "heading": "Slik bruker du halv og dobbel takt",
        "bullets": [
          "Sjekk halv takt når resultatet føles for raskt for pulsen i musikken.",
          "Sjekk dobbel takt når resultatet føles for tregt for beatmatching eller beatgrid.",
          "Sammenlign transientene i bølgeformen over flere takter før du endrer beatgridet i DJ-programvaren.",
          "Behold verdien som gjør det enklest å telle takter og legge fraser oppå hverandre."
        ]
      },
      {
        "heading": "Eksempler",
        "table": {
          "headers": [
            "Målt BPM",
            "Halv takt",
            "Dobbel takt",
            "Vanlig tolkning"
          ],
          "rows": [
            [
              "70",
              "35",
              "140",
              "Hiphop i halv takt, eller dubstep og drum and bass telt i full takt"
            ],
            [
              "87,5",
              "43,75",
              "175",
              "Rask breakbeat telt på en langsommere puls"
            ],
            [
              "128",
              "64",
              "256",
              "Housetempo som også kan legges i et halvt rutenett"
            ]
          ]
        }
      },
      {
        "heading": "Slå opp tempoet",
        "paragraphs": [
          "Hvert tempo fra 60 til 200 BPM har en egen side med lenker til halv og dobbel takt, millisekunder per slag og typiske sjangre (på engelsk)."
        ],
        "links": [
          {
            "href": "/bpm/90",
            "label": "90 BPM"
          },
          {
            "href": "/bpm/120",
            "label": "120 BPM"
          },
          {
            "href": "/bpm/128",
            "label": "128 BPM"
          },
          {
            "href": "/bpm/140",
            "label": "140 BPM"
          },
          {
            "href": "/bpm/174",
            "label": "174 BPM"
          },
          {
            "href": "/bpm",
            "label": "Alle tempoer fra 60 til 200 BPM (engelsk)"
          }
        ]
      }
    ],
    "faqs": [
      {
        "question": "Endrer halv takt selve låten?",
        "answer": "Nei. Halv og dobbel takt er bare to måter å telle den samme timingen på. Det er tallet du bruker til beatgrid og fraser som endres, ikke musikken."
      }
    ],
    "relatedPageIds": [
      "tap-tempo-nb",
      "bpm-to-ms-nb",
      "home-nb"
    ]
  }
]);
