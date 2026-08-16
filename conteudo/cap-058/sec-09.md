Toda ferramenta de transferência abre uma porta — literalmente — entre o seu Deck e o mundo. A diferença entre um fluxo tranquilo e uma dor de cabeça está em três coisas: manter as portas fechadas quando não usa, entender as permissões do sistema e saber ler os sinais de erro antes que virem problema. Esta seção fecha o capítulo com segurança e resolução de problemas.

:::objetivos
- Adotar princípios de segurança para os serviços de transferência
- Diagnosticar os erros mais comuns (firewall, permissão, rede)
- Ler logs para achar a causa-raiz
- Evitar corrupção por remoção/desmontagem prematura
- Manter um checklist de saúde do fluxo de transferência

:::

## Segurança em princípios

1. **Serviço ligado só quando precisa.** `sshd`, Syncthing e afins não precisam rodar 24/7 se você transfere uma vez por semana.

```terminal
$ sudo systemctl stop sshd        # desliga até você ligar de novo
$ sudo systemctl enable --now sshd   # religa e torna persistente
```

2. **Fechar portas no firewall.** Se usa `firewalld`, libere apenas o necessário e restrinja à sua sub-rede local.

3. **Senhas e chaves fortes.** Prefira chave pública a senha; nunca deixe senha em texto puro em scripts/fstab.

4. **Desconfie de redes públicas.** Em café/hotel, evite transferir arquivos sensíveis por SMB/SSH sem VPN; ative só o que for estritamente necessário.

## O top 5 dos erros e suas causas

| Sintoma | Causa provável | Fix rápido |
|---|---|---|
| Dispositivos não se veem (Warpinator/KDE Connect) | Firewall ou AP isolation | Liberar portas; testar em outra rede |
| SSH "connection refused" | `sshd` desligado ou IP errado | `systemctl enable --now sshd`; conferir `ip addr` |
| SFTP/SMB pede senha e falha | Conta sem senha / usuário errado | `passwd` no `deck`; conferir credencial |
| Copiar falha "read-only" | Arquivo em área read-only do sistema | Escrever em `/home`, não em `/` ou `/usr` |
| Arquivo chega truncado/corrompido | Remoção sem desmontar, ou cópia interrompida | `umount` antes de remover; usar `rsync` |

## Lendo logs

O primeiro lugar para olhar é o journal do systemd:

```terminal
# logs do sshd
$ journalctl -u sshd -n 50

# logs de falha de montagem
$ journalctl -u systemd -- -n 50 | grep -i mount
```

Falhas de montagem em fstab também aparecem com `dmesg`, especialmente para sistemas de arquivos corrompidos ou formato não suportado.

## Permissões e o sistema read-only

Uma pegadinha clássica: o SteamOS mantém o sistema (`/usr`, `/etc` em parte) **read-only**, com apenas `/home` (e alguns alvos) graváveis. Se uma transferência mira uma pasta do sistema, ela falha ou pede senha. Regra: **receba arquivos sempre em `/home/deck`** e, se precisar mexer no sistema, use `sudo steamos-readonly disable` com consciência (e reative depois).

```terminal
# status do sistema read-only
$ steamos-readonly status

# (usar apenas se necessário) — desativar temporariamente
$ sudo steamos-readonly disable
```

## Checklist de saúde

- Transferência pontual funciona nos dois sentidos?
- Saves sincronizam sem conflito ativo?
- Backup semanal rodou e o `rsync` retornou sem erro?
- Mídia removível foi desmontada com segurança?
- Serviços desnecessários estão parados?

Rodar essa lista a cada poucas semanas evita que um problema silencioso vire uma perda real.

## Pontos-chave

- Mantenha serviços ligados só quando preciso e portas restritas ao necessário.
- Prefira chave pública; nunca senha em texto puro em scripts.
- Aprenda o top-5 de erros e seus logs (`journalctl`, `dmesg`).
- Escreva sempre em `/home`; o sistema é read-only por padrão.
- Um checklist periódico vale mais que qualquer ferramenta nova.

## Exercícios

1. Liste os serviços ativos com `systemctl list-units --type=service --state=running` e identifique os de transferência.
2. Desligue o `sshd` (`systemctl stop sshd`) e confirme que a conexão remota falha; depois religue.
3. Provoque um erro de permissão tentando gravar em `/usr` (e observe a negação) sem desativar o read-only.
4. Inspecione `journalctl -u sshd` após uma tentativa de login e identifique sucessos e falhas.
5. **Desafio.** Configure regras de `firewalld` que permitam SSH e KDE Connect apenas na sua sub-rede local, e teste um acesso externo.
