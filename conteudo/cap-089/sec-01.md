Um Steam Deck funciona perfeitamente de fábrica, mas existe uma razão forte para mexer na aparência dele: a interface do Steam e a carcaça física são duas coisas que você vê todos os dias, por horas. Trocar um tema, um conjunto de botões ou o próprio case não muda o desempenho do aparelho, mas muda a sua relação com ele — e, bem feito, comunica algo sobre o seu uso. Esta seção abre o capítulo desenhando o mapa: onde cada tipo de personalização atua, o que é superficial e o que exige abrir o aparelho.

:::objetivos
- Mapear os três eixos de personalização (software, botões e case)
- Distinguir mudança reversível de mudança definitiva
- Entender o que são skins e como elas se diferenciam de temas de navegador
- Conhecer as ferramentas que o curso usará (Decky Loader, CSS Loader)
- Avaliar o risco de cada intervenção antes de começar
:::

## Três eixos, três níveis de risco

Toda personalização do Steam Deck cabe em três caixas, cada uma com um custo de reversão diferente.

**Eixo do software.** São as skins — temas visuais que alteram a aparência do menu, das cores, dos ícones e da tipografia do Steam. Ficam inteiramente no disco, não exigem abrir nada e são reversíveis em segundos: desinstalar ou desativar a skin devolve a interface original. É o ponto de entrada natural.

**Eixo dos botões.** Os botões frontais (A/B/X/Y, direcionais, gatilhos) e os *grips* podem ser trocados por versões de outra cor, relevo ou material. Exigem abrir o aparelho, mas não tocam em componentes eletrônicos sensíveis — a troca é mecânica, com parafusos e encaixes.

**Eixo do case.** A carcaça traseira (ou o shell inteiro) pode ser substituída por um case transparente, de outra cor ou com melhor grip. É a intervenção mais profunda: exige desconectar cabos, remover o dissipador em alguns modelos e trabalhar perto da bateria. Errar aqui tem custo real.

Não existe uma ordem obrigatória, mas a ordem natural — software, botões, case — coincide com a ordem de risco crescente. O curso segue essa sequência.

:::info
O Steam Deck original (LCD), o OLED e o modelo de 2024 têm parafusos, encaixes e conectores diferentes. Um case comprado para o LCD **não** encaixa no OLED. Confirme sempre o modelo exato antes de comprar peça física; o comando abaixo diz qual é o seu.

```terminal
$ cat /sys/devices/virtual/dmi/id/product_name
Steam Deck
$ cat /sys/devices/virtual/dmi/id/board_name
Jupiter
$ cat /proc/cpuinfo | grep -m1 "model name"
model name	: AMD Custom APU 0405
```

`Jupiter` identifica a primeira geração; o modelo OLED e o de 2024 aparecem como placas diferentes (`Galileo` e sucessoras). Guarde essa saída antes de encomendar qualquer peça.
:::

## O que é exatamente uma "skin"

A palavra *skin* virou guarda-chuva, então vale separar o joio do trigo. No contexto do SteamOS, uma skin é um conjunto de **regras de CSS** aplicadas sobre a interface do Steam no modo jogo, somadas a imagens (papéis de parede, ícones, texturas) e, às vezes, pequenos ajustes de comportamento. Nada disso altera binários do sistema: a skin "pinta por cima" do layout que a Valve entrega.

Isso é diferente de três outras coisas que costumam ser confundidas com skin:

- **Tema de navegador.** O Steam também roda no modo desktop como aplicativo; temas de navegador ou do KDE não tocam no modo jogo.
- **Papel de parede do modo desktop.** É só uma imagem de fundo do KDE Plasma, não uma skin.
- **Mod de jogo individual.** Alguns jogos aceitam *workshop* de skins próprias; isso é do jogo, não do aparelho.

A skin do SteamOS age globalmente: uma vez ativa, tudo no modo jogo — biblioteca, perfil, configurações — herda o visual. E, porque é tudo CSS, ela é frágil a atualizações do Steam: quando a Valve muda o nome de uma classe ou o DOM da interface, skins feitas para a versão anterior quebram em detalhes. Isso explica por que o gerenciamento correto importa mais do que baixar qualquer tema bonito da internet.

```terminal
$ ls ~/.local/share/Steam/skins 2>/dev/null
skin-audioloader  skin-classic  skin-default
```

Numa instalação padrão pode não existir a pasta `skins` ainda; ela é criada na primeira vez que você instala uma skin via ferramenta. O diretório `~/.local/share/Steam` é onde o cliente Steam guarda os temas no modo desktop, mas no Steam Deck a gestão de skins do **modo jogo** passa por outro caminho — o plugin de que as próximas seções tratam.

