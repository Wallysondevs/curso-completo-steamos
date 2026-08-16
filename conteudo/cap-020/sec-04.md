A bandeja do sistema — aquele canto com relógio, rede, volume, bateria e os ícones agrupados — é o termômetro do deck no Modo Desktop. É nela que você vê se o Wi-Fi caiu, se o áudio está mudo, quanto de bateria resta e quais serviços ficam rodando em segundo plano. Boa parte desses ícones não são imagens estáticas: são **applets** vivos, pequenos programas que reagem a cliques e exibem estado em tempo real.

:::objetivos
- Localizar os applets padrão da bandeja do SteamOS
- Expandir e recolher o grupo de ícones ocultos da bandeja
- Configurar quais ícones ficam sempre visíveis
- Usar o `qdbus` para inspecionar e controlar o Plasma pela bandeja
- Entender por que alguns ícones somem e como restaurá-los
:::

## O que vive na bandeja

A bandeja padrão do SteamOS agrupa, tipicamente:

- **Relógio digital** — hora e data, com calendário ao clicar.
- **Rede** — estado do Wi-Fi e das conexões.
- **Áudio** — volume e dispositivos de saída/entrada.
- **Bateria e brilho** — carga restante e controle de brilho da tela.
- **Notificações** — sino com a fila de avisos.
- **Dispositivos** — ícone de ejeção segura de mídia e cartão SD.

Os ícones de aplicativos que "minimizam para a bandeja" (como um cliente de mensagens) também aparecem aqui, escondidos atrás de uma seta que expande o agrupamento. Essa separação entre ícones **sempre visíveis** e **ocultos** é configurável.

Para ver o que o Plasma considera itens da bandeja do ponto de vista do processo, dá para inspecionar o shell em execução via D-Bus, o barramento de comunicação entre processos que o Plasma usa intensamente:

```terminal
$ qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.dumpCurrentLayoutJS
```

O método `dumpCurrentLayoutJS` despeja um arquivo JavaScript (`.js`) com o layout completo do shell — painéis, widgets e seus identificadores. A saída é enorme, então normalmente você a redireciona para um arquivo e busca o que interessa.

:::nota
`qdbus` é a ferramenta de linha de comando que fala com o D-Bus. No Plasma, quase tudo pode ser controlado por objetos D-Bus: o shell se expõe em `org.kde.plasmashell`, no caminho `/PlasmaShell`. Dominar isso abre portas para scripts que manipulam o desktop de forma programática, algo que você usará mais adiante na seção de atalhos globais.
:::

## Expandindo e organizando os ícones

A seta (um pequeno chevron `^`) no canto da bandeja expande a lista de ícones ocultos. Para decidir o que fica sempre visível, clique com o botão direito na bandeja e escolha **Configurar bandeja do sistema** (ou "Configure System Tray"), depois a aba **Entradas** (Entries).

Ali cada applet tem um controle com três estados:

| Estado | Comportamento |
|---|---|
| Mostrar sempre | Ícone fixo, sempre na parte visível |
| Ocultar automaticamente | Some quando inativo, reaparece na expansão |
| Ocultar sempre | Só aparece ao expandir a seta |

Arrastar um ícone visível para dentro da seta recolhida e vice-versa também reorganiza a posição. Essa arrumação é lembrada no perfil e sobrevive a reinicializações.

## Controlando o shell via D-Bus

O `qdbus` não serve só para inspecionar — ele controla. Um exemplo concreto e útil no deck: esconder ou mostrar a bandeja, ou forçar um refresh do shell. Para listar os métodos disponíveis do objeto do shell:

```terminal
$ qdbus org.kde.plasmashell /PlasmaShell | grep -i -E 'evaluate|toggle|show'
```

O método `evaluateScript` é particularmente poderoso: ele executa um trecho de JavaScript dentro da própria sessão do `plasmashell`, o que permite mexer em qualquer widget programaticamente. Um uso clássico é listar os applets e sua localização:

```terminal
$ qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript \
    "print(plasmoid.configuration)"
```

Como o script roda no contexto do shell, ele enxerga o objeto `plasmoid` (o widget atual) e as APIs internas. Isso é avançado, mas já mostra que a bandeja e o painel são, no fundo, objetos conversáveis, não uma caixa-preta gráfica.

:::atencao
Métodos `evaluateScript` executam código dentro do processo do shell com os privilégios do usuário. Nunca rode JavaScript que você não entende, vindo de fontes não confiáveis — você não está "só mexendo na bandeja", está executando código no seu processo de desktop.
:::

## Quando um ícone some

Ícone de rede sumiu? Volume desapareceu? Na maioria das vezes não é um bug, e sim o estado de "ocultar automaticamente" combinado com alguma condição (sem rede, por exemplo). Antes de suspeitar de problema, expanda a seta e confira se o ícone está na área oculta.

Se o ícone não estiver em lugar nenhum, o applet pode ter falhado e sido descarregado. O caminho de recuperação é reiniciar o shell:

```terminal
$ plasmashell --replace &
```

Se nem isso resolver, o applet pode estar corrompido no cache. Reconstruir o cache de serviços ajuda:

```terminal
$ kbuildsycoca5 --noincremental
```

A flag `--noincremental` força a reconstrução completa do cache, do zero, em vez de apenas o incremental. É o "rebuild limpo" que corrige inconsistências entre o que o Plasma acha que tem e o que realmente está instalado.

## Resumo

- A bandeja do SteamOS reúne relógio, rede, áudio, bateria, notificações e ícones de aplicativos em segundo plano.
- Ícones fixos ficam sempre visíveis; os demais se recolhem atrás da seta expansível, com estados configuráveis por entrada.
- `qdbus org.kde.plasmashell /PlasmaShell` permite inspecionar e controlar o shell via D-Bus.
- `dumpCurrentLayoutJS` exporta o layout completo; `evaluateScript` executa JavaScript dentro do shell.
- Ícone sumido costuma ser estado de ocultação; a recuperação passa por `plasmashell --replace` ou `kbuildsycoca5 --noincremental`.

## Exercícios

1. Expanda a seta da bandeja e liste os ícones que estavam ocultos, anotando quais você considera "essenciais".
2. Torne o ícone de bateria "sempre visível" e o de notificações "ocultar automaticamente", e observe a diferença.
3. Rode `qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.dumpCurrentLayoutJS > /tmp/layout.js` e localize, com `grep`, a entrada do relógio.
4. Force a reconstrução do cache com `kbuildsycoca5 --noincremental` e verifique se a bandeja continua íntegra.
5. **Desafio.** Use `evaluateScript` para imprimir o título da janela ou o identificador de um applet da bandeja, e explique, em uma frase, por que essa capacidade é ao mesmo tempo poderosa e perigosa.
