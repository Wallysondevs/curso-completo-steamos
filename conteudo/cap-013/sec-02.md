O perfil por jogo é a ferramenta mais poderosa que o Steam Deck oferece para quem quer controlar consumo, temperatura e fluidez de forma seletiva. Em vez de castigar ou liberar a máquina inteira, você cria regras sob medida para um único título, acessando as *Propriedades* dele no Modo Jogo. Nesta seção você acompanha, na prática, a criação do primeiro perfil individual — do acesso à gravação do ajuste em disco.

:::objetivos
- Acessar as Propriedades de um jogo no Modo Jogo
- Criar e nomear um perfil de desempenho individual
- Entender os campos de TDP, GPU e FPS disponíveis por jogo
- Confirmar no terminal que o ajuste foi realmente gravado
- Evitar os erros comuns de quem edita o perfil errado
:::

## O caminho até as Propriedades

No Modo Jogo, cada título instalado aparece na biblioteca com um botão de contexto. Para criar um perfil individual, o caminho é: selecione o jogo, abra o menu de contexto (botão **...** ou o ícone de engrenagem), e escolha **Propriedades**. Lá dentro existe uma aba dedicada a **Desempenho** — ou, em versões mais recentes do SteamOS, a opção **Perfil de desempenho**.

A gravação do perfil não depende de nada que você rode no terminal, mas o resultado dela é verificável em disco. Os ajustes de desempenho por jogo são armazenados na pasta de configuração local do usuário Steam, dentro de `~/.local/share/Steam/userdata/<ID>/config/localconfig.vdf`, um arquivo grande que centraliza o estado por usuário e por AppID.

## Descobrindo seu ID de usuário Steam

Antes de inspecionar o perfil, você precisa saber qual é o seu ID de usuário Steam — a pasta numérica dentro de `userdata`. É um diretório por conta logada:

```terminal
$ ls ~/.local/share/Steam/userdata/
182745653
```

Nesse exemplo existe uma única conta, com ID `182745653`. Se houver mais de uma pessoa logada no Deck, você verá vários números, um por conta. O perfil por jogo fica dentro da pasta do usuário que o criou, não num lugar global — logo, cada conta tem os seus próprios perfis.

## Localizando o arquivo de configuração local

O `localconfig.vdf` é onde o Steam grava o estado local da conta, incluindo preferências por AppID. Encontrar referências ao jogo ali é a prova de que o perfil foi salvo. Use `grep` para procurar o AppID do título que você configurou (aqui, um exemplo real de AppID popular):

```terminal
$ grep -n "1730680" ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf | head -5
3241:				"1730680"
3314:					"PerformanceProfile"		"1"
```

O `grep -n` mostra o número da linha seguido do conteúdo. A primeira ocorrência (`"1730680"`) é o bloco do jogo; a segunda (`"PerformanceProfile"`) indica que existe um perfil de desempenho salvo para aquele AppID. O valor `"1"` pode significar que o perfil está ativo ou que um modo específico foi escolhido — a interpretação exata depende da versão do cliente.

## O que dá para configurar por jogo

O painel de desempenho por jogo expõe um conjunto de controles que, no fundo, são os mesmos do global, mas aplicados só ao título. Os principais:

| Controle | O que faz | Custo típico |
|---|---|---|
| Limite de TDP (W) | Teto de energia do SoC | Menos TDP = mais bateria, menos desempenho |
| Clock da GPU (MHz) | Frequência máxima da GPU | Fixa alto em jogos leves para estabilidade |
| Limite de FPS | Teto de quadros por segundo | 30/40/60 fps mudam calor e consumo |
| FSR / upscaling | Renderização em resolução menor | Ganho de FPS com perda sutil de nitidez |
| Perfil do ventilador | Curva de fan (SteamOS 3.5+) | Antigo vs novo controle de rotação |

Cada um desses campos, quando alterado no perfil individual, vira uma entrada dentro do bloco daquele AppID no `localconfig.vdf`.

:::dica
Ao criar o primeiro perfil, anote mentalmente os três valores que mais mudam o resultado: **TDP**, **limite de FPS** e **FSR**. Dominar esses três cobre a grande maioria dos casos práticos do Deck.
:::

## Conferindo a estrutura gravada

Abrir um trecho do `localconfig.vdf` mostra como a Valve aninha o perfil dentro do bloco do jogo. O arquivo é extenso, então filtre pelo AppID e algumas linhas ao redor com `grep -A`:

```terminal
$ grep -A 20 '"1730680"' ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf | head -22
				"1730680"
				{
					"LastPlayed"		"1736123456"
					"Playtime"		"18420"
					"PerformanceProfile"
					{
						"fpsLimit"		"40"
						"tdpLimit"		"10"
					}
				}
```

Aqui o perfil do jogo `1730680` guarda duas chaves: `fpsLimit` em `40` e `tdpLimit` em `10`. É a tradução em disco exatamente do que você marcou na interface — prova de que o perfil por jogo não é "mágica", mas um conjunto de pares chave/valor que o cliente lê na hora de abrir o título.

:::atencao
Não edite o `localconfig.vdf` à mão enquanto o Steam está aberto. O cliente mantém esse arquivo na memória e grava por cima ao sair; qualquer mudança sua será sobrescrita, e um formato quebrado pode fazer o Steam ignorar configurações silenciosamente. Trate-o como somente leitura para inspeção.
:::

## Resumo

- O perfil por jogo é criado em **Propriedades → Desempenho** no Modo Jogo, não na tela inicial.
- Cada conta Steam tem sua própria pasta em `~/.local/share/Steam/userdata/<ID>/`, e os perfis ficam ali.
- O `localconfig.vdf` centraliza o estado local, com um bloco por AppID incluindo o `PerformanceProfile`.
- TDP, clock de GPU, limite de FPS e FSR são os quatro controles que mais impactam o resultado por jogo.
- Os ajustes viram pares chave/valor no VDF, como `"fpsLimit" "40"` e `"tdpLimit" "10"`.

## Exercícios

1. No Modo Jogo, abra as **Propriedades** de um jogo instalado e localize a aba de desempenho. Liste os sliders disponíveis.
2. Descubra o seu ID de usuário com `ls ~/.local/share/Steam/userdata/` e registre quantas contas existem.
3. Crie um perfil simples para um jogo (por exemplo, limite de 40 FPS) e confirme com `grep -n "<AppID>" .../localconfig.vdf` que a chave `PerformanceProfile` apareceu.
4. Compare o bloco do jogo configurado com o de um jogo sem perfil. Que chaves existem num e não no outro?
5. **Desafio.** Abra o `localconfig.vdf`, encontre o bloco de um jogo qualquer e identifique três campos que **não** são de desempenho (ex.: `LastPlayed`, `Playtime`). Explique por que esses campos também estão ali, relacionando com o que você aprendeu sobre o formato VDF na [seção 1](#/cap-013/sec-01).
