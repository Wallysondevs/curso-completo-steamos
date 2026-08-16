Depois das skins, o degrau seguinte da personalização é físico e reversível: trocar os botões frontais e os *grips* do Steam Deck. É a primeira intervenção que exige abrir o aparelho, mas se limita à mecânica — parafusos, encaixes e fitas — sem tocar em componentes eletrônicos delicados. Esta seção prepara o terreno: ferramentas, riscos, e o passo a passo conceitual da troca, com ênfase em não danificar o que não deve ser mexido.

:::objetivos
- Reunir as ferramentas e o espaço de trabalho adequados para abrir o Steam Deck
- Compreender a anatomia dos botões frontais e como eles se encaixam
- Executar uma troca de botões sem danificar a carcaça ou os flex dos controles
- Conhecer os riscos dos parafusos e dos conectores de fita
- Inspecionar o estado do aparelho antes e depois da troca
:::

## Antes de abrir: ferramentas e postura

Trocar botões não é um trabalho de força, e sim de precisão. Você vai precisar de:

- Chave Phillips **PH00** (e, para alguns parafusos internos, PH0), de boa qualidade — chaves vagabundas espanam a cabeça do parafuso.
- Espátulas de plástico (*spudgers*) e uma alavanca de abertura (*pry tool*); palhetas de guitarra de nylon também funcionam.
- Pinça antiestática para manusear conectores e fitas.
- Tapete ou pulseira antiestática, para não descarregar estática na placa.
- Bandeja magnética (ou fita) para organizar os parafusos por etapa — cada etapa tem parafusos de comprimentos diferentes.

O ambiente importa tanto quanto as ferramentas. Trabalhe numa mesa limpa, com boa luz e espaço para espalhar as peças. Fotografe **cada etapa antes de desmontar**; a foto é a sua memória na hora de remontar.

:::perigo
Antes de abrir qualquer aparelho com bateria, **desligue por completo** e, se possível, deixe a bateria descarregar abaixo de 50%. A maioria dos guias recomenda desconectar a bateria internamente como primeira ação real. Lidar com o aparelho ligado ou com o conector da bateria energizado é o caminho mais curto para um curto-circuito caro. Nunca use ferramentas metálicas para alavancar os conectores de bateria.
:::

## Anatomia dos botões e do front shell

Os botões frontais do Steam Deck — os quatro A/B/X/Y, o D-pad, os dois analógicos e os botões de menu — assentam numa placa de controles presa ao *front shell* (a carcaça dianteira). Cada botão é uma peça de plástico com uma "saia" que o impede de cair para fora, apoiada sobre um contato de membrana ou um switch táctil.

Entender isso já previne o erro mais comum: **os botões não são colados nem soldados** — eles são peças plásticas que se encaixam e podem ser retiradas com uma espátula fina, uma vez que a carcaça dianteira esteja solta.

```terminal
$ ls /sys/class/input/ | grep -E "event|js"
event0  event1  event2  event3  event4  event5  js0  js1
```

Antes de abrir, vale registrar o estado dos controles para ter uma referência do "antes". O Steam Deck expõe os controles como dispositivos de entrada (`eventX` para botões, `jsX` para analógicos). Se depois da remontagem um botão parar de responder, esse inventário ajuda a isolar se o problema é físico ou de firmware.

## A troca, passo a passo conceitual

Cada modelo tem um roteiro de parafusos ligeiramente diferente, então o que segue é o esqueleto que todo guia confiável (iFixit, por exemplo) detalha. **Siga o guia do seu modelo**, não a memória.

1. **Remover o back shell.** Afrouxe os parafusos traseiros (alguns modelos usam parafusos com rosca curta/auto-atarraxante) e solte os clipes com a espátula, começando por uma quina.
2. **Desconectar a bateria.** Localize o conector da bateria e solte-o com a pinça, antes de tocar em qualquer placa.
3. **Desconectar os flex e o dissipador, conforme o guia**, liberando o conjunto da placa-mãe.
4. **Acessar a placa de controles** e, por trás, empurrar cada botão para fora com a espátula pelo seu alojamento.
5. **Encaixar os botões novos** nos alojamentos, conferindo orientação (os botões têm posições encaixadas, não são todos girados iguais).
6. **Remontar na ordem inversa**, reconectando a bateria **por último**.

:::atencao
Os conectores de fita (flex) abrem com uma trava: levante a aba com a unha ou pinça antes de puxar o cabo. Puxar o cabo sem destravar rasga a fita, e aí o conserto deixa de ser cosmético. Fotografe a posição e a orientação de cada flex antes de soltar.
:::

## Parafusos: o detalhe que morde

Um dos maiores calvários de quem abre o Steam Deck pela primeira vez é misturar os parafusos. Se você usar um parafuso comprido onde deveria ir um curto, arrisca furar a placa ou a carcaça ao apertar. A disciplina é simples e muda tudo:

```terminal
$ mkdir -p ~/lab/teardown
$ ls ~/lab/teardown
```

Use uma bandeja com divisórias etiquetadas — "back shell", "placa", "controles" — e devolva cada parafuso à divisória da sua etapa. Alguns guias colam os parafusos num esquema desenhado no papel, reproduzindo a posição exata de cada um.

:::dica
Parafusos auto-atarraxantes (os que cortam o próprio filete no plástico) desgastam o furo a cada remontagem. Evite abrir e fechar o aparelho muitas vezes e, ao reapertar, pare no primeiro sinal de resistência — plástico espanado não segura mais parafuso e exige reparo com inserto de latão.
:::

## Verificando depois de remontar

Fechou o aparelho? Antes de comemorar, execute uma checagem funcional. Os controles do Steam Deck respondem a um utilitário de teste embutido, e há dados no `/sys` que confirmam se cada entrada foi reconhecida.

```terminal
$ cat /proc/bus/input/devices | grep -A6 -i "Steam Deck" | head -20
```

Percorra mentalmente cada botão: A/B/X/Y disparam o evento correspondente? O D-pad responde nas quatro direções? Os analógicos centralizam? Os *grips* (se trocados) registram pressão? Um teste sistemático agora é muito mais barato que descobrir um botão morto no meio de uma partida.

## Resumo

- Trocar botões é intervenção mecânica reversível, mas exige abrir o aparelho e desconectar a bateria.
- Ferramentas certas (chave PH00, espátula, pinça, antiestática) evitam 90% dos danos acidentais.
- Botões são peças encaixadas, não coladas; saem por trás da placa de controles.
- Conectores flex têm trava — destrave antes de puxar, ou rasga a fita.
- Parafusos de comprimentos diferentes exigem organização por etapa para não furar a placa.
- Testes funcionais pós-montagem (via `/proc/bus/input/devices` e o teste de controles) confirmam a remontagem.

## Exercícios

1. Liste os dispositivos de entrada do seu aparelho com `ls /sys/class/input/` e registre quais `eventX`/`jsX` existem como referência do "antes".
2. Pesquise o guia de desmontagem do **seu** modelo (LCD ou OLED) no site da iFixit e anote quantos parafusos do back shell ele lista, e de que comprimentos.
3. Reúna as ferramentas da lista. Verifique se a sua chave Phillips é realmente PH00 (teste o encaixe num parafuso traseiro sem apertar).
4. Em um aparelho (ou vídeo) de referência, identifique a trava de um conector flex e descreva, em duas frases, como destravá-la sem danificar a fita.
5. **Desafio.** Proponha um plano de verificação pós-montagem que use tanto o teste de controles da interface quanto leituras de `/proc/bus/input/devices`, e explique como você distinguiria um botão quebrado na remontagem de um botão que nunca foi reconhecido por firmware.
