Todo jogo do Steam Deck chega com um layout de controle pronto. A Valve distribui um template oficial para praticamente tudo, e ainda assim a comunidade produz milhares de alternativas para cada título. Saber a diferença entre um *layout oficial*, um *template* e um *community layout* — e como um layout navega entre essas categorias — evita ficar refém de uma configuração ruim que você baixou sem querer.

:::objetivos
- Distinguir layout oficial, template e layout da comunidade
- Navegar pelo seletor de layouts na interface do deck
- Encontrar e comparar layouts da comunidade para um jogo
- Exportar e fazer backup de um layout como arquivo `.vdf`
:::

## Os três tipos de layout

Um **layout** é um mapeamento completo de controles para um jogo específico. Um **template** é o mesmo tipo de mapeamento, mas genérico — pensado para um gênero (FPS, plataforma, direção), não para um jogo. E a terceira categoria é o **layout da comunidade**: um layout criado por outro usuário e compartilhado publicamente, que você pode adotar, editar e, por sua vez, republicar.

A hierarquia de escolha, quando você abre um jogo, costuma ser esta: primeiro o layout oficial da Valve (se existir), depois os templates genéricos do Steam Input, e por fim os layouts da comunidade. A ordem importa porque o layout oficial já foi testado pela Valve para aquele hardware específico, enquanto um layout da comunidade pode ter sido feito para um controle totalmente diferente do seu.

<terminal>
$ ls ~/.local/share/Steam/config/controller_configs/438700 2>/dev/null
SteamControllerGamepad.vdf
workshop
$ ls ~/.local/share/Steam/config/controller_configs/438700/workshop 2>/dev/null
2857644748_SteamControllerGamepad.vdf
2974102155_SteamControllerGamepad.vdf
</terminal>

Os arquivos de `workshop` seguem o padrão `<SteamID>`_`<arquivo>`. O número antes do primeiro travessão é o SteamID do autor/origem daquele item da Oficina Steam. Ou seja, aqueles dois layouts ali não foram feitos por você nem pela Valve — vieram da comunidade, e o nome do arquivo preserva de quem.

## O layout oficial e o botão "Gamepad"

O **Gamepad with Mouse Trackpad** é o template que a Valve considera o padrão de fábrica do deck, e ele ilustra bem a filosofia oficial: alavancas e botões funcionam como um controle comum, mas o touchpad direito vira mouse, e o esquerdo pode abrir menu radial. É o layout que a maioria dos jogos sem suporte nativo recebe automaticamente.

<terminal>
$ grep -i "config loaded\|template\|official" ~/.local/share/Steam/logs/controller_ui.txt 2>/dev/null | tail -8
[Steam Input] Config loaded: official gamepad template
[Steam Input] Config loaded: official gamepad template
[Steam Input] Config loaded: 1389032 (official Steam Deck template)
[Steam Input] No recommended config; falling back to "Gamepad with Camera Controls"
</terminal>

A última linha revela um comportamento importante: quando a Valve **não** tem um layout recomendado para aquele jogo, o Steam Input não te deixa sem nada — ele cai num *fallback* automático ("Gamepad with Camera Controls"). É por isso que praticamente nenhum jogo abre "sem controle": existe sempre uma rede de segurança.

:::nota
O template oficial de fabrica do deck é conhecido internamente como "Gamepad with Mouse Trackpad". O fallback "Gamepad with Camera Controls" existe porque muitos jogos de ação mapeiam a câmera no analógico direito, e o template replica isso com sensibilidade ajustada.
:::

## Escolhendo um layout da comunidade

Na interface do deck, o caminho é: abra o jogo, aperte o botão Steam (ou `[[Steam]]`), entre em **Controles / Controller Settings** e toque no layout atual. Você verá abas para **Official**, **Templates** e **Community**. A aba Community lista layouts ordenados por tempo de uso coletivo, com votos e um botão para ver detalhes.

Escolher um layout da comunidade é quase sempre seguro, mas vale uma verificação antes de adotar às cegas:

- Veja para qual **tipo de controle** o autor desenhou aquele layout. Um layout feito para "Steam Controller" pode desperdiçar recursos do deck e vice-versa.
- Confira se o layout usa **giroscópio** e de que forma. Alguns ativam o gyro o tempo todo; outros só quando você toca o touchpad.
- Teste a **ação de cada botão** por alguns minutos antes de mergulhar no jogo de verdade.

<terminal>
$ ls -la ~/.local/share/Steam/config/controller_configs/personalization 2>/dev/null
total 16
drwxr-xr-x  2 deck deck 4096 Jan 14 10:02 .
drwxr-xr-x  4 deck deck 4096 Jan 14 10:02 ..
-rw-r--r--  1 deck deck  712 Jan 14 10:02 Preferences.vdf
</terminal>

O arquivo `Preferences.vdf` registra suas preferências globais de controle, como em que ordem os layouts salvos aparecem e quais templates você fixou. É o único arquivo da pasta `personalization`. Mexer nele à mão raramente compensa; ele está aqui mais como ponto de referência para backup.

## Exportando e preservando um layout

Tudo o que você configura fica salvo no seu perfil, mas só naquela máquina (ou na nuvem do Steam, se a sincronização estiver ligada). Para guardar uma cópia física, com fins de backup ou para compartilhar manualmente, você copia o `.vdf` correspondente.

<terminal>
$ mkdir -p ~/lab/layouts-backup
$ cp ~/.local/share/Steam/config/controller_configs/1172470/SteamControllerGamepad.vdf ~/lab/layouts-backup/
$ ls -l ~/lab/layouts-backup/
total 8
-rw-r--r--  1 deck deck 1824 Jan 15 18:40 SteamControllerGamepad.vdf
</terminal>

Copiar o `.vdf` não "publica" o layout na comunidade — para isso é preciso usar o botão **Export**/**Share** dentro da interface de configuração, que envia o layout para a Oficina Steam e gera um link público. O arquivo copiado serve para restauração local: se você formatar o deck ou perder a sincronização, basta devolver o `.vdf` ao diretório do AppID correto.

:::atencao
O campo `controller_type` dentro do `.vdf` descreve para qual controle o layout foi escrito. Se você copiar um layout de outra máquina cujo controle é diferente do seu, o Steam Input vai tentar reaproveitar o que for compatível e ignorar o resto — nem sempre com bom resultado. Prefira layouts do mesmo tipo de controle.
:::

## Resumo

- Layout é um mapeamento para um jogo; template é um mapeamento genérico por gênero; layout da comunidade é criado por outro usuário.
- O template de fábrica do deck é o "Gamepad with Mouse Trackpad".
- Sem layout recomendado, o Steam Input aplica um fallback automático — por isso jogos não abrem "sem controle".
- Arquivos em `controller_configs/<AppID>/workshop/` indicam layouts vindos da comunidade, com o SteamID do autor no nome.
- Copiar `.vdf` preserva o layout localmente; publicar na comunidade exige o botão de compartilhamento da interface.

## Exercícios

1. Abra um jogo qualquer e navegue até Controller Settings. Anote qual layout está ativo e em qual aba (Official, Templates ou Community) ele se encontra.
2. Liste o conteúdo de `~/.local/share/Steam/config/controller_configs/` e identifique, para cada AppID, se existe um subdiretório `workshop`.
3. Escolha um layout da comunidade de um jogo que você joga e leia os três primeiros comentários na página de detalhes. O que os usuários mais elogiam ou reclamam?
4. Faça um backup do layout oficial de um jogo com `cp` para `~/lab/layouts-backup/` e abra o arquivo com `head` para conferir o campo `title`.
5. **Desafio.** Com dois arquivos `.vdf` de jogos diferentes abertos, localize o campo `controller_type` em cada um. Em seguida, explique por que um layout escrito para `controller_steamcontroller_gordon` (Steam Controller) pode se comportar de forma diferente no deck, mesmo que o jogo seja o mesmo.
