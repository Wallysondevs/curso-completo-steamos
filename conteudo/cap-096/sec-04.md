Ler estado é a metade passiva; agora vem a metade ativa. `start`, `stop`, `restart`, `enable` e `disable` são os verbos que transformam o `systemctl` numa ferramenta de comando. A pegadinha está em saber que eles operam em dois eixos distintos — o "agora" e o "no próximo boot" — e que trocá-los é a causa número um de serviços que misteriosamente "não voltam". Esta seção ensina a agir nos dois eixos com precisão.

:::objetivos
- Ligar, parar e reiniciar serviços com `start`, `stop`, `restart` e `reload`
- Habilitar e desabilitar o início automático com `enable` e `disable`
- Entender os dois eixos: estado de runtime versus política de boot
- Mascarar unidades com `mask` e desfazer com `unmask`
- Aplicar mudanças com `daemon-reload` após editar unidades
:::

## Os dois eixos do systemctl

Imagine uma chave e um interruptor. O **estado de runtime** (ativo/inativo agora) é a chave que você vira com `start`/`stop`. A **política de boot** (habilitado/desabilitado) é o interruptor programado com `enable`/`disable`, que decide se a luz acende sozinha ao ligar a casa. São independentes: posso apagar a luz agora sem desprogramar o interruptor, e posso desprogramar o interruptor com a luz ainda acesa.

Quatro combinações decorrem disso, e vale fixá-las porque explicam quase todo "comportamento estranho":

| Comando | Efeito |
|---|---|
| `systemctl start srv` | Liga agora; não muda o boot |
| `systemctl stop srv` | Desliga agora; não muda o boot |
| `systemctl enable srv` | Fará subir no boot; não liga agora |
| `systemctl disable srv` | Não subirá no boot; não desliga agora |

Para fazer as duas coisas juntas (ligar agora *e* garantir que volte no boot), o atalho é `systemctl enable --now srv`. O inverso é `disable --now`.

```terminal
$ systemctl enable --now docker
Created symlink /etc/systemd/system/multi-user.target.wants/docker.service → /usr/lib/systemd/system/docker.service.
$ systemctl is-active docker && systemctl is-enabled docker
active
enabled
```

A mensagem do `enable` revela o mecanismo por baixo: habilitar cria um *symlink* (atalho) dentro de um diretório `*.wants/` do target. O `disable` simplesmente apaga esse link. É por isso que habilitar é barato, reversível e não mexe no arquivo da unidade em si.

:::nota
`enable` não copia nem altera o arquivo `.service`; ele apenas cria um atalho num diretório `multi-user.target.wants/`. Por isso desabilitar é 100% reversível e não destrói a definição do serviço — você pode religar a qualquer momento.
:::

## Start, stop, restart e a diferença para reload

O trio básico de runtime é direto, mas o `systemd` tem mais de um jeito de "reiniciar":

```terminal
$ systemctl restart sshd
$ systemctl status sshd --no-pager | head -3
● sshd.service - OpenSSH Daemon
     Loaded: loaded (/usr/lib/systemd/system/sshd.service; enabled)
     Active: active (running) since Wed 2025-01-15 13:47:05 -03; 1s ago
```

`restart` derruba o processo e sobe outro do zero. Já `reload` pede ao serviço que *releia* sua configuração **sem** derrubá-lo — rápido e sem cortar conexões ativas, mas só funciona se o serviço implementar esse suporte (serviços como `sshd` e `nginx` reagem a um sinal de recarga). O `reload-or-restart` é o pragmático: tenta `reload`, e se o serviço não suportar, cai para o `restart`.

```terminal
$ systemctl reload sshd
$ systemctl reload-or-restart sshd
```

Quando a unidade parou no meio de uma subida e ficou num estado inconsistente, o `stop` isolado pode não bastar — use `restart`, que combina `stop` + `start` e limpa o estado. E o `start` numa unidade já ativa é um não-evento (o `systemd` apenas confirma), o que torna idempotente o uso em scripts.

:::atencao
No SteamOS, reiniciar serviços do *sistema* (como o de rede) pode cortar o Wi-Fi ou derrubar a sessão do modo Gaming por alguns segundos. Prefira `reload` quando existir, e não rode `restart` no `NetworkManager` a menos que o Wi-Fi esteja realmente travado e você aceite a reconexão.
:::

## Mask: o desligamento definitivo

`disable` impede o início *automático*, mas você ainda pode iniciar a unidade manualmente (ou outra unidade pode puxá-la). Quando você precisa de um veto absoluto — "este serviço não roda, ponto, nem se alguém pedir" — existe o `mask`:

```terminal
$ systemctl mask foo.service
Created symlink /etc/systemd/system/foo.service → /dev/null.
$ systemctl start foo.service
Failed to start foo.service: Unit foo.service is masked.
```

O `mask` aponta o nome da unidade para `/dev/null`, tornando impossível carregá-la. É útil para desabilitar de vez um serviço problemático ou que conflita com outro sem apagar arquivos. O `unmask` desfaz. Note a assimetria com o `enable`: aqui o symlink aponta para o vazio, não para o arquivo real — por isso qualquer tentativa de uso falha.

```terminal
$ systemctl unmask foo.service
$ systemctl start foo.service
```

Mascarar é uma ferramenta de último recurso e tem efeito persistente; anote o que você mascara para não se perder semanas depois, quando o serviço "sumiu".

## daemon-reload: quando você editou uma unidade

Há um comando que não mexe em nenhum serviço, apenas no próprio `systemd`, e que é esquecido com frequência: `daemon-reload`. Sempre que você cria, edita ou remove um arquivo de unidade em `/etc/systemd/system`, o `systemd` ainda tem a versão antiga em memória. O `daemon-reload` obriga-o a reler tudo:

```terminal
$ sudo systemctl daemon-reload
```

Sem isso, suas edições parecem "não pegar" — o serviço inicia com a configuração velha e você perde minutos caçando um erro que não existe. A regra é: **editou uma unidade, rode `daemon-reload` antes de `start`/`restart`/`enable`**. A seção 9 usa esse comando na prática ao criar um serviço próprio.

## Resumo

- `start`/`stop` agem no "agora"; `enable`/`disable` no "próximo boot" — eixos independentes.
- `enable --now` (e `disable --now`) combinam os dois eixos numa tacada única.
- `restart` derruba e religa; `reload` relê a configuração sem derrubar; `reload-or-restart` tenta o melhor dos dois.
- `mask` veta a unidade por completo (symlink para `/dev/null`); `unmask` desfaz.
- Após editar qualquer arquivo de unidade, rode `sudo systemctl daemon-reload` antes de agir.

## Exercícios

1. Com `systemctl is-active` e `is-enabled`, registre o estado atual de um serviço; depois rode `stop` e observe o que mudou em cada um dos dois comandos.
2. Use `systemctl enable --now` em um serviço da sua máquina e confirme com `is-active` + `is-enabled` que ambos agora estão ligados.
3. Reverta o exercício anterior com `systemctl disable --now` e confirme a reversão nos dois eixos.
4. Rode `systemctl reload-or-restart` em um serviço que você saiba apoiar `reload` e explique, pela saída, qual caminho ele tomou.
5. **Desafio.** Edite (ou crie) um arquivo de unidade em `/etc/systemd/system`, tente `systemctl start` *antes* de `daemon-reload` e registre o que acontece; depois rode `sudo systemctl daemon-reload` e `start` de novo, comparando os resultados.
