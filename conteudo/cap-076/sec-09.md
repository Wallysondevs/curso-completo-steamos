Toda otimização deste capítulo tem uma coisa em comum: basta uma atualização do SteamOS ou do jogo para que ela deixe de fazer sentido — ou passe a atrapalhar. Saber **reverter** é tão importante quanto saber aplicar. Esta seção fecha o capítulo ensinando como voltar ao estado original de forma limpa, conhecer alternativas que não exijam mexer no kernel, e limpar resíduos que ferramentas de tweak deixam para trás.

:::objetivos
- Reverter swappiness, THP e zram aos valores originais
- Restaurar o modo somente leitura do SteamOS de forma segura
- Remover resíduos deixados por ferramentas de otimização
- Conhecer alternativas que não exigem tocar no kernel
- Estabelecer uma rotina de verificação após atualizações do sistema
:::

## Revertendo cada tweak na prática

Cada parâmetro que o CryoUtilities altera tem um caminho de volta. O princípio é devolver exatamente o valor que existia antes, e não "um valor bom" — porque o estado de fábrica da Valve já foi calibrado para o conjunto do sistema.

**Swappiness.** Volte ao valor original (100 no SteamOS 3.6) no arquivo persistente ou em tempo real:

```terminal
# echo 100 > /proc/sys/vm/swappiness
$ sysctl vm.swappiness
vm.swappiness = 100
```

Se você criou um arquivo em `/etc/sysctl.d/`, remova-o em vez de apenas mudar o valor, para eliminar o tweak pela raiz:

```terminal
$ sudo rm /etc/sysctl.d/99-deck-custom.conf
$ sudo sysctl --system
```

**Transparent Huge Pages.** Devolva o modo `madvise` (padrão sempre que o SteamOS 3.6) para o arquivo:

```terminal
# echo madvise > /sys/kernel/mm/transparent_hugepage/enabled
$ cat /sys/kernel/mm/transparent_hugepage/enabled
always [madvise] never
```

**zram.** Se você redimensionou o zram (via script ou ferramenta), o caminho é religar o serviço que o gerencia. O SteamOS usa um swapfile/configuração própria; desfazer um `zram` customizado costuma envolver:

```terminal
$ sudo swapoff /dev/zram0
$ sudo zramctl --reset /dev/zram0
```

Depois, reinicie ou religue o gerador de zram do sistema para recriar com o tamanho padrão.

:::perigo
`swapoff` num sistema com pouca RAM livre pode travar, porque os dados comprimidos no zram precisam voltar para a RAM de uma vez. Feche aplicativos pesados antes de desativar o swap, ou reinicie o Deck com o serviço de zram desfeito em vez de forçar o `swapoff` ao vivo.
:::

## Restaurando o modo somente leitura

