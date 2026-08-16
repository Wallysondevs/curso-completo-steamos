Até aqui você instalou aplicativos de desktop genéricos — coisas que funcionariam em qualquer Linux. Mas o Steam Deck tem um ecossistema próprio, com ferramentas que não existem fora dele: o ProtonUp-Qt, que gerencia as camadas de compatibilidade para rodar jogos Windows, e o Decky Loader, que injeta plugins diretamente no modo jogo. São duas peças que fecham o kit de qualquer usuário avançado do Deck.

:::objetivos
- Instalar o ProtonUp-Qt e adicionar versões do Proton e do GE-Proton
- Entender a diferença entre Proton oficial e Proton-GE
- Instalar o Decky Loader e seus plugins pela interface do modo jogo
- Configurar ferramentas do ecossistema (protontricks) para jogos específicos
:::

## ProtonUp-Qt: o que ele resolve

A Steam roda jogos nativos do Linux tranquilamente, mas a biblioteca dela é majoritariamente de jogos para Windows. O **Proton** é a camada de compatibilidade da Valve (baseada no Wine) que traduz chamadas do Windows para Linux. A Valve mantém a versão oficial, mas a comunidade produz builds alternativas — como o **Proton-GE** (GloriousEggroll) — com codecs e correções que a Valve não pode distribuir.

O ProtonUp-Qt é uma interface gráfica que instala essas versões alternativas sem você mexer manualmente em pastas escondidas:

```terminal
$ flatpak install net.davidotek.pupgui2
Looking for matches…
Found similar ref(s) for 'net.davidotek.pupgui2' in remote 'flathub' (system).
Use this remote? [Y/n]: Y

        ID                                          Branch          Op           Remote           Download
 1. [✓] net.davidotek.pupgui2                      stable          i            flathub          28,7 MB / 28,8 MB

Installation complete.

$ flatpak run net.davidotek.pupgui2
```

Na interface, você vê uma lista de ferramentas instaláveis: `GE-Proton`, `Proton Tkg`, `Luxtorpeda`, `Wine-GE`, `protontricks`, entre outras. Selecione uma ferramenta, clique em "Versões", escolha a mais recente e em "Instalar".

## Onde o Proton-GE faz diferença

O Proton-GE existe porque a Valve, por questões legais, não pode incluir certos codecs de vídeo proprietários (ex.: WMV, alguns codecs de mídia com patente). Jogos que usam vídeo introdutório nesses formatos ficam com tela preta no Proton oficial, mas funcionam no Proton-GE.

Para instalar o Proton-GE e ativá-lo num jogo:

```terminal
$ flatpak run net.davidotek.pupgui2
```

Depois da instalação pelo ProtonUp-Qt:

1. Reinicie a Steam (ou o modo jogo).
2. Vá ao jogo desejado → Propriedades → Compatibilidade.
3. Marque "Forçar o uso de uma ferramenta de compatibilidade".
4. Escolha a versão `GE-Proton` que você instalou.

A versão fica salva por jogo, então você pode usar Proton oficial para uns e GE para outros.

:::nota
O ProtonUp-Qt também instala o `protontricks`, que roda o `winetricks` dentro do prefixo Wine de um jogo. É a ferramenta usada para instalar DLLs e componentes do Windows (como o `d3dx9` ou fontes) que alguns jogos exigem. Para o usuário comum, o Proton-GE já resolve 90% dos casos; o protontricks é para os 10% restantes.
:::

## Decky Loader: plugins no modo jogo

O Decky Loader é um gerenciador de plugins que roda **dentro do modo jogo** (Game Mode), acessível pelo botão `...` (Quick Access Menu). Ele injeta uma interface própria onde você instala plugins como o `Storage Cleaner`, o `Animation Changer` ou o `PowerTools`.

A instalação do Decky é feita por um script oficial que você baixa e roda. Primeiro, defina/confirme uma senha sudo para o usuário `deck`:

```terminal
$ passwd
Changing password for deck.
Current password:
New password:
Retype new password:
passwd: password updated successfully
```

