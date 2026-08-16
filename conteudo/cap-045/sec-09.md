Até aqui você aprendeu a instalar mods, patches, trainers, runtimes e a reparar prefixos danificados. Esta seção é o check-up final: o fluxo de trabalho unificado, as ferramentas que você terá à mão e os recursos da comunidade que mantêm o Steam Deck respirando fora do ecossistema fechado.

:::objetivos
- Consolidar um fluxo de modding reproduzível: backup, runtime, mod, patch, teste
- Conhecer ferramentas auxiliares: Proton GE, Luxtorpeda, Boxtron, Heroic, Lutris
- Mapear os canais de comunidade essenciais (ProtonDB, Reddit, Discord, GitHub)
- Decidir quando usar Wine/Proton manual vs Flatpak vs AppImage
- Planejar a evolução do seu setup de modding no Deck
:::

## O fluxo de trabalho unificado

Toda intervenção no Deck segue o mesmo ritual. Interiorize estes passos — eles previnem 90% dos problemas:

```
BACKUP → RUNTIME → MOD → PATCH → TESTE → COMMIT
```

1. **BACKUP**: `rsync` do prefixo. Sempre. Custa 30 segundos e salva horas.
2. **RUNTIME**: instale todas as dependências antes dos mods. `protontricks APPID vcrun2022 dotnet48 d3dx9` em uma tacada.
3. **MOD**: instale um mod por vez. Teste o jogo entre cada instalação. Instalar 50 mods de uma vez e descobrir que um deles quebra é ineficiente.
4. **PATCH**: aplique patches de comunidade sobre a base limpa, não sobre mods.
5. **TESTE**: carregue um save, jogue 5 minutos, verifique o log do Proton.
6. **COMMIT**: se tudo funcionar, faça um novo backup com a data e uma etiqueta descritiva: `prefix-skyrim-240mods-ok-20250315`.

No terminal, esse fluxo se traduz em:

```terminal
$ APPID=489830
$ PREFIX="$HOME/.steam/steam/steamapps/compatdata/$APPID"

## 1. BACKUP
$ rsync -a "$PREFIX/" "$HOME/backups/prefixos/$APPID-$(date +%Y%m%d-%H%M%S)/"

## 2. RUNTIME
$ protontricks "$APPID" -q vcrun2022 d3dx9 d3dcompiler_43 xact dotnet48

## 3. MOD (um por vez)
$ protontricks -c 'wine "Z:\home\deck\Mods\Skyrim\mod01.exe"' "$APPID"
$ PROTON_LOG=1 steam steam://run/"$APPID"  # testa

## 4. PATCH
$ protontricks -c 'wine "Z:\home\deck\Patches\uskp.exe"' "$APPID"

## 5. TESTE
$ PROTON_LOG=1 steam steam://run/"$APPID"
$ grep -c 'err:' ~/steam-"$APPID".log
0   # zero erros = sucesso

## 6. COMMIT
$ rsync -a "$PREFIX/" "$HOME/backups/prefixos/$APPID-ok-mod01-$(date +%Y%m%d-%H%M%S)/"
```

## Ferramentas além do Proton stock

O Proton que vem com o Steam não é a única opção. O ecossistema oferece alternativas para casos específicos:

| Ferramenta | Propósito | Instalação |
|---|---|---|
| **Proton GE** (GloriousEggroll) | Proton com codecs patenteados, patches extras e wine staging | `wget` do GitHub, extrair em `~/.steam/steam/compatibilitytools.d/` |
| **Luxtorpeda** | Substitui Proton por builds nativas Linux de engines (OpenMW, GZDoom, ScummVM) | ProtonUp-Qt ou GitHub |
| **Boxtron** | Executa jogos nativos DOS via DOSBox Staging com configuração automática | ProtonUp-Qt |
| **Heroic Games Launcher** | Alternativa ao Steam para Epic Games e GOG com Wine/Proton integrado | Flatpak: `com.heroicgameslauncher.hgl` |
| **Lutris** | Gerenciador de jogos não-Steam com suporte a Wine, runners e scripts da comunidade | Flatpak: `net.lutris.Lutris` |
| **ProtonUp-Qt** | Interface gráfica para instalar Proton GE, Luxtorpeda, Boxtron e Wine GE | Flatpak: `net.davidotek.pupgui2` |

O Proton GE é o mais usado porque resolve problemas de codec que a Valve não pode incluir no Proton oficial por questões legais:

```terminal
$ flatpak run net.davidotek.pupgui2
## Interface gráfica: selecione Proton GE, clique Install
## Reinicie o Steam. Proton GE aparecerá na lista de compatibilidade.
```

Para jogos via Epic ou GOG, o Heroic simplifica o gerenciamento:

```terminal
$ flatpak install flathub com.heroicgameslauncher.hgl
$ flatpak run com.heroicgameslauncher.hgl
## Faça login na Epic/GOG, selecione o jogo, configure o Wine/Proton, instale.
```

## Canais da comunidade

O Steam Deck sobrevive de comunidade. Saber onde buscar ajuda é parte do setup:

