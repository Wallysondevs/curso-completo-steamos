Nem todo mundo quer montar um servidor ou rodar um daemon P2P. Para quem já vive no ecossistema de uma nuvem comercial, a saída é instalar o cliente daquela nuvem no Steam Deck e tratar as pastas como se estivesse num desktop comum. A boa notícia é que o Flathub tem clientes para as principais; a má notícia é que o SteamOS impõe algumas limitações importantes que determinam qual cliente faz ou não sentido.

:::objetivos
- Reconhecer quais serviços de nuvem têm cliente funcional no SteamOS
- Instalar e autenticar o Dropbox via Flatpak
- Entender as limitações de integração (autostart, sincronização em modo jogo)
- Avaliar a relação do sistema de arquivos imutável com a sincronização
- Comparar nuvem comercial com as alternativas self-hosted
:::

## O panorama dos clientes no SteamOS

O SteamOS é uma distribuição Arch com raiz somente-leitura e aplicativos distribuídos majoritariamente como Flatpak. Isso significa que o cliente de uma nuvem precisa existir como Flatpak para integrar bem — e nem todos têm.

| Serviço | Cliente no Flathub | Observações |
|---|---|---|
| Dropbox | `com.dropbox.Client` | Oficial, funciona bem no modo desktop |
| Google Drive | (nenhum oficial) | Não há cliente oficial para Linux; use `rclone` ou insync (pago) |
| OneDrive | (terceiros) | Clientes open source como `onedrive` (CLI) ou via rclone |
| MEGA | `mega.megasync` + `mega.megasync.MEGAsync` | Disponível, mas pesado |
| pCloud | `com.pcloud.PCloudDrive` | Cliente oficial |

O padrão se repete: serviços com cliente Linux nativo (Dropbox, MEGA, pCloud) migraram bem para Flatpak; serviços sem cliente nativo dependem de alternativas. O Google Drive, um dos serviços mais usados do mundo, **não tem cliente oficial para Linux** — nesse caso, `rclone` (seções 6 e 7) é a rota mais limpa.

:::info
O Dropbox tinha suporte nativo a sistemas de arquivos tradicionais (ext4). Como o SteamOS usa ext4 na partição `home`, o Dropbox funciona sem os problemas que afeta em sistemas que usam Btrfs/ZFS com recursos avançados. Ainda assim, instalações recentes do cliente pedem configurar o *sync daemon* com cuidado.
:::

## Instalando o Dropbox

O Dropbox é o caso de estudo desta seção porque é o cliente comercial que funciona com menos atrito no SteamOS. A instalação segue o ritual Flatpak de sempre.

```terminal
$ flatpak install flathub com.dropbox.Client
Looking for matches…
Required runtime for com.dropbox.Client/x86_64/stable (runtime/org.freedesktop.Platform/x86_64/23.08) found in remote flathub
Do you want to install it? [Y/n]: Y
Installation complete.
```

Na primeira execução, o Dropbox abre o assistente de login. Você autentica com e-mail e senha (e o 2FA, se habilitado) e escolhe a pasta local que será a raiz do Dropbox.

```terminal
$ flatpak run com.dropbox.Client &
This computer isn't linked to any Dropbox account…
Please visit https://www.dropbox.com/cli_link_nonce?nonce=… to link this device.
```

O assistente costuma abrir o navegador automaticamente. Depois de autenticado, o Dropbox cria `~/Dropbox/` e começa a baixar os arquivos da sua conta.

## Pastas e sincronização seletiva

Assim como no Nextcloud, no Dropbox você **não precisa** (e não deve, num Deck de armazenamento escasso) sincronizar tudo. O recurso de *Selective Sync* deixa você escolher quais subpastas ficam locais.

```terminal
$ ls ~/Dropbox/
Saves/  Documentos/  Fotos/  Projetos/
```

A recomendação para o Deck é espelhar apenas o essencial — tipicamente uma pasta de saves e talvez documentos. Fotos e arquivos grandes podem ficar disponíveis apenas *online* (o Dropbox mostra placeholder) e ser baixados sob demanda.

:::dica
Use o *Selective Sync* com agressividade no Steam Deck: o armazenamento interno (64 GB no modelo base, 256 GB/512 GB/1 TB nos maiores) enche rápido, e a última coisa que você quer é o Dropbox baixando 200 GB de fotos para o SSD de jogos.
:::

