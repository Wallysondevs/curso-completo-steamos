O Steam Deck não se comporta da mesma forma em todos os jogos, e forçar um único ajuste de TDP, GPU ou FPS para o aparelho inteiro é uma receita de bateria desperdiçada e de desempenho que não chega onde deveria. A Valve resolve isso com uma hierarquia de configurações: existe um **perfil global**, que vale para todos os jogos, e existe o **perfil por jogo**, que sobrescreve o global só naquele título específico. Entender onde cada ajuste mora é o primeiro passo para tirar o máximo do Steam Deck sem travar o sistema inteiro.

:::objetivos
- Distinguir perfil global de perfil por jogo no Modo Jogo
- Identificar onde cada tipo de configuração de desempenho vive no sistema
- Encontrar os arquivos `.vdf` que guardam esses ajustes no disco
- Entender por que o perfil global é o fallback do perfil individual
- Preparar o ambiente para criar perfis com segurança nas próximas seções
:::

## Onde os ajustes realmente moram

Tudo que você configura na interface do Steam — desde a sensibilidade do trackpad até o limite de TDP — acaba gravado em disco no formato **VDF** (*Valve Data Format*), um formato de texto chave/valor próprio da Valve. No SteamOS, a raiz da instalação do Steam fica em `~/.local/share/Steam`, e é lá que os arquivos mais importantes deste capítulo vivem.

```terminal
$ find ~/.local/share/Steam -name "*.vdf" 2>/dev/null | head -20
/home/deck/.local/share/Steam/config/loginusers.vdf
/home/deck/.local/share/Steam/config/config.vdf
/home/deck/.local/share/Steam/config/steamdeck.vdf
/home/deck/.local/share/Steam/steamapps/libraryfolders.vdf
/home/deck/.local/share/Steam/steamapps/compatdata/backup.vdf
```

O `find` percorre a árvore inteira do Steam e devolve só os arquivos que terminam em `.vdf`. O nome já entrega a função de cada um: `loginusers.vdf` guarda as contas, `config.vdf` as preferências do cliente, `libraryfolders.vdf` as pastas de jogos — e o `steamdeck.vdf` é justamente aquele que acumula configurações específicas do aparelho.

## O perfil global e o perfil por jogo

O **perfil global** é o conjunto de ajustes que vale para *qualquer* jogo que não tenha uma configuração própria. Ele é o alvo de qualquer mudança que você faz quando está na tela inicial do Modo Jogo, fora das propriedades de um título. Já o **perfil por jogo** é gravado dentro das *Propriedades* daquele jogo específico e, quando existe, manda no lugar do global só naquele contexto.

O conceito central é o de **fallback**: o Steam lê primeiro o perfil do jogo; se um ajuste não foi definido ali, ele cai para o valor global. Isso permite o truque clássico de quem usa o Deck intensamente — definir um teto conservador no global e afrouxar ou apertar só nos jogos que realmente precisam.

:::dica
Pense no perfil global como o "padrão de fábrica" da sua máquina, e no perfil por jogo como uma exceção. Definir um limite de TDP baixo no global economiza bateria em dezenas de títulos; você só sobe nos que pedem mais.
:::

## Inspecionando as configurações do aparelho

O SteamOS mantém configurações de desempenho espalhadas por arquivos que o cliente grava. O `steamdeck.vdf` concentra boa parte do que o Modo Jogo chama de "ajustes do sistema", e você pode conferir o conteúdo dele com `grep` para ver os campos reais que existem.

```terminal
$ grep -r "steamdeck" ~/.local/share/Steam/config 2>/dev/null | head -10
/home/deck/.local/share/Steam/config/steamdeck.vdf:"SteamDeck"		{"CustomControllerConfigsDir"		"/home/deck/.local/share/Steam/controller_base"}
/home/deck/.local/share/Steam/config/libraryfolder.vdf:"apps"		{"0"		{"name"		"Steam Deck Settings"}}
/home/deck/.local/share/Steam/config/config.vdf:"SkinRenderer"		"steamdeck"
```

O `grep -r` procura o termo `steamdeck` de forma recursiva na pasta `config` e mostra o arquivo, a chave e o valor. Repare na sintaxe do VDF: pares `"chave" "valor"` e blocos entre chaves `{ }`, sem vírgulas — uma estrutura bem diferente de JSON, embora pareça.

## Entendendo a estrutura do VDF na prática

Vale abrir um arquivo pequeno por inteiro para internalizar o formato antes de mexer nos perfis. O `libraryfolders.vdf` é um bom candidato porque mostra como a Valve aninha blocos e como identifica cada jogo por um **AppID** numérico.

```terminal
$ cat ~/.local/share/Steam/steamapps/libraryfolders.vdf
"libraryfolders"
{
	"0"
	{
		"path"		"/home/deck/.local/share/Steam"
		"label"		""
		"contentid"		"4120f2ea05d2a87d57e19ea5c927d496"
		"totalsize"		"512000000000"
		"apps"
		{
			"413080"		"1372721159380"
			"105600"		"42904"
			"570"			"125236"
		}
	}
}
```

As chaves numéricas (`413080`, `105600`, `570`) são AppIDs de jogos — no caso, exemplos de títulos instalados. É essa chave que o Steam usa para ligar cada jogo ao seu perfil de desempenho individual, como você verá nas próximas seções.

## A hierarquia em uma imagem mental

Quando você abre o menu **...** (botão de reticências) no Modo Jogo e navega até **Desempenho**, está editando o perfil global *se* veio da tela inicial; se entrou pelo menu do próprio jogo em execução (o *quick access* do game), está mexendo no perfil individual daquele título. Saber de onde você veio evita o erro mais comum: ajustar o global achando que está ajustando um jogo só, ou vice-versa.

:::atencao
O menu de desempenho aberto **de dentro de um jogo** pode estar editando o global ou o jogo dependendo do estado do seletor. Sempre confira o rótulo do topo do painel (que indica "Global" ou o nome do jogo) antes de salvar um ajuste.
:::

## Resumo

- Configurações do Steam ficam em arquivos `.vdf`, um formato de texto chave/valor da Valve, sob `~/.local/share/Steam`.
- O perfil global vale para todo jogo que não tem ajuste próprio; o perfil por jogo vale só para aquele título.
- O perfil por jogo sobrescreve o global por fallback: o valor do jogo é lido primeiro, e o global preenche o que faltar.
- `find ~/.local/share/Steam -name "*.vdf"` lista os arquivos de configuração; `grep -r "steamdeck"` acha os campos específicos do aparelho.
- `libraryfolders.vdf` liga AppIDs numéricos às pastas de jogos, chave que também ancora os perfis individuais.

## Exercícios

1. Rode `find ~/.local/share/Steam -name "*.vdf"` e liste em uma frase o papel provável de três dos arquivos encontrados.
2. Abra `~/.local/share/Steam/steamappi/libraryfolders.vdf` (ou `steamapps/libraryfolders.vdf`) e identifique quantos AppIDs aparecem no bloco `apps`.
3. Use `grep -r "TDP" ~/.local/share/Steam/config` e verifique se algum campo de limite de energia já aparece nos seus arquivos.
4. No Modo Jogo, abra o menu **...** na tela inicial e depois de dentro de um jogo. Anote quais opções aparecem em cada um e se o título do painel muda.
5. **Desafio.** Explique, com base no fallback global→jogo, o que acontece se você definir 30 FPS no global e 60 FPS no perfil de um jogo, jogar esse título, e depois abrir outro jogo sem perfil — que limite cada um respeita e por quê?