## Por onde entra a personalização: Decky Loader e CSS Loader

O Steam, por padrão, não expõe uma loja de skins para o modo jogo. Para instalar e alternar temas com um menu bonito, a comunidade construiu em cima de uma peça chamada **Decky Loader**: um carregador de plugins que se acopla ao Steam e adiciona um menu próprio (`...`) dentro da interface. Dentro do Decky, o plugin mais usado é o **CSS Loader**, que aplica as skins.

Pense no Decky como o "sistema operacional" dos plugins e no CSS Loader como um "aplicativo" dentro dele. Sem o Decky, você aplicaria CSS na mão, editando arquivos e conferindo IDs a cada atualização do Steam — possível, porém frágil. O Decky abstrai isso e ainda carrega uma série de outros plugins úteis (monitor de FPS, ajuste de brilho, troca de capa de jogo).

Para ter uma ideia do que já está instalado no seu aparelho antes de qualquer mudança, dá para perguntar diretamente ao cliente Steam qual versão ele roda e se alguma personalização de terceiros já foi parar no diretório de dados do usuário:

```terminal
$ steam -version 2>/dev/null | head -1
Steam Version: 1738026274
$ ls ~/.local/share/Steam 2>/dev/null | head -8
appcache
config
logs
shadercache
skins
steamui
userdata
```

A pasta `skins` na lista acima — caso exista — é o indício de que alguma skin já foi aplicada no modo desktop. O restante do capítulo desloca essa personalização para o modo jogo, onde o CSS Loader assume.

:::atencao
O Decky Loader e seus plugins são **software de terceiros**, não suportados pela Valve. Uma atualização grande do Steam pode temporariamente quebrar o Decky até a comunidade corrigir. Isso raramente trava o aparelho, mas pode derrubar o menu de plugins. Não é motivo para pânico — é só o preço de personalizar por fora do que a Valve oferece.
:::

A instalação do Decky é o tema das próximas seções. Por ora, guarde a cadeia de responsabilidades:

```text
[ Steam (modo jogo) ] --carrega--> [ Decky Loader ] --carrega--> [ CSS Loader ] --aplica--> [ skins ]
```

## Riscos e quanto você está disposto a gastar

Antes de qualquer ferramenta, vale fixar duas verdades que o resto do capítulo assume como base.

Primeira: **personalização de software é essencialmente segura**. O pior cenário prático é uma skin quebrada que deixa o menu ilegível até você desativá-la — e há caminho de recuperação, detalhado adiante.

Segunda: **personalização física anula ou limita a garantia**. A Valve não cobre danos causados por você ao abrir o aparelho, e em alguns mercados a simples remoção do selo/parafuso original sinaliza abertura. Trocar botões pode ser reversível; trocar o case inteiro, na prática, não é — e um deslize com o conector da bateria ou do display muda um hobby barato num prejuízo caro.

O bom senso que fecha esta seção: comece pelo software, acostume-se com a estética que você quer, e só depois considere abrir o aparelho. Muita gente descobre que uma skin bem escolhida já resolve 90% da vontade de "deixar do meu jeito".

## Resumo

- A personalização se divide em software (skins), botões e case, nessa ordem crescente de risco.
- Skin é um conjunto de CSS + imagens aplicado por cima da interface do modo jogo, sem alterar binários.
- Skin difere de tema de navegador, papel de parede do KDE e mod de jogo individual.
- O Decky Loader carrega plugins; o CSS Loader é o plugin que aplica skins no modo jogo.
- O modelo do aparelho (LCD `Jupiter` vs. OLED `Galileo`) define quais peças físicas são compatíveis.
- Personalização física anula ou limita a garantia; a de software é essencialmente reversível.

## Exercícios

1. Rode o comando que identifica o modelo do seu aparelho e anote o valor de `board_name`. Cruze com a ficha técnica para saber se é LCD ou OLED.
2. Liste o conteúdo de `~/.local/share/Steam` e verifique se a pasta `skins` já existe na sua instalação. Se não, crie mentalmente o fluxo de como ela surgiria.
3. Abra o modo jogo e o modo desktop. Escreva em uma frase qual dos dois é afetado pelas skins do CSS Loader e por quê.
4. Pesquise (no navegador) duas skins populares de Steam Deck e anote se elas declaram compatibilidade com a sua versão atual do Steam.
5. **Desafio.** Sem instalar nada ainda, explique — a partir da cadeia Steam → Decky → CSS Loader → skins — por que uma atualização do Steam é o evento mais provável de quebrar uma skin, e não uma atualização do sistema de arquivos.
