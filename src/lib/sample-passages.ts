import type { SpeechLanguage } from "./speech-recognition";

export type SamplePassage = {
  id: string;
  title: string;
  text: string;
};

type SampleTranslation = Omit<SamplePassage, "id">;

type Sample = {
  id: string;
  en: SampleTranslation;
  es: SampleTranslation;
  fr: SampleTranslation;
  de: SampleTranslation;
  pt: SampleTranslation;
};

const samples: Sample[] = [
  {
    id: "public-speaking",
    en: {
      title: "Public speaking",
      text: "Good public speaking is not a gift reserved for a lucky few. It is a skill, built one sentence at a time. When you read aloud, you train your voice to carry meaning, your breath to steady your nerves, and your ears to hear your own rhythm. Start slowly. Let each word land. Pause where the punctuation asks you to pause. In time, the page stops being a script and becomes a conversation with your audience.",
    },
    es: {
      title: "Hablar en público",
      text: "Hablar bien en público no es un don reservado para unos pocos afortunados. Es una habilidad que se construye frase a frase. Cuando lees en voz alta, entrenas tu voz para transmitir significado, tu respiración para calmar los nervios y tu oído para reconocer tu propio ritmo. Empieza despacio. Deja que cada palabra llegue. Haz una pausa donde lo indique la puntuación. Con el tiempo, la página deja de ser un guion y se convierte en una conversación con tu público.",
    },
    fr: {
      title: "Prendre la parole en public",
      text: "Bien parler en public n’est pas un don réservé à quelques chanceux. C’est une compétence qui se construit phrase après phrase. Quand vous lisez à voix haute, vous entraînez votre voix à transmettre du sens, votre respiration à apaiser votre trac et votre oreille à reconnaître votre propre rythme. Commencez lentement. Laissez chaque mot trouver sa place. Faites une pause lorsque la ponctuation vous y invite. Avec le temps, la page cesse d’être un texte à réciter et devient une conversation avec votre public.",
    },
    de: {
      title: "Vor anderen sprechen",
      text: "Gut vor anderen zu sprechen ist kein Talent, das nur wenigen Glücklichen vorbehalten ist. Es ist eine Fähigkeit, die Satz für Satz wächst. Wenn du laut liest, trainierst du deine Stimme, Bedeutung zu vermitteln, deinen Atem, um die Nervosität zu beruhigen, und dein Gehör, deinen eigenen Rhythmus wahrzunehmen. Beginne langsam. Lass jedes Wort wirken. Mache eine Pause, wenn es die Zeichensetzung verlangt. Mit der Zeit ist die Seite kein Skript mehr, sondern ein Gespräch mit deinem Publikum.",
    },
    pt: {
      title: "Falar em público",
      text: "Falar bem em público não é um dom reservado a poucos sortudos. É uma habilidade construída frase por frase. Ao ler em voz alta, você treina a voz para transmitir significado, a respiração para acalmar o nervosismo e a audição para perceber seu próprio ritmo. Comece devagar. Deixe cada palavra chegar. Faça uma pausa quando a pontuação indicar. Com o tempo, a página deixa de ser um roteiro e se transforma em uma conversa com seu público.",
    },
  },
  {
    id: "morning-walk",
    en: {
      title: "A morning walk",
      text: "The city feels different before the day begins. Shop windows catch the first light, and quiet streets make room for small details. A warm cup of tea waits at home, but there is no need to hurry. For a few minutes, the morning belongs to everyone who is awake enough to notice it.",
    },
    es: {
      title: "Un paseo por la mañana",
      text: "La ciudad parece distinta antes de que empiece el día. Los escaparates reciben la primera luz y las calles tranquilas dejan espacio para los pequeños detalles. En casa espera una taza de té caliente, pero no hay motivo para apresurarse. Durante unos minutos, la mañana pertenece a quienes están despiertos para disfrutarla.",
    },
    fr: {
      title: "Une promenade matinale",
      text: "La ville semble différente avant le début de la journée. Les vitrines accueillent les premiers rayons, et les rues calmes laissent place aux petits détails. Une tasse de thé chaud vous attend à la maison, mais rien ne presse. Pendant quelques minutes, le matin appartient à celles et ceux qui prennent le temps de le remarquer.",
    },
    de: {
      title: "Ein Spaziergang am Morgen",
      text: "Die Stadt wirkt anders, bevor der Tag beginnt. Schaufenster fangen das erste Licht ein, und in den ruhigen Straßen werden kleine Details sichtbar. Zu Hause wartet eine Tasse warmer Tee, doch es gibt keinen Grund zur Eile. Für ein paar Minuten gehört der Morgen allen, die wach genug sind, ihn wahrzunehmen.",
    },
    pt: {
      title: "Uma caminhada pela manhã",
      text: "A cidade parece diferente antes de o dia começar. As vitrines recebem a primeira luz, e as ruas tranquilas dão espaço aos pequenos detalhes. Uma xícara de chá quente espera em casa, mas não há motivo para correr. Por alguns minutos, a manhã pertence a quem está desperto para percebê-la.",
    },
  },
  {
    id: "learning",
    en: {
      title: "Learning something new",
      text: "Learning takes patience. The first attempt may feel awkward, and the second may not be much better. Still, every small effort builds on the one before it. Ask questions, notice what has changed, and give yourself time to improve. Progress is often easier to see when you look back.",
    },
    es: {
      title: "Aprender algo nuevo",
      text: "Aprender requiere paciencia. El primer intento puede resultar incómodo, y quizá el segundo no salga mucho mejor. Aun así, cada pequeño esfuerzo se apoya en el anterior. Haz preguntas, observa qué ha cambiado y date tiempo para mejorar. A menudo es más fácil ver el progreso cuando miras hacia atrás.",
    },
    fr: {
      title: "Apprendre quelque chose de nouveau",
      text: "Apprendre demande de la patience. Le premier essai peut sembler maladroit, et le deuxième ne sera peut-être pas beaucoup mieux. Pourtant, chaque petit effort s’appuie sur le précédent. Posez des questions, remarquez ce qui a changé et laissez-vous le temps de progresser. Il est souvent plus facile de voir le chemin parcouru en regardant derrière soi.",
    },
    de: {
      title: "Etwas Neues lernen",
      text: "Lernen braucht Geduld. Der erste Versuch fühlt sich vielleicht ungewohnt an, und der zweite gelingt womöglich kaum besser. Trotzdem baut jede kleine Anstrengung auf der vorherigen auf. Stelle Fragen, achte auf Veränderungen und gib dir Zeit, besser zu werden. Fortschritte erkennt man oft leichter, wenn man zurückblickt.",
    },
    pt: {
      title: "Aprender algo novo",
      text: "Aprender exige paciência. A primeira tentativa pode parecer estranha, e a segunda talvez não seja muito melhor. Ainda assim, cada pequeno esforço se apoia no anterior. Faça perguntas, perceba o que mudou e dê a si mesmo tempo para melhorar. Muitas vezes, é mais fácil enxergar o progresso quando olhamos para trás.",
    },
  },
  {
    id: "listening",
    en: {
      title: "The power of listening",
      text: "Good conversations begin with attention. Listening carefully shows respect, but it also helps us understand what someone means beyond the words they choose. Leave a little space before you respond. In that pause, a conversation can become more thoughtful, more honest, and more useful to everyone involved.",
    },
    es: {
      title: "El poder de escuchar",
      text: "Las buenas conversaciones empiezan prestando atención. Escuchar con cuidado demuestra respeto y también nos ayuda a entender lo que alguien quiere decir más allá de las palabras que elige. Deja un pequeño espacio antes de responder. En esa pausa, la conversación puede volverse más reflexiva, más sincera y más útil para todos.",
    },
    fr: {
      title: "Le pouvoir de l’écoute",
      text: "Les bonnes conversations commencent par l’attention. Écouter attentivement témoigne du respect et nous aide à comprendre ce qu’une personne veut dire au-delà des mots qu’elle choisit. Prenez un instant avant de répondre. Dans cette pause, l’échange peut devenir plus réfléchi, plus sincère et plus utile pour tout le monde.",
    },
    de: {
      title: "Die Kraft des Zuhörens",
      text: "Gute Gespräche beginnen mit Aufmerksamkeit. Aufmerksam zuzuhören zeigt Respekt und hilft uns zugleich, mehr zu verstehen als nur die gewählten Worte. Lass einen kurzen Moment verstreichen, bevor du antwortest. In dieser Pause kann ein Gespräch nachdenklicher, ehrlicher und für alle hilfreicher werden.",
    },
    pt: {
      title: "O poder de ouvir",
      text: "Boas conversas começam com atenção. Ouvir com cuidado demonstra respeito e também nos ajuda a compreender o que alguém quer dizer além das palavras escolhidas. Deixe um pequeno espaço antes de responder. Nessa pausa, a conversa pode se tornar mais reflexiva, mais sincera e mais útil para todos.",
    },
  },
  {
    id: "neighborhood",
    en: {
      title: "A brighter neighborhood",
      text: "A welcoming neighborhood is built through everyday choices. Neighbors share tools, greet one another, and look out for people who may need a hand. These gestures are small, but they add up. When people feel seen and included, familiar streets begin to feel like a community.",
    },
    es: {
      title: "Un vecindario más acogedor",
      text: "Un vecindario acogedor se construye con decisiones cotidianas. Los vecinos comparten herramientas, se saludan y están pendientes de quienes puedan necesitar ayuda. Son gestos pequeños, pero juntos cuentan mucho. Cuando las personas se sienten vistas e incluidas, las calles de siempre empiezan a sentirse como una comunidad.",
    },
    fr: {
      title: "Un quartier plus accueillant",
      text: "Un quartier accueillant se construit au fil des gestes du quotidien. Les voisins se prêtent des outils, se saluent et prennent des nouvelles de ceux qui pourraient avoir besoin d’aide. Ces gestes sont modestes, mais ils s’additionnent. Quand chacun se sent reconnu et inclus, les rues familières prennent un air de communauté.",
    },
    de: {
      title: "Ein lebendiges Viertel",
      text: "Ein freundliches Viertel entsteht durch alltägliche Entscheidungen. Nachbarn leihen einander Werkzeug, grüßen sich und achten auf Menschen, die Hilfe brauchen könnten. Diese Gesten sind klein, aber gemeinsam bewirken sie viel. Wenn Menschen sich wahrgenommen und willkommen fühlen, werden vertraute Straßen zu einer Gemeinschaft.",
    },
    pt: {
      title: "Um bairro mais acolhedor",
      text: "Um bairro acolhedor é construído por meio de escolhas do dia a dia. Os vizinhos compartilham ferramentas, cumprimentam uns aos outros e ajudam quem pode estar precisando. Esses gestos são pequenos, mas, juntos, fazem diferença. Quando as pessoas se sentem vistas e incluídas, as ruas conhecidas começam a parecer uma comunidade.",
    },
  },
];

function languageGroup(language: SpeechLanguage): keyof Omit<Sample, "id"> {
  if (language.startsWith("es-")) return "es";
  if (language === "fr-FR") return "fr";
  if (language === "de-DE") return "de";
  if (language === "pt-BR") return "pt";
  return "en";
}

export function getSamplePassages(language: SpeechLanguage): SamplePassage[] {
  const group = languageGroup(language);
  return samples.map((sample) => ({ id: sample.id, ...sample[group] }));
}
