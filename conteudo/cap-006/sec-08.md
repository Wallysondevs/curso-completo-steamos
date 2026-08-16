O Modo Jogo é personalizável — não ao ponto de virar um desktop, mas o suficiente para parecer seu: tema da interface, ordem da biblioteca, idioma, fonte, teclado virtual, controles. Quase tudo que você muda aqui vira uma entrada no `localconfig.vdf` ou num arquivo de config por jogo. Entender onde essas escolhas são gravadas permite restaurar, transferir e até "resetar" a interface sem perder os jogos.

:::objetivos
- Personalizar aparência, idioma e teclado virtual do Modo Jogo
- Entender a camada de preferências por usuário e por jogo
- Localizar as preferências persistidas no `localconfig.vdf`
- Restaurar padrões sem reinstalar o Steam
- Ajustar os controles (Steam Input) por jogo e globalmente

:::

## Aparência e idioma

Duas categorias dominam a personalização visual: **tema/acento de cor** e **idioma**. O Steam permite trocar o idioma da interface independente do teclado, e algumas versões do Deck oferecem um seletor de cor de destaque. Essas mudanças são instantâneas e afetam só a interface — nunca os jogos (que têm seus próprios idiomas internos).

O idioma da interface não é armazenado num arquivo binário misterioso: é uma preferência do cliente, gravada junto às demais no `localconfig.vdf`. Você pode vê-la:

```terminal
$ grep -iE 'language|"Language"' ~/.steam/steam/userdata/76561198000000000/config/localconfig.vdf | head -6
```

A chave `Language` controla o idioma da interface (e em alguns setups a região da loja). Junto dela vivem outras preferências de exibição — escala de interface, dicas de botão, etc. A regra mental que vale para o capítulo inteiro se repete: **tudo é texto num arquivo VDF**.

## O teclado virtual e a fonte

O teclado virtual (`[[Steam]]`+`[[X]]`) tem temas próprios: claro, escuro, compacto, completo, e a opção de mostrar ou não a fila de números. Ele é um componente do Steam (não do Gamescope), então suas preferências ficam no escopo do cliente. A **fonte** da interface também é ajustável num seletor de escala/texto, útil para quem tem a tela pequena de vista.

| Preferência | Onde fica na UI | Persistência |
|---|---|---|
| Idioma da interface | Configurações → Idioma | `localconfig.vdf` (chave `Language`) |
| Tema do teclado | Configurações → Teclado | `localconfig.vdf` |
| Escala/fonte | Configurações → Exibição | `localconfig.vdf` |
| Favoritos/coleções | Biblioteca | `localconfig.vdf` + `shortcuts.vdf` |

:::dica
Quer "resetar" a interface sem perder jogos? Saia do Steam, renomeie o `localconfig.vdf` para `localconfig.vdf.bak` e reinicie. O Steam recria o arquivo com padrões. Se algo ficou estranho só numa config, você restaura da cópia. Os jogos em `steamapps` não são afetados porque vivem fora do `userdata`.
:::

## Steam Input: controles por jogo e globais

O maior trunfo de personalização do Deck é o **Steam Input**, o sistema que mapeia os botões do gamepad para ações, em camadas: há um layout **global** (vale para a interface e para jogos sem config própria) e layouts **por jogo** (sobrepõem o global). Você também pode definir zonas mortas do analógico, resposta do giroscópio e os *pads* traseiros.

Essas configurações de input são ricas e não cabem num único arquivo simples — o Steam as guarda sob `userdata/<steamid>/config/controller_configs/`:

```terminal
$ ls -R ~/.steam/steam/userdata/76561198000000000/config/controller_configs/ 2>/dev/null | head -20
/home/deck/.steam/steam/userdata/76561198000000000/config/controller_configs/:
413150
413150/config
413150/config/local.vdf

/home/deck/.steam/steam/userdata/76561198000000000/config/controller_configs/apps:
```

