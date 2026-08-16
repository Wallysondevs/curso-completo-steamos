Até aqui, cobrimos acessibilidade **global** — opções que valem para o sistema inteiro. Mas o cenário real é mais fino: cada jogo tem suas próprias necessidades, e o SteamOS permite criar configurações de entrada **por jogo**, que sobrescrevem as globais só quando aquele título está rodando. É o que separa um perfil genérico de uma experiência acessível verdadeiramente adaptada a *cada* título da biblioteca.

:::objetivos
- Entender a hierarquia de perfis do Steam Input (global × por jogo)
- Criar e salvar um perfil de acessibilidade específico de um jogo
- Reaproveitar o mesmo perfil entre jogos semelhantes
- Identificar onde os perfis por jogo são persistidos no disco
- Usar opções de acessibilidade internas dos jogos em conjunto com as do SteamOS
:::

## A hierarquia de configurações

O Steam Input tem três camadas de configuração, em ordem crescente de especificidade:

1. **Perfil global** — vale para todos os jogos que não têm um perfil próprio.
2. **Perfil por controle** — vale para um controle específico (ex.: o seu Adaptive Controller), independentemente do jogo.
3. **Perfil por jogo** — vale para um par "jogo + controle", e é o que realmente importa para acessibilidade fina.

Quando você abre um jogo e entra na configuração de entrada pelo menu Steam, está editando o perfil da camada 3. As alterações valem **só para aquele jogo**, e o jogo volta ao comportamento global assim que é fechado.

A lógica de resolução é: o Steam aplica o perfil por jogo se existir; senão, cai para o por controle; senão, o global. Saber essa ordem evita a frustração de "configurei no jogo A e mudou no jogo B" — isso só aconteceria se você tivesse editado a camada global por engano.

## Criando um perfil por jogo

O fluxo no Modo Jogo: com o jogo aberto, pressione `[[Steam]]` → **Configuração de Controle** (ou *Controller Settings*). Ali você edita o mapeamento e, ao voltar, o perfil é salvo automaticamente associado àquele app.

Os perfis por jogo são gravados no disco, dentro do diretório de configuração do Steam, associados ao `appid` do título. Você pode localizá-los:

```terminal
$ find ~/.local/share/Steam/userdata -type f -name "*.vdf" -path "*controller*" | head -5
/home/user/.local/share/Steam/userdata/471066905/controller_config/1086940/config.vdf
/home/user/.local/share/Steam/userdata/471066905/controller_config/22380/config.vdf
```

Cada arquivo `config.vdf` corresponde a um jogo. O número da pasta (ex.: `1086940`) é o **AppID** do jogo na Steam — no caso, um título específico. Para ver o conteúdo de um perfil e confirmar que ele guarda o mapeamento (não apenas um vazio), você pode inspecionar o arquivo:

```terminal
$ head -12 ~/.local/share/Steam/userdata/471066905/controller_config/1086940/config.vdf
"controller_config"
{
	"version"		"3"
	"revision"		"12"
	"mode"
	{
		"id"		"0"
		"name"		"gamepad_with_trackpad"
		"input_source"		"0"
	}
	"bindings"
}
```

O cabeçalho mostra a `version` do esquema do perfil e o **nome do template-base** usado (`gamepad_with_trackpad`, o padrão do Steam Deck com trackpads). A presença de um bloco `bindings` é o que indica mapeamentos personalizados — se ele estivesse vazio, o jogo estaria usando puramente o template.

Cruzando nomes e AppIDs, conte quantos jogos têm perfil próprio:

```terminal
$ ls ~/.local/share/Steam/userdata/471066905/controller_config/ | wc -l
12
```

O `471066905` é o identificador numérico do usuário `deck` (o SteamID64). Na sua instalação esse número varia. O `12` aqui indica doze jogos com configuração de controle individual.

## Reaproveitando perfis entre jogos

Configurar acessibilidade jogo a jogo pode ser repetitivo. O Steam Input resolve com **templates** (modelos): um perfil pode ser salvo como template e depois aplicado a quantos jogos você quiser.

