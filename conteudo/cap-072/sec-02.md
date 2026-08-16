O diálogo de conflito do Steam Cloud é uma das piores experiências de UX da plataforma: duas opções genéricas, nenhuma pré-visualização do conteúdo, zero contexto sobre qual máquina gerou qual versão. Um clique errado e você perde semanas de progresso. Felizmente, por baixo desse diálogo existe lógica determinística e arquivos que permitem resolver conflitos com precisão cirúrgica — inclusive recuperar saves que o Steam já deu como perdidos.

:::objetivos
- Compreender o algoritmo de conflito do Steam Cloud
- Resolver conflitos manualmente comparando arquivos antes de decidir
- Restaurar saves sobrescritos usando os backups locais automáticos do Steam
- Usar o `steam_autocloud.vdf` para forçar preferência por uma versão
- Impedir que um conflito apague saves sem backup
:::

## O algoritmo do conflito

Quando o Steam detecta que um arquivo mudou tanto localmente quanto no servidor desde a última sincronização, ele não consegue decidir sozinho qual versão é a "correta". A condição exata é: `localtime > remotetime` (mudou local) E o servidor reporta um `remotetime` mais novo que o `remotetime` armazenado localmente (mudou no servidor também). Isso acontece quando você joga o mesmo jogo em duas máquinas sem sincronizar entre elas.

O diálogo oferece duas escolhas mal traduzidas: "Enviar para a nuvem" (sobe a versão local, descarta a remota) ou "Baixar da nuvem" (desce a remota, sobrescreve a local). O que ele não mostra é que o Steam já fez uma cópia de segurança antes de exibir o diálogo.

```terminal
$ ls ~/.local/share/Steam/userdata/207304170/730/local/cfg/
config.cfg
config.cfg.bak
config.cfg.bak2
$ diff ~/.local/share/Steam/userdata/207304170/730/local/cfg/config.cfg \
        ~/.local/share/Steam/userdata/207304170/730/local/cfg/config.cfg.bak
13c13
<         "setting.gpu_mem_level"         "2"
---
>         "setting.gpu_mem_level"         "1"
```

Antes de sobrescrever qualquer arquivo local com a versão remota, o Steam renomeia o original para `.bak`. Se o arquivo `.bak` já existir, ele cria `.bak2`. Isso significa que, mesmo que você escolha "Baixar da nuvem" e se arrependa, o arquivo local anterior ainda está ali — só precisa ser restaurado manualmente.

:::dica
Se o diálogo de conflito aparecer e você não tiver certeza, **feche o Steam completamente** antes de escolher. Copie as duas versões (local e `.bak`) para uma pasta segura. Depois reabra o Steam, faça sua escolha, e compare com as cópias de segurança. Assim você sempre tem uma rota de volta.
:::

## Forçando preferência com `steam_autocloud.vdf`

O Steam respeita um arquivo especial chamado `steam_autocloud.vdf` dentro da raiz da `userdata`. Ele serve para forçar uma decisão automática quando há conflito, sem mostrar o diálogo. É útil em máquinas headless ou em cenários onde você sempre quer que uma máquina específica vença:

```
"steam_autocloud"
{
        "account"
        {
                "autocloudsave"         "1"
        }
}
```

Com `autocloudsave` em `1`, o Steam sempre envia a versão local ao detectar conflito, sem perguntar. Com `0`, sempre baixa a remota. Se o arquivo não existir, o comportamento padrão é mostrar o diálogo.

```terminal
$ cat ~/.local/share/Steam/userdata/207304170/steam_autocloud.vdf
cat: /home/deck/.local/share/Steam/userdata/207304170/steam_autocloud.vdf: Arquivo ou diretório inexistente
$ echo '"steam_autocloud"' > /tmp/autocloud.vdf
# edite o arquivo e depois:
$ cp /tmp/autocloud.vdf ~/.local/share/Steam/userdata/207304170/steam_autocloud.vdf
```

:::perigo
Habilitar `autocloudsave = 1` significa que você nunca mais verá o diálogo de conflito — o Steam vai silenciosamente sobrescrever a versão remota com a local **sempre**. Se você joga em duas máquinas e esqueceu dessa configuração, pode perder saves da outra máquina sem aviso. Use com consciência e documente em qual máquina ativou.
:::

## Restaurando um save que o Steam sobrescreveu

Cenário clássico: você clicou "Baixar da nuvem" sem querer e perdeu as últimas 8 horas de Elden Ring. O Steam já sobrescreveu o save, mas o arquivo `.bak` ainda está lá. O processo de restauração é manual, mas simples:

```terminal
$ ls -la ~/.local/share/Steam/userdata/207304170/1245620/local/
total 320
-rw-r--r-- 1 deck deck 149876 Abr 20 01:33 ER0000.sl2
-rw-r--r-- 1 deck deck 149876 Abr 19 19:14 ER0000.sl2.bak
$ cp ~/.local/share/Steam/userdata/207304170/1245620/local/ER0000.sl2.bak \
     ~/.local/share/Steam/userdata/207304170/1245620/local/ER0000.sl2
```

Depois de restaurar o `.bak`, o arquivo restaurado tem timestamp mais novo que o `remotetime` do servidor. Na próxima vez que você fechar o jogo, o Steam sobe essa versão como se fosse a legítima.

Mas há uma sutileza: o Steam também mantém um cache no servidor que pode rejeitar um arquivo se o hash não bater com o que ele espera. Se após restaurar o `.bak` o Steam insistir em baixar a versão remota de novo, você precisa forçar o cliente a aceitar sua versão:

```terminal
$ pkill steam
$ rm ~/.local/share/Steam/userdata/207304170/1245620/remotecache.vdf
# Restaure o save desejado como acima
# Na reabertura do Steam, ele tratará como "primeiro sync" e subirá sua versão
```

Apagar o `remotecache.vdf` é uma medida drástica, mas eficaz: o Steam perde a referência de qual versão estava sincronizada e trata o arquivo local como a fonte da verdade.

## Quando o `.bak` não salva

Existem duas situações em que o backup automático falha. A primeira é quando o conflito acontece múltiplas vezes na mesma sessão — o Steam só mantém `.bak` e `.bak2`, sobrescrevendo o mais antigo. Se você abriu e fechou o jogo três vezes com conflito, a primeira versão já foi perdida pelo mecanismo automático.

A segunda é quando o save não está em `userdata/`. Jogos que salvam em `~/Documents/My Games/` ou dentro do prefixo Proton em `compatdata/` **não** geram `.bak` automático — o Steam Cloud monitora esses caminhos mas o backup só cobre a árvore `userdata/`.

```terminal
$ find ~/.local/share/Steam/steamapps/compatdata/1245620/pfx/drive_c/users/steamuser/Documents/ \
    -name "*.sl2" -o -name "*.sav" -o -name "*.dat" 2>/dev/null
/home/deck/.local/share/Steam/steamapps/compatdata/1245620/pfx/drive_c/users/steamuser/Documents/Elden Ring/ER0000.sl2
```

Para esses casos, a única proteção é um backup externo — seja um `tar` agendado (ver [seção sobre backup offline](#/cap-072/sec-07)) ou uma sincronização com Syncthing (ver [seção sobre Syncthing](#/cap-072/sec-06)).

:::atencao
Jogos com anti-cheat ou que usam saves no servidor (como Destiny 2, The Division 2 e a maioria dos MMOs) não dependem do Steam Cloud para progresso — o save está na conta do jogo, não no seu disco. Nesses casos, o Steam Cloud é irrelevante, e restaurar arquivos locais não muda nada.
:::

## Resumo

- O conflito ocorre quando `localtime > remotetime` nos dois lados; o Steam faz backup `.bak` antes de sobrescrever.
- O arquivo `steam_autocloud.vdf` com `autocloudsave = 1` (ou `0`) suprime o diálogo e força a decisão automaticamente.
- Restaurar um save sobrescrito é copiar o `.bak` por cima do original e, se necessário, apagar o `remotecache.vdf` para forçar ressincronização.
- Jogos que salvam fora de `userdata/` não ganham `.bak` automático; precisam de backup externo.
- Saves em servidor (MMOs, jogos com anti-cheat) são imunes ao Steam Cloud — a restauração local não os afeta.

## Exercícios

1. Provoque um conflito controlado: jogue um jogo com Cloud, feche o Steam, edite um arquivo de configuração manualmente e mude seu timestamp com `touch -t`. Abra o Steam e veja o que acontece.
2. Localize três jogos seus que salvam fora da árvore `userdata/`. Para cada um, escreva o caminho completo do save e verifique se há algum mecanismo de `.bak` sendo gerado pelo jogo (não pelo Steam).
3. Crie um `steam_autocloud.vdf` com `autocloudsave = 1`, abra um jogo, feche, e verifique se o `remotecache.vdf` foi atualizado sem diálogo. Depois remova o arquivo de autocloud.
4. Simule uma restauração: renomeie um save para `.bak`, crie um novo save com conteúdo diferente, depois restaure usando o `.bak`. O Steam Cloud subiu a versão restaurada?
5. **Desafio.** Escreva um script que monitore `~/.local/share/Steam/userdata/<seu_id>/` com `inotifywait` e, sempre que um arquivo `.bak` aparecer, copie-o para uma pasta `~/save-backups/<appid>/` com um timestamp no nome. Teste provocando um conflito.