Cada subdiretório com um `appid` (aqui `413150`, o Stardew Valley) guarda o layout personalizado daquele jogo. O `local.vdf` dentro dele é o mapa de botões daquele título. Jogos sem diretório usam o global (`controller_configs/` raiz ou outro arquivo de padrão). É a prova de que a personalização por jogo é "arquivo por appid" — fiel ao padrão que você já viu duas vezes.

## Perfis de desempenho por jogo

Além do input, você pode fixar perfil de **desempenho por jogo**: limite de FPS, TDP (consumo), escala FSR e taxa de atualização. Isso é configurado no menu `...` → Desempenho → "Perfil por jogo", e o Steam lembra a escolha quando aquele título subir de novo. Como parte dessas escolhas é função do Gamescope, elas não estão todas no `localconfig.vdf` — o Steam as escreve em arquivos de perfil dentro da própria árvore do cliente.

```terminal
$ grep -rniE 'fps|tdp|gameui|perf' ~/.steam/steam/userdata/76561198000000000/config/ 2>/dev/null | head -8
```

O resultado aponta para as chaves de desempenho, misturadas às demais preferências. O ponto pedagógico não é memorizar a chave exata, mas internalizar a arquitetura: **preferência visual e social → `localconfig.vdf`; controle → `controller_configs/`; desempenho → perfis no mesmo escopo de `config/`** — tudo sob `userdata/<steamid>`.

## Transferindo e restaurando suas preferências

Como tudo vive em `userdata/<steamid>/`, um backup do diretório `userdata` transporta, para outro Deck ou reinstalação, praticamente toda a sua identidade de interface: coleções, favoritos, configs de controle, capturas de tela (via `760/remote/`) e playtime local. O comando mais confiável é copiar o diretório inteiro com o Steam fechado:

```terminal
$ rsync -av ~/.steam/steam/userdata/ /mnt/backup/userdata/
```

No destino, você restaura com o caminho inverso. Dois cuidados:

1. **Feche o Steam antes de copiar/restaurar.** Arquivos VDF escritos durante o uso podem ficar inconsistentes se copiados no meio de uma escrita.
2. **O SteamID precisa bater.** As preferências são vinculadas ao `steamid`; se a conta mudar, a pasta muda de nome e a restauração precisa ser feita para a pasta nova.

:::atencao
Não restaure `userdata` de uma conta anti-cheat-bloqueada ou de outra máquina com SteamID diferente esperando "puxar" configs de outra pessoa. O SteamID64 é a chave; pastas de contas diferentes não se misturam.
:::

## Resumo

- Idioma, tema, teclado virtual e escala da interface são persistidos no `localconfig.vdf`.
- Renomear `localconfig.vdf` reseta a interface sem apagar jogos (que vivem em `steamapps`).
- O Steam Input guarda layouts por jogo em `controller_configs/<appid>/config/local.vdf`.
- Perfis de desempenho por jogo combinam funções do Gamescope e do cliente Steam.
- Backup de `userdata/<steamid>/` transporta coleções, controles, capturas e playtime.
- Feche o Steam antes de copiar/restaurar `userdata`, e respeite o SteamID como chave.

## Exercícios

1. Troque o idioma da interface, observe com `grep` a mudança da chave `Language` no `localconfig.vdf` e volte ao idioma original.
2. Crie um layout de controle personalizado para um jogo e localize o diretório `controller_configs/<appid>/` correspondente.
3. Renomeie o `localconfig.vdf` para `.bak` (com o Steam fechado), reinicie e confirme que a interface voltou ao padrão; depois restaure.
4. Faça um backup de `userdata/<steamid>/` com `rsync` para uma pasta externa e liste o que ele inclui (capturas, configs, controles).
5. **Desafio.** Combine com a seção 2: crie uma coleção dinâmica e um favorito, faça o backup de `userdata`, apague `localconfig.vdf`, e restaure a partir do backup. Verifique se coleção e favorito voltaram. Explique por que o `steamapps` (jogos) não precisou ser incluído no backup.