| Recurso | URL / Local | Melhor para |
|---|---|---|
| **ProtonDB** | [protondb.com](https://www.protondb.com) | Relatos de compatibilidade com parâmetros de launch |
| **r/SteamDeck** | Reddit | Dicas, troubleshooting, novidades |
| **r/linux_gaming** | Reddit | Discussões técnicas sobre Wine/Proton |
| **Steam Deck Discord** | Discord | Ajuda em tempo real |
| **Valve Issue Tracker** | [github.com/ValveSoftware/Proton/issues](https://github.com/ValveSoftware/Proton/issues) | Bugs do Proton (com log) |
| **Proton GE Releases** | [github.com/GloriousEggroll/proton-ge-custom](https://github.com/GloriousEggroll/proton-ge-custom) | Changelog e download |
| **PCGamingWiki** | [pcgamingwiki.com](https://www.pcgamingwiki.com) | Patches, fixes e workarounds por jogo |
| **Game Modding BR** | Discord / Fórum | Traduções PT-BR e mods localizados |

Ao reportar um bug no Proton, inclua sempre:

```terminal
$ PROTON_LOG=1 %command%
## O log estará em ~/steam-<APPID>.log
$ grep "Proton:" ~/steam-<APPID>.log | head -1
Proton: 9.0-3
$ uname -r
6.5.0-valve37-1-neptune
```

A combinação versão do Proton + versão do kernel + log completo é o mínimo que os desenvolvedores precisam para investigar.

## Quando usar o quê: Flatpak vs AppImage vs nativo

O Deck usa Flatpak como sistema de empacotamento principal para aplicativos de desktop. A escolha do formato importa:

| Formato | Vantagens | Desvantagens | Use para |
|---|---|---|---|
| **Flatpak** | Integração com Discover, sandbox, atualização automática | Acesso restrito a arquivos fora de `~/` (precisa de override) | ProtonUp-Qt, Heroic, Lutris |
| **AppImage** | Portátil, sem instalação, acesso total ao filesystem | Sem atualização automática, ocupa mais espaço | Nexus Mods App, ferramentas standalone |
| **Nativo (apt)** | Acesso total, integração máxima | Disponível só no modo Desktop; imutável no modo SteamOS | `scanmem`, `xdelta3`, ferramentas de linha de comando |
| **Proton/Steam** | Integrado ao Steam, zero configuração | Só para jogos Steam | Jogos da biblioteca Steam |

:::nota
Flatpaks são conteinerizados e por padrão só acessam `~/`. Para dar acesso a um Flatpak a `/run/media/` (cartão SD), use `flatpak override --filesystem=/run/media/mmcblk0p1 com.heroicgameslauncher.hgl`. Isso é necessário para instalar jogos no cartão SD via Heroic.
:::

## Evoluindo o setup

Seu Deck não será o mesmo daqui a seis meses. Com o tempo, você acumulará:

- Uma pasta `~/backups/prefixos/` com snapshots históricos.
- Scripts em `~/bin/` que automatizam tudo que é repetitivo.
- Uma lista de "jogos resolvidos" com anotações sobre qual Proton usar, quais runtimes instalar e quais mods são essenciais.
- Templates de prefixo: um prefixo "base Bethesda" com SKSE, .NET e VC runtimes que você copia para novos jogos da engine.

O próximo passo natural é versionar essas configurações com Git:

```terminal
$ cd ~/bin
$ git init
$ git add backup-prefix.sh setup-prefix-skyrim.sh setup-prefix-fallout.sh
$ git commit -m "Scripts de gerenciamento de prefixos Steam Deck"
$ git remote add origin git@github.com:deck/scripts.git
$ git push
```

Assim, se você resetar o Deck ou comprar um Steam Deck 2, seu setup é reconstruído com um `git clone`.

## Resumo

- O fluxo BACKUP → RUNTIME → MOD → PATCH → TESTE → COMMIT previne 90% dos problemas de modding.
- Proton GE resolve codecs patenteados; Luxtorpeda fornece engines nativas Linux para jogos antigos.
- Heroic e Lutris gerenciam jogos de outras lojas (Epic, GOG) dentro do ecossistema Deck.
- A comunidade (ProtonDB, Reddit, Discord, GitHub) é parte essencial do suporte a jogos no Deck.
- Versionar scripts e configurações com Git garante reprodutibilidade e resiliência.

## Exercícios

1. Instale o ProtonUp-Qt via Flatpak e adicione o Proton GE mais recente. Teste um jogo com problema conhecido de codec.
2. Configure o Heroic Games Launcher para acessar o cartão SD e instale um jogo da Epic Games. Ele funciona com o Proton GE?
3. Execute o fluxo completo (BACKUP → RUNTIME → MOD → PATCH → TESTE → COMMIT) para um jogo da sua escolha. Documente cada passo.
4. Entre no ProtonDB, encontre o relato mais útil para um jogo problemático que você possui e replique a solução sugerida.
5. **Desafio.** Monte um template de prefixo "base" com todos os runtimes comuns, compacte-o com `tar czf` e escreva um script que descompacta o template para um novo AppID, ajusta os paths e lança o jogo. Teste com dois jogos diferentes.