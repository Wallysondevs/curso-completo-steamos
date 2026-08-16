Você chegou ao fim do capítulo, mas não ao fim da história: conta, biblioteca e loja são sistemas vivos que interagem com o resto do SteamOS — redes, disco, desktop, `systemd`. Esta seção fecha o arco com duas coisas: um resumo operacional de tudo o que os comandos do capítulo revelam sobre o seu Deck, e um diagnóstico de problemas comuns, para que você saiba agir quando algo sair do lugar.

:::objetivos
- Consolidar os comandos de inspeção vistos ao longo do capítulo
- Diagnosticar problemas comuns de conta, loja e biblioteca
- Entender o que os logs do Steam informam e o que escondem
- Reconhecer a relação entre o capítulo e outras partes do curso
- Formar um checklist de verificação rápida do ambiente Steam
:::

## O mapa completo dos comandos

As seções deste capítulo percorreram um conjunto pequeno, mas poderoso, de comandos e arquivos. Vale agrupá-los numa tabela de referência, porque é essa visão consolidada que transforma instruções soltas em competência:

| Comando/arquivo | O que responde |
|---|---|
| `~/.steam/steam/config/loginusers.vdf` | Quem está logado e se a sessão está guardada |
| `~/.steam/steam/config/config.vdf` | SteamID64 e configuração global do cliente |
| `~/.local/share/Steam/steamapps/` | Onde os jogos e seus metadados vivem |
| `~/.local/share/Steam/steamapps/libraryfolders.vdf` | Bibliotecas (SSD + microSD) e o que cada uma contém |
| `~/.local/share/Steam/userdata/[SteamID64]/` | Saves, screenshots e config por conta |
| `flatpak list | grep steam` | A instalação Flatpak do cliente no SteamOS |
| `steamcmd +login USER` | Cliente em texto para servidores e automação |
| `steam steam://...` | Ponte do terminal para a interface (loja, biblioteca, instalação) |

Todos eles orbitam as mesmas três perguntas: *quem sou eu no Steam, o que eu possuo e onde isso está no disco.* Com essa tabela em mãos, nenhum problema do capítulo fica sem um primeiro passo de investigação.

## O que os logs contam (e o que não contam)

Os logs do cliente Steam, em `~/.steam/steam/logs/`, são a sua janela de diagnóstico — mas ela é parcial. Eles registram eventos de compatibilidade, downloads e alguns erros, mas **não** guardam senhas nem o conteúdo dos seus saves. Saber isso importa por dois motivos: você sabe onde procurar, e sabe o que proteger.

```terminal
$ ls ~/.steam/steam/logs/
bootstrap_log.txt
cef_log.txt
console-linux.txt
content_log.txt
remote_connections.txt
stats_log.txt
```

Cada arquivo tem um papel. O `console-linux.txt` concentra mensagens do processo do cliente; `content_log.txt` registra downloads e atualizações de conteúdo; `bootstrap_log.txt` cobre a inicialização. O `grep` de compatibilidade que usamos nas seções do Verified lê do conjunto desses arquivos.

:::atencao
Os logs do Steam **não** são segredos de conta, mas podem conter caminhos, nomes de usuário e appids que juntos ajudam um atacante a mapear seu ambiente. O `loginusers.vdf` e tokens, sim, são secretos e jamais devem ser compartilhados — regra já definida na primeira seção e que continua valendo aqui. Na dúvida entre "log" e "credencial", trate tudo que vive em `~/.steam` com o mesmo cuidado.
:::

## Diagnóstico: três falhas recorrentes

**"O cliente abre, mas não conecta."** Antes de culpar a conta, verifique a rede. O capítulo de redes do curso cobre isso em profundidade, mas o sintoma local é a ausência de conexão com os servidores da Valve.

```terminal
$ ping -c 3 steamcommunity.com
PING steamcommunity.com (192.168.1.1) 56(84) bytes of data.
```

Se o `ping` responde, o problema não é físico; pode ser DNS, proxy ou a sessão expirada. Se não responde, o Deck está offline e a loja inteira falha — não é bug do Steam, é rede.

