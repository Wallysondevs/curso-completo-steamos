O Proton é a peça que faz a maioria dos jogos Windows rodar no SteamOS, mas ele é um conjunto de ferramentas, não um único programa. Entre versões oficiais, forks da comunidade e utilitários de manutenção, é fácil se perder. Esta seção apresenta as ferramentas que orbitam o Proton e que resolvem os problemas mais comuns: trocar de versão, instalar builds da comunidade e diagnosticar prefixos.

:::objetivos
- Distinguir Proton oficial, Proton Experimental e Proton GE
- Instalar e usar o ProtonUp-Qt para gerenciar versões de Proton
- Usar o Protontricks para gerenciar prefixos e aplicar workarounds
- Entender onde cada ferramenta se encaixa no fluxo de jogar no Deck
:::

## O mapa das versões de Proton

O Proton é a camada de compatibilidade da Valve baseada em Wine com patches próprios. Mas "Proton" aparece sob vários nomes, e cada um tem um papel:

**Proton estável** é distribuído pela Steam e ativado automaticamente para jogos verificados. **Proton Experimental** é a build de ponta, também oficial, usada para testar correções antes de promovê-las a estável. **Proton GE** (GloriousEggroll) é um fork da comunidade mantido por Thomas "GloriousEggroll" Crider, que inclui correções — especialmente codecs de mídia patenteados — que a Valve não pode distribuir legalmente sem licenciamento.

A consequência prática: alguns jogos exibem vídeos pretos ou sem áudio no Proton oficial porque o codec não é licenciado; o Proton GE resolve isso incluindo os codecs. Por isso a opção de trocar a versão do Proton por jogo, nas propriedades do jogo na Steam, é o primeiro recurso a tentar.

```terminal
$ ls ~/.steam/steam/compatibilitytools.d/
GE-Proton9-25/  Proton-9.0-4/
```

O diretório `compatibilitytools.d` é onde as versões instaladas manualmente ficam. A Steam lê esse diretório e expõe as versões no menu de compatibilidade. Instalar Proton GE, portanto, é em essência copiar uma pasta para cá — mas é mais seguro e cômodo automatizar isso.

## ProtonUp-Qt: um gerenciador de Proton

O [ProtonUp-Qt](https://github.com/DavidoTek/ProtonUp-Qt) é a ferramenta que elimina o trabalho braçal de baixar e posicionar versões de Proton. Ele baixa Proton GE, Luxtorpeda, Boxtron e outros runners, e os instala no local correto automaticamente — dentro da Steam ou do Heroic, conforme sua escolha.

A instalação no Steam Deck usa o Discover (a loja de apps em modo desktop) ou o Flatpak:

```terminal
$ flatpak install flathub net.davidotek.pupgui2
$ flatpak run net.davidotek.pupgui2
```

Depois de aberto, o ProtonUp-Qt lista os runners disponíveis. Você seleciona "Add version", escolhe o runner (por exemplo, "GE-Proton"), e ele baixa a última versão e a instala no `compatibilitytools.d` ou no diretório do Heroic conforme o alvo escolhido. Reinicie a Steam e a nova versão aparece no menu de compatibilidade de cada jogo.

:::dica
Mantenha o Proton GE atualizado pelo ProtonUp-Qt em vez de baixar releases manualmente. As correções de novos jogos chegam primeiro no GE, e o processo manual de copiar pastas — embora funcione — é onde a maioria dos erros de permissão e de versão acontece.
:::

## Protontricks: administrando prefixos

Cada jogo rodando sob Proton vive num **prefixo** — um diretório que simula uma instalação Windows isolada, com seus próprios `*.dll`, chaves de registro e configurações. Quando um jogo precisa de uma dependência extra (um redirecionador de DirectX, uma fonte, uma configuração de registro), você aplica isso dentro do prefixo dele, e não no sistema.

O [Protontricks](https://github.com/Matoking/protontricks) é a interface para isso. Com ele você instala componentes, executa comandos dentro do prefixo e abre editores de configuração:

```terminal
$ protontricks 1675200 -q d3dx11_43
$ protontricks 1675200 winecfg
$ protontricks 1675200 regedit
```

O primeiro comando instala silenciosamente (`-q`) o componente `d3dx11_43` no jogo de ID 1675200. O segundo abre a configuração do Wine, e o terceiro o editor de registro — ambos confinados ao prefixo daquele jogo. O ID do jogo você descobre no ProtonDB ou com:

```terminal
$ protontricks -l
```

Que lista todos os prefixos instalados com seus IDs e nomes.

:::atencao
Aplicar um workaround no prefixo errado não corrige nada e, pior, pode quebrar outro jogo. Sempre confirme o ID com `protontricks -l` antes de rodar qualquer comando. E um prefixo com problema difícil de diagnosticar pode simplesmente ser deletado e recriado — a Steam regenera prefixos do zero, e o save costuma estar salvo na nuvem Steam Cloud.
:::

## Quando usar cada ferramenta

O fluxo de diagnóstico mais comum segue uma ordem: primeiro trocar a versão do Proton (oficial → Experimental → GE); se persistir, aplicar workarounds no prefixo com Protontricks; se o problema for codec de vídeo, pular direto para o Proton GE. O ProtonUp-Qt é a engrenagem que mantém as versões à mão sem esforço manual.

| Ferramenta | Resolve | Como instalar |
|---|---|---|
| Proton oficial / Experimental | base de compatibilidade | já vem na Steam |
| Proton GE | codecs e correções de ponta | ProtonUp-Qt |
| ProtonUp-Qt | gerenciar versões de Proton | Flatpak |
| Protontricks | administrar prefixos | Flatpak |

## Resumo

- Proton é uma família: oficial, Experimental e GE, com papéis distintos.
- Proton GE inclui codecs patenteados que a Valve não pode distribuir.
- ProtonUp-Qt automatiza o download e posicionamento de versões de Proton.
- Protontricks administra prefixos — instalar componentes, abrir winecfg e regedit.
- A ordem de diagnóstico típica é: trocar versão, depois mexer no prefixo.

## Exercícios

1. Liste os runners de compatibilidade atualmente instalados no seu Deck (`ls ~/.steam/steam/compatibilitytools.d/`). Quais são oficiais e quais são da comunidade?
2. Instale o ProtonUp-Qt via Flatpak e adicione a última versão do Proton GE. Reinicie a Steam e confirme que ela aparece no menu de compatibilidade de um jogo.
3. Rode `protontricks -l` e identifique três jogos instalados pelos seus IDs. Anote um prefixo que você sabe que usa e outro que nunca configurou.
4. Escolha um jogo com vídeo quebrado (ou simulando: um jogo qualquer que você suspeite de codec) e troque sua versão de Proton para GE. Meça se o problema som.
5. **Desafio.** Encontre no ProtonDB um jogo que exige um workaround de prefixo (uma DLL ou configuração de registro específica) e aplique-o com o Protontricks. Confirme com `protontricks -l` que o prefixo é o certo antes e depois de mexer.