Depois baixe e execute o instalador:

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
Downloading decky installer...
[INFO] Detected SteamOS...
[INFO] Installing Decky Loader...
[INFO] Done! Please restart your Steam Deck to finish the installation.
```

Após reiniciar, o botão `...` do modo jogo mostra um novo ícone de plugin (um formato de peça de quebra-cabeça). Ali você navega por uma loja de plugins e instala e remove com um clique.

:::atencao
O Decky Loader não é um Flatpak — ele se instala no diretório `~/homebrew` e sobrescreve partes da interface da Steam. Por isso ele **pode quebrar após atualizações grandes do SteamOS**, até os desenvolvedores lançarem uma versão compatível. Antes de atualizar o Deck para uma versão nova do SteamOS, verifique se há uma release recente do Decky. Se o modo jogo travar após uma atualização, desinstale o Decky pelo menu dele ou removendo `~/homebrew`.
:::

## Plugins que valem a pena

O catálogo do Decky muda com frequência, mas alguns plugins são estáveis e úteis:

| Plugin | Função |
|---|---|
| **Storage Cleaner** | Remove shader caches e arquivos temporários de jogos desinstalados |
| **PowerTools** | Ajusta TDP, frequência de CPU/GPU e limites de energia |
| **Animation Changer** | Troca as animações de boot e suspensão |
| **Pause Games** | Suspende jogos em segundo plano para economizar bateria |
| **SteamGridDB** | Importa artes e capas personalizadas para jogos não-Steam |

O Storage Cleaner, em especial, é quase essencial num Deck com modelo base de 64 GB, onde os shader caches acumulados podem ocupar gigabytes à medida que você instala e remove jogos.

## Proton, Wine e o ecossistema em perspectiva

Vale entender a hierarquia para não se perder: o **Wine** é o projeto de base que traduz Windows→Linux; o **Proton** é o Wine otimizado pela Valve para jogos, integrado à Steam; o **Proton-GE** é a variante comunitária com extras; o **ProtonUp-Qt** é o instalador/gerenciador de todas essas camadas; e o **Decky Loader** é uma categoria à parte — ele altera a interface do próprio Steam, não a compatibilidade de jogos.

:::dica
Use Proton-GE quando um jogo travar ou apresentar vídeo preto mesmo no Proton oficial mais recente. Mantenha também uma versão do Proton oficial atualizada — a Valve corrige bugs de compatibilidade a cada release, e muitas vezes o oficial já resolve o que antes exigia o GE.
:::

## Resumo

- O ProtonUp-Qt (`net.davidotek.pupgui2`) instala e gerencia versões do Proton e ferramentas como Proton-GE e protontricks.
- O Proton-GE inclui codecs proprietários que a Valve não distribui, resolvendo jogos com vídeo introdutório preto.
- A ativação do Proton-GE é por jogo, em Propriedades → Compatibilidade → Forçar ferramenta.
- O Decky Loader injeta uma loja de plugins no modo jogo, acessível pelo botão `...` (Quick Access Menu).
- O Decky não é Flatpak e pode quebrar em grandes atualizações do SteamOS; verifique compatibilidade antes de atualizar.

## Exercícios

1. Instale o ProtonUp-Qt e, por ele, instale a versão mais recente do GE-Proton.
2. Escolha um jogo Windows que exiba vídeo introdutório preto (ou qualquer jogo Windows) e force o uso do GE-Proton em Propriedades → Compatibilidade.
3. Defina uma senha sudo para o usuário `deck` com `passwd` e instale o Decky Loader pelo script oficial.
4. Após reiniciar, abra a loja de plugins do Decky (botão `...` no modo jogo) e instale o Storage Cleaner. Execute-o e veja quanto espaço ele sugere liberar.
5. **Desafio.** Use o `protontricks` (instalado pelo ProtonUp-Qt) para instalar um componente Windows (ex.: `d3dx9`) no prefixo de um jogo antigo, confirme que o jogo abre, e escreva uma nota curta comparando Proton oficial × Proton-GE × protontricks para aquele jogo.