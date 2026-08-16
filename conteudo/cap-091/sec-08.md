Entre a reimagem total e a reinstalação que mantém tudo, existe a operação que só apaga os seus dados e deixa o sistema intocado: o "Clear local user data". É o botão para quem quer devolver o Deck a um estado limpo de uso — para revenda pessoal, empréstimo, preparação de um aparelho de substituição ou simplesmente recomeçar sem o peso de reinstalar o sistema inteiro. Entender exatamente o que ele apaga (e o que não apaga) é essencial, porque a fronteira entre "dados" e "sistema" no SteamOS nem sempre é óbvia à primeira vista.

:::objetivos
- Executar a limpeza de dados locais do usuário
- Compreender o que essa operação apaga e o que preserva
- Distinguir "Clear local user data" de reimagem e reinstalação
- Avaliar se a operação é segura para revenda ou se exige reimagem
:::

## O que exatamente é "dado local do usuário"

No SteamOS, "dado do usuário" significa o conteúdo da partição `/home`, montada em `nvme0n1p8` no Deck. É onde vivem:

- Jogos instalados (que ficam em `/home/deck/.local/share/Steam/steamapps`).
- Saves de jogos que **não** usam cloud (ficam em `/home/deck/.local/share` ou em caminhos específicos por jogo).
- Configurações do KDE Plasma, temas, ícones, papéis de parede.
- Arquivos pessoais no diretório do usuário (`~/Documents`, `~/Downloads`, `~/Pictures`).
- Flatpaks instalados pelo usuário (em `/home/deck/.var`).
- Senhas de Wi-Fi salvas pelo NetworkManager, sessões do navegador, chaves SSH.

Tudo isso é apagado. O que **não** é apagado é o restante: as partições de sistema (`rootfs-A`, `rootfs-B`), a EFI, o bootloader e — crucialmente — o próprio sistema operacional com sua versão e todas as atualizações aplicadas.

```terminal
$ lsblk -o NAME,SIZE,LABEL /dev/nvme0n1
NAME        SIZE LABEL
nvme0n1p8  938.5G home    <- esta é apagada e reformatada
```

A partição `home` é desmontada, reformatada em ext4 e remontada vazia. O sistema em si continua no mesmo estado: mesma versão do SteamOS, mesmos pacotes de sistema, mesmas atualizações.

:::nota
"Clear local user data" equivale, em outra distribuição, a apagar o conteúdo de `/home` e recriar o usuário. No SteamOS, como o sistema é imutável e versões são atômicas, a separação entre sistema (imutável) e usuário (mutável) é ainda mais limpa do que num Linux tradicional.
:::

## O passo a passo

A operação é a mais curta das quatro e usa uma confirmação simples:

1. Na área de trabalho de recovery, toque em **Clear local user data** (ícone de pasta com X).
2. Leia a caixa: "This will format the /home partition, removing all downloaded games and personal content on this Steam Deck. System configuration will remain in place."
3. Toque em **Proceed**.
4. Aguarde — geralmente menos de um minuto.
5. O Deck reinicia no OOBE (assistente de primeira inicialização), igual a um aparelho novo — mas com o sistema já na versão atual.

```terminal
## A ordem acontece rápido demais para observar ao vivo.
## Dentro do Terminal, o equivalente seria:
$ sudo umount /dev/nvme0n1p8
$ sudo mkfs.ext4 -L home /dev/nvme0n1p8
$ sudo mount /dev/nvme0n1p8 /home
```

O `mkfs.ext4` (ou o equivalente que o script usa, por vezes `mke2fs`) é rápido numa partição, mesmo de 938 GiB, porque formatar não zera todos os blocos de dados — apenas recria as estruturas do sistema de arquivos. Os dados antigos ficam fisicamente no disco até serem sobrescritos, o que tem implicação na seção sobre revenda.

:::atencao
A limpeza de dados **não** é uma limpeza segura no sentido forense. Como o `mkfs.ext4` não sobrescreve os blocos, alguém com ferramentas de recuperação pode, em tese, ler arquivos antigos. Se o Deck vai para terceiros e os dados são sensíveis, a reimagem também não resolve por si só — seria preciso uma sobrescrita completa (secure erase). Para revenda comum, o Clear local user data é considerado suficiente pela Valve.
:::

## Quando usar "Clear local user data"

O ícone de limpeza preenche lacunas que os outros três não cobrem:

| Você quer... | Opção certa |
|---|---|
| Apagar dados e jogos, manter o sistema atualizado | **Clear local user data** |
| Apagar dados e também zerar o sistema para a versão da caixa | Reimage |
| Manter dados e corrigir o sistema | Reinstall |
| Só diagnosticar | Terminal |

É a escolha ideal para preparar um Deck emprestado: o sistema fica na última versão estável, com todos os pacotes de sistema da Valve intactos, mas o usuário seguinte começa do zero, criando sua própria conta Steam e configurações.

```terminal
$ ## Exemplo de uso: aparelho de empréstimo.
$ ## Antes: empreste e o amigo vê seus jogos/saves.
$ ## Clear local user data -> OOBE -> amigo cria a conta dele.
```

Para revenda entre particulares, o Clear local user data é o mínimo. Alguns vendedores preferem a reimagem completa por dois motivos: ela também reinstala o sistema (eliminando qualquer modificação feita na raiz) e reconstrói as partições (eliminando qualquer esquema de dual-boot). Se você nunca mexeu no sistema além de instalar Flatpaks e jogar, o Clear local user data basta; se fez tweaks com `pacman` ou dual-boot, a reimagem é mais honesta com o comprador.

## Diferenças para reimagem e reinstalação

Confundir as três operações é o erro mais caro deste capítulo. Uma tabela comparativa final:

| Aspecto | Clear local user data | Reinstall | Reimage |
|---|---|---|---|
| Toca em `/home`? | Sim (apaga) | Não (preserva) | Sim (apaga) |
| Toca no sistema? | Não | Sim (regrava) | Sim (regrava + reparticiona) |
| Reconstroi GPT? | Não | Não | Sim |
| Dispara OOBE? | Sim | Não | Sim |
| Tempo típico | < 1 min | 10-20 min | 15-35 min |
| Remove dual-boot? | Não | Não | Sim |
| Preserva versão do sistema? | Sim | Não (imagem do USB) | Não (imagem do USB) |

A coluna que mais surpreende é a de "reconstroi GPT": apenas a reimagem mexe na tabela de partições. Tanto o Clear local user data quanto a reinstalação assumem que o layout de fábrica está íntegro — se não está, ambos falham ou produzem resultados inesperados.

```terminal
$ ## Se a GPT foi corrompida, nem Clear nem Reinstall resolvem:
$ sudo gdisk -l /dev/nvme0n1 | head -5
GPT fdisk (gdisk) version 1.0.10

Partition table scan:
  MBR: not present
  BSD: not present
  APM: not present
  GPT: not present
```

Um "GPT: not present" é o sinal de que você precisa da reimagem (ou de reconstruir a GPT manualmente pelo Terminal). Clear local user data e Reinstall não têm como operar sobre um disco sem tabela de partições válida.

## Resumo

- "Clear local user data" apaga e reformata a partição `/home` (`nvme0n1p8`), mantendo o sistema e a versão intactos.
- Jogos, saves locais, configurações KDE, Flatpaks de usuário e arquivos pessoais são destruídos.
- A operação leva menos de um minuto, porque `mkfs` não sobrescreve os blocos de dados — apenas recria estruturas.
- Dispara o OOBE, então o próximo usuário inicia como num aparelho novo, mas com o sistema já atualizado.
- Só a reimagem reconstrói a GPT; Clear e Reinstall exigem particionamento de fábrica íntegro.

## Exercícios

1. Liste os tipos de conteúdo que vivem na sua partição `/home` hoje, agrupando por "jogos", "saves", "configurações" e "arquivos pessoais". Use `du -sh` em subdiretórios de `~/`.
2. Explique a diferença entre "apagar arquivos" e "formatar a partição" do ponto de vista da recuperação de dados. Por que o Clear local user data não é apagamento seguro?
3. Inicialize o recovery, abra o Terminal e rode `sudo gdisk -l /dev/nvme0n1`. A GPT está presente? O que isso te diz sobre a viabilidade de um Clear local user data?
4. Descreva um cenário em que você usaria Clear local user data em vez de Reimage, e outro em que faria o contrário.
5. **Desafio.** Suponha que você queira vender o Deck e garantir que ninguém recupere os dados. Combine o que aprendeu: proponha uma sequência (com comandos reais do Terminal with repair tools) que sobrescreva fisicamente os blocos antes da reimagem, usando `dd` com `/dev/zero`.