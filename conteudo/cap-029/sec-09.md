Você já instalou, atualizou, gerenciou e ajustou permissões. Agora é hora de consolidar: diagnosticar problemas de forma metódica, entender como o Discover e o Flatpak se relacionam em cenários de falha e adotar uma rotina de manutenção que mantenha o Steam Deck saudável a longo prazo. Esta seção fecha o capítulo com um mapa de resolução de problemas e um checklist de manutenção.

Dominar a resolução de problemas do Discover/Flatpak significa entender as camadas — interface gráfica, libdiscover, Flatpak, OSTree, rede — e saber em qual delas o problema está antes de agir.

:::objetivos
- Diagnosticar falhas do Discover isolando a camada responsável
- Usar logs e o modo verboso para obter pistas concretas
- Adotar uma rotina de manutenção periódica do Flatpak
- Resolver os problemas mais comuns do ecossistema no Steam Deck
:::

## O mapa de camadas

Quando algo falha no Discover, a primeira pergunta é: **em que camada está o problema?** O fluxo de uma operação atravessa várias camadas independentes:

```text
[Discover (interface)] → [libdiscover] → [Flatpak/OSTree] → [rede] → [Flathub]
```

- **Discover** — bug de interface, lista não atualizada, botão que não responde
- **libdiscover** — backend desativado, catálogo cacheado corrompido
- **Flatpak/OSTree** — repositório local inconsistente, objeto corrompido, bloqueio de instalação
- **Rede** — DNS, proxy, firewall bloqueando `dl.flathub.org`
- **Flathub** — indisponibilidade temporária do servidor

Cada camada se diagnostica com ferramentas específicas. O erro mais comum é culpar a camada errada (ex.: atribuir ao Discover uma falha que na verdade é de rede).

## Diagnóstico guiado

**1. O Discover não mostra aplicativos (lista vazia ou desatualizada):**

```terminal
$ flatpak remotes
$ flatpak remote-list -d
$ flatpak update --no-deploy 2>&1 | head -20
```

Se `flatpak remotes` mostra o flathub mas a lista do Discover está vazia, o problema pode ser o cache da libdiscover. Uma solução é forçar a reindexação:

```terminal
$ pkcon refresh force
```

**2. A instalação falha com erro de rede:**

```terminal
$ curl -I https://dl.flathub.org/repo/summary
HTTP/2 200
```

Se o `curl` falha mas a rede funciona, o problema é DNS ou proxy:

```terminal
$ ping -c 1 dl.flathub.org
$ getent hosts dl.flathub.org
```

**3. A instalação falha com erro de espaço:**

```terminal
$ df -h /var/lib/flatpak /home
$ flatpak list --columns=name,size | sort -k2 -h | tail -10
```

Identifique os maiores consumidores e libere espaço com `flatpak uninstall` seguido de `flatpak uninstall --unused`.

**4. O aplicativo instala mas não abre (ícone some, crash na inicialização):**

```terminal
$ flatpak run <id> 2>&1 | head -30
```

Rode o aplicativo pelo terminal. As mensagens de erro do sandbox e do runtime aparecem aí. Se não houver mensagem útil, use o modo de depuração:

```terminal
$ flatpak run -d <id> 2>&1 | grep -i -E 'error|warn|denied' | head -20
```

**5. Atualizações não aparecem no Discover:**

```terminal
$ flatpak update
```

Se `flatpak update` mostra atualizações mas o Discover não, o problema está na libdiscover (cache do backend). Reinicie o Discover ou, em último caso, feche e reabra a sessão.

:::dica
Um diagnóstico rápido e não-destrutivo: use `flatpak repair`. Ele verifica a consistência do repositório local OSTree e corrige objetos corrompidos, sem desinstalar nada. Se suspeita de corrupção no diretório `/var/lib/flatpak`, é o primeiro comando a tentar.
:::

## Rotina de manutenção periódica

Adote uma rotina mensal — ou sempre que notar lentidão ou falta de espaço:

```terminal
$ flatpak update
$ flatpak uninstall --unused
$ flatpak repair
$ flatpak list --columns=name,size | sort -k2 -h
$ df -h /home
```

Em sequência, esses comandos atualizam tudo, removem lixo, reparam repositórios e dão uma visão clara do espaço. São seguros e não-destrutivos (nenhum remove dados de aplicativos em uso ativo).

Uma versão mais agressiva, para quando o espaço está crítico:

```terminal
$ flatpak list --app --columns=name,application
$ flatpak uninstall <id-que-nao-uso>
$ flatpak uninstall --unused
$ flatpak repair --user --system
```

Aqui você decide manualmente o que desinstalar a partir da lista.

:::atencao
Nunca rode `flatpak repair` ou `flatpak uninstall` durante uma instalação em andamento. Espere o Discover terminar o que estiver fazendo (a barra de progresso desaparecer) antes de qualquer operação de manutenção. Operações simultâneas no mesmo repositório OSTree podem corromper o índice.
:::

## Resolvendo os clássicos do Steam Deck

Três problemas recorrentes no ecossistema do Steam Deck, com suas soluções:

**"Instalei pelo Discover mas o app não aparece no Modo Jogo"** — o Modo Jogo usa uma lista própria de atalhos, separada do menu do KDE. Aplicativos Flatpak aparecem no Modo Jogo apenas quando adicionados como "atalho de não-jogo" na interface da Steam. Isso não é problema do Flatpak nem do Discover; é como o Modo Jogo indexa atalhos.

**"O Discover está em inglês mesmo com o sistema em português"** — verifique se o pacote de tradução do Flatpak (`org.kde.discover.Locale`) foi baixado. Se não, force:

```terminal
$ flatpak update org.kde.discover.Locale
```

**"Atualizei o Firefox e ele cresceu 200 MB"** — Flatpaks não fazem atualização delta eficiente em todas as situações; às vezes o OSTree baixa o commit inteiro. Não é vazamento de memória nem bug; é o funcionamento normal do modelo atômico (cada versão é um commit completo, com deduplicação interna).

## Resumo

- Falhas do Discover atravessam camadas (interface, libdiscover, Flatpak, rede, Flathub); isole a camada antes de agir.
- Diagnóstico começa com `flatpak remotes`, `df -h`, `flatpak update` e `flatpak run <id>`.
- `flatpak repair` verifica e corrige o repositório local sem desinstalar nada.
- Uma rotina mensal de `update` → `uninstall --unused` → `repair` mantém o Flatpak saudável.
- Problemas específicos do Steam Deck (app sumindo no Modo Jogo, tradução, crescimento de tamanho) têm causas conhecidas e soluções simples.

## Exercícios

1. Execute a sequência completa de manutenção: `flatpak update`, `flatpak uninstall --unused`, `flatpak repair`, `df -h /home`. Anote a saída de cada comando e quanto espaço (se algum) foi liberado.
2. Force uma falha de rede controlada: desconecte o Wi-Fi e tente atualizar pelo Discover. Anote a mensagem de erro exata. Depois reconecte e repita — o erro some?
3. Rode um aplicativo Flatpak pelo terminal com `flatpak run <id>` e tente reproduzir um problema de permissão (ex.: salvar numa pasta fora do sandbox). Use `flatpak override` para corrigir e confirme.
4. Execute `flatpak repair` e observe a saída. Ele reportou algum objeto corrompido? Compare o tempo de execução com uma segunda chamada (a segunda deve ser mais rápida, pois nada foi encontrado).
5. **Desafio.** Crie um "plano de recuperação" por escrito: imagine que seu Steam Deck ficou sem espaço e o Discover parou de funcionar (lista vazia, instalações falham). Usando APENAS os comandos deste capítulo e da seção sobre permissões, escreva os passos exatos — na ordem — que você seguiria para diagnosticar e recuperar o sistema, sem reinstalar nada. Inclua os comandos de rede, espaço, reparo e permissão, e explique o que você faria se cada comando falhasse. Peça a alguém (ou a uma IA) para revisar seu plano e aponte as falhas.