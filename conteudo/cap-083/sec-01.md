Um Steam Deck é, antes de tudo, um console portátil — mas ele vira outra máquina quando você conecta um controle de verdade, um teclado mecânico ou um volante. O SteamOS herda do Linux uma pilha de entrada (input) madura e transparente, o que significa que praticamente todo periférico "só funciona" ao plugar. O que exige trabalho não é a conexão em si, e sim configurar mapeamento, latência e force feedback de forma que a experiência fique à altura de um console dedicado.

:::objetivos
- Entender como o SteamOS organiza os dispositivos de entrada em camadas
- Identificar onde cada periférico aparece no sistema
- Distinguir a leitura crua do kernel das traduções do Steam Input
- Reconhecer os protocolos usados por controles modernos
:::

## Três camadas entre o dedo e o jogo

Quando você aperta um botão, a informação percorre três camadas antes de virar ação no jogo. A primeira é o **driver do kernel**: um módulo que conversa com o hardware por USB ou Bluetooth e expõe o dispositivo como um nó em `/dev/input`. A segunda é o **subsistema de input** do Linux, que padroniza eventos — todo botão vira um código numérico acompanhado de "pressionado" ou "solto". A terceira é o **Steam Input**, a tradução proprietária da Valve que converte esses códigos brutos em ações de jogo e permite remapear tudo por cima.

```terminal
$ ls /dev/input
by-id    by-path  event0  event1  event2  event3  event4  mice
```

Os arquivos `event*` são os pontos de leitura bruta. Cada um é um fluxo contínuo de estruturas do tipo "botão X pressionado", "eixo Y moveu para -32767". O Steam Input lê esses fluxos e os reinterpreta; sem ele, o jogo receberia os códigos crus do kernel, que nem sempre batem com o que a Valve e os desenvolvedores esperam.

## Por que controles modernos são mais que botões

Um DualSense ou um controle Xbox Series não é um joystick de quatro botões dos anos 1990. Eles carregam uma lista de recursos que o kernel precisa entender e o Steam Input precisa expor:

| Recurso | O que faz | Relevância no Steam Deck |
|---|---|---|
| Botões e gatilhos analógicos | enviam valores de 0 a 255, não só ligado/desligado | disparo gradual no freio e acelerador |
| Eixos (analógicos) | dois sticks com X e Y cada | movimento e câmera |
| Giroscópio | mede inclinação e rotação | mira de precisão no Steam Input |
| Touchpad | superfície tátil multi-toque | navegação e menus |
| Force feedback / rumble | motores vibratórios | imersão e avisos táteis |
| LEDs e áudio | indicadores e alto-falante embutido | feedback visual e sonoro |

Cada um desses recursos exige um driver que o anuncie corretamente ao kernel. A boa notícia é que os drivers dos controles mais populares já vêm no kernel do SteamOS; a má notícia é que nem tudo é exposto sem configuração, principalmente force feedback e o giroscópio em alguns modelos.

## USB, Bluetooth e o protocolo HID

Quase todo controle moderno fala **HID** (*Human Interface Device*), um protocolo padronizado pelo qual o aparelho se descreve: "tenho 14 botões, 6 eixos e um hat switch". É por isso que um controle não precisa de driver proprietário para funcionar no Linux: basta o driver genérico `hid` interpretar o descritor enviado pelo aparelho.

A escolha do transporte muda o comportamento:

- **USB**: pareamento trivial, latência mínima, carrega o controle enquanto joga. É o caminho recomendado para jogos competitivos.
- **Bluetooth**: conveniência sem fio, mas com latência maior e um passo extra de pareamento. Algumas funções avançadas (áudio pelo controle, por exemplo) só funcionam em USB.

```terminal
$ lsusb | grep -iE 'sony|microsoft|xbox'
Bus 001 Device 004: ID 054c:0df2 Sony Corp. DualSense wireless controller (PS5)
```

O driver `hid` genérico cobre a maioria; a Valve e a comunidade mantêm módulos específicos (como `hid-playstation` e `xpad`) que acrescentam suporte a recursos extras. Entender essa divisão — o que é kernel, o que é Steam Input — evita metade da frustração quando algo "não funciona": o problema raramente está na conexão, quase sempre está na camada que deveria traduzir o evento.

## Onde as coisas dão errado

:::atencao
O sintoma mais comum é o controle aparecer no sistema (`lsusb` lista o aparelho) mas não responder no jogo. Isso quase nunca é defeito de driver: é o Steam Input travando em um layout errado, ou o jogo aberto fora do Steam (via Flatpak ou modo desktop) e, portanto, sem a tradução de eventos. Antes de reinstalar nada, teste a leitura crua com `evtest` — se os eventos aparecem lá, o hardware e o kernel estão perfeitos.
:::

Outro erro típico é tentar parear um controle já conectado a outro aparelho. Bluetooth é um relacionamento exclusivo: se o DualSense ainda está pareado com o seu PS5 ou celular, ele não aparece na lista do Steam Deck até você forçar o modo de pareamento.

## Resumo

- O caminho do botão ao jogo passa por driver do kernel, subsistema de input e Steam Input.
- Os nós `/dev/input/event*` são a leitura crua dos eventos de hardware.
- Controles modernos expõem giroscópio, gatilhos analógicos, touchpad e rumble, não só botões.
- O protocolo HID permite que a maioria dos controles funcione sem driver proprietário.
- USB oferece latência menor e carregamento; Bluetooth oferece conveniência sem fio.
- Erros são quase sempre de mapeamento (Steam Input), não de conexão física.

## Exercícios

1. Com o controle desconectado, liste `/dev/input` e conte quantos nós `event*` existem. Conecte o controle por USB e liste de novo — quantos novos apareceram?
2. Rode `lsusb` e localize a linha do seu controle. Anote o par `ID xxxx:xxxx` (IDs de vendedor e produto) e pesquise a que fabricante pertencem.
3. Identifique, com `ls /dev/input/by-id`, qual `event*` corresponde ao seu controle usando o sufixo legível do caminho.
4. Conecte o controle por Bluetooth e depois por USB. Anote em qual deles a latência *parece* menor e explique por quê antes de ler o capítulo sobre latência.
5. **Desafio.** Sem consultar a seção 5, tente descobrir sozinho qual comando lê os eventos brutos de um nó `/dev/input/event*` digitando `cat /dev/input/eventX` e observando a saída ilegível. O que essa saída binária sugere sobre o formato dos eventos?
