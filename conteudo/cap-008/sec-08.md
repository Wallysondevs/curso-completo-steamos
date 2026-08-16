A raiz do SteamOS é somente leitura. Essa afirmação, repetida em vários pontos do curso, costuma gerar uma pergunta inevitável: "Mas como eu atualizo, então, se não posso escrever na raiz?" A resposta revela a engenharia por trás do sistema imutável — e o perigo delicado de desligar a proteção para fazer gambiarras. Esta seção explica como atualização e imutabilidade convivem, e o que acontece quando alguém (você) força a escrita.

:::objetivos
- Entender como a atualização contorna a raiz somente leitura
- Saber o que `steamos-readonly disable/enable` faz e por que evitar
- Compreender a mudança no modelo de atualização na transição para a base Debian (partições e Btrfs)
- Ver o layout Btrfs do sistema com `btrfs filesystem show`
:::

## Imutável, mas não estático

A raiz (`/`) do SteamOS é montada somente leitura **em tempo de execução**. Isso significa que, com o sistema rodando, nenhum processo — nem você — consegue gravar em `/usr`, `/bin`, `/etc` sem antes desligar a proteção. É uma cerca, e ela existe para proteger a imagem contra corrupção acidental e contra malware.

Mas a atualização precisa, obviamente, escrever no sistema. Como isso é possível? A resposta está no **momento** e no **alvo** da escrita. A atualização não escreve na partição **ativa** (que está montada e em uso, com a proteção ligada). Ela escreve na partição **inativa**, que não está montada como raiz e, portanto, não está sob a trava de somente leitura. É como trocar o pneu do carro parado: você não mexe no pneu que está girando, mexe no estepe.

Então a frase correta não é "o sistema é imutável", mas "o sistema **em execução** é imutável; a atualização troca o sistema por uma imagem nova quando ele não está rodando". A imutabilidade e o esquema A/B são duas faces da mesma moeda: sem a segunda dupla de partições, não haveria onde gravar a imagem nova; sem a trava de somente leitura, a partição ativa poderia ser corrompida antes da troca.

## Desligar a proteção: por que e por que não

O SteamOS oferece uma válvula de escape: `steamos-readonly disable`. Ele remonta a raiz em modo leitura-escrita, permitindo modificar o sistema livremente. É um recurso que existe para casos legítimos — instalar um driver manual, corrigir um arquivo de configuração específico, depurar.

```terminal
$ steamos-readonly status
Read-only filesystem is enabled.
$ sudo steamos-readonly disable
Read-only filesystem is disabled.
$ steamos-readonly status
Read-only filesystem is disabled.
```

Depois de mexer, você religa:

```terminal
$ sudo steamos-readonly enable
Read-only filesystem is enabled.
```

O problema é que **qualquer coisa que você grave na raiz com a proteção desligada**:

- será apagada na próxima atualização (que reescreve a imagem limpa sobre a partição);
- invalida a "pureza" da imagem, dificultando o diagnóstico de problemas;
- e, se for algo errado, pode impedir o boot — e aí o rollback não salva, porque o rollback só troca de partição, não desfaz suas gravações manuais.

Por isso o `steamos-readonly disable` é tratado como ferramenta de última instância, e não como rotina. No Steam Deck, o caminho recomendado para instalar software extra não é desligar a proteção, e sim usar Flatpak (que instala em `/home` e `/var`, fora da imagem imutável).

:::atencao
A proteção de somente leitura é restabelecida automaticamente a cada boot e a cada atualização. Ou seja, `steamos-readonly disable` vale **só para a sessão atual**. Se você desligar a proteção, fizer uma alteração e reiniciar **sem** reativar, a proteção volta sozinha — mas a alteração que você gravou continua lá (até a próxima atualização apagar).
:::

## Um parêntese histórico: a mudança para o Debian

Até a geração SteamOS 3.x (base Arch), a imutabilidade era implementada com o binário `steamos-readonly` atuando sobre a montagem da raiz, num particionamento A/B fixo. Na transição para a base **Debian** (SteamOS 4 e além, já anunciada pela Valve para o futuro), o modelo evoluiu para algo mais moderno: o sistema usa **Btrfs** com *snapshots* (instantâneos) e subvolumes, em vez de apenas duas partições espelhadas.

