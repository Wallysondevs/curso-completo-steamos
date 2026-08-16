O Steam Deck é um PC que quer ser console, e essa identidade dupla cria uma dificuldade prática: como você coloca ROMs, jogos não-Steam, vídeos, documentos e arquivos grandes dentro dele — e como tira saves, capturas de tela e backups de lá? Não existe disquete, não existe gaveta de cartucho, e o teclado físico é uma memória distante. Em compensação, sob a capa do modo de jogo mora um Arch Linux completo, com todas as portas de entrada e saída de um desktop de verdade.

:::objetivos
- Mapear os principais métodos de transferência de arquivos no SteamOS
- Diferenciar cada método por caso de uso (arquivo avulso × sincronização × backup)
- Entender o que é preciso configurar (modo Desktop, permissões, rede)
- Escolher a ferramenta certa para cada situação
- Reconhecer limites e riscos de cada abordagem
:::

## O cenário

O SteamOS (baseado em Arch) já traz quase tudo do que você precisa embutido. O problema é que boa parte fica escondida no modo Desktop, que é acessado pelo menu de energia → **Desligar/Reiniciar** → **Mudar para Desktop**. Ali vivem o KDE Plasma, o Discover (a "loja" de Flatpaks) e o terminal que desbloqueia SSH, Syncthing e montagem de discos.

As formas de mover arquivos se dividem em grandes famílias:

| Método | Melhor para | Curva de aprendizado | Isso requer |
|---|---|---|---|
| **Pendrive/HD externo** | Arquivos muito grandes, sem rede | Baixa | Apenas plugar (e um formato compatível) |
| **Warpinator** | Arquivo avulso, outro PC Linux/Windows rápido | Baixa | Flatpak + mesmo grupo de código |
| **KDE Connect** | Deck ↔ celular/PC, notificações, colar texto | Baixa/média | Aplicativo no outro lado |
| **SSH/SFTP** | Controle total, scripts, automação | Média/alta | Ativar servidor SSH |
| **Syncthing** | Sincronização contínua de pastas | Média | Instalar nos dois lados |
| **SMB/Samba/NFS** | Compartilhamentos de rede permanentes (NAS) | Média/alta | Servidor ou compartilhamento do outro lado |

## Por que o modo Desktop importa

Quase toda transferência "esperta" passa pelo modo Desktop. Nele você pode:

- Abrir o **Discover** e instalar Warpinator, KDE Connect ou Syncthing como Flatpak.
- Abrir o **Konsole** (terminal) para `ssh`, `scp`, `rsync` e `mount`.
- Gerenciar o **Firewall** e as permissões do sistema de arquivos (o sistema é *read-only* por padrão, com `/home` livre).

```terminal
# habilitar SSH (persistente, sobrevive a reboot)
$ sudo systemctl enable --now sshd
```

## Montar o mapa mental dos fluxos

Antes de baixar qualquer app, decida o *padrão* de uso:

- **Transferência pontual** (um ROM, um PDF): Warpinator ou KDE Connect resolvem em segundos.
- **Transferência recorrente** (saves que vão e voltam): Syncthing ou rsync automático.
- **Backup completo** (a biblioteca inteira): pendrive/HD externo, ou rsync para um NAS.
- **Administração remota** (gerenciar arquivos sem encostar no Deck): SSH/SFTP.

Não existe "o melhor método" — existe o método certo para o seu fluxo. Os capítulos seguintes cobrem cada um em detalhe.

## Pontos-chave

- O SteamOS é um Arch Linux completo: todas as formas de transferência de um desktop estão disponíveis no modo Desktop.
- Escolha a ferramenta pelo *padrão* de uso: avulso, recorrente, backup ou administração.
- Sistemas como pendrive não exigem rede, mas SSH/Syncthing sim.
- O `/home` é gravável; o resto do sistema é read-only por padrão (implicações nas próximas seções).

## Exercícios

1. Reinicie o Deck para o modo Desktop e abra o Konsole e o Discover.
2. Liste os dispositivos de bloco com `lsblk` e identifique o disco interno (`nvme0n1` ou `mmcblk0`).
3. Verifique seu endereço IP na rede local com `ip addr` e anote-o.
4. Decida, para o seu uso, quais dois métodos você vai priorizar e escreva por quê.
5. **Desafio.** Execute `systemctl is-enabled sshd` e interprete o resultado antes de prosseguir para a seção de SSH.