## As limitações que você precisa aceitar

O Dropbox no SteamOS funciona, mas com ressalvas que vale conhecer antes de comprometer sua estratégia de sincronização a ele.

**Autostart.** No modo desktop, o Dropbox se registra para iniciar na sessão. Mas ele **não roda em modo jogo**, que é onde o Deck passa a maior parte do tempo. Saves de emuladores criados no modo desktop não são o cenário principal — você provavelmente estará jogando no modo jogo.

**Compatibilidade com o deamon.** O cliente Flatpak roda o daemon num processo separado; matar a interface não interrompe a sincronização, mas reinicializações de sessão podem deixar o daemon órfão.

```terminal
$ ps aux | grep -i dropbox | grep -v grep
deck      1234  0.3  0.9 1234567 123456 ?   Sl   10:00   0:12 dropbox
deck      1300  0.1  0.4  987654  65432 ?   Sl   10:00   0:03 /app/extra/dropbox
```

**Sem integração com o jogo.** Diferente do Steam Cloud, o Dropbox não tem conhecimento de jogos: ele sincroniza o que está na pasta, ponto. Se o save do seu emulador não está em `~/Dropbox`, ele não é copiado — você precisa movê-lo (ou usar link simbólico) para dentro da pasta sincronizada.

:::atencao
Mover a pasta de saves de um emulador para dentro do Dropbox e criar um *symlink* de volta pode funcionar, mas é frágil: se o emulador não seguir links simbólicos ou se o Dropbox tentar sincronizar um arquivo que o emulador mantém aberto, você terá conflitos ou estados inconsistentes. Prefira sincronizar uma **cópia** periódica dos saves (ver seção 8).
:::

## Comparando com o caminho self-hosted

Para fechar o raciocínio do capítulo, vale uma comparação objetiva entre a nuvem comercial e as opções que você já viu:

| Critério | Dropbox/Drive | Syncthing | Nextcloud |
|---|---|---|---|
| Custo de infraestrutura | Nenhum | Nenhum | Servidor próprio |
| Privacidade | Terceiro vê dados | Total | Total (se você controla) |
| Funciona sem 2ª máquina ligada | Sim | Não | Sim (servidor sempre ligado) |
| Funciona em modo jogo | Não | Sim (com systemd) | Não (sem systemd) |
| Facilidade de setup | Muito fácil | Média | Alta |

A conclusão prática: a nuvem comercial é o caminho de menor atrito, ideal para quem quer zero manutenção e aceita terceirizar privacidade. O Syncthing é o melhor para o Steam Deck especificamente, porque pode rodar em modo jogo. O Nextcloud equilibra privacidade e comodidade, ao custo de manter um servidor.

## Resumo

- Dropbox (`com.dropbox.Client`), MEGA e pCloud têm clientes Flatpak funcionais no SteamOS.
- Google Drive não tem cliente oficial para Linux; use rclone (seções 6-7).
- Use sincronização seletiva para não encher o SSD do Deck com arquivos desnecessários.
- Nenhum cliente comercial roda em modo jogo por padrão; eles atuam no modo desktop.
- Mover saves para dentro da nuvem é frágil; prefira sincronizar cópias periódicas.
- Nuvem comercial = zero manutenção; Syncthing = melhor em modo jogo; Nextcloud = privacidade com servidor próprio.

## Exercícios

1. Instale o Dropbox via Flatpak, autentique e confirme que `~/Dropbox/` foi criado.
2. Configure o *Selective Sync* para manter apenas uma subpasta de teste local e verifique que arquivos grandes ficam como placeholder.
3. Liste os processos do Dropbox com `ps aux | grep -i dropbox` e identifique a diferença entre o daemon e a GUI.
4. Crie um arquivo grande (ex.: 100 MB com `dd if=/dev/zero of=arquivo bs=1M count=100`) fora do Dropbox e dentro dele, e meça a diferença de comportamento de sincronização/implicação de espaço.
5. **Desafio.** Escolha um emulador, localize a pasta de saves dele, e projete (sem necessariamente implementar) uma estratégia de symlink ou de cópia periódica para o Dropbox. Documente por que a segunda é mais segura.