Isso não é contradição — é a mesma filosofia de atualização segura, reimplementada com ferramentas melhores. O Btrfs permite criar um snapshot do sistema inteiro em segundos (por ser *copy-on-write*), aplicar a atualização sobre um subvolume, e reverter instantaneamente para o snapshot anterior se algo der errado. O princípio "nunca atualize por cima do sistema em uso; mantenha sempre uma cópia boa" permanece idêntico. Só a mecânica muda.

Para enxergar isso, o `btrfs filesystem show` lista os sistemas de arquivos Btrfs presentes no disco:

```terminal
$ sudo btrfs filesystem show
Label: 'steamos'  uuid: 9c4f2a1d-8b7e-4c3a-9f2d-1e5a7b3c0d4e
	Total devices 1 FS bytes used 6,82GiB
	devid    1 size 50,00GiB used 13,64GiB path /dev/nvme0n1p3

Label: 'home'  uuid: 5d8e3b2c-1a4f-4b9e-8c7d-0e2f6a9b5c1d
	Total devices 1 FS bytes used 287,00GiB
	devid    1 size 456,00GiB used 287,00GiB path /dev/nvme0n1p8
```

Aqui aparecem dois sistemas Btrfs: o do sistema (`steamos`, na partição 3) e o de dados (`home`, na partição 8). O campo `FS bytes used` de 6,82 GiB no sistema reflete o espaço real ocupado — que, por causa do copy-on-write, pode ser bem menor que o tamanho lógico dos snapshots somados (dois snapshots quase idênticos compartilham blocos em vez de duplicá-los).

:::info
Se a sua máquina ainda roda SteamOS 3.6 (base Arch), o `btrfs filesystem show` pode não retornar nada, porque o sistema usa outro esquema (ext4 ou similar) nas partições. O comando ganha relevância nas versões mais novas, com base Debian. A lógica de imutabilidade, porém, não muda: a proteção continua lá, seja por `steamos-readonly`, seja por subvolumes somente leitura do Btrfs.
:::

## Atualização e imutabilidade, juntas

O quadro completo, então, é este: a imutabilidade protege o sistema **enquanto ele roda**; a atualização troca o sistema **quando ele não roda** (escrevendo na partição inativa ou num subvolume novo); e o rollback devolve a versão boa **porque a cópia anterior nunca foi tocada**. São três mecanismos que só funcionam juntos — e é por isso que desligar a proteção e gravar na raiz é correr na contramão do design inteiro.

Na próxima (e última) seção, você verá a ferramenta que fecha o raciocínio: o `rauc status`, que reporta o estado das duas partições e qual delas é a "boa" — a prova concreta de que o sistema mantém, o tempo todo, uma segunda via em que confiar.

## Resumo

- A raiz é somente leitura em tempo de execução; a atualização escreve na partição inativa, fora da trava.
- `steamos-readonly disable/enable` controla a proteção, mas deve ser usado como último recurso.
- Alterações manuais na raiz são apagadas na próxima atualização.
- A base Debian troca o A/B fixo por Btrfs com snapshots, mantendo a mesma filosofia.
- `btrfs filesystem show` lista os sistemas Btrfs do disco e seu uso real.

## Exercícios

1. Confira o estado da proteção com `steamos-readonly status`. Descreva o que `enabled` significa em termos de escrita.
2. Execute `sudo btrfs filesystem show` e anote os sistemas de arquivos listados (ou a ausência deles, se sua base for Arch).
3. Se a sua máquina suporta Btrfs, compare o `FS bytes used` do sistema com o tamanho da partição no `lsblk`. A diferença (se houver) faz sentido por causa do copy-on-write? Explique.
4. Pesquise a justificativa da Valve para tornar a raiz somente leitura no Steam Deck. Escreva dois motivos em frases próprias.
5. **Desafio.** Simule mentalmente: você roda `sudo steamos-readonly disable`, instala um binário em `/usr/local/bin`, reinicia e depois aceita uma atualização. Em que momento seu binário manual desaparece — e por que o rollback **não** o recupera? Relacione com o que você aprendeu sobre partições A/B e checkout.