Na tela de configuração de controle, a opção **Exportar perfil** (ou *Save as personal template*) guarda o mapeamento atual como um modelo reutilizável. Depois, em outro jogo, **Importar perfil → Personalizados** aplica esse mesmo modelo.

:::dica
Se você joga vários títulos do mesmo gênero (ex.: vários FPS ou vários jogos de plataforma), configure um template de acessibilidade por gênero: "FPS — zona morta 30%, toggle correr, recarregar no R4". Depois basta importar e fazer pequenos ajustes por jogo, em vez de recomeçar do zero a cada título.
:::

## Opções internas dos jogos × SteamOS

O Steam Input é só metade da história. A outra metade está **dentro** dos jogos, nas configurações de acessibilidade próprias de cada título. Jogos como *The Last of Us Part I* e *God of War Ragnarök* trazem menus dedicados com dezenas de opções: contraste de HUD, auxílio de mira, legendas ampliadas, avisos visuais para sons.

A boa prática é **combinar** as duas frentes sem conflito:

- **Cores/contraste** → prefira as opções do jogo quando existirem (elas sabem o que é HUD crítico); senão use os filtros globais do SteamOS.
- **Botões/entrada** → use o Steam Input para remapeamento físico e toggles, e as opções do jogo para auxílios de mira e reação.
- **Texto/legendas** → aumente no jogo; o redimensionamento do SteamOS não mexe no texto renderizado pelo motor do jogo.

:::atencao
Nunca ative simultaneamente um filtro de cor no SteamOS **e** o modo de daltonismo do jogo — as matrizes se acumulam e o resultado será incorreto, como já vimos na seção de filtros. Escolha um e desligue o outro. É o erro de acessibilidade mais comum entre jogadores de PC que migram para o deck.
:::

## Acessibilidade que depende do jogo, não do deck

Existem limites claros. O SteamOS não consegue, por exemplo, aumentar a legenda de um jogo se o jogo não expõe essa opção — o texto do jogo é desenhado pelo motor dele, fora do controle do compositor. O mesmo vale para auxílios de mira e `hitmarkers` sonoros.

Por isso, parte da acessibilidade no Modo Jogo é saber **avaliar rapidamente** o que um título oferece antes de investir no perfil. Um bom hábito: ao instalar um jogo novo, abra primeiro o menu de opções → Acessibilidade (o jogo) e catalogue o que existe — depois construa o perfil do Steam Input em torno disso.

## Resumo

- O Steam Input resolve perfis em três camadas: global, por controle e por jogo (da menos à mais específica).
- Perfis por jogo ficam em `userdata/<id>/controller_config/<appid>/config.vdf`, um por título configurado.
- Templates permitem exportar um perfil de acessibilidade e importá-lo em outros jogos.
- Combine opções internas do jogo (cores, legendas) com Steam Input (botões, toggles), evitando sobreposição.
- O SteamOS não altera texto/legenda renderizada pelo motor do jogo — isso depende exclusivamente do título.

## Exercícios

1. Liste seus perfis por jogo com `ls ~/.local/share/Steam/userdata/*/controller_config/` e identifique, pelo AppID, a quais jogos cada perfil corresponde.
2. Abra um jogo, crie um perfil com uma mudança simples (ex.: remapear pulo para R4) e feche. Confirme que um novo `config.vdf` apareceu.
3. Exporte esse perfil como template e importe-o em outro jogo. Verifique se o mapeamento foi replicado.
4. Num jogo com menu de acessibilidade interno, catalogue pelo menos cinco opções que ele oferece e liste quais delas se sobrepõem às capacidades do SteamOS.
5. **Desafio.** Monte um fluxo completo para um jogo FPS: filtro de cor (jogo OU SteamOS, sem acumular), toggle de correr via Steam Input, zona morta ajustada e legendas ampliadas no jogo. Justifique em que camada cada ajuste foi feito e por que não há conflito.