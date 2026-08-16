Antes de enviar um Steam Deck para RMA, é obrigatório devolver a máquina num estado limpo: seus dados apagados e o sistema restaurado. Isso protege sua privacidade (o aparelho vai passar na mão de desconhecidos) e evita que suas configurações atrapalhem a análise. O processo tem duas camadas — o backup que preserva e o reset que apaga — e fazer na ordem certa é o que separa o envio seguro do desastre.

:::objetivos
- Fazer um backup completo e verificável antes de qualquer apagamento
- Sair da conta Steam e desconectar o aparelho
- Restaurar o sistema ao estado de fábrica de forma correta
- Confirmar que nenhum dado pessoal restou no aparelho
:::

## Backup: a camada que preserva

A nuvem Steam guarda saves e conquistas da maioria dos jogos, mas não guarda tudo. Capturas de tela não sincronizadas, arquivos do modo Desktop, saves de jogos sem suporte a nuvem, ROMs de emulador e configurações locais estão sob seu risco. O backup começa identificando o que é só local.

```terminal
$ du -sh ~/Pictures ~/Documents ~/Downloads ~/lab 2>/dev/null
4.2G	/home/deck/Pictures
1.1G	/home/deck/Documents
8.7G	/home/deck/Downloads
512M	/home/deck/lab
```

O `du` mostra quanto cada pasta ocupa, ajudando a dimensionar o destino do backup (um microSD grande, um pendrive ou um drive de rede). Copie tudo que tiver valor, não só o que achar que precisa — o erro de apagar algo raro é irreversível.

```terminal
$ rsync -avh ~/ /run/media/deck/BACKUP/home-deck/
```

Este comando espelha o diretório home inteiro para o destino. O `-a` preserva permissões e datas, o `-v` mostra o progresso e o `-h` torna os tamanhos legíveis. Deixe rodar por completo e, ao final, confira com um `ls` no destino que os arquivos principais estão lá.

:::dica
Depois do `rsync`, abra alguns arquivos copiados no destino para confirmar que não estão corrompidos. Um backup que só "existe" mas não abre não vale de nada na hora do aperto.
:::

## Saindo da conta e desconectando

Além dos arquivos, o aparelho guarda a sua sessão Steam — e, embora o reset apague isso, deslogar manualmente é uma camada extra de segurança e uma exigência frequente das instruções da Valve. Deslogue da conta Steam pelo menu de configurações e esqueça os dispositivos Bluetooth pareados (o reset também cobre isso, mas confirmar não custa).

```terminal
$ steamos-session-select gaming
```

Mudar para o modo Gaming e navegar até **Configurações → Sistema → Restaurar para o estado de fábrica** mantém você no ambiente controlado da Valve. O reset pelo sistema apaga a partição do usuário e as credenciais, deixando o aparelho como veio.

:::atencao
Se o aparelho tem uma senha `sudo` ou `deck` customizadas, anote que elas serão removidas no reset. O reset de fábrica apaga contas locais e reconfigura o usuário padrão `deck` limpo.
:::

## O reset de fábrica em si

O reset é acionado pela interface do SteamOS — não é um comando de terminal destrutivo que você precisa digitar à mão, mas vale entender o que ele faz por baixo. Ele reformata a partição de dados e restaura a imagem de sistema, devolvendo o aparelho ao estado de primeira inicialização.

```terminal
$ lsblk -f | grep -E "esp|rootfs|home"
```

Antes do reset você pode inspecionar as partições para entender a geografia (a pequena partição de boot, a de sistema imutável e a de dados do usuário). O reset atua essencialmente sobre a partição de dados, onde moram seu home e seus arquivos.

:::perigo
Nunca reutilize o cartão microSD ou pendrive do backup para outra coisa antes de o aparelho voltar do RMA. Se o envio ou a troca der errado, é esse backup que restaura sua vida digital. Trate-o como a única cópia — porque, por um período, ele será.
:::

## Confirmando que nada restou

Depois do reset, o aparelho deve voltar à tela de configuração inicial do Steam Deck. Se ele liga direto no seu desktop ou pede sua senha antiga, o reset falhou ou não foi concluído — repita antes de enviar. Um aparelho enviado com dados pessoais é, além de risco de privacidade, sinal de que você não seguiu o processo.

```terminal
$ systemctl get-default
multi-user.target
```

Após o reset, o modo padrão e a configuração retornam ao estado de fábrica. Verificar que o aparelho não "lembra" de nada seu — nenhuma rede Wi-Fi salva, nenhuma conta logada — é o teste final antes de embalar.

## Erros comuns de backup e reset

O erro número um é confiar que a nuvem Steam guarda tudo: muitos jogos não têm suporte a cloud save, e nenhum arquivo do modo Desktop sobe automaticamente. Outro erro é iniciar o reset antes de deslogar da conta — embora o reset apague a sessão, deslogar antes é uma cortina extra de segurança e evita que o aparelho apareça como "autorizado" no seu Steam Guard.

```terminal
$ steamos-session-select desktop
$ ls ~/.steam/steam/userdata/ 2>/dev/null
12345678
```

O diretório `userdata` dentro do `.steam` guarda saves locais, capturas de tela não sincronizadas e configurações por jogo. O ID numérico ali é o seu SteamID64 — verifique o tamanho dessa pasta antes do backup, pois ela costuma conter os arquivos que a nuvem não pega.

| Item | Backup necessário? | Onde fica |
|---|---|---|
| Cloud saves (Steam) | Não (automático) | Nuvem Steam |
| Saves de jogos sem nuvem | Sim | `~/.steam/steam/userdata/` |
| Capturas de tela não publicadas | Sim | `~/.steam/steam/userdata/<id>/screenshots/` |
| Arquivos do Desktop | Sim | `~/Documents`, `~/Downloads`, `~/Pictures` |
| ROMs e saves de emulador | Sim | `~/Emulation/`, `~/roms/` ou EmuDeck |

## Resumo

- O backup vem antes do reset, e deve ser verificado abrindo os arquivos no destino.
- A nuvem Steam não cobre captures não sincronizadas, saves sem nuvem e arquivos do desktop.
- Deslogue da conta Steam e faça o reset pelo menu de configurações do sistema.
- O reset reformata a partição de dados e restaura a imagem de fábrica.
- Confirme que nenhum dado pessoal restou antes de embalar o aparelho.

## Exercícios

1. Use `du -sh` para dimensionar as pastas que precisam de backup no seu aparelho.
2. Execute um `rsync -avh` e liste três itens que a nuvem Steam não guarda e que você precisou copiar.
3. Descreva a ordem correta entre "deslogar", "resetar" e "embalar", justificando cada passo.
4. Liste o que você verificaria para garantir que o reset de fábrica foi concluído de verdade.
5. **Desafio.** Escreva um script `pre-rma.sh` que faça backup com `rsync`, gere um manifesto (`ls -lR` do destino) e imprima um aviso caso alguma pasta importante esteja vazia, integrando o que você aprendeu sobre shell em seções anteriores.
