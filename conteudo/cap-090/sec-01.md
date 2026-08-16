A garantia do Steam Deck é um contrato entre você e a Valve, e conhecer seus limites evita tanto expectativas erradas quanto desperdício de tempo: nem todo defeito é coberto, e nem toda abertura de chamado termina em troca. Entender o que a política cobre — e o que explicitamente fica de fora — é o primeiro filtro antes de gastar horas diagnosticando ou enviando o aparelho.

:::objetivos
- Entender o que a garantia limitada da Valve cobre e por quanto tempo
- Distinguir defeito de fabricação de dano causado pelo uso
- Identificar o que a política exclui da cobertura
- Saber onde a documentação oficial está e como lê-la
:::

## A garantia limitada da Valve

O Steam Deck vem com uma **garantia limitada** de hardware, não uma garantia total. De modo geral, ela cobre defeitos de fabricação e de materiais por um período que começa na data da compra (ou da entrega, conforme a região), com duração que varia por país — no Brasil e na União Europeia, por exemplo, legislação local estende prazos e direitos além do que a Valve oferece voluntariamente em outros mercados.

O ponto central: a garantia é contra **defeito de fábrica**, não contra acidente. Se a tela trincou porque o aparelho caiu, se a porta USB-C quebrou por esforço lateral ou se houve entrada de líquido, o problema é classificado como dano do usuário e normalmente não entra na cobertura.

```terminal
$ cat /etc/os-release | grep VERSION
VERSION="3.6.20"
```

Consultar a versão do sistema é útil porque boa parte dos defeitos "de fabricação" relatados são, na verdade, problemas de software corrigíveis por atualização. A Valve tende a pedir que você esteja na versão estável mais recente antes de autorizar um RMA.

## O que costuma ser coberto

Há categorias clássicas de defeito de fábrica que a política cobre na prática, e conhecê-las ajuda a enquadrar seu caso. Defeito de tela (pixels mortos além do limiar, backlight apagado, linhas verticais) que aparece sem impacto físico, bateria que incha ou perde capacidade anormalmente cedo, botões que param de registrar toque, gatilhos/gatilhos analógicos que não zeram ou não alcançam o valor máximo, e falha de componentes internos (SSD, ventoinha, placa-mãe) costumam entrar na cobertura quando não há sinal de mau uso.

```terminal
$ systemctl --version
systemd 255 (255.4-1-arch)
```

Antes de concluir que o botão está morto, o teste pelo software vale a pena: um botão que não responde no jogo pode ser problema de mapeamento ou de driver, não de hardware. Essa distinção é o que separa um chamado aceito de um retorno desnecessário.

:::nota
A Valve também incorpora, em alguns mercados, a chamada "garantia legal" imposta por lei local (como o CDC no Brasil ou a diretiva europeia de bens de consumo). Ela é irrenunciável e pode cobrir situações além da garantia contratual — guarde a nota fiscal.
:::

## O que fica de fora

A lista de exclusões é longa, mas os itens que mais derrubam chamados são previsíveis: dano por queda, impacto ou pressão, entrada de líquido, abertura do aparelho com dano aos lacres ou ao hardware interno, modificação física (troca de SSD que quebrou um conector, por exemplo), desgaste natural de peças de consumo e dano por uso de carregadores ou docas fora de especificação.

```terminal
$ ls -l /sys/class/power_supply/
total 0
lrwxrwxrwx 1 root root 0 Feb 20 10:00 AC -> ../../devices/platform/...
lrwxrwxrwx 1 root root 0 Feb 20 10:00 BAT1 -> ../../devices/platform/...
```

O registro do estado da bateria, acessível pelo sistema, pode revelar se uma "bateria viciada" é desgaste natural ou defeito precoce. Um aparelho com poucos ciclos e capacidade já degradada é candidato forte a RMA; um com centenas de ciclos, não.

:::atencao
Trocar o SSD do Steam Deck **não** anula a garantia por si só — a Valve apoia essa troca — mas dano causado durante o procedimento sim fica de fora. A regra de ouro: qualquer modificação é permitida desde que não cause o defeito relatado.
:::

## Onde ler a política oficial

A fonte da verdade é a página da Valve, não resumos de terceiros. Os termos variam por região e por data de compra, então o texto que vale é sempre o vigente no seu país na data da nota.

```terminal
$ curl -s https://store.steampowered.com/hardware | grep -i warranty
```

Acesse diretamente o **Hardware Warranty** na central de suporte Steam (`help.steampowered.com`), selecionando Steam Deck e depois a opção de garantia. Lá estão prazos, exceções e o passo a passo para iniciar um pedido.

## Resumo

- A garantia limitada cobre defeitos de fabricação e de materiais, não dano causado pelo uso.
- O prazo começa na data da compra e pode ser estendido por lei local (CDC, diretiva europeia).
- Defeitos de tela, bateria, botões e componentes internos sem sinal de mau uso são os casos típicos cobertos.
- Queda, líquido, abertura com dano e carregadores fora de especificação estão entre as exclusões mais comuns.
- A documentação oficial está na central de suporte da Steam, e vale sempre o texto do seu país e data de compra.

## Exercícios

1. Acesse `help.steampowered.com` e localize a página de garantia do Steam Deck para o seu país. Anote o prazo de cobertura exibido.
2. Descreva, em duas frases, por que "defeito de fabricação" e "dano acidental" são tratados de forma diferente, citando um exemplo de cada.
3. Rode `cat /etc/os-release | grep VERSION` e confirme se você está na versão estável mais recente; explique por que isso importa antes de um chamado.
4. Liste no mínimo três situações de exclusão da garantia previstas pela política que você leu.
5. **Desafio.** Suponha que sua bateria degradou 40% de capacidade em 6 meses de uso leve. Usando o que viu em seções anteriores sobre leitura de bateria, proponha uma sequência de comandos para reunir evidência objetiva (ciclos, capacidade) que justifique um pedido de RMA.