**"O jogo não baixa / para no meio."** Quase sempre é espaço ou permissão do diretório de destino.

```terminal
$ df -h ~/.local/share/Steam
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  468G  465G  1.2G  99% /home
```

`Avail` em `1.2G` é o diagnóstico pronto: disco cheio. Nenhum selo de compatibilidade resolve isso — é logística de biblioteca, tema da seção 6.

**"O save não voltou."** Depois de restaurar um Deck novo, alguns jogos não trazem o progresso. O primeiro lugar a olhar é o Cloud e o `remote/`:

```terminal
$ ls ~/.local/share/Steam/userdata/[SEU_STEAM_ID64]/remote/
```

Ou, para um jogo específico, o `remote/` dentro do appid dele. Se a pasta está vazia e a nuvem não restaurou, o jogo provavelmente não suporta Steam Cloud — o que reforça a lição da seção 8 sobre backup manual do `userdata`.

:::dica
Três perguntas resolvem 90% dos problemas deste capítulo, nesta ordem: (1) estou online? (`ping`), (2) tenho espaço? (`df -h`), (3) minha sessão é válida? (`loginusers.vdf` e desautorização). Comece sempre por elas antes de reinstalar tudo.
:::

## Ligações com o resto do curso

Este capítulo é um nó numa rede maior. O `steamcmd` e o `flatpak` reaparecem quando estudamos instalação de software no SteamOS; o `df` e as partições reaparecem nos capítulos de discos; o `ping` e a loja que não conecta pertencem ao capítulo de redes [ver a seção sobre rede do curso](#/cap-009/sec-02). A conta e o multi-uso do Deck conversam com a administração de usuários do próprio Linux.

O elo que você deve levar daqui: o Steam **é o sistema** no Deck, mas o SteamOS **é Linux** por baixo. Tudo o que você aprendeu de conta, loja e biblioteca é o caso de uso, e o Linux é a fundação que o torna possível.

## Checklist de verificação rápida

Encerre rodando, em sequência, um "check-up" do ambiente Steam do seu Deck:

```terminal
$ cat ~/.steam/steam/config/loginusers.vdf
$ df -h ~/.local/share/Steam
$ du -sh ~/.local/share/Steam/steamapps/common/* | sort -h | tail -3
$ flatpak list | grep -i steam
```

Esses quatro comandos respondem: estou logado? tenho espaço? o que pesa? o cliente está presente? É o resumo executável de tudo o que este capítulo ensinou, condensado em meia dúzia de linhas que rodam em segundos.

## Resumo

- Os comandos do capítulo respondem a três perguntas: quem sou, o que possuo, onde está no disco.
- Logs do Steam registram eventos e erros, mas não credenciais; `loginusers.vdf` e tokens são secretos.
- "Não conecta", "não baixa" e "save sumiu" são as falhas mais comuns, cada uma com diagnóstico próprio.
- `ping`, `df -h` e a checagem de `loginusers.vdf` resolvem 90% dos casos antes de reinstalar.
- O capítulo liga-se a redes, discos e administração do Linux em outras partes do curso.
- O check-up de 4 comandos resume a inspeção do ambiente Steam no Deck.

## Exercícios

1. Monte sua própria tabela de referência com os 8 comandos/arquivos da tabela desta seção, anotando a pergunta que cada um responde.
2. Rode `ls ~/.steam/steam/logs/` e descreva a função presumida de dois arquivos, a partir do nome e de um `head` em cada um.
3. Execute o check-up completo (os quatro comandos do bloco final) e escreva um parágrafo diagnosticando o estado atual do seu Deck.
4. Provoque e resolva um problema: deixe o disco propositalmente apertado só na simulação (sem instalar nada), e explique em texto o que você faria se visse `df -h` com `Use%` acima de 95%.
5. **Desafio.** Escreva um único script `bash` que rode os quatro comandos do check-up em sequência, salvando a saída num arquivo `~/lab/checkup-steam.txt`. Depois explique como esse script se conecta ao que você aprendeu em todas as seções do capítulo — e por que ele nunca deve capturar o conteúdo de tokens.
