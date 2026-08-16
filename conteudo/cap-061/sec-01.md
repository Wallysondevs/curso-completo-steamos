O Steam Deck tem duas realidades de armazenamento que brigam entre si: o SSD interno, que nas versões mais comuns tem 64 GB ou 512 GB, e o cartão microSD, que a pessoa trata como extensão natural da biblioteca. Jogos AAA de 2024 passam fácil de 100 GB, shader cache cresce silenciosamente e prefixos Proton acumulam gigabytes por título. Entender *para onde* o espaço vai é o primeiro passo antes de sair apagando coisas no escuro.

:::objetivos
- Mapear as principais pastas que consomem disco no SteamOS
- Interpretar a saída de `df` e `du` para medir o quanto está ocupado
- Entender o layout do sistema de arquivos Btrfs e a partição home
- Identificar a diferença entre arquivos do sistema (protegidos) e dados do usuário
- Estabelecer uma ordem de investigação para diagnosticar disco cheio
:::

## Onde o SteamOS guarda as coisas

O SteamOS 3.6 (Noble) organiza o armazenamento em um esquema com duas partições principais: uma partição de sistema, montada em `/`, que fica somente leitura durante o uso normal para garantir a integridade do console, e uma partição de usuário, montada em `/home`, onde vivem seus jogos, saves e configurações.

```terminal
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4  5.0G  3.9G  1.1G  79% /
/dev/nvme0n1p8  458G  312G  146G 69% /home
/dev/mmcblk0p1  512G  203G  309G 40% /run/media/deck/0f1b2c3d
```

A primeira linha mostra a raiz do sistema (`/`), pequena e quase cheia — o que é normal e esperado, porque ela é imutável. A segunda é a que interessa: `/home`, com 312 GB usados. A terceira é o cartão microSD montado automaticamente pelo Steam. Quando alguém diz "meu Deck está cheio", quase sempre é a partição `/home` que estourou.

## Medindo com `du`

O `df` mostra o percentual da partição, mas não diz *quem* ocupa. Para isso existe o `du` (*disk usage*), que desce a árvore de diretórios somando o tamanho de cada arquivo:

```terminal
$ du -sh ~/.* ~/* 2>/dev/null | sort -hr | head -10
145G   .local/share/Steam
62G    .steam/steam
23G    Emulation
8.9G   Downloads
4.1G   .cache
```

A linha mais pesada, `.local/share/Steam`, é o coração da biblioteca Steam no Linux: é lá que ficam os jogos instalados, o shader cache e os prefixos compatdata. Repare num detalhe traiçoeiro: `.steam/steam` aparece com 62 GB porque, no SteamOS, parte do conteúdo de `.local/share/Steam` é ligada ao diretório `.steam` por links simbólicos — o `du` contou duas vezes. Para não se enganar com esse tipo de duplicidade, o `du -x` ignora outros sistemas de arquivos, mas a duplicação por *symlink* exige um pouco mais de atenção.

:::dica
Para medir sem cair na armadilha dos symlinks, rode `du -sh` em um único caminho por vez (não em `*`, que expande e soma tanto o original quanto o link). Outra opção é o `du -shL`, que segue links, mas aí você perde a distinção entre o arquivo real e o vínculo — útil só quando quer saber o tamanho final do alvo.
:::

:::atencao
No SteamOS, `.steam/steam` e `.local/share/Steam` se sobrepõem por vínculos de diretório. Se você somar os dois achando que são pastas independentes, vai superestimar o consumo. Ao medir, investigue uma de cada vez e confirme com `du -sh` em cada caminho *real*.
:::

## O que engorda com o tempo

Existem quatro vilões recorrentes no Deck, cada um com seu ritmo próprio de crescimento:

1. **Jogos instalados** — o óbvio. Cada título AAA ocupa de 40 a 150 GB. Desinstalar é a alavanca de maior retorno.
2. **Shader cache** — o Steam baixa e compila shaders Vulkan/DXVK específicos da sua GPU. Fica em `.local/share/Steam/steamapps/shadercache`, e cresce silenciosamente mesmo quando você não joga há meses.
3. **compatdata** — para cada jogo Windows rodado via Proton, o Steam cria um "prefixo" Wine completo: uma mini-instalação com diretórios `drive_c`, registry e DLLs. São centenas de megabytes a gigabytes por título.
4. **Downloads e arquivos órfãos** — instaladores `.run`, ROMs baixadas, backups e o conteúdo da pasta `Downloads` que nunca foi movido.

## Btrfs e a pegadinha do Copy-on-Write

O SteamOS usa Btrfs, um sistema de arquivos Copy-on-Write (COW). Diferentemente do ext4, quando você modifica um arquivo, o Btrfs não sobrescreve o bloco original — ele escreve a nova versão num bloco livre e só depois libera o antigo. Isso dá segurança (snapshots, rollback), mas tem um efeito colateral que interessa a quem administra espaço: o sistema precisa de **blocos livres contínuos** para qualquer escrita, mesmo as pequenas.

Na prática, um disco com 95% de ocupação em Btrfs se comporta *pior* do que um ext4 com os mesmos 95%. Você pode ser incapaz de renomear um arquivo, de atualizar um jogo ou até de fazer login, porque não há blocos livres suficientes para a operação COW. Por isso a regra prática do Deck é nunca deixar a partição `/home` passar de 90% de uso.

```terminal
$ sudo btrfs filesystem usage /home
Overall:
    Device size:                 458.00GiB
    Device allocated:            402.00GiB
    Device unallocated:           56.00GiB
    Device missing:                0.00GiB
    Used:                        383.00GiB
    Free (estimated):             71.00GiB      (min: 43.00GiB)
    Data ratio:                    1.00
    Metadata ratio:                2.00
    Global reserve:              512.00MiB      (used: 0.00MiB)
```

O campo `Free (estimated)` com valor menor que o `unallocated` é outra idiossincrasia do Btrfs: o espaço "livre" que você vê em `df` nem sempre é o espaço que o Btrfs considera realmente disponível, por causa dos metadados duplicados (`Metadata ratio: 2.00`) e da reserva global. É mais um motivo para manter folga.

## Uma ordem de investigação

Em vez de apagar por impulso, siga uma sequência progressiva que vai do mais seguro para o mais agressivo:

```terminal
$ df -h /home
$ du -sh ~/.local/share/Steam/steamapps/shadercache
$ du -sh ~/.local/share/Steam/steamapps/compatdata
$ du -sh ~/Downloads
$ du -sh ~/.local/share/Steam/steamapps/common
```

Esse roteiro responde, em cinco comandos, se o problema é shader cache, prefixo Proton, lixo baixado ou simplesmente biblioteca grande demais. A partir do diagnóstico, cada capítulo seguinte deste capítulo ataca uma dessas frentes com a ferramenta certa.

## Resumo

- A partição que importa para "espaço cheio" é `/home`, não a raiz imutável do sistema.
- `df -h` mede o percentual usado; `du -sh` mede quem ocupa dentro de um caminho.
- `.local/share/Steam` concentra jogos, shader cache e compatdata.
- `.steam/steam` se sobrepõe à biblioteca por symlink — não some os dois.
- Os quatro maiores consumidores são: jogos, shader cache, prefixos Proton e Downloads.

## Exercícios

1. Rode `df -h` e identifique qual partição está mais cheia; escreva qual delas corresponde ao seu caso de "Deck cheio".
2. Liste os dez maiores itens da sua home com `du -sh ~/.* ~/* | sort -hr | head -10`.
3. Confirme a sobreposição: rode `du -sh ~/.local/share/Steam` e `du -sh ~/.steam/steam` e discuta por que somá-los seria errado.
4. Rode os cinco comandos da "ordem de investigação" e anote, para cada um, qual valor indica a causa provável do consumo.
5. **Desafio.** Sem instalar nada novo, estime quanto espaço você recuperaria desinstalando os dois jogos maiores — compare sua conta com o `du -sh` de cada pasta em `steamapps/common`.
