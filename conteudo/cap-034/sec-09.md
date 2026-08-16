Chegamos ao ponto em que todas as peças estão instaladas. Agora a pergunta é prática: como é um dia real de trabalho usando o Steam Deck como estação de trabalho? Esta seção monta o cenário completo — dock, periféricos, múltiplas áreas de trabalho virtuais e scripts de automação — e propõe um fluxo integrado onde Writer, Calc, Obsidian, VS Codium e PDFs convivem na mesma sessão do KDE Plasma, tudo rodando num aparelho que cabe na mochila.

:::objetivos
- Configurar áreas de trabalho virtuais no KDE para separar contextos de tarefa
- Montar um fluxo de trabalho que integra Writer, Calc, Obsidian e VS Codium
- Automatizar a abertura do "setup de trabalho" com um script de sessão
- Medir o consumo de recursos e entender os limites do Deck como workstation
- Avaliar se o Deck supre as necessidades de uma estação de trabalho leve e definitiva
:::

## Um dia de trabalho no Deck

Imagine o cenário: você chega em casa, conecta o Deck ao dock USB-C, o monitor 1080p acende, o teclado e o mouse são reconhecidos. Em vez de abrir aplicativos um por um, você roda um script que restaura sua sessão de trabalho exatamente como estava:

```bash
#!/bin/bash
## ~/scripts/iniciar-workstation.sh
## Restaura a sessão de produtividade no Steam Deck

flatpak run org.libreoffice.LibreOffice --writer ~/Documents/projeto/relatorio.odt &
sleep 2
flatpak run md.obsidian.Obsidian &
sleep 1
flatpak run com.vscodium.codium ~/projetos/ &
sleep 1
kate ~/Documents/projeto/notas-tecnicas.md &
```

```terminal
$ chmod +x ~/scripts/iniciar-workstation.sh
$ ~/scripts/iniciar-workstation.sh
```

As pausas com `sleep` não são frescura: elas evitam que três aplicativos Electron/Java disputem o mesmo núcleo de CPU durante a inicialização simultânea. Em 10 segundos, o Deck está com Writer, Obsidian e VS Codium abertos, cada um na sua área de trabalho virtual.

## Áreas de trabalho virtuais: o segredo do KDE

O KDE Plasma herdou o conceito de áreas de trabalho virtuais dos Unix tradicionais e o refinou com um gesto simples: `[[Ctrl+F1]]` até `[[Ctrl+F4]]` trocam de área; `[[Ctrl+Shift+F1]]` move a janela ativa para a área correspondente. Cada área pode ter seu próprio papel de parede e seu próprio conjunto de widgets.

Uma organização típica para o Deck como workstation:

| Área | Aplicativos | Propósito |
|---|---|---|
| Área 1 (`[[Ctrl+F1]]`) | Firefox, Dolphin | Navegação e arquivos |
| Área 2 (`[[Ctrl+F2]]`) | Writer, Calc | Documentos e planilhas |
| Área 3 (`[[Ctrl+F3]]`) | VS Codium, terminal | Código e shell |
| Área 4 (`[[Ctrl+F4]]`) | Obsidian, Okular | Notas e leitura |

Com essa divisão, você alterna de contexto com `[[Ctrl+F2]]` (hora de escrever o relatório) e `[[Ctrl+F3]]` (hora de programar o script de extração de dados). Não há sobreposição de janelas e cada área tem exatamente os aplicativos daquele contexto.

```terminal
## Listar áreas de trabalho e janelas em cada uma:
$ wmctrl -d
0  * DG: 1920x1080  VP: 0,0  WA: 0,0 1920x1080  Área 1
1  - DG: 1920x1080  VP: 0,0  WA: 0,0 1920x1080  Área 2
2  - DG: 1920x1080  VP: 0,0  WA: 0,0 1920x1080  Área 3
3  - DG: 1920x1080  VP: 0,0  WA: 0,0 1920x1080  Área 4
```

Se o `wmctrl` não estiver disponível, instale via `flatpak install flathub org.kde.wmctrl` ou use o atalho `[[Meta+W]]` (visão geral do KDE) que exibe todas as áreas com miniaturas.

