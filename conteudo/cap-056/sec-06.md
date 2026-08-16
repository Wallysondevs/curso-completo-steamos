O principal motivo para ter um microSD no Deck é mover jogos para ele — liberando espaço no SSD interno. O Steam faz isso nativamente e bem, mas existem decisões: onde instalar cada jogo, como transferir a biblioteca inteira, como lidar com jogos não-Steam (Proton, ROMs, Heroic) e quando mover para o cartão pode até piorar o desempenho.

:::objetivos
- Mover jogos Steam entre SSD interno e microSD pela interface
- Definir o local padrão de instalação da biblioteca
- Entender a estrutura de pastas da biblioteca Steam no cartão
- Mover jogos não-Steam (Proton, Heroic, ROMs) manualmente
- Avaliar o impacto de desempenho do microSD no carregamento
:::

## Movendo jogos Steam pela interface

No Modo Jogo, o processo é simples:

1. Abra **Configurações → Armazenamento** e confirme que o cartão aparece listado.
2. Para mover um jogo já instalado: selecione o jogo, abra **Gerenciar → Propriedades → Arquivos instalados → Mover arquivo de instalação** e escolha o cartão.
3. Para instalar direto no cartão: ao instalar, escolha o microSD como destino no seletor de biblioteca.

A transferência é feita pelo Steam de forma segura (copia e valida), sem corromper saves — os dados de save, por padrão, ficam no disco interno (em `~/.local/share/Steam`), separados dos arquivos do jogo.

## Estrutura da biblioteca no cartão

O Steam cria no cartão uma estrutura paralela à do disco interno:

```terminal
$ ls /run/media/deck/SD/
steamapps
```

Dentro de `steamapps`:

```terminal
$ ls /run/media/deck/SD/steamapps/
common/          # arquivos dos jogos
compatdata/      # prefixos Proton/Wine por jogo
shadercache/     # cache de shaders
appmanifest_*.acf  # manifestos de instalação
```

- `common/<nome-do-jogo>`: os arquivos do jogo.
- `compatdata/<appid>`: o prefixo Wine/Proton daquele jogo.
- `shadercache/<appid>`: shaders compilados (importante para evitar stutter).
- `appmanifest_<appid>.acf`: diz ao Steam onde o jogo está instalado e seu estado.

:::info
Quando um jogo roda via Proton, o prefixo (`compatdata`) e o shader cache podem ficar grandes. Mover o jogo para o cartão move esses elementos junto, então o cartão precisa de espaço não só para o jogo, mas para esses extras.
:::

## Mover jogos não-Steam e Proton manualmente

Jogos fora do Steam (GOG, Heroic/Legendary, Lutris, ROMs) você move manualmente:

```terminal
## Mover uma pasta de jogo Heroic para o cartão
$ mv ~/Games/Heroic/MeuJogo /run/media/deck/SD/Games/MeuJogo

## Mover ROMs
$ mv ~/Emulation/roms /run/media/deck/SD/roms
```

Após mover, atualize os caminhos na ferramenta que gerencia o jogo (no Heroic, aponte o jogo para o novo local; no EmuDeck, atualize a pasta de ROMs). Atenção especial a **prefixos Proton**: se um jogo não-Steam usa prefixo, mova o prefixo junto ou o jogo pode perder saves/configs.

```terminal
## Ver tamanho antes de mover
$ du -sh ~/Games/Heroic/MeuJogo ~/.wine
```

:::atencao
Ao mover jogos não-Steam, jogos que usam caminho absoluto gravado (alguns prefixos Proton e saves) podem quebrar se o caminho mudar. Prefira mover para um ponto de montagem estável (ou usar o caminho `/run/media/deck/...` consistente) e teste o jogo após a mudança antes de apagar o original.
:::

## Desempenho: SSD interno vs. microSD

O microSD é bem mais lento que o NVMe interno, e isso afeta:

- **Carregamento**: telas de loading mais longas, especialmente em jogos de mundo aberto que fazem streaming de assets.
- **Shader cache**: se o cache ficar no cartão lento, compilação/leitura de shaders pode causar mais stutter.
- **Gravações**: instalar/atualizar jogos grandes no cartão é notavelmente mais demorado.

Regra prática: jogos pesados, de mundo aberto ou que sofrem de stutter de carregamento ficam melhor no SSD interno. Jogos leves, indies, emuladores e ROMs ficam bem no cartão.

:::dica
O cartão A2 (Application Performance Class 2) tem IOPS muito superiores ao A1 e reduz o impacto no carregamento e nos shaders. Se você planeja instalar jogos grandes no microSD, invista num A2 de marca confiável (evite cartões falsificados de "capacidade maior").
:::

## Verificando espaço e integridade após mover

```terminal
## Espaço livre no cartão
$ df -h /run/media/deck/SD

## Confirmar que o jogo está no cartão
$ ls /run/media/deck/SD/steamapps/common/
```

Depois de mover, valide os arquivos do jogo no Steam (Propriedades → Arquivos instalados → Verificar integridade) para garantir que a transferência foi íntegra.

## Pontos-chave

- O Steam move jogos nativamente e mantém saves (no disco interno) separados.
- A biblioteca no cartão fica em `steamapps/` com `common`, `compatdata`, `shadercache` e manifestos `.acf`.
- Jogos não-Steam você move com `mv` e depois atualiza o caminho na ferramenta (Heroic, EmuDeck).
- microSD é mais lento que NVMe: jogos pesados ficam melhor no interno; indies/ROMs no cartão.
- Valide a integridade dos arquivos após mover; confira espaço com `df -h`.

## Exercícios

1. Mova um jogo Steam do SSD para o microSD pela interface e confirme em `steamapps/common/`.
2. Liste o conteúdo de `steamapps/` do cartão e identifique `compatdata` e `shadercache`.
3. Mova uma pasta de ROMs para o cartão com `mv` e atualize o EmuDeck para o novo caminho.
4. Compare `df -h` antes e depois de mover um jogo grande; anote o espaço liberado no interno.
5. **Desafio.** Cronometre o carregamento de um jogo pesado no SSD vs. no microSD e relate a diferença em segundos.
