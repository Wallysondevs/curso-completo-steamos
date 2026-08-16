As oito seções anteriores cobriram ferramentas isoladas: senha, sudo, firewall, LUKS, Flatpak, permissões, SSH e auditoria. Mas segurança é um sistema, não uma lista. Esta seção fecha o capítulo transformando tudo num checklist executável e num script de validação que você roda de tempos em tempos para saber, em trinta segundos, qual a postura de segurança atual do seu Steam Deck.

:::objetivos
- Consolidar as oito áreas em um checklist ordenado por prioridade
- Executar um script de validação que audita todas as áreas de uma vez
- Interpretar cada saída do script e decidir o que corrigir
- Estabelecer uma rotina mínima de revisão periódica
- Saber o que é risco aceitável num console e o que não é negociável
:::

## A ordem importa: priorização de risco

Nem toda medida de segurança tem o mesmo peso. Antes de se perder em configurações finas, ataque na ordem de exposição — o que um invasor remoto alcançaria primeiro:

1. **SSH** — se está habilitado, use chaves e desligue senha. É a porta de entrada nº 1.
2. **Senha do `deck`** — sem ela, qualquer `sudo` local é trivial.
3. **Firewall** — negação de entrada por padrão.
4. **Flatpak** — audite permissões de host/rede.
5. **LUKS** — criptografe dados que não podem vazar se o aparelho for roubado.
6. **Permissões de arquivo** — `find` por `o+w` em diretórios sensíveis.
7. **Auditoria** — habilite logs e um script de revisão.

O checklist completo cabe numa única página:

| Área | O que verificar | Comando-chave |
|---|---|---|
| Senha | `deck` tem hash no shadow | `sudo grep deck /etc/shadow` |
| sudo | Só o `deck` (e `sudo` group) têm acesso | `sudo grep -v '^#' /etc/sudoers` |
| Firewall | `ufw` ativo com deny incoming | `sudo ufw status` |
| SSH | chave funciona, senha desligada | `ssh -o PreferredAuthentications=publickey deck@steamdeck.local` |
| LUKS | volumes sensíveis criptografados | `lsblk -f | grep crypto_LUKS` |
| Flatpak | sem `filesystems=host` indevido | `flatpak info -m <id>` |
| Arquivos | nenhum `o+w` em dados sensíveis | `find ~ -perm -0002` |
| Auditoria | logs rodando, `lastb` limpo | `sudo lastb`, `journalctl -p err` |

## O script de validação

Em vez de decorar comandos, grave um script que imprime um relatório. Ele encapsula o capítulo inteiro:

```terminal
$ cat ~/scripts/audita-seguranca.sh
#!/bin/bash
echo "== 1. Senha do deck (campo hash) =="
sudo grep '^deck:' /etc/shadow | cut -d: -f2 | grep -q '^!\|^$\|^*' \
  && echo "ATENCAO: deck sem senha" || echo "OK: deck tem senha"

echo ""
echo "== 2. Firewall =="
sudo ufw status 2>/dev/null | grep -q 'inactive' \
  && echo "ATENCAO: firewall inativo" || sudo ufw status verbose

echo ""
echo "== 3. SSH: autenticacao por senha =="
grep -E '^PasswordAuthentication[[:space:]]+yes' /etc/ssh/sshd_config >/dev/null \
  && echo "ATENCAO: SSH aceita senha" || echo "OK: SSH por chave"

echo ""
echo "== 4. Portas expostas =="
ss -ltnp | grep '0.0.0.0' || echo "OK: nenhuma porta exposta"

echo ""
echo "== 5. Flatpaks com filesystems=host =="
for app in $(flatpak list --app --columns=application 2>/dev/null); do
  flatpak info -m "$app" 2>/dev/null | grep -q 'filesystems=.*host' \
    && echo "$app: host exposto"
done

echo ""
echo "== 6. Arquivos escreviveis por outros =="
find ~/.ssh ~/.local/share -maxdepth 3 -perm -0002 2>/dev/null \
  | head -5 || echo "OK"
```

Roles o script e leia o relatório:

```terminal
$ chmod 755 ~/scripts/audita-seguranca.sh
$ ~/scripts/audita-seguranca.sh
== 1. Senha do deck (campo hash) ==
OK: deck tem senha

== 2. Firewall ==
Status: active

== 3. SSH: autenticacao por senha ==
OK: SSH por chave

== 4. Portas expostas ==
LISTEN 0 128 0.0.0.0:22 ...

== 5. Flatpaks com filesystems=host ==
com.visualstudio.code: host exposto

== 6. Arquivos escreviveis por outros ==
OK
```

Duas coisas saltam aos olhos: a porta 22 ainda aparece exposta (esperado, você habilitou SSH) e o VS Code tem `host`. A primeira é aceitável **se** o SSH está por chave e o firewall permite só sua rede; a segunda é uma decisão sua — um IDE precisa de acesso amplo, mas vale o risco? Se decidir restringir, aplique e reinspecione:

```terminal
$ flatpak override --user --nofilesystem=host com.visualstudio.code
$ flatpak info -m com.visualstudio.code | grep filesystems
filesystems=home;xdg-config/Code;
```

O `host` sumiu da lista de montagens. O VS Code perdeu acesso à raiz, mas continua vendo o home. Se nem `home` for aceitável, `--nofilesystem=home` também funciona — com o custo de o IDE não abrir projetos fora do que o portal entregar.

:::dica
Agende o script para rodar semanalmente e gravar num arquivo: um timer systemd (`OnCalendar=weekly`) executando `~/scripts/audita-seguranca.sh > ~/log/audit-$(date +%F).txt`. Assim você tem histórico da postura de segurança e percebe regressões — como um `ufw` que alguém desligou por frustração.
:::

## Risco aceitável num console

Um Steam Deck não é um servidor de produção, e tentar transformá-lo num reduto de segurança militar atrapalha o propósito principal: jogar. Algumas fricções não valem a pena:

- **Deixar o autologin** no modo jogo é razoável se o aparelho não sai de casa.
- **Não criptografar o disco inteiro** é aceitável se o que importa está numa pasta LUKS separada.
- **Manter Flatpaks com `host`** é ok quando você confia no aplicativo e precisa da integração.

O que **não** é negociável, por pouco esforço:

- Ter senha no `deck`.
- SSH por chave (senha desligada) se o SSH estiver exposto.
- Firewall com deny incoming.
- Um script que avisa quando algo sai do lugar.

:::nota
O princípio que guia este capítulo inteiro é **defesa em profundidade**: nenhuma camada sozinha é suficiente, mas cada uma torna o ataque mais caro. Senha, sudo, firewall, LUKS, sandbox Flatpak e logs se reforçam — a falha de uma não expõe tudo porque as outras seguram.
:::

## Resumo

- Segurança é sistema, não lista: ataque na ordem de exposição (SSH → senha → firewall → Flatpak → LUKS → arquivos → auditoria).
- Um script de validação consolida o capítulo inteiro em um relatório de trinta segundos.
- Porta 22 exposta é aceitável só com SSH por chave e firewall restrito; `filesystems=host` é aceitável só com decisão consciente.
- Defesa em profundidade: cada camada torna o ataque mais caro, e a falha de uma não expõe tudo.
- Revise periodicamente: um timer semanal com o script mantém o histórico e revela regressões.

## Exercícios

1. Rode o script `audita-seguranca.sh` desta seção no seu Deck e anote a saída. Quantas verificações ficaram "OK" e quantas "ATENCAO"?
2. Para cada "ATENCAO", aplique a correção correspondente (uma das seções 1 a 8) e rode o script de novo até zerar as pendências ou justificar cada exceção.
3. Transforme o script numa versão que aceite um argumento `--quiet` (só imprime linhas com "ATENCAO") e use isso para um monitoramento não intrusivo.
4. Crie um timer systemd semanal que grave a saída do script em `~/log/`. Teste o timer com `systemctl --user list-timers`.
5. **Desafio.** Escreva uma versão do script que verifique também: integridade do `known_hosts`, expiração de senha no `/etc/shadow`, e presença de processos `sshd` filhos com root. Combine com o conteúdo da seção de auditoria (regras `auditd` sobre chaves SSH) e documente num README como restaurar a máquina caso um check falhe.