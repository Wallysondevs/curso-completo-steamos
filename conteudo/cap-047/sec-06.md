O EmuDeck seria útil mesmo se você tivesse que abri-lo toda vez para jogar — mas é o Steam ROM Manager que transforma a coleção de ROMs numa biblioteca de verdade, com capas, dentro do Steam. Sem ele, cada jogo é um arquivo solto numa pasta; com ele, cada jogo ganha um atalho clicável no Game Mode. Esta seção cobre o coração dessa integração.

:::objetivos
- Entender o papel dos parsers do Steam ROM Manager
- Configurar a varredura de ROMs por console
- Gerar atalhos e aplicá-los ao Steam
- Gerenciar a arte de capa e o fallback de imagens
- Atualizar os atalhos depois de adicionar ROMs novas
:::

## O que o SRM faz, em três passos

O Steam ROM Manager (SRM) é uma aplicação separada, instalada junto do EmuDeck, que percorre três etapas: **parsear** (varrer pastas de ROMs e reconhecer jogos), **gerar** (criar entradas de biblioteca com arte e parâmetros de execução) e **salvar** (escrever essas entradas no Steam, num arquivo `shortcuts.vdf` que o cliente Steam lê).

O coração do SRM são os **parsers**. Cada parser é uma regra: "na pasta `~/Emulation/roms/snes`, arquivos com extensão `.sfc` e `.smc` são jogos de Super Nintendo". O EmuDeck já entrega dezenas de parsers pré-configurados, um por console, então na maioria dos casos você não escreve nenhuma regra — só clica em "Preview" e depois em "Save to Steam".

```terminal
$ ls ~/.config/EmuDeck/backend/
romManager.json  steam_rom_manager_parsers.json
```

O `romManager.json` guarda a configuração global do SRM, e o arquivo de parsers lista, em JSON, cada regra de varredura. Vale abrir esse arquivo para entender a estrutura, mesmo que você prefira editar os parsers pela interface.

## Configurando a varredura

Na interface do SRM, cada parser aparece numa lista lateral com um checkbox. O fluxo de uso é sempre o mesmo: selecionar quais consoles você quer publicar na biblioteca, clicar em **Preview** (que roda a varredura e mostra os jogos encontrados), revisar e então **Save to Steam**.

```terminal
$ grep -o '"/run/media/deck/[^"]*"' ~/.config/EmuDeck/backend/romManager.json | head -5
"/run/media/deck/emudeck/Emulation/roms/snes"
"/run/media/deck/emudeck/Emulation/roms/gba"
"/run/media/deck/emudeck/Emulation/roms/ps2"
```

As linhas confirmam os caminhos que o SRM vai varrer. Se você moveu as ROMs para o cartão, como na seção 3, esses caminhos precisam apontar para `/run/media/deck/...` — senão a varredura volta vazia mesmo com os jogos no lugar.

:::atencao
Depois de "Save to Steam", a mudança **não aparece** até o Steam reiniciar. Feche o Steam completamente (não só a janela, mas o processo) e reabra. No Desktop Mode isso é evidente; no Game Mode, é preciso sair do jogo e, às vezes, reiniciar o modo. O erro mais comum de "meus jogos não apareceram" é simplesmente não ter reiniciado o Steam.
:::

## O arquivo shortcuts.vdf

O resultado de tudo isso é um único arquivo: `~/.steam/steam/userdata/<id>/config/shortcuts.vdf`, onde `<id>` é o seu SteamID numérico. É nele que cada atalho vira uma entrada com nome, caminho do executável, argumentos e o id da arte usada.

```terminal
$ ls ~/.steam/steam/userdata/*/config/shortcuts.vdf
/home/deck/.steam/steam/userdata/123456789/config/shortcuts.vdf
```

O formato é o Valve Data Format — chaves aninhadas, sem vírgulas. O SRM também escreve a arte (capas e banners) em `~/.steam/steam/userdata/<id>/config/grid/`, e cada atalho referencia um id de imagem dali.

:::info
O `shortcuts.vdf` é reescrito integralmente a cada "Save to Steam". Edições manuais feitas nele são perdidas no próximo salvamento do SRM. Por isso, todo ajuste deve ser feito no SRM (ou nos arquivos de config dele), nunca direto no VDF — que é tratado como saída, não como fonte.
:::

## Gerenciando a arte de capa

O SRM baixa a arte automaticamente de bancos como o SteamGridDB, mas nem todo jogo tem capa de qualidade — sobretudo homebrew e hacks de ROM. Nesses casos, você pode definir uma imagem local ou aceitar o fallback genérico com o nome do jogo.

```terminal
$ ls ~/.steam/steam/userdata/123456789/config/grid | head -6
1234567890p.png
1234567890_hero.png
1234567890_logo.png
...
```

Cada jogo gera três imagens: a capa (`.png`), o banner horizontal de herói (`_hero.png`) e o logo (`_logo.png`). O Steam usa cada uma num contexto diferente da interface. Quando a arte não baixa, o SRM ainda gera entradas, mas com um retângulo vazio — e é aí que importar manualmente uma capa resolve.

## Adicionando ROMs novas

O ponto de confusão número um do SRM é a expectativa de que ele "monitore" a pasta automaticamente. Ele não monitora: cada vez que você adiciona uma ROM, precisa rodar o Preview e o Save to Steam de novo para que o novo jogo ganhe atalho.

```terminal
$ cp meu-jogo-novo.sfc ~/Emulation/roms/snes/
$ # agora rode o SRM: Preview → Save to Steam → reinicie o Steam
```

Não há daemon rodando em segundo plano; a varredura é sempre sob demanda. Para quem adiciona ROMs com freqüência, o ritual é sempre o mesmo — e é um dos poucos lugares em que a "mágica" do EmuDeck exige uma interação manual recorrente.

## Resumo

- O SRM parseia pastas de ROMs, gera atalhos e os salva no Steam em três etapas.
- Os parsers são regras por console; o EmuDeck já entrega dezenas prontos.
- O resultado vive em `shortcuts.vdf`, que é reescrito a cada salvamento.
- A arte (capa, herói e logo) fica em `userdata/<id>/config/grid/`.
- O Steam precisa reiniciar para que os atalhos recém-gerados apareçam.
- Adicionar ROMs exige rodar Preview + Save de novo; o SRM não monitora pastas.

## Exercícios

1. Abra o SRM e identifique, na lista lateral, três parsers pré-configurados e o que cada um varre (pasta + extensões).
2. Rode o Preview de um parser e observe a lista de jogos encontrados; anote quantos itens foram detectados.
3. Localize o seu `shortcuts.vdf` (`ls ~/.steam/steam/userdata/*/config/`) e, antes de qualquer alteração, faça uma cópia de segurança dele.
4. Gere atalhos para uma pasta de ROMs de teste e confirme, após reiniciar o Steam, que eles aparecem na biblioteca no Game Mode.
5. **Desafio.** Crie um parser customizado no SRM para uma pasta fora do layout padrão (ex.: uma pasta de ROMs de hack no `~/Downloads`), aponte-o para a extensão correta e faça um jogo dela aparecer na biblioteca com arte definida manualmente.