:::dica
No KDE, clique com botão direito na barra de título de qualquer janela e escolha **More Actions → Configure Special Window Settings**. Ali você pode forçar uma janela a sempre abrir numa área de trabalho específica, com um tamanho e posição determinados. É como ter um gerenciador de janelas automático sem instalar nada extra.
:::

## O Deck aguenta? Recursos e limites

Vamos aos números. Com o cenário acima (Writer, Obsidian, VS Codium, Kate e Firefox com 5 abas), o Deck consome aproximadamente:

```terminal
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            14Gi       5,8Gi       3,9Gi       1,2Gi       4,9Gi       8,1Gi
Swap:           4,0Gi        0B         4,0Gi

$ uptime
 15:23:45 up  2:17,  1 user,  load average: 0,89, 0,72, 0,58
```

Com 5,8 GB usados de 16 GB disponíveis e load average abaixo de 1,0 (para 8 threads lógicos do Zen 2), o Deck está confortável. Dá para abrir mais. A CPU Zen 2 (4 núcleos, 8 threads) entrega desempenho equivalente a um notebook Core i5 de 2019 — suficiente para desenvolvimento web, scripts Python e edição de documentos, mas insuficiente para compilar kernels ou rodar VMs pesadas.

O gargalo real não é CPU nem RAM: é a **tela de 7 polegadas**. Sem monitor externo, você está limitado a uma área de trabalho portátil minúscula. Com monitor externo, o Deck vira outra máquina.

:::info
O Steam Deck tem suporte oficial a monitores até 4K@60Hz via DisplayPort sobre USB-C (dock oficial) e 4K@120Hz via HDMI 2.0 (docks de terceiros). Na prática, o KDE Plasma roda suavemente em 1440p, mas em 4K as animações podem engasgar porque a GPU (RDNA 2 com 8 CUs) foi dimensionada para 800p, não para 8 megapixels.
:::

## Indo além: o Deck como servidor leve

Uma vez que o Deck está no dock, conectado à energia e à rede, nada impede que ele também funcione como um servidor doméstico leve enquanto você trabalha. O SteamOS, sendo um Linux, suporta:

```terminal
## Servir um site estático em desenvolvimento:
$ python3 -m http.server 8080 --directory ~/projetos/site/
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...

## Compartilhar uma pasta na rede local:
$ flatpak run --command=python3 org.libreoffice.LibreOffice -c \
    "import http.server; http.server.test()"
```

O `python3 -m http.server` é o servidor mais simples possível: qualquer navegador na rede local acessa `http://steamdeck.local:8080` e vê o conteúdo da pasta. Para desenvolvimento web com hot-reload (Node.js, Vite, etc.), o VS Codium no Deck suporta tudo que seu notebook suportaria.

## Resumo

- Com dock, monitor externo e um script de inicialização, o Deck restaura toda a estação de trabalho em segundos.
- Áreas de trabalho virtuais (`[[Ctrl+F1]]` a `[[Ctrl+F4]]`) isolam contextos: documentos, código, notas, navegação.
- O Deck consome ~6 GB de RAM com Writer + Obsidian + VS Codium + Firefox, deixando ~8 GB livres para outras tarefas.
- O limite real é a tela de 7"; com monitor 1080p ou 1440p, o Deck rivaliza com notebooks intermediários.
- Além de workstation, o Deck também serve como servidor web leve com `python3 -m http.server`.

## Exercícios

1. Configure 4 áreas de trabalho virtuais no KDE e distribua Writer, Obsidian, VS Codium e Firefox, um em cada área. Cronometre a troca entre elas com `[[Ctrl+F1]]`…`[[Ctrl+F4]]`.
2. Crie um script `iniciar-workstation.sh` que abre pelo menos dois aplicativos com `sleep` entre eles. Execute e verifique com `ps aux | grep flatpak` se todos subiram.
3. Com todos os aplicativos do exercício anterior abertos, meça `free -h` e `uptime`. O Deck está confortável ou no limite?
4. Usando **Special Window Settings** do KDE, force o Obsidian a sempre abrir na Área 4. Feche e reabra; ele obedeceu?
5. **Desafio.** Escreva um segundo script, `finalizar-workstation.sh`, que fecha ordenadamente todos os aplicativos abertos (envia SIGTERM com `kill` ou `flatpak kill`) e gera um relatório de `~/.local/share/` com tudo que foi modificado na sessão. Esse script é seu "desligar o trabalho" automatizado.