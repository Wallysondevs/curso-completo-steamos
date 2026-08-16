Dois jogos de Switch raramente exigem as mesmas configurações. Um plataforma 2D roda a 60 FPS com tudo no mínimo; um mundo aberto precisa de resolução reduzida, mod de 60 FPS e uma configuração de CPU específica. Esta seção ensina a criar perfis por jogo no Yuzu e no Ryujinx, e a lidar com títulos que precisam de intervenção manual.

:::objetivos
- Criar configurações globais e sobrepô-las por título (per-game)
- Aplicar mods de desempenho e resolução dinâmica
- Ajustar a jogabilidade com cheats e patches específicos
- Gerenciar a lista de jogos e o cache por título
:::

## Perfis globais vs per-game

Ambos os emuladores separam uma configuração global de perfis individuais. A global vale para qualquer jogo sem perfil próprio; o per-game sobrepõe (override) apenas os campos que você alterar. Isso evita recalibrar tudo a cada título.

No Yuzu, clique com o botão direito num jogo da lista e escolha **Properties**. Ali você encontra:

```text
General   → título, região, idioma
Graphics  → API, resolução, async shaders (herdado da global, sobrescrevível)
System    → modo docked, idioma do sistema
Add-ons   → atualizações, DLCs, mods instalados
```

No Ryujinx, o caminho é **Options → Manage Title Update / DLC / Mods**, e há perfis por título em **Options → Settings**, aba **Graphics**, com uma lista de configurações por jogo.

:::dica
Crie um perfil "pesado" (resolução 1x, async shaders on) e aplique apenas aos jogos de mundo aberto. Nos demais, deixe a global generosa (2x, filtros ligados) — a maioria dos títulos não precisa de perfil próprio.
:::

## Mods de desempenho: o caso dos 60 FPS e FPS dinâmico

Alguns portes de Switch travam a 30 FPS no próprio código do jogo. Emuladores não conseguem desbloquear isso sem alterar o jogo — aí entram os mods (cheats/patchs). O mais famoso é o **mod de 60 FPS** para *The Legend of Zelda: Tears of the Kingdom*, que modifica o limite de frame e usa resolução dinâmica.

A instalação de mods no Yuzu:
1. Baixe o mod (arquivo `.zip` com estrutura `exefs/` e/ou `romfs/` no topo)
2. Clique com o botão direito no jogo → **Open Mods Directory**
3. Cole a pasta do mod dentro
4. Reabra o jogo e ative o mod em **Properties → Add-ons**

```terminal
$ ls ~/.local/share/yuzu/load/0100F2C0115B6000/
60fps_v4.1/  DynamicFPS_v1.5.5/  ...
```

O Ryujinx usa a mesma estrutura de mods em `~/.config/Ryujinx/mods/contents/<titleID>/`, ou via interface em **Manage Mods**.

:::perigo
Mods alteram o executável do jogo em memória. Use apenas mods de fontes confiáveis e compatíveis com a versão do jogo. Um mod de versão errada pode corromper o save ou impedir o jogo de iniciar. Sempre faça backup do save antes (veja a seção sobre saves).
:::

## Modo docked vs handheld

O Switch muda o limite de desempenho conforme o modo: **docked** libera mais clock de CPU/GPU, **handheld** prioriza bateria. O emulador replica isso. Para extrair o máximo no Deck, ative o modo **docked** — você não está limitado por bateria do Switch original.

No Yuzu: **Emulation → Configure → System → Console Mode = Docked**.

```terminal
$ # Modo docked libera resolução nativa maior em vários jogos
MANGOHUD=1 flatpak run org.yuzu_emu.yuzu
FPS: 49 → 60  (docked desbloqueia o teto de 30 FPS em alguns títulos)
```

No Ryujinx, o modo docked está em **Options → Settings → System → Enable Docked Mode**.

:::info
O modo docked não é universalmente melhor. Alguns jogos têm bugs visuais no modo docked emulado porque assumem TV. Se um jogo glitchar em docked, volte para handheld — o desempenho no Deck já é superior ao do Switch original de qualquer forma.
:::

## Lidando com títulos problemáticos

Nem todo jogo é plug-and-play. Sinais de que um título precisa de perfil manual:

- Tela preta ou crash na inicialização → troque de backend (Vulkan ↔ OpenGL), verifique firmware/keys
- FPS instável em áreas específicas → reduza resolução, ative FPS dinâmico via mod
- Áudio cortando → ajuste o sample rate ou o backend de áudio (veja próxima seção)
- Controles que não respondem → reconfigure o mapeamento por jogo

Um fluxo de diagnóstico rápido:

```terminal
$ # Veja o log do último jogo aberto
$ tail -50 ~/.local/share/yuzu/log/yuzu_log.txt
[   0.123] Frontend                         <Info>    yuzu starting...
[   0.456] Vulkan                           <Error>   Device lost (VK_ERROR_DEVICE_LOST)
```

A mensagem `VK_ERROR_DEVICE_LOST` aponta para instabilidade do Vulkan naquele jogo — troque para OpenGL. Logs são a ferramenta mais honesta quando a interface não diz o que há de errado.

## Organizando a biblioteca

Conforme o catálogo cresce, a lista de jogos precisa de curadoria. O Yuzu mostra título, título ID, região e versão de cada entrada. Você pode criar um perfil antes mesmo de jogar: adicione o jogo, configure o perfil em **Properties**, e ele já inicia calibrado.

```terminal
$ # Lista de jogos instalados no Yuzu
$ ls ~/.local/share/yuzu/nand/user/Contents/registered/ | head
0100000000010000.nca
...
```

Manter os título IDs documentados ajuda a mapear mods e saves para o jogo certo quando várias entradas têm nomes parecidos.

## Resumo

- Perfis per-game sobrepõem a configuração global apenas nos campos alterados.
- Mods de 60 FPS e DynamicFPS desbloqueiam limites do jogo e estabilizam o frame rate.
- Modo docked libera clocks maiores e é geralmente preferível no Deck, salvo bugs visuais.
- Logs em `~/.local/share/yuzu/log/` revelam a causa de crashes e telas pretas.
- Backup de save é obrigatório antes de instalar mods.

## Exercícios

1. Crie um perfil "pesado" e um "leve" no Yuzu e aplique-os a dois jogos diferentes. Confirme que a global não foi alterada.
2. Instale um mod de 60 FPS em um jogo de mundo aberto e meça o FPS antes e depois com MangoHud.
3. Alterne docked e handheld no mesmo jogo e registre a diferença de FPS e de estabilidade visual.
4. Force um crash trocando para o backend errado e leia o log para identificar a mensagem de erro.
5. **Desafio.** Use `strings` ou um editor hexa para localizar o limite de 30 FPS no executável de um jogo (arquivo `main` dentro do NSP), correlacionando a descoberta com o funcionamento de um mod de 60 FPS real.