Tweaks exigem `steamos-readonly disable`, como visto na [abertura do capítulo](#/cap-076/sec-01). Se você mexeu em `/etc` ou `/usr`, precisa devolver a trava, ou futuras atualizações podem se comportar de forma imprevisível ao não conseguir reescrever arquivos que você alterou:

```terminal
$ sudo steamos-readonly status
Read-only filesystem status: disabled

$ sudo steamos-readonly enable
$ sudo steamos-readonly status
Read-only filesystem status: enabled
```

O ciclo `disable` → editar → `enable` é a forma correta. Deixar o sistema permanentemente em modo escrita é um risco: as atualizações atômicas do SteamOS esperam uma raiz somente leitura e podem conflitar com arquivos que você deixou editados.

:::atencao
Não confunda "reverter o tweak" com "apagar toda a pasta". Se você apagar um diretório de sistema enquanto o readonly está desabilitado, está corrompendo o SteamOS, não o desinstalando. Reverter é sempre devolver os valores originais, nunca apagar estrutura do sistema.
:::

## Resíduos que ferramentas deixam

Ferramentas de otimização (e scripts copiados de fórum) frequentemente criam arquivos em lugares que esquecem de limpar ao desinstalar. Os suspeitos comuns:

| Local | O que procurar |
|---|---|
| `/etc/sysctl.d/` | Arquivos com `swappiness` ou tweaks de VM |
| `/etc/systemd/system/` | Units customizadas que reaplicam tweaks no boot |
| `/etc/tmpfiles.d/` | Regras que recriam arquivos de ajuste |
| `~/.config/` e `~/.local/share/` | Configurações de apps de tweak |

Uma varredura rápida por referências aos valores típicos encontra resíduos:

```terminal
$ sudo grep -rE 'swappiness|nr_hugepages|transparent_hugepage' /etc/ 2>/dev/null
/etc/sysctl.d/99-deck-custom.conf:vm.swappiness=1
/etc/tmpfiles.d/cryo.conf:w /proc/sys/vm/swappiness - - - - 1
```

Muitas ferramentas criam uma unit do systemd que **reaplica** o tweak a cada boot. É por isso que "eu mudei o swappiness de volta e no reboot voltou a 1": uma unit estava reescrevendo. Ache-a e desative:

```terminal
$ systemctl list-unit-files | grep -iE 'cryo|tweak|swap|huge'
cryo-utilities.service          enabled
$ sudo systemctl disable --now cryo-utilities.service
```

:::dica
Após reverter, reinicie o Deck e confira se os valores **continuam** no padrão. Se voltarem a mudar sozinhos, há uma unit do systemd ou um script de boot reaplicando o tweak — procure com `systemctl list-unit-files` e `grep -r` em `/etc`.
:::

## Alternativas que não tocam no kernel

Nem toda melhoria exige mexer em `sysctl`. Muitas "otimizações" têm equivalentes dentro das opções que a Valve já oferece, sem risco de instabilidade:

- **Liberar memória:** fechar aplicativos em segundo plano no modo desktop, em vez de baixar swappiness.
- **Reduzir stutter de shader:** deixar o cache de shader atualizado (Steam baixa/compila em segundo plano), em vez de mexer em huge pages.
- **Saúde do SSD:** o `fstrim.timer` já agendado da Valve cobre o TRIM — nenhum tweak necessário.
- **Temperatura/clocks:** usar o limite de TDP e o controle de FPS do Quick Access Menu, que a Valve otimizou, em vez de ferramentas externas de overclock.

A regra de bolso: prefira a alternativa **suportada pela Valve** antes do ajuste cru de kernel. Elas são testadas nas mesmas atualizações que quebram os tweaks manuais.

## Rotina de auditoria pós-update

O SteamOS atualiza de forma atômica e reseta o sistema para o estado de fábrica em muitas partições. Qualquer tweak manual pode sumir — ou, pior, conflitar. Após cada atualização grande, rode um check rápido:

```terminal
$ sysctl vm.swappiness
$ cat /sys/kernel/mm/transparent_hugepage/enabled
$ systemctl status fstrim.timer --no-pager | head -3
$ sudo steamos-readonly status
```

Se algo voltou ao padrão da Valve, decida **conscientemente** se vale reaplicar o tweak (re-testando) ou se a nova versão já tornou o ajuste desnecessário. Muitos tweaks populares morreram por se tornarem padrão após uma atualização da Valve.

## Resumo

- Reversão é devolver o valor original (e remover o arquivo persistente), não só "mudar para um valor bom".
- Restaurar `steamos-readonly enable` é obrigatório após qualquer edição em `/etc` ou `/usr`.
- Resíduos em `/etc/sysctl.d`, `/etc/systemd/system` e `/etc/tmpfiles.d` reaplicam tweaks no boot e precisam ser removidos.
- Alternativas suportadas pela Valve (Quick Access Menu, cache de shader, fstrim nativo) dispensam tweaks de kernel.
- Após cada atualização, rode um check de valores para decidir se vale reaplicar.

## Exercícios

1. Liste todos os arquivos em `/etc/sysctl.d/` e identifique quais não pertencem ao sistema base (criados por você ou por ferramentas).
2. Verifique `systemctl list-unit-files` por qualquer unit suspeita de tweak e, se existir, desative-a e reinicie para confirmar.
3. Reverta manualmente o swappiness e o THP para os padrões e reinicie. Os valores permanecem? Se não, encontre o que os reaplica.
4. Rode o check de auditoria pós-update completo e registre os quatro valores em um arquivo de referência para comparações futuras.
5. **Desafio.** Crie um script shell que capture o estado atual de todos os parâmetros deste capítulo num arquivo JSON/texto, para servir de baseline de restauração automática.