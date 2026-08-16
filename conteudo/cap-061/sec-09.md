As oito seções anteriores atacaram cada ladrão de espaço com a ferramenta certa. Esta última seção fecha o capítulo com o que fazer quando tudo falhou — o disco chegou a 100% e o Steam nem abre — e com as boas práticas que mantêm o Deck saudável a longo prazo. Inclui `fstrim`, diferenças entre SSD e eMMC, e a importância de nunca sobrecarregar o sistema de arquivos ao ponto de corrupção.

:::objetivos
- Recuperar espaço quando o disco atingiu 100% e o sistema está travado
- Entender a importância do TRIM (`fstrim`) no SSD e como ele afeta a performance
- Diferenciar SSD NVMe, eMMC e os cuidados de desgaste com cada um
- Aplicar boas práticas de longo prazo para nunca mais ver disco cheio
- Compilar um resumo de comandos de emergência para situações críticas
:::

## Quando chega a 100%

Disco 100% cheio não é só inconveniente: o SteamOS pode falhar em iniciar novas sessões, o KDE Plasma trava ao tentar escrever em cache, e o Steam pode corromper o estado da biblioteca ao tentar atualizar um jogo sem espaço para staging. O plano de emergência:

```terminal
## 1. Se o modo Desktop ainda abre, vá para o terminal. Se não, mude para o TTY:
## [[Ctrl+Alt+F2]] → login como deck

## 2. Identifique rapidamente o que está ocupando (sem entrar na home para evitar mais escrita)
$ du -x --max-depth=1 /home/deck | sort -nr | head -10

## 3. Libere emergencialmente: shader cache é 100% seguro e rápido de apagar
$ rm -rf /home/deck/.local/share/Steam/steamapps/shadercache/*

## 4. Se ainda não bastar, apague a lixeira
$ rm -rf /home/deck/.local/share/Trash/files/*

## 5. Verifique se voltou a ter espaço respirável (pelo menos 2-3 GB para o sistema funcionar)
$ df -h /home
```

Se o problema for tão severo que nem o TTY abre, inicialize por um pendrive de recuperação Linux (qualquer live USB serve) e monte a partição `/home` para fazer a limpeza. O Btrfs permite montagem externa sem riscos adicionais.

## TRIM e a saúde do SSD

SSDs não "apagam" células — eles as marcam como disponíveis e as reescrevem. O TRIM é o comando que avisa ao SSD: "esses blocos NÃO estão mais em uso, pode reciclar". Sem TRIM periódico, a performance de escrita degrada visivelmente depois de meses de uso intenso.

No SteamOS, o `fstrim` roda via timer do systemd, mas você pode verificar:

```terminal
$ systemctl status fstrim.timer
● fstrim.timer - Discard unused blocks once a week
   Active: active (waiting) since Sat 2024-08-10 12:34:15 UTC; 3 days ago

$ sudo fstrim -v /
/: 3.2 GiB (3428007936 bytes) trimmed
$ sudo fstrim -v /home
/home: 47.1 GiB (50541264896 bytes) trimmed
```

O número "47.1 GiB trimmed" não é espaço liberado agora — é o total de blocos que foram marcados como descartáveis desde o último trim. Rodar `fstrim` manualmente é inofensivo e recomendável após uma grande faxina (você apagou gigabytes de arquivos, então há muitos blocos a reciclar).

:::dica
O timer `fstrim` roda semanalmente, mas você pode forçá-lo depois de uma limpeza pesada. É o equivalente a "passar o aspirador depois de derrubar areia no carpete" — não é obrigatório, mas evita degradação acumulada.
:::

## SSD NVMe vs. eMMC

O Deck tem dois modelos de armazenamento interno: SSD NVMe no modelo de 256/512 GB e eMMC de 64 GB no modelo de entrada, além do OLED com SSD de 512/1 TB. A diferença prática para gerenciamento de espaço:

| Característica | NVMe (256/512/1024 GB) | eMMC (64 GB) |
|---|---|---|
| Velocidade de leitura | ~2500-3500 MB/s | ~300-400 MB/s |
| TRIM importante? | Sim, mas menos crítico | Sim, e mais crítico — menos canais de escrita |
| Espaço típico livre após sistema | 180-470 GB em `/home` | 15-30 GB em `/home` |
| Tolerância a disco cheio | Média (cache e staging funcionam) | Baixa (Btrfs precisa de espaço para COW) |

