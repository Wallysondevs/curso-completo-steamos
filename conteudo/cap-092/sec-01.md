O reset de fábrica do Steam Deck é uma operação destrutiva — ela apaga os dados do usuário, desfaz configurações e devolve o sistema ao estado em que saiu da caixa. Mas "apagar tudo" não é a mesma coisa que "instalar do zero", e cada uma dessas rotas serve a um propósito diferente. Entender quando cada uma se aplica evita que você apague seu disco à toa ou, pior, que tente consertar com reset o que só uma reinstalação completa resolve.

:::objetivos
- Saber o que o factory reset realmente apaga e o que preserva
- Distinguir reset via menu Steam de reinstalação limpa por imagem
- Identificar os cenários em que cada rota é a mais adequada
- Conhecer os riscos e as pré-condições de cada operação
:::

## O que o reset de fábrica realmente faz

O factory reset acessível pelo menu Steam (`Configurações → Sistema → Redefinir para padrões de fábrica`) age sobre as partições de dados do usuário: ele formata `/home` e remove os `overlays` de sistema que acumularam alterações ao longo do tempo. A partição raiz imutável (`/`) não é regravada — ela é montada como `read-only` e simplesmente volta ao estado original porque os overlays somem.

```terminal
$ lsblk /dev/nvme0n1
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0  512G  0 disk
├─nvme0n1p1 259:1    0   64M  0 part
├─nvme0n1p2 259:2    0   32M  0 part
├─nvme0n1p3 259:3    0   32M  0 part
├─nvme0n1p4 259:4    0    5G  0 part
├─nvme0n1p5 259:5    0    5G  0 part
├─nvme0n1p6 259:6    0  256M  0 part /efi
├─nvme0n1p7 259:7    0    5G  0 part /
├─nvme0n1p8 259:8    0    5G  0 part /var
└─nvme0n1p9 259:9    0  462G  0 part /home
```

O layout acima é o padrão do SteamOS: a partição 6 (`/efi`), 7 (`/`), 8 (`/var`) e 9 (`/home`) são as partes ativas. O reset de fábrica apaga a 9 e limpa os overlays sobre 7 e 8, mas mantém as partições 1 a 5 intactas — elas contêm firmware e recovery do próprio sistema.

:::nota
O reset de fábrica **não** apaga o conteúdo de `/efi`, ou seja, o bootloader permanece. Se o problema for corrupção no GRUB/systemd-boot, o reset não resolve — é preciso recriar a partição EFI, o que já exige a rota de reinstalação.
:::

## Quando usar o reset de fábrica

O reset de fábrica é a ferramenta certa quando o problema está nos dados do usuário: configurações conflitantes, plugins que quebraram o sistema, cache corrompido, desempenho degradado por acúmulo de pacotes Flatpak desatualizados. Também é o caminho recomendado antes de vender, doar ou enviar o aparelho para RMA.

```terminal
$ du -sh /home/deck/.local/share/Steam
45G     /home/deck/.local/share/Steam
```

Se o espaço em disco está baixo e o sistema parece instável, um reset limpa tudo sem a complexidade de regravar a imagem inteira. Mas é preciso ter certeza de que o kernel, os módulos e o initramfs estão ilesos — se a instabilidade começou após uma atualização de sistema, o reset pode não bastar.

:::atencao
O reset de fábrica **não reverte a versão do SteamOS**. Se você está no canal beta ou preview e quer voltar ao estável, o reset apaga seus dados mas mantém a versão corrente. Voltar de canal exige reinstalação por imagem de recuperação ou reconfiguração manual.
:::

## Quando pular o reset e reinstalar do zero

Há cenários em que o reset de fábrica é inútil ou insuficiente: corrupção da tabela de partições, falha no bootloader, downgrade de canal (beta → stable), troca física do SSD, ou quando o sistema simplesmente não inicia para alcançar o menu de configurações. Nesses casos, a reinstalação limpa por imagem de recuperação — via pendrive USB-C — é a única saída.

```terminal
$ ls /efi/EFI/BOOT/
bootx64.efi  steamdeck
```

Se o conteúdo de `/efi` estiver faltando ou corrompido, o sistema nem chega ao menu Steam, e o reset de fábrica (que depende do sistema estar rodando) é inalcançável. É aqui que a imagem de recuperação gravada num pendrive se torna a ferramenta universal.

## Comparação entre as duas rotas

| Rota | O que apaga | Requer sistema rodando | Recria partições | Reverte canal |
|---|---|---|---|---|
| Reset de fábrica | /home e overlays | Sim | Não | Não |
| Imagem de recuperação | Disco inteiro ou partições selecionadas | Não | Sim | Sim |

A imagem de recuperação, que será detalhada mais adiante, é um sistema Linux live que arranca pelo pendrive e oferece três caminhos: reinstalar preservando `/home`, reinstalar apagando tudo, ou abrir um terminal para particionamento manual.

## Resumo

- O reset de fábrica formata `/home` e limpa os overlays, mas mantém o sistema base e a versão corrente do SteamOS.
- Use o reset para problemas de dados do usuário, antes de vender/doar, ou para RMA.
- A reinstalação por imagem de recuperação é necessária quando o sistema não inicia, o bootloader está corrompido, ou é preciso trocar o canal.
- O reset não reverte de beta para estável — é preciso reinstalar para isso.

## Exercícios

1. Liste as partições do seu Steam Deck com `lsblk` e identifique qual delas é o `/home`.
2. Explique, em duas frases, por que corrupção no `/efi` não se resolve com factory reset.
3. Descreva três cenários em que o reset de fábrica é suficiente e três em que é preciso reinstalar pela imagem de recuperação.
4. Verifique o espaço ocupado pelo diretório Steam com `du -sh ~/.local/share/Steam` e anote quanto seria liberado num reset.
5. **Desafio.** Proponha um plano de ação para um Steam Deck que não inicia (tela preta após o logo) e está no canal beta: qual rota você segue e por quê?