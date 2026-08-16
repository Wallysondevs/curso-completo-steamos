O Steam Deck tem Wi-Fi, CPU x86-64 e roda Arch Linux com systemd. É, para todos os efeitos, um computador portátil com controles embutidos. Ativar o SSH transforma essa máquina de jogar numa estação gerenciável remotamente: você edita arquivos de configuração do conforto do teclado do seu desktop, transfere ROMs e saves sem cartão SD, e depura problemas sem precisar do trackpad minúsculo. O primeiro passo é ligar o servidor — e isso, no SteamOS, tem suas peculiaridades.

:::objetivos
- Ativar o serviço SSH no Steam Deck de forma persistente
- Entender por que o sshd desliga a cada atualização do sistema
- Conectar-se ao Deck pela primeira vez e confirmar o funcionamento
- Diferenciar o modo leitura/escrita do sistema de arquivos do SteamOS
- Descobrir o IP do Deck sem acessar a interface gráfica
:::

## O estado do SSH no SteamOS

O SteamOS 3.6 traz o OpenSSH pré-instalado, mas o serviço não vem habilitado por padrão. Isso é deliberado: um servidor SSH ativo num dispositivo que você leva para redes públicas frequentemente seria um vetor de ataque se não fosse configurado com critério. A boa notícia é que o binário `sshd` já está no lugar, o arquivo de configuração também, e só falta ligá-lo.

```terminal
$ which sshd
/usr/bin/sshd
$ systemctl status sshd
○ sshd.service - OpenSSH Daemon
     Loaded: loaded (/usr/lib/systemd/system/sshd.service; disabled)
     Active: inactive (dead)
```

O status `disabled` + `inactive (dead)` confirma: o binário existe, a unit do systemd existe, mas ninguém ligou. Habilitar é simples, mas há um obstáculo que pega quase todo mundo nos primeiros dias.

## O sistema de arquivos em leitura

O SteamOS monta a partição raiz como somente leitura por padrão. Essa é uma decisão de fábrica — ele usa um esquema A/B de atualização atômica, e a imutabilidade do sistema base impede que uma atualização ou um acidente corrompa a instalação. Para ativar o sshd de forma persistente, você precisa desbloquear a raiz, habilitar o serviço e depois travar de novo:

```terminal
$ sudo steamos-readonly disable
$ sudo systemctl enable sshd
Created symlink /etc/systemd/system/multi-user.target.wants/sshd.service → /usr/lib/systemd/system/sshd.service.
$ sudo systemctl start sshd
$ sudo steamos-readonly enable
```

O `steamos-readonly disable` remonta `/` com leitura e escrita. Você então habilita e inicia o serviço. No final, `steamos-readonly enable` volta a travar — o serviço continua ativo porque o systemd já criou o symlink dentro de `/etc/systemd/system/`, que fica em outra partição (a `/var` ou uma overlay) e sobrevive ao readonly.

:::atencao
Toda atualização do SteamOS reverte customizações no sistema base. Não é incomum o sshd parar de iniciar depois de um update. Você precisará repetir `sudo steamos-readonly disable && sudo systemctl enable sshd` se o serviço sumir. Uma alternativa mais robusta é usar um script de `/etc/systemd/system/` que sobreviva, como veremos na seção 3.
:::

## Primeira conexão

Com o serviço ativo, você precisa do IP do Deck para conectar. O jeito mais direto é pelo próprio aparelho:

```terminal
$ ip -br addr show wlan0
wlan0            UP             192.168.1.105/24
```

Do seu desktop, o comando de conexão usa o usuário `deck`, que é o padrão do SteamOS:

```terminal
$ ssh deck@192.168.1.105
The authenticity of host '192.168.1.105 (192.168.1.105)' can't be established.
ED25519 key fingerprint is SHA256:dGhpcyBpcyBhbiBleGFtcGxlIGtleSBmb3IgdGhlIGNvdXJzZQ.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '192.168.1.105' (ED25519) to the list of known hosts.
(deck@192.168.1.105) Password:
```

O Steam Deck não tem senha de root por padrão, e o usuário `deck` também não — você precisará definir uma antes de usar SSH com autenticação por senha. É por isso que a seção 2 é dedicada inteiramente a chaves.

:::dica
O fingerprint da chave do host muda a cada reinstalação do SteamOS ou quando o sshd regenera as chaves. Se você se conectar e receber um aviso de que a chave do host não confere (`REMOTE HOST IDENTIFICATION HAS CHANGED`), não ignore — elimine a entrada antiga com `ssh-keygen -R 192.168.1.105` e aceite a nova após confirmar que está na rede correta.
:::

## Descobrindo o IP sem tela

Às vezes você quer o IP do Deck mas a interface gráfica está inacessível (modo desktop não carrega, tela quebrada). Nesse caso, você escaneia a rede local a partir de outra máquina:

```terminal
$ sudo nmap -sn 192.168.1.0/24 | grep -B2 -i valve
Nmap scan report for 192.168.1.105
Host is up (0.0032s latency).
MAC Address: AA:BB:CC:DD:EE:FF (Valve)
```

O endereço MAC do Steam Deck aparece com fabricante "Valve" no scan. Outra alternativa é olhar a tabela ARP do roteador ou, se seu roteador tiver interface web, a lista de clientes DHCP — o hostname `steamdeck` costuma aparecer lá.

## Resumo

- O SSH está instalado mas desativado no SteamOS 3.6; ativá-lo requer `steamos-readonly disable`.
- `systemctl enable sshd && systemctl start sshd` liga o servidor; o symlink em `/etc/systemd/system/` sobrevive ao readonly.
- Atualizações do SteamOS podem desfazer a habilitação; prepare-se para repetir o processo após cada update.
- A primeira conexão registra o fingerprint da chave do host; mudanças nesse fingerprint são suspeitas e devem ser verificadas.
- `ip -br addr` no Deck ou `nmap -sn` de outra máquina resolvem a descoberta do IP sem depender da interface gráfica.

## Exercícios

1. Habilite o SSH no seu Steam Deck seguindo o procedimento completo: disable readonly, enable + start, enable readonly. Confirme com `systemctl status sshd` que o serviço está `active (running)`.
2. Conecte-se ao Deck a partir de outro computador na mesma rede. Registre o fingerprint ED25519 do host e explique quando ele deve mudar.
3. Desabilite e reabilite o SSH para simular o que acontece após uma atualização do sistema. O serviço sobreviveu? Por quê?
4. Descubra o IP do seu Deck usando `nmap -sn` de outra máquina. Depois faça o mesmo usando a interface web do seu roteador. Os resultados batem?
5. **Desafio.** Configure o SSH para iniciar com o sistema sem usar `systemctl enable` — ou seja, crie um script que sobreviva a atualizações do SteamOS e suba o sshd no boot. Dica: considere hooks de `/etc/systemd/system/` que não dependem da partição raiz.