Ter uma imagem de backup é inútil se você não conseguir bootar um ambiente que a restaure. O SteamOS não é um sistema qualquer — ele usa partições A/B e rootfs read-only, então restaurar a partir do próprio sistema rodando não funciona. Esta seção cobre como preparar mídias de resgate que permitem acessar seu backup, seja num pendrive, cartão SD ou disco externo, e iniciar a restauração mesmo com o SSD vazio.

:::objetivos
- Entender por que é necessário um ambiente externo para restaurar o SteamOS
- Criar pendrive multiboot com Ventoy
- Montar o backup em ambiente live e acessar seus arquivos
- Preparar mídia de recuperação com Clonezilla + GParted + imagem da Valve
- Testar o boot antes de precisar de verdade

:::

## Por que você não consegue restaurar estando no sistema

O SteamOS monta a raiz (`/`) como read-only e mantém o `home` em uso constante. Se você tentar sobrescrever o disco estando nele, duas coisas quebram: arquivos abertos que mudam durante a restauração e a própria partição que segura o sistema operacional do restore. É como tentar trocar o motor do carro com ele andando.

A solução: bootar a partir de outro dispositivo. O Deck suporta boot USB nativamente — basta segurar [[Volume -]] e [[Power]] para entrar no menu de boot. Aí você escolhe o pendrive, entra num Linux Live (Clonezilla, GParted Live, até um Ubuntu Live) e restaura com calma, sem o disco de sistema montado.

## Ventoy: um pendrive, várias ISOs

Gravar uma ISO por pendrive funciona, mas é pouco prático. O Ventoy resolve isso: você instala o Ventoy no pendrive **uma vez** e depois basta copiar arquivos `.iso` para ele — cada nova ferramenta é só um `cp`. O Deck boota o pendrive e o Ventoy exibe o menu com todas as ISOs disponíveis:

```terminal
$ lsblk --fs
sda
└─sda1  vfat   VENTOY      /run/media/deck/Ventoy
$ cp ~/Downloads/clonezilla-live-3.1.3-amd64.iso /run/media/deck/Ventoy/
$ cp ~/Downloads/gparted-live-1.6.0-1-amd64.iso /run/media/deck/Ventoy/
$ cp ~/Downloads/steamdeck-recovery-20250321.iso /run/media/deck/Ventoy/
$ ls /run/media/deck/Ventoy/
clonezilla-live-3.1.3-amd64.iso  gparted-live-1.6.0-1-amd64.iso  steamdeck-recovery-20250321.iso
```

Agora o mesmo pendrive oferece Clonezilla (para restaurar imagem), GParted (para redimensionar partições depois) e a imagem de recuperação da Valve (para reinstalar o sistema do zero, se tudo mais falhar).

:::dica
Instale o Ventoy pelo Linux. Baixe o script em `ventoy.net`, extraia, execute `sudo bash Ventoy2Disk.sh -i /dev/sda`. **Confira o dispositivo** — o comando apaga todo o conteúdo do pendrive, mas não deve ser rodado no SSD interno.
:::

## Acessando o backup pelo ambiente live

Quando você boota um Linux Live, ele monta os discos internos e externos, mas não os toca. É o momento de acessar seu backup, confirmar que está íntegro e se preparar:

```terminal
## dentro do ambiente live (Clonezilla ou GParted)
$ lsblk
sda        # pendrive de boot
nvme0n1    # SSD interno (vazio ou quebrado)
sdb        # disco externo com a imagem de backup
$ mount /dev/sdb1 /mnt/backup
$ ls /mnt/backup/
steamdeck-full-2026-mar-10/
steamdeck-home-2026-mar-20/
```

Se o backup está no disco externo e você consegue listá-lo, está pronto para restaurar. Se o backup estiver em rede (SSH, NAS), seu live precisa ter acesso à rede — o Clonezilla Live detecta a placa Wi-Fi e oferece configuração de rede no menu.

