Depois de oito seções explorando cada peça do SteamInput, chegou a hora de juntar tudo. Criar um layout do zero não é sobre saber qual botão faz o quê — é sobre ter um método. Esta seção propõe um fluxo de 5 passos para ir do "baixei o jogo" ao "layout está pronto e salvo", usando tudo que o capítulo cobriu.

:::objetivos
- Aplicar um método de 5 passos para criar layouts do zero
- Escolher o template inicial certo para cada gênero de jogo
- Decidir quais ações vão para botões traseiros, touchpads e giroscópio
- Testar e iterar com ciclos curtos de "joga 10 minutos → ajusta"
- Exportar e versionar o layout finalizado
:::

## Passo 1: Escolha o template certo

Não comece do vácuo absoluto. A Valve fornece templates que já cobrem 80% do trabalho para a maioria dos gêneros. A escolha errada aqui custa horas de remapeamento depois.

| Template | Para qual gênero |
|---|---|
| `Gamepad` | Jogos com suporte nativo a controle (ação, plataforma, fighting) |
| `Keyboard (WASD) and Mouse` | FPS e jogos que esperam teclado + mouse |
| `Gamepad with Mouse Trackpad` | TPS e ação com elemento de mira livre |
| `Gamepad with Joystick Trackpad` | Condução, voo, esportes |
| `Gamepad with High Precision Camera` | FPS competitivo com giroscópio já configurado |

```text
No editor de layout: 
  → Selecionar template
  → "Gamepad with High Precision Camera" (para um FPS)
  → Aplicar
```

:::dica
Para jogos antigos que só reconhecem teclado (ex.: Doom original, Diablo II), comece com `Keyboard (WASD) and Mouse`. O SteamInput vai emular teclado para o jogo, que nem saberá que um controle está conectado.
:::

## Passo 2: Identifique as ações críticas

Jogue o jogo por 15 minutos com o template escolhido. Durante essa sessão, anote (mentalmente ou num papel) toda ação que você precisou fazer mais de 3 vezes e que exigiu:

- Tirar o polegar do analógico direito (mirar) para apertar um botão
- Fazer um malabarismo de dedos (ex.: segurar `X` enquanto aperta `Y`)
- Parar de se mover para selecionar algo

Essas ações são as candidatas prioritárias a serem movidas para botões traseiros, touchpads e giroscópio. O critério não é "o que seria legal ter" — é "o que está me atrapalhando agora".

```text
Exemplo — Elden Ring, primeiros 15 minutos:
  1. Correr (segurar B) e controlar câmera (analógico direito) ao mesmo tempo → dor
  2. Trocar item rápido (seta para baixo) exige tirar o polegar do analógico → dor
  3. Usar frasco de cura (X) no meio do combate → ok, já está acessível
```

## Passo 3: Distribua as ações nos recursos disponíveis

Com a lista de ações críticas em mãos, atribua cada uma ao recurso físico que faz sentido:

| Recurso | Quantidade | Melhor para |
|---|---|---|
| Botões traseiros (grip) | 4 (L4, L5, R4, R5) | Ações que exigem manter o polegar nos analógicos |
| Touchpad esquerdo | 1 | Radial menu, touch menu, mouse region |
| Touchpad direito | 1 | Mouse, radial menu, scroll |
| Giroscópio | 1 | Mira fina, seleção gestual |
| Camadas (hold) | Ilimitado | Modos temporários (correr, mirar, menu rápido) |

A regra de ouro: **ação que compete com o analógico direito → botão traseiro**. Ação que compete com o analógico esquerdo → touchpad esquerdo. Ação que é um menu de opções → radial menu.

```text
Para o exemplo de Elden Ring:
  Correr (B)                → L4 (botão traseiro, hold)
  Trocar item (↓)           → Radial menu de 4 setores no touchpad esquerdo
  Mira fina (arco)          → Giroscópio, ativação Touch no pad direito
  Usar frasco (X)           → permanece em X (já acessível)
```

## Passo 4: Itere em ciclos curtos

Não passe 2 horas configurando e depois vá jogar. O ciclo produtivo é:

```text
Jogar 10 minutos → identificar 1 atrito → ajustar 1 coisa → repetir
```

Cada ciclo dura ~12 minutos e resolve um problema concreto. Depois de 4 ou 5 ciclos, você tem um layout personalizado que resolve os seus problemas reais, não problemas hipotéticos.

:::atencao
Resista à tentação de "deixar perfeito antes de testar". Layouts são como código: o teste revela o que a teoria não previu. Seu cérebro em jogo é um animal diferente do seu cérebro no editor.
:::

## Passo 5: Salve, exporte e versione

Quando o layout estiver estável (3 a 5 sessões de jogo sem ajustes), salve-o com um nome descritivo e exporte-o para o Workshop ou para backup local.

```terminal
## Backup local do layout (cópia do arquivo .vdf):
$ mkdir -p ~/backups/steam-layouts
$ find ~/.local/share/Steam/userdata -name '*.vdf' -path '*local*' -newer ~/backups/steam-layouts -exec cp {} ~/backups/steam-layouts/ \;
$ ls ~/backups/steam-layouts/
elden_ring_deck_br.vdf
```

O comando copia todo `.vdf` de layout pessoal mais recente que a pasta de backup para um local seguro. Se o Steam redefinir suas configurações (acontece em updates beta), você restaura de lá.

Para confirmar que o backup foi criado e inspecionar o conteúdo salvo:

```terminal
$ ls -la ~/backups/steam-layouts/
total 28
drwxr-xr-x 2 deck deck  4096 mar 15 14:22 .
drwxr-xr-x 5 deck deck  4096 mar 15 14:20 ..
-rw-r--r-- 1 deck deck 18234 mar 15 14:22 elden_ring_deck_br.vdf

$ head -5 ~/backups/steam-layouts/elden_ring_deck_br.vdf
"controller_mappings"
{
    "version"    "3"
    "revision"   "5"
    "title"      "Ana Souls Deck v1"
```

E para listar todos os layouts pessoais que você já criou, o `find` com o padrão de caminho certo revela a coleção:

```terminal
$ find ~/.local/share/Steam/userdata -name '*.vdf' -path '*local*' -exec grep -l '"title"' {} \; 2>/dev/null | while read f; do echo "--- $f"; grep '"title"' "$f"; done
--- /home/deck/.local/share/Steam/userdata/12345678/config/controller_configs/440/local/meu_layout.vdf
    "title"      "Meu CS2 com Giro"
--- /home/deck/.local/share/Steam/userdata/12345678/config/controller_configs/730/local/deck_souls.vdf
    "title"      "Ana Souls Deck v1"
```

Cada arquivo é um layout independente; o título dentro do `.vdf` é o que aparece no seletor de layouts do Steam.

O nome que você dá ao layout no editor é o que vai para o campo `title` do `.vdf` e também é o nome que aparece no Workshop se você publicar:

```text
Nome do layout: "Ana Souls Deck v1"
Descrição: "Correr no L4, radial de itens no pad esquerdo, giro no touch. 
            Otimizado para jogar sem tirar os polegares dos analógicos."
Exportar: Workshop (opcional) + backup local
```

:::info
Se você publicar no Workshop, o layout ganha versionamento automático: cada atualização incrementa a revisão. Mas o backup local é seu seguro contra perda — a Valve não restaura arquivos deletados da sua máquina.
:::

## O método inteiro num diagrama

```text
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐    ┌───────────┐
│ 1. Template  │ →  │ 2. Jogar 15  │ →  │ 3. Distribuir│ →  │ 4. Iterar   │ →  │ 5. Salvar │
│    certo     │    │ min e anotar │    │ nos recursos │    │ 10 min cada │    │ e exportar│
└─────────────┘    └──────────────┘    └──────────────┘    └────────────┘    └───────────┘
```

Esse método funciona para qualquer gênero e qualquer jogo. O que muda são as ações críticas e os recursos escolhidos — o processo é o mesmo. Depois de 3 ou 4 layouts criados assim, você internaliza o fluxo e consegue montar um layout funcional em menos de uma hora.

## Resumo

- Comece sempre com um template da Valve; escolha pelo gênero: `Gamepad` para ação, `KBM` para FPS antigos, `High Precision Camera` para FPS modernos.
- Jogue 15 minutos para identificar ações que competem com os polegares; essas são as prioritárias.
- Ação que compete com analógico direito → botão traseiro. Menu de opções → radial menu. Mira fina → giroscópio.
- Itere em ciclos de 10 minutos: jogue, encontre um atrito, ajuste, repita.
- Salve o layout com nome descritivo e faça backup local do `.vdf`; publique no Workshop se quiser compartilhar.
- O método de 5 passos é transferível: funciona para FPS, RPG, RTS, simulação e qualquer gênero com suporte a SteamInput.

## Exercícios

1. Escolha um jogo que você nunca configurou. Siga o método de 5 passos: template, 15 min, distribuição, 3 ciclos de iteração, salvamento. Cronometre o tempo total gasto.
2. Compare o layout final com o template original. Quantas alterações você fez? Elas correspondem aos atritos que você anotou no passo 2?
3. Faça backup do seu layout com o comando `find` + `cp` mostrado acima. Depois, simule uma restauração copiando o `.vdf` de volta e verificando se ele aparece no editor.
4. Troque de layout com um amigo que tenha o mesmo jogo. Jogue por 20 minutos com o layout dele e anote o que funciona para você e o que não funciona.
5. **Desafio.** Crie um layout para um jogo que não tem suporte nativo a controle (ex.: um RTS antigo ou um city-builder). Use tudo que o capítulo ensinou: mouse region para o painel de construção, radial menu para comandos de esquadrão, camadas para modos de jogo, e toggle para atalhos de UI. Documente o processo em um arquivo de texto e guarde junto com o backup.