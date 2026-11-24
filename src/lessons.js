/* Cartões "Aprender" — mini-lições antes de cada fase.
   Texto ESCRITO POR NÓS, com base nos capítulos do livro (sem copiar o texto nem as imagens do livro).
   Cada cartão: no máximo 2 frases curtas + um exemplo. Cada lição termina com uma pergunta-relâmpago
   que não vale ponto (só para a criança se lembrar do que acabou de ler).
   Fase sem lição simplesmente não mostra o botão "Aprender". */

// F(a, b) = fração empilhada, definida em questions.js (carregado antes deste arquivo).

const LESSONS = {
  // ============================= LÍNGUA PORTUGUESA =============================
  'port-1': {
    cards: [
      { icon: '🎨', title: 'Poema visual', text: 'É um poema feito para ser lido e também visto. As palavras são arrumadas no papel para formar um desenho.', ex: 'No poema "Aranha", as letras desenham o corpo e as patas do bicho.' },
      { icon: '👀', title: 'A forma também conta', text: 'No poema visual, o lugar e o formato das palavras ajudam a entender o que o poema quer dizer.', ex: 'Palavras em zigue-zague podem mostrar peixes nadando de um lado para o outro.' },
      { icon: '🔁', title: 'Repetir sons', text: 'Os poemas costumam repetir letras e sons para criar ritmo e significado.', ex: '"arrrranha": o R repetido faz a gente falar devagar, como a aranha arranhando.' },
      { icon: '🔄', title: 'Palíndromo', text: 'É uma palavra ou frase que pode ser lida da esquerda para a direita e da direita para a esquerda.', ex: '"Rio: o ir" e "Irene ri" são palíndromos.' },
      { icon: '🌸', title: 'Linguagem figurada', text: 'É quando as palavras criam uma imagem na nossa imaginação, com um sentido diferente do sentido comum.', ex: '"Ela é uma flor de pessoa" quer dizer que ela é delicada e gentil.' },
      { icon: '🐟', title: 'Animais que falam', text: 'Dar voz a animais ou coisas, que na vida real não falam, também é usar o sentido figurado.', ex: 'No poema "Zigue-zague", os peixes Zig e Zag conversam.' },
    ],
    check: { prompt: '"Fulano tem um coração de ouro." Essa frase usa:', options: ['Linguagem figurada', 'Um palíndromo', 'Um numeral'], correct: 0, explain: 'O coração não é de ouro de verdade: a frase cria uma imagem para dizer que a pessoa é muito boa.' },
  },
  'port-2': {
    cards: [
      { icon: '📢', title: 'Cartaz de conscientização', text: 'É um cartaz que convida as pessoas a pensar sobre um tema importante e a mudar de atitude.', ex: 'Ex.: respeitar as diferenças, cuidar da água, combater a dengue.' },
      { icon: '🖍️', title: 'Como ele chama atenção', text: 'Usa imagens, frases curtas, cores e letras de tamanhos diferentes para destacar a mensagem principal.', ex: 'A frase mais importante costuma aparecer bem grande.' },
      { icon: '🔢', title: 'Numeral', text: 'É a palavra que indica quantidade ou ordem. Pode ser escrita com algarismos (11) ou por extenso (onze).', ex: '"Leonardo treina três horas por dia."' },
      { icon: '🧮', title: 'Tipos de numeral', text: 'Cardinal: um, dois, três. Ordinal: primeiro, segundo. Multiplicativo: dobro, triplo. Fracionário: meio, um terço.', ex: '"Bia foi a terceira colocada" → terceira é ordinal.' },
      { icon: '🤫', title: 'A letra H no começo', text: 'Quando a palavra começa com H, essa letra não tem som nenhum. Mas ela precisa ser escrita!', ex: 'hino, herói, homenagem, higiene.' },
    ],
    check: { prompt: '"O evento teve o dobro de voluntários." A palavra "dobro" é um numeral:', options: ['Multiplicativo', 'Ordinal', 'Fracionário'], correct: 0, explain: 'Dobro quer dizer duas vezes a quantidade: é um numeral multiplicativo.' },
  },
  'port-3': {
    cards: [
      { icon: '🗣️', title: 'Depoimento', text: 'É um texto em que alguém conta publicamente o que viveu ou o que achou de algo ou de alguém.', ex: '"Nós adoramos a festa! Os monitores foram muito atenciosos."' },
      { icon: '👤', title: 'Eu e nós, no passado', text: 'O depoimento costuma ser escrito na 1ª pessoa (eu, nós) e com verbos no passado, porque conta algo que já aconteceu.', ex: '(eu) comemorei, (nós) comemoramos.' },
      { icon: '⏪', title: 'Terminação -am', text: 'Nos verbos no plural, -am geralmente indica o passado. É falado de um jeito mais fraco.', ex: 'Ontem, eles brincaram muito.' },
      { icon: '⏩', title: 'Terminação -ão', text: 'Nos verbos no plural, -ão geralmente indica o futuro. É falado de um jeito mais forte.', ex: 'Amanhã, eles brincarão de novo.' },
      { icon: '🤝', title: 'Concordância verbal', text: 'O verbo combina com quem faz a ação, em número (singular ou plural) e em pessoa (eu, nós, eles).', ex: 'O menino corre. Os meninos correm.' },
    ],
    check: { prompt: '"No ano que vem, os alunos ___ uma nova festa." Qual verbo completa?', options: ['farão', 'fizeram', 'faz'], correct: 0, explain: '"No ano que vem" indica futuro, e "os alunos" está no plural: farão.' },
  },

  // ============================= MATEMÁTICA =============================
  'mat-1': {
    cards: [
      { icon: '🍕', title: 'O que a fração mostra', text: `O número de baixo (denominador) diz em quantas partes iguais o inteiro foi dividido. O de cima (numerador) diz quantas partes pegamos.`, ex: `${F(3, 8)} → pizza em 8 pedaços, comemos 3.` },
      { icon: '⚖️', title: 'Mesmo denominador', text: 'Se os denominadores são iguais, a maior fração é a que tem o MAIOR numerador.', ex: `${F(5, 8)} > ${F(3, 8)}` },
      { icon: '🔍', title: 'Mesmo numerador', text: 'Se os numeradores são iguais, a maior fração é a que tem o MENOR denominador, porque as partes são maiores.', ex: `${F(1, 2)} > ${F(1, 4)} (metade é maior que um quarto)` },
      { icon: '1️⃣', title: 'Menor, igual ou maior que 1', text: 'Se o numerador é menor que o denominador, a fração é menor que 1 inteiro. Se são iguais, vale 1 inteiro.', ex: `${F(3, 4)} < 1 · ${F(4, 4)} = 1 · ${F(5, 4)} > 1` },
    ],
    check: { prompt: `Qual fração é maior: ${F(2, 6)} ou ${F(5, 6)}?`, options: [`${F(5, 6)}`, `${F(2, 6)}`, 'São iguais'], correct: 0, explain: 'Os denominadores são iguais (6), então ganha quem tem o maior numerador: 5.' },
  },
  'mat-2': {
    cards: [
      { icon: '🟰', title: 'Frações equivalentes', text: 'São frações diferentes que representam a mesma parte do inteiro.', ex: `${F(1, 2)} = ${F(2, 4)} = ${F(4, 8)}` },
      { icon: '🧮', title: 'Multiplicando', text: 'Para achar uma fração equivalente, multiplique o numerador e o denominador pelo MESMO número.', ex: `${F(1, 3)} → ×2 → ${F(2, 6)}` },
      { icon: '➗', title: 'Dividindo', text: 'Também dá para dividir o numerador e o denominador pelo mesmo número.', ex: `${F(6, 8)} → ÷2 → ${F(3, 4)}` },
      { icon: '🍫', title: 'Na prática', text: 'Comer 2 pedaços de uma barra dividida em 4 é o mesmo que comer metade da barra.', ex: `${F(2, 4)} = ${F(1, 2)}` },
    ],
    check: { prompt: `Qual fração é equivalente a ${F(1, 4)}?`, options: [`${F(2, 8)}`, `${F(2, 4)}`, `${F(1, 8)}`], correct: 0, explain: 'Multiplicando 1 e 4 por 2, obtemos 2/8.' },
  },
  'mat-3': {
    cards: [
      { icon: '✂️', title: 'Simplificar', text: 'Simplificar é escrever a fração com números menores, sem mudar o valor dela.', ex: `${F(4, 8)} = ${F(1, 2)}` },
      { icon: '➗', title: 'Como fazer', text: 'Divida o numerador e o denominador pelo mesmo número.', ex: `${F(6, 9)} → ÷3 → ${F(2, 3)}` },
      { icon: '🔁', title: 'Pode repetir', text: 'Dá para simplificar mais de uma vez, até não dar mais para dividir os dois pelo mesmo número.', ex: `${F(8, 16)} → ÷2 → ${F(4, 8)} → ÷4 → ${F(1, 2)}` },
      { icon: '🏁', title: 'Forma mais simples', text: 'Quando o numerador e o denominador só podem ser divididos juntos por 1, a fração está na forma mais simples.', ex: `${F(3, 5)} já está simplificada.` },
    ],
    check: { prompt: `Qual é a forma simplificada de ${F(5, 10)}?`, options: [`${F(1, 2)}`, `${F(5, 2)}`, `${F(1, 5)}`], correct: 0, explain: 'Dividindo 5 e 10 por 5, chegamos a 1/2.' },
  },
  'mat-4': {
    cards: [
      { icon: '➕', title: 'Somar com o mesmo denominador', text: 'Mantenha o denominador e some só os numeradores.', ex: `${F(2, 7)} + ${F(3, 7)} = ${F(5, 7)}` },
      { icon: '➖', title: 'Subtrair com o mesmo denominador', text: 'Mantenha o denominador e subtraia só os numeradores.', ex: `${F(6, 9)} − ${F(4, 9)} = ${F(2, 9)}` },
      { icon: '🚫', title: 'Erro comum', text: 'Não some os denominadores! O tamanho das partes não muda, só a quantidade de partes.', ex: `${F(1, 4)} + ${F(1, 4)} = ${F(2, 4)}, e não 2/8.` },
      { icon: '🧺', title: 'Fração de uma quantidade', text: 'Para achar uma fração de um número, divida pelo denominador e multiplique pelo numerador.', ex: `${F(1, 4)} de 12 = 12 ÷ 4 = 3` },
    ],
    check: { prompt: `Quanto é ${F(3, 5)} + ${F(1, 5)}?`, options: [`${F(4, 5)}`, `${F(4, 10)}`, `${F(3, 5)}`], correct: 0, explain: 'Mantemos o 5 e somamos os numeradores: 3 + 1 = 4.' },
  },

  // ============================= HISTÓRIA (cap. 8) =============================
  'hist-1': {
    cards: [
      { icon: '🧳', title: 'Migrar', text: 'Migrar é deixar o lugar onde se vive para morar em outro. Pode ser por escolha ou por necessidade.', ex: 'A mudança pode durar alguns meses, anos ou ser para sempre.' },
      { icon: '📈', title: 'Cada vez mais migrantes', text: 'O número de pessoas vivendo fora do seu país cresceu muito.', ex: 'Eram 84 milhões em 1970 e mais de 280 milhões em 2020.' },
      { icon: '💼', title: 'À procura de oportunidades', text: 'Algumas pessoas se mudam para estudar ou trabalhar, porque não encontram boas oportunidades no seu país.', ex: 'Falta de emprego e salários baixos pesam nessa decisão.' },
      { icon: '🏚️', title: 'Procurando abrigo', text: 'Desastres naturais, como terremotos, tsunamis e tempestades, destroem casas e cidades. Muitas pessoas precisam buscar um lugar seguro.', ex: 'Ex.: terremotos no Haiti (2010 e 2021) e na Turquia (2023).' },
      { icon: '🛡️', title: 'Buscando segurança', text: 'Guerras, conflitos e perseguições fazem pessoas fugirem em busca de proteção. Elas são chamadas de refugiados.', ex: 'Ex.: pessoas da Síria e do Afeganistão.' },
    ],
    check: { prompt: 'Uma família que foge de uma guerra no seu país em busca de proteção é chamada de:', options: ['Refugiada', 'Turista', 'Exploradora'], correct: 0, explain: 'Refugiados são pessoas que deixam seu país em busca de proteção contra guerras e perseguições.' },
  },
  'hist-2': {
    cards: [
      { icon: '🧭', title: 'Escolher o destino', text: 'Quem migra pensa em vários pontos: se o país tem paz, se tem trabalho, a distância e os meios de transporte.' },
      { icon: '🏘️', title: 'Perto de casa', text: 'Muitas pessoas que fogem de perigos vão para países vizinhos.', ex: '73% delas estão em territórios vizinhos aos seus países.' },
      { icon: '🌎', title: 'Onde vivem mais imigrantes', text: 'Hoje, os países onde mais vivem imigrantes são Estados Unidos, Alemanha e Arábia Saudita.' },
      { icon: '📜', title: 'Basta entrar?', text: 'Não! Cada país tem leis com regras de entrada, direitos e deveres para os imigrantes.' },
      { icon: '🛂', title: 'Passaporte e visto', text: 'O passaporte identifica o viajante em outros países. O visto é a autorização para entrar no país de forma legal.', ex: 'Para ter o visto: formulário, entrevista e documentos.' },
    ],
    check: { prompt: 'Qual documento autoriza a entrada de um estrangeiro em um país de forma legal?', options: ['O visto', 'A carteira de estudante', 'O boletim escolar'], correct: 0, explain: 'O visto é o documento que autoriza a entrada do estrangeiro no país de forma legal.' },
  },

  // ============================= HISTÓRIA (cap. 9) =============================
  'hist-3': {
    cards: [
      { icon: '🚶', title: 'Viajar no passado', text: 'Antigamente, viajar era uma aventura lenta e cansativa. As pessoas iam a pé, em animais ou em barcos simples.', ex: 'Cavalos, bois e camelos carregavam pessoas e cargas.' },
      { icon: '🐎', title: 'A carruagem', text: 'Era um transporte de luxo puxado por animais, como cavalos e mulas. Era usado por pessoas que tinham muito dinheiro.' },
      { icon: '⛵', title: 'A caravela', text: 'Era uma embarcação movida pela força do vento nas velas. No passado, era considerada rápida e levava pessoas e mercadorias.' },
      { icon: '🐫', title: 'Caravanas', text: 'Para ir longe, as pessoas usavam vários transportes na mesma viagem e viajavam em grupo, as caravanas.', ex: 'As viagens eram demoradas, desconfortáveis e perigosas.' },
    ],
    check: { prompt: 'O que fazia a caravela se mover?', options: ['A força do vento nas velas', 'Um motor a gasolina', 'Cavalos puxando'], correct: 0, explain: 'A caravela era movida pelo vento que batia nas velas.' },
  },
  'hist-4': {
    cards: [
      { icon: '🏙️', title: 'Por que mudou?', text: 'As cidades cresceram e o comércio aumentou. Então as pessoas precisaram de transportes mais rápidos.' },
      { icon: '🚂', title: 'Novos transportes', text: 'Foram criados o trem, o automóvel e o avião. Os primeiros motores funcionavam com vapor.', ex: 'Depois vieram a eletricidade e a gasolina.' },
      { icon: '✈️', title: 'Mais rápido', text: 'Com os motores, dá para ir mais longe em menos tempo. Uma viagem que levava meses hoje pode levar algumas horas.' },
      { icon: '🛵', title: 'Evolução continua', text: 'Os transportes seguem mudando. A motocicleta, por exemplo, hoje tem modelos elétricos, que poluem menos.' },
      { icon: '🛤️', title: 'Transformar para se deslocar', text: 'Para os transportes circularem, construímos estradas, ferrovias e portos. Essas obras mudam a paisagem e podem causar impactos no ambiente.' },
    ],
    check: { prompt: 'Qual foi a primeira fonte de energia dos motores dos novos transportes?', options: ['O vapor', 'A energia solar', 'O vento'], correct: 0, explain: 'Os primeiros motores funcionavam com vapor. Depois vieram a eletricidade e a gasolina.' },
  },

  // ============================= GEOGRAFIA =============================
  'geo-1': {
    cards: [
      { icon: '📦', title: 'Circulação de mercadorias', text: 'É o caminho que os produtos fazem desde onde são feitos até onde são vendidos.', ex: 'Um celular pode ter peças feitas em vários países!' },
      { icon: '✈️', title: 'Vias aéreas', text: 'Aviões e helicópteros. É o transporte mais rápido, mas é caro, então leva poucas mercadorias.' },
      { icon: '🚢', title: 'Vias aquáticas', text: 'Barcos e navios em rios, mares e oceanos. Levam muita carga de uma vez para lugares longe.', ex: 'Grãos, minério de ferro e combustíveis vão muito de navio.' },
      { icon: '🚆', title: 'Ferroviário', text: 'Trens sobre trilhos. Bom para levar cargas pesadas por longas distâncias, em países grandes.' },
      { icon: '🚚', title: 'Rodoviário', text: 'Caminhões, carros e ônibus em estradas. Chega a quase todos os lugares e é o mais usado no Brasil.' },
    ],
    check: { prompt: 'Qual transporte é o mais rápido, mas também o mais caro?', options: ['Aéreo', 'Ferroviário', 'Aquático'], correct: 0, explain: 'O avião é o mais rápido, mas por ser caro é pouco usado para mercadorias.' },
  },
  'geo-2': {
    cards: [
      { icon: '🌍', title: 'Comércio internacional', text: 'É a troca de produtos entre países. Ele tem duas partes: exportar e importar.' },
      { icon: '📤', title: 'Exportar', text: 'É quando um país VENDE produtos para outro país.', ex: 'O Brasil exporta soja, minério de ferro e café.' },
      { icon: '📥', title: 'Importar', text: 'É quando um país COMPRA produtos de outro país.', ex: 'O Brasil importa produtos industrializados, como remédios e máquinas.' },
      { icon: '🤝', title: 'Brasil e o mundo', text: 'O Brasil vende principalmente matérias-primas e compra principalmente produtos industrializados.', ex: 'Grandes parceiros: China e Estados Unidos.' },
      { icon: '⚓', title: 'Como as mercadorias viajam', text: 'Entre países, o mais usado é o navio, porque leva muita carga por longas distâncias.' },
    ],
    check: { prompt: 'Quando o Brasil vende soja para a China, isso é:', options: ['Exportação', 'Importação', 'Consumo interno'], correct: 0, explain: 'Vender para outro país é exportar.' },
  },
  'geo-3': {
    cards: [
      { icon: '⛰️', title: 'Relevo', text: 'É o conjunto das formas da superfície da Terra: umas mais altas, outras mais baixas.', ex: 'No Brasil, os tipos principais são planalto, depressão e planície.' },
      { icon: '🟩', title: 'Planície', text: 'Terreno plano e baixo, perto do nível do mar, de rios ou de lagos. Recebe materiais trazidos pela água e pelo vento.', ex: 'Ex.: Pantanal, em Mato Grosso do Sul.' },
      { icon: '🟧', title: 'Depressão', text: 'Área mais baixa que os terrenos em volta, ou abaixo do nível do mar. Formada pelo desgaste do vento e da água.', ex: 'Ex.: Vale do Pati, na Bahia.' },
      { icon: '🟪', title: 'Planalto', text: 'Superfície elevada, mais ou menos plana. Tem chapadas, serras e morros.', ex: 'Brasília fica num planalto: por isso o Palácio do Planalto!' },
      { icon: '🏔️', title: 'Montanha', text: 'Relevo muito alto e inclinado. Várias montanhas seguidas formam uma cordilheira.', ex: 'Serra da Mantiqueira, Cordilheira dos Andes, Himalaia.' },
    ],
    check: { prompt: 'Um terreno elevado e mais ou menos plano, com chapadas e serras, é:', options: ['Planalto', 'Planície', 'Depressão'], correct: 0, explain: 'O planalto é elevado e mais ou menos plano.' },
  },
  'geo-4': {
    cards: [
      { icon: '🐢', title: 'Mudanças lentas', text: 'A maior parte das mudanças no relevo acontece devagar, durante milhões de anos.' },
      { icon: '💧', title: 'Águas e ventos', text: 'A água da chuva, dos rios e do mar desgasta e leva pedacinhos do solo e das rochas. O vento também molda as rochas, mais devagar.' },
      { icon: '🌡️', title: 'Temperatura', text: 'O calor e o frio fazem as rochas aumentarem e diminuírem de tamanho. Com o tempo, elas racham e quebram.' },
      { icon: '🌋', title: 'Mudanças rápidas', text: 'Vulcões e terremotos mudam o relevo depressa. A lava esfria e vira rocha nova; os terremotos movem pedaços da crosta terrestre.' },
      { icon: '🏗️', title: 'Ação humana', text: 'As pessoas também mudam o relevo: derrubam morros, aterram áreas alagadas, abrem estradas e fazem mineração.' },
    ],
    check: { prompt: 'Qual destes muda o relevo de forma RÁPIDA?', options: ['Um terremoto', 'O vento', 'A água da chuva'], correct: 0, explain: 'Terremotos e vulcões mudam o relevo rápido. Vento e chuva agem devagar.' },
  },

  // ============================= CIÊNCIAS =============================
  'cien-1': {
    cards: [
      { icon: '🦠', title: 'Seres que causam doenças', text: 'Vírus, bactérias, vermes e outros microrganismos podem causar doenças. Quem causa doença é chamado de patogênico.' },
      { icon: '🧬', title: 'Vírus', text: 'São tão pequenos que só aparecem em microscópios potentes. Só conseguem se multiplicar dentro das células de outro ser vivo.' },
      { icon: '🤧', title: 'Doenças por vírus', text: 'Gripe, sarampo, dengue, zika e chikungunya são causadas por vírus.', ex: 'Sarampo: manchas vermelhas na pele, febre alta e tosse.' },
      { icon: '🦟', title: 'Dengue, zika e chikungunya', text: 'São transmitidas pela picada do mosquito Aedes aegypti, que nasce em água parada.', ex: 'Não deixar água parada ajuda a combater o mosquito.' },
      { icon: '💉', title: 'Vacina', text: 'A vacina ensina o corpo a criar defesas antes de ficarmos doentes. Assim ele reage mais rápido se o vírus aparecer.' },
    ],
    check: { prompt: 'Qual destas doenças é causada por vírus?', options: ['Sarampo', 'Cárie', 'Amebíase'], correct: 0, explain: 'O sarampo é causado por vírus. A cárie é por bactéria e a amebíase, pela ameba.' },
  },
  'cien-2': {
    cards: [
      { icon: '🔬', title: 'Bactérias', text: 'A maioria das bactérias não faz mal. Mas algumas podem causar doenças.', ex: 'Exemplos: cárie e tuberculose.' },
      { icon: '🦷', title: 'Cárie', text: 'Bactérias da boca comem restos de comida, principalmente doces, e soltam um ácido que fura o dente.' },
      { icon: '🪥', title: 'Evitar a cárie', text: 'Escove os dentes e a língua depois das refeições, ao acordar e antes de dormir.' },
      { icon: '🫁', title: 'Tuberculose', text: 'Ataca principalmente os pulmões. Causa tosse por várias semanas, febre e perda de peso. Passa por gotinhas de saliva e por objetos do doente.' },
      { icon: '🪟', title: 'Evitar a tuberculose', text: 'Deixe o ambiente arejado, lave as mãos, não use objetos do doente e tome a vacina, que é gratuita no Brasil.' },
    ],
    check: { prompt: 'O que causa a cárie?', options: ['Bactérias da boca', 'Um vírus', 'Um verme'], correct: 0, explain: 'As bactérias da boca se alimentam dos restos de comida e produzem o ácido que fura o dente.' },
  },
  'cien-3': {
    cards: [
      { icon: '🔬', title: 'Outros microrganismos', text: 'Além de vírus e bactérias, há outros seres microscópicos que causam doenças, como a giárdia e a ameba.' },
      { icon: '💧', title: 'Giardíase', text: 'A giárdia vive na água. Quem bebe água contaminada engole a giárdia, que vai para o intestino e causa diarreia e dor de barriga.' },
      { icon: '🤢', title: 'Amebíase', text: 'A ameba passa por água ou comida contaminada. Causa diarreia forte com sangue, febre e fraqueza.' },
      { icon: '🧼', title: 'Como prevenir', text: 'Lave as mãos depois do banheiro e antes de comer, beba só água tratada e lave bem frutas e verduras.', ex: 'Não existe vacina para a giardíase.' },
    ],
    check: { prompt: 'Como a giárdia entra no nosso corpo?', options: ['Pela água ou comida contaminada', 'Pela picada de mosquito', 'Pela pele dos pés'], correct: 0, explain: 'A giárdia vive na água e é engolida com água ou alimentos contaminados.' },
  },
  'cien-4': {
    cards: [
      { icon: '🪱', title: 'Vermes', text: 'São animais de corpo mole e comprido, sem olhos nem patas. Alguns causam doenças, as verminoses.', ex: 'Não existe vacina contra vermes. O remédio se chama vermífugo.' },
      { icon: '🥗', title: 'Lombriga (ascaridíase)', text: 'Entra quando a pessoa come ou bebe algo com ovos de lombriga. Causa dor de barriga, diarreia, febre e vômito.' },
      { icon: '🦶', title: 'Ancilóstomo', text: 'É um verme pequeno que entra pela pele de quem pisa descalço na terra úmida contaminada. Ele se alimenta do sangue da pessoa.' },
      { icon: '👟', title: 'Como prevenir', text: 'Lave as mãos, lave bem os alimentos crus, beba água tratada e ande sempre calçado na terra.' },
    ],
    check: { prompt: 'Qual atitude ajuda a evitar o ancilóstomo?', options: ['Andar calçado na terra', 'Tomar vacina', 'Usar repelente'], correct: 0, explain: 'O ancilóstomo entra pela pele dos pés descalços. Por isso, use calçado na terra.' },
  },

  // ============================= INGLÊS =============================
  'ing-1': {
    lang: 'en',
    cards: [
      { icon: '🐯', title: 'Animals', text: 'tiger (tigre), lion (leão), leopard (leopardo), zebra, panda, rhino (rinoceronte).', say: 'tiger, lion, leopard, zebra, panda, rhino' },
      { icon: '🐧', title: 'More animals', text: 'penguin (pinguim), monkey (macaco), snake (cobra), parrot (papagaio).', say: 'penguin, monkey, snake, parrot' },
      { icon: '🐆', title: 'Body parts', text: 'spots (pintas), stripes (listras), fur (pelo), tail (rabo), feathers (penas), wings (asas).', say: 'spots, stripes, fur, tail, feathers, wings' },
      { icon: '🦓', title: 'Examples', text: 'Zebras have stripes. Leopards have spots. Parrots have feathers and wings.', say: 'Zebras have stripes. Leopards have spots. Parrots have feathers and wings.' },
    ],
    check: { prompt: 'Which animal has stripes?', options: ['Zebra', 'Penguin', 'Snake'], correct: 0, explain: 'Zebras have stripes (listras).' },
  },
  'ing-2': {
    lang: 'en',
    cards: [
      { icon: '✅', title: 'can', text: '"can" = consegue / sabe fazer.', ex: 'Monkeys can climb. (Macacos conseguem escalar.)', say: 'Monkeys can climb.' },
      { icon: '❌', title: "can't", text: '"can\'t" = não consegue.', ex: "Penguins can't fly. (Pinguins não conseguem voar.)", say: "Penguins can't fly." },
      { icon: '❓', title: 'Can they...?', text: 'Para perguntar, o "can" vem antes: Can they...? Resposta: Yes, they can. / No, they can\'t.', ex: "Can parrots fly? Yes, they can.", say: "Can parrots fly? Yes, they can." },
      { icon: '🐾', title: "have / don't have", text: '"have" = têm. "don\'t have" = não têm.', ex: "Lions have fur. Snakes don't have legs.", say: "Lions have fur. Snakes don't have legs." },
      { icon: '🤔', title: 'Do they have...?', text: 'Para perguntar: Do they have...? Resposta: Yes, they do. / No, they don\'t.', ex: "Do zebras have stripes? Yes, they do.", say: "Do zebras have stripes? Yes, they do." },
    ],
    check: { prompt: 'Do penguins have wings?', options: ['Yes, they do.', 'Yes, they can.', "No, they can't."], correct: 0, explain: 'Pergunta com "Do they have" → resposta com "do": Yes, they do.' },
  },
  'ing-3': {
    lang: 'en',
    cards: [
      { icon: '🧺', title: 'Outdoor activities', text: 'having a picnic (fazer piquenique), building a fort (construir um forte), fishing (pescar).', say: 'having a picnic, building a fort, fishing' },
      { icon: '🚲', title: 'On wheels', text: 'riding a bike (andar de bicicleta), skateboarding (andar de skate).', say: 'riding a bike, skateboarding' },
      { icon: '🗺️', title: 'Adventure', text: 'reading a map (ler um mapa), sailing (velejar), hiking a nature trail (fazer trilha), rock-climbing (escalar rochas).', say: 'reading a map, sailing, hiking a nature trail, rock-climbing' },
      { icon: '✏️', title: 'And...', text: 'drawing (desenhar).', say: 'drawing' },
    ],
    check: { prompt: '"Sailing" significa:', options: ['Velejar', 'Pescar', 'Desenhar'], correct: 0, explain: 'Sailing = velejar, andar de barco a vela.' },
  },
  'ing-4': {
    lang: 'en',
    cards: [
      { icon: '🎣', title: 'She is + ing', text: 'Para dizer o que alguém está fazendo agora: She is / He is + verbo com -ing.', ex: 'She is fishing. (Ela está pescando.)', say: 'She is fishing.' },
      { icon: '🚫', title: "He isn't + ing", text: '"isn\'t" = não está.', ex: "He isn't drawing. (Ele não está desenhando.)", say: "He isn't drawing." },
      { icon: '❓', title: 'Is she...?', text: 'Para perguntar, o "Is" vem primeiro. Resposta: Yes, she is. / No, she isn\'t.', ex: 'Is she sailing? Yes, she is.', say: 'Is she sailing? Yes, she is.' },
    ],
    check: { prompt: 'Is he riding a bike? (Sim)', options: ['Yes, he is.', 'Yes, he does.', 'Yes, he can.'], correct: 0, explain: 'Pergunta com "Is" → resposta com "is": Yes, he is.' },
  },
};

if (typeof module !== 'undefined') { module.exports = { LESSONS }; }