Para conferir a integridade do backup antes de confiar nele, monte-o e liste o conteúdo com tamanhos e datas:

```terminal
$ mount /dev/sdb1 /mnt/backup
$ ls -lh /mnt/backup/steamdeck-full-2026-mar-10/
total 218G
-rw-r--r-- 1 root root 218G Mar 10 02:41 ssd-deck.img
-rw-r--r-- 1 root root   65 Mar 10 02:53 ssd-deck.img.sha256
$ cat /mnt/backup/steamdeck-full-2026-mar-10/ssd-deck.img.sha256
9f8e7d6c5b4a39281706f5e4d3c2b1a0...  ssd-deck.img
```

Se você gravou o hash junto à imagem (ver [seção 9](#/cap-060/sec-09)), pode rodar `sha256sum -c` ali mesmo, ainda no ambiente live, e ter certeza de que a imagem não corrompeu durante os meses parada no disco externo.

## Preparando o kit de resgate completo

Monte um pendrive de 16 GB (mínimo 8 GB) e coloque nele:

- **Clonezilla Live** — restauração de imagens `partclone` e `dd`.
- **GParted Live** — redimensionar e criar partições, essencial quando migra para SSD de tamanho diferente.
- **Imagem de recuperação da Valve** — reinstalação limpa caso a restauração falhe.
- **Ubuntu/Debian Live** (opcional) — acesso a `rsync`, `dd` e `partclone` em ambiente gráfico confortável.

Com esses quatro itens num pendrive protegido de poeira e não perdido na gaveta, você cobre todos os cenários: restaurar clone, ajustar partições ou reinstalar do zero.

:::info
A imagem de recuperação da Valve pode ser baixada de `help.steampowered.com` → Steam Deck Recovery Instructions. Ela reinstala o SteamOS preservando ou apagando o `home`, conforme você escolher no assistente.
:::

## Testando antes de precisar

A pior hora para descobrir que o pendrive não boota é depois do desastre. Teste agora:

1. Desligue o Deck completamente.
2. Insira o pendrive.
3. Segure [[Volume -]] e ligue. O menu de boot aparece.
4. Selecione o pendrive (aparece como `USB Drive` ou pelo nome do fabricante).
5. Confirme que o menu do Ventoy aparece e que as ISOs são listadas.

Se não aparecer, verifique se o Ventoy foi instalado no modo correto (GPT para Deck moderno, que usa UEFI) e se o pendrive está na porta certa (hub USB-C com alimentação, se estiver usando adaptador).

:::atencao
O Deck usa UEFI com Secure Boot **desligado** por padrão, então a maioria das ISOs Linux boota sem problemas. Mas algumas ISOs antigas ou mal configuradas podem travar. Teste cada uma individualmente — e se uma não bootar, tente a versão mais recente ou uma distro mais popular como Ubuntu.
:::

## Resumo

- Restaurar exige ambiente externo porque o sistema não pode sobrescrever a si mesmo.
- Ventoy permite carregar múltiplas ISOs num só pendrive, só copiando os arquivos.
- Em live, monte o disco de backup e confirme que a imagem está acessível.
- Kit de resgate ideal: Clonezilla + GParted + imagem de recuperação da Valve.
- Teste o boot do pendrive **hoje**, não na hora do desastre.

## Exercícios

1. Instale o Ventoy num pendrive de 8 GB ou mais e copie pelo menos duas ISOs para ele.
2. Boote o Deck pelo pendrive e navegue entre as ISOs no menu do Ventoy.
3. Inicie o Clonezilla Live e explore o menu sem executar operação nenhuma.
4. Boote o GParted Live e monte o disco externo de backup; liste os arquivos para confirmar acesso.
5. **Desafio.** Monte um pendrive com Ventoy + Clonezilla + GParted + imagem de recuperação da Valve e execute um ciclo completo de simulação: boot, acessar backup, desligar, bootar de volta no SteamOS.