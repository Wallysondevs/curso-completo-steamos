Rodar como `root` o tempo todo é a receita clássica para quebrar um sistema — um `rm` no lugar errado já não tem quem o detenha. O `sudo` resolve isso dando privilégio por comando, por tempo limitado e com registro no log. No SteamOS ele opera sobre uma particularidade: o sistema de arquivos raiz é **read-only**, então qualquer mudança persistente exige passar pelo `steamos-readonly` antes. Esta seção mostra como o `sudo` funciona e como o SteamOS o entrelaça com essa proteção de imutabilidade.

:::objetivos
- Entender a diferença entre `su`, `sudo` e login direto como root
- Configurar permissões granulares no `/etc/sudoers` com `visudo`
- Desabilitar o modo read-only do SteamOS para persistir mudanças
- Auditar o que foi executado com `sudo` via logs
- Usar `sudo -v` e o cache de credenciais de forma consciente
:::

## Por que não logar como root

O SteamOS desativa a conta `root` no sentido de login interativo — não há senha de root definida por padrão. Todo privilégio passa pelo `deck` via `sudo`. A lógica é de "menor privilégio": você permanece um usuário comum e só eleva permissão onde precisa, pelo tempo estritamente necessário. Se um comando destrutivo roda sem `sudo`, ele falha por falta de permissão em vez de apagar o disco.

```terminal
$ rm -rf /etc/nginx
rm: cannot remove '/etc/nginx/nginx.conf': Permission denied
```

O mesmo comando com `sudo` não avisaria — executaria e pronto. Por isso a regra de ouro: **nunca** prefixe com `sudo` um comando cujo efeito você não entende por completo.

## A configuração do sudoers

Quem pode usar `sudo` e com quais comandos é definido em `/etc/sudoers`, editado **sempre** pelo `visudo` (que valida a sintaxe antes de salvar e trava o arquivo contra edições concorrentes).

```terminal
$ sudo visudo
```

Dentro, as linhas seguem o formato `usuário  host=(alvo)  comandos`. Para o SteamOS, o `deck` costuma estar autorizado a tudo — padrão de uma máquina pessoal:

```terminal
$ sudo grep -v '^#' /etc/sudoers | grep -v '^$'
Defaults	env_reset
Defaults	mail_badpass
root	ALL=(ALL:ALL) ALL
%sudo	ALL=(ALL:ALL) ALL
deck	ALL=(ALL:ALL) ALL
```

A linha `deck ALL=(ALL:ALL) ALL` significa: o usuário `deck`, em qualquer host, pode executar qualquer comando como qualquer usuário ou grupo. Você pode restringir isso a comandos específicos, uma prática útil em máquinas compartilhadas:

```conf
deck  ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart sshd
```

Com essa linha, o `deck` só consegue reiniciar o `sshd` sem senha — e mais nada. O `NOPASSWD` remove a exigência de senha para aquele comando específico, o que é conveniente para scripts, mas reduz a segurança (qualquer processo do `deck` consegue reiniciar o SSH).

:::atencao
Editar `/etc/sudoers` com um editor comum e salvar com erro de sintaxe pode **bloquear todo acesso administrativo** da máquina até você corrigir pelo recovery. O `visudo` previne isso, mas só se você usar ele. Se precisar de automação, use `visudo -c` para validar antes de aplicar.
:::

## O modo read-only do SteamOS

O SteamOS monta a partição raiz em modo read-only como proteção contra alterações acidentais e para permitir atualizações atômicas por imagem. Se você tentar escrever em `/etc` ou `/usr`, recebe erro mesmo com `sudo`:

```terminal
$ sudo touch /etc/teste
touch: cannot touch '/etc/teste': Read-only file system
```

Para persistir uma mudança, desative temporariamente a proteção:

```terminal
$ sudo steamos-readonly disable
$ sudo steamos-readonly status
Read-only filesystem: disabled
```

Depois de editar, reative:

```terminal
$ sudo steamos-readonly enable
```

:::perigo
Mudanças feitas em `/etc` e `/usr` **não sobrevivem a uma atualização de sistema** — a Valve reaplica a imagem e apaga edições manuais nessas áreas. Para automação persistente, prefira `/etc/systemd/system`, home do usuário e arquivos de configuração apontados por *drop-in* do systemd. Desabilitar o read-only e esquecer de reativar também anula uma camada de defesa contra malware.
:::

## Auditando o que rodou com sudo

Cada uso de `sudo` registra uma linha no journal, acessível mesmo para quem não é root por meio dos logs de autenticação.

```terminal
$ sudo grep 'sudo.*COMMAND' /var/log/auth.log | tail -3
Jan 12 10:14:41 steamdeck sudo:     deck : TTY=pts/0 ; PWD=/home/deck ; USER=root ; COMMAND=/usr/bin/apt update
Jan 12 10:15:02 steamdeck sudo:     deck : TTY=pts/0 ; PWD=/home/deck ; USER=root ; COMMAND=/usr/bin/systemctl restart sshd
Jan 12 10:17:55 steamdeck sudo:  pam_unix(sudo:auth): authentication failure; logname=deck uid=1000 euid=0 tty=/dev/pts/0 ruser=deck
```

A última linha é a mais interessante: uma falha de autenticação. O `pam_unix` registrou que alguém tentou `sudo` e errou a senha — um sinal de tentativa de força bruta ou de senha digitada errado. Auditorar esse arquivo regularmente é o jeito mais barato de notar atividade suspeita.

:::dica
Use `sudo -v` para validar suas credenciais antes de uma sequência longa de comandos — ele não executa nada, só atualiza o cache de 15 minutos. E `sudo -k` invalida o cache imediatamente, útil quando você termina e quer garantir que nenhum comando seguinte rode com privilégio herdado.
:::

## Resumo

- `sudo` eleva privilégio por comando e por tempo limitado, evitando operar sempre como `root`.
- A conta `root` não tem senha por padrão no SteamOS; tudo passa pelo `deck` via `sudo`.
- O `/etc/sudoers` deve ser editado só pelo `visudo`; um erro de sintaxe pode travar o acesso administrativo.
- O `steamos-readonly disable` libera o sistema de arquivos raiz para edição, mas mudanças não sobrevivem a atualizações.
- `/var/log/auth.log` (ou o journal) registra cada `sudo`, incluindo falhas de autenticação.

## Exercícios

1. Liste as regras ativas do sudoers com `sudo visudo -c` para validar a sintaxe e depois `sudo grep -v '^#' /etc/sudoers | grep -v '^$'`.
2. Use `sudo -n true` para testar se você tem `NOPASSWD` configurado. Qual o código de saída quando a senha é exigida?
3. Desabilite o read-only (`sudo steamos-readonly disable`), crie um arquivo em `/etc`, reative e confirme com `steamos-readonly status` que voltou a `enabled`.
4. Execute `sudo journalctl /usr/bin/sudo | tail` e identifique na saída quem, quando e com qual diretório de trabalho rodou cada comando.
5. **Desafio.** Crie uma regra no sudoers que permita ao `deck` executar apenas `systemctl restart sshd` com `NOPASSWD`, teste-a, e depois remova a regra. Explique por que deixá-la lá seria um risco se o SSH estivesse exposto à internet.