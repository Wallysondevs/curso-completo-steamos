Quando você instala um jogo de Windows no Steam Deck e ele simplesmente abre, existe uma pilha inteira de software trabalhando por baixo para que aquilo aconteça. O nome que resume essa pilha é **Proton**, e o sistema que a entrega de forma transparente para você é o **Steam Play**. Esta seção estabelece os dois conceitos e separa o que é um do outro, porque confundir os dois é o erro mais comum de quem começa a mexer com compatibilidade no Linux.

:::objetivos
- Definir Proton e Steam Play e distinguir os dois conceitos
- Entender por que rodar jogos Windows no Linux é um problema difícil
- Identificar a origem Valve/CodeWeavers da tecnologia
- Localizar onde o Proton vive no sistema de arquivos
- Reconhecer a relação entre Proton e o projeto Wine
:::

## Dois nomes para coisas diferentes

Steam Play e Proton não são sinônimos. **Steam Play** é o nome comercial do recurso do cliente Steam que permite comprar um jogo uma vez e rodá-lo tanto no Windows quanto no Linux — antes dele, a biblioteca Linux era separada, e títulos como *Team Fortress 2* exigiam uma versão nativa. **Proton** é o componente técnico: uma distribuição modificada do Wine, mantida pela Valve em parceria com a CodeWeavers, que traduz as chamadas do Windows para o Linux.

No Steam Deck, quando você aperta *Jogar*, o cliente consulta uma configuração que define qual ferramenta de compatibilidade será usada. Essa ferramenta é o Proton (ou uma de suas versões, como Proton Experimental, Proton GE ou Proton Hotfix). O Steam Play é o guarda-chuva: a política que decide que, por padrão, qualquer jogo Windows pode ser tentado no Linux, com ou sem garantia oficial.

A distinção prática aparece todo dia: você pode ativar ou desativar o Steam Play globalmente nas configurações, e pode trocar o Proton de cada jogo individualmente. Desligar o Steam Play mas deixar o Proton instalado faz o Steam ignorar a compatibilidade para títulos sem versão nativa.

## Por que não é só "instalar e rodar"

Um jogo feito para Windows não é um arquivo neutro. Ele faz três tipos de exigência que o Linux não atende nativamente:

- **Chamadas de sistema e de API.** Um executável `.exe` pede coisas ao kernel usando o formato PE (Portable Executable) e chama bibliotecas como `kernel32.dll`, `user32.dll` e `gdi32.dll`. O Linux não entende o formato PE e não tem essas DLLs.
- **Gráficos.** Jogos modernos falam Direct3D (D3D9, D3D11, D3D12), uma API da Microsoft. O Linux tem OpenGL e Vulkan. Alguém precisa traduzir uma para a outra.
- **Áudio e entrada.** Muitos jogos dependem de XAudio2, DirectSound e de serviços como o Steamworks. Esses componentes também precisam ser emulados ou substituídos.

O Proton ataca os três problemas de uma vez, combinando vários projetos num pacote único que veremos em detalhe nas próximas seções. A primeira parada é o Wine, a camada que resolve as chamadas de sistema.

## Um primeiro olhar no sistema

Você pode confirmar que o Proton está instalado e qual versão o seu Steam deck conhece com poucos comandos. O diretório padrão guarda uma ou mais versões do Proton:

```terminal
$ ls ~/.steam/steam/steamapps/common/Proton* -d
/home/ana/.steam/steam/steamapps/common/Proton 9.0
/home/ana/.steam/steam/steamapps/common/Proton Experimental
/home/ana/.steam/steam/steamapps/common/Proton Hotfix
```

Cada pasta é uma árvore completa: contém o executável `proton`, o binário do Wine modificado, as bibliotecas DXVK e VKD3D e os scripts de configuração. A própria Valve empacota o Proton com um executável de linha de comando, útil para diagnóstico:

```terminal
$ ~/.steam/steam/steamapps/common/Proton\ 9.0/proton --version
Proton: 9.0-4
Steam Runtime Version: sniper 0.20250303.110000
Wine version: wine-9.0
```

Essa saída já conta uma história: o Proton 9.0-4 empacota um Wine 9.0 sobre o Steam Runtime "sniper", o ambiente de bibliotecas Linux isolado que a Valve monta para que o jogo não dependa do que está (ou não está) instalado no sistema base. O `proton --version` é o comando mais útil para saber exatamente o que está rodando antes de investigar qualquer falha.

:::nota
O Proton vive dentro de `~/.steam/steam/steamapps/common/`, o mesmo lugar onde os jogos são baixados. Isso significa que, ao trocar de unidade ou reinstalar o Steam, o Proton pode precisar ser baixado de novo. O Steam trata o Proton como um "jogo" interno invisível: ele tem um `appid` próprio e aparece em listas de conteúdo baixado.
:::

## A linhagem Valve + CodeWeavers

O Proton não nasceu do nada. Em 2013, a Valve anunciou o SteamOS e iniciou um investimento pesado em Linux para jogos. Em paralelo, a **CodeWeavers** — empresa que comercializa o CrossOver, uma versão polida do Wine — se tornou a principal contribuidora comercial do projeto Wine. A Valve contratou a CodeWeavers para trabalhar em Wine e em tecnologias adjacentes, e dessa colaboração surgiu o Proton.

O resultado é uma relação de mão dupla: boa parte do trabalho feito para o Proton volta para o Wine *upstream*, beneficiando também quem usa Wine puro. Muitos patches do Proton (melhorias em Direct3D, correções de anti-cheat, suporte a fontes e codecs) chegam ao Wine principal depois de amadurecerem na versão da Valve.

```terminal
$ wine --version
wine-9.0
```

Rodar `wine --version` direto no terminal mostra o Wine do sistema, que no SteamOS costuma ser bem mais antigo ou nem estar instalado. Vale notar a diferença: o Wine que interessa para jogos é o que vem **dentro** do Proton, não o pacote `wine` do repositório. Confundir os dois leva a diagnósticos errados, pois as versões e os patches são diferentes.

## Resumo

- Steam Play é o recurso comercial do Steam; Proton é a tecnologia de compatibilidade que o implementa.
- Proton resolve chamadas de sistema (Wine), gráficos (DXVK/VKD3D) e áudio (FAudio) num pacote só.
- O Proton fica em `~/.steam/steam/steamapps/common/Proton*`, com versões como 9.0, Experimental e Hotfix.
- `proton --version` revela a versão do Proton, do Wine empacotado e do Steam Runtime.
- O Proton é fruto da parceria entre Valve e CodeWeavers, e contribui de volta para o Wine upstream.

## Exercícios

1. Rode `ls ~/.steam/steam/steamapps/common/Proton* -d` e liste quantas e quais versões de Proton estão instaladas na sua máquina.
2. Escolha uma versão instalada e execute `<caminho>/proton --version`. Anote a versão do Proton, do Wine e do Steam Runtime exibidas.
3. Verifique se o Wine está instalado fora do Proton com `wine --version` e compare o número de versão com o Wine empacotado no Proton.
4. Nas configurações do Steam, confirme se o Steam Play está ativado e anote qual é a versão de Proton selecionada como padrão global.
5. **Desafio.** Explique, em um parágrafo, por que um jogo pode não abrir mesmo quando `wine --version` no terminal mostra uma versão "normal" do Wine instalada. Relacione sua resposta com a diferença entre o Wine do sistema e o Wine dentro do Proton.