No modelo eMMC de 64 GB, o Btrfs está mais pressionado: como é Copy-on-Write, toda modificação aloca blocos novos antes de liberar os antigos — se não houver blocos livres, a operação falha com `ENOSPC`. Por isso, o modelo de 64 GB exige uma disciplina de espaço que o modelo maior tolera sem pensar.

## Boas práticas de longo prazo

Com tudo o que você aprendeu neste capítulo, estas seis práticas garantem que você nunca mais veja disco cheio sem aviso:

1. **Reserve 15 GB para respiro.** Não deixe a home passar de 90-92% de uso. O Btrfs precisa de blocos livres para operações COW; abaixo de 5% livre, até renomear um arquivo pode falhar.
2. **Rotação trimestral.** A cada três meses, rode o `limpa-disco.sh` manualmente e o `fstrim -v /home` em seguida.
3. **Shader cache sob controle.** Mantenha o cache só dos 10 jogos que você está jogando; remova o resto periodicamente ou automatize com o script.
4. **ROMs no microSD.** Jogos de PS2, GameCube e Wii são os maiores consumidores; mova tudo para o cartão com symlink.
5. **Não ignore prefixos órfãos.** Depois de desinstalar jogos, verifique `compatdata` por resíduos. É uma verificação de 30 segundos.
6. **Monitoramento ativo.** O timer semanal com alerta de 85% é seu seguro. Se o Deck emitir o alerta, reserve 15 minutos para fazer a faxina antes de o disco cruzar 95%.

## Checklist de emergência

Guarde esta lista como referência rápida (imprima ou salve no celular):

:::perigo
Os comandos "Free" abaixo usam `rm -rf`. No SteamOS, `~` aponta para `/home/deck`, então `rm -rf ~/.local/share/Trash/files/*` é seguro — mas um erro de digitação (como um espaço antes do `*`, ou `rm -rf ~/` em vez de `~/...`) apaga sua home inteira. Só execute em emergência, com calma, copiando e colando. Se o comando tiver `sudo`, redobre a atenção.
:::

```terminal
## COMANDOS DE EMERGÊNCIA — DECK COM DISCO CHEIO

## Quanto espaço disponível?
$ df -h /home

## O que está ocupando? (ordem decrescente, um nível)
$ du -h --max-depth=1 /home/deck 2>/dev/null | sort -hr | head -10

## Free 1: shader cache (regenerável, seguro)
$ rm -rf ~/.local/share/Steam/steamapps/shadercache/*

## Free 2: lixeira (já estava apagada)
$ rm -rf ~/.local/share/Trash/files/*

## Free 3: Flatpak órfãos
$ flatpak uninstall --unused

## Free 4: journal velho
# journalctl --vacuum-size=50M

## Free 5: Downloads antigos (> 180 dias)
$ find ~/Downloads -type f -mtime +180 -delete

## TRIM (depois de liberar)
# fstrim -v /home
```

## Resumo

- Disco 100% cheio no Btrfs pode corromper o estado do Steam; aja rápido com o plano de emergência.
- Shader cache, lixeira e Flatpak órfãos são os três alvos mais seguros para liberar espaço em crise.
- `fstrim` recicla blocos do SSD que foram liberados; rode após toda faxina grande.
- Modelos eMMC de 64 GB exigem disciplina rígida de espaço; o Btrfs não perdoa.
- Um timer semanal com alerta de 85% e um script de limpeza mantêm o Deck saudável sem intervenção manual.

## Exercícios

1. Simule uma emergência: anote o espaço livre, depois rode os três primeiros "frees" do checklist e meça o ganho.
2. Execute `sudo fstrim -v /home` e anote quantos GB foram reciclados; compare com o espaço que você liberou nas seções anteriores.
3. Descubra se seu Deck tem SSD NVMe ou eMMC com `lsblk -d -o NAME,TYPE,SIZE,ROTA,TYPE`; discuta as implicações.
4. Crie sua própria checklist de emergência personalizada com os comandos que funcionaram melhor no seu Deck.
5. **Desafio.** Provoque conscientemente uma situação de disco a 95% (baixe um arquivo grande em `/tmp`, não em `/home`), execute o plano de emergência completo e meça o tempo do diagnóstico à resolução. Documente cada passo e identifique o gargalo.