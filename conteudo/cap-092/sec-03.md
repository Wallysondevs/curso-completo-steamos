O caminho mais simples para devolver o Steam Deck ao estado de fábrica é o próprio menu do sistema, em modo desktop ou no modo de jogo. Ele não exige pendrive, imagem nem terminal — apenas alguns toques. Mas, como toda operação destrutiva, há uma sequência correta de pré-requisitos e confirmações para não se arrepender na metade do processo.

:::objetivos
- Localizar a opção de reset no menu Steam
- Preparar o aparelho antes de iniciar o reset
- Completar o processo do início ao fim com segurança
- Reconhecer o que esperar na primeira inicialização pós-reset
:::

## Onde fica a opção de reset

A opção está presente tanto no modo de jogo quanto no desktop. No modo de jogo: pressione o botão Steam → `Configurações` → `Sistema` → role até `Redefinir para padrões de fábrica`. No modo desktop, o mesmo caminho fica em `Steam → Configurações → Sistema`.

```terminal
$ steam steam://open/settings/system
```

O comando acima, se executado no terminal do modo desktop, abre diretamente a página de sistema das configurações — útil se a navegação por toque estiver confusa. No SteamOS, o menu de reset fica ao final dessa página, abaixo das opções de canal de atualização.

:::nota
Antes do reset, o SteamOS pede que você esteja com a bateria carregada ou conectado à energia. Um reset interrompido por desligamento pode deixar o sistema em estado inconsistente, exigindo reinstalação por imagem.
:::

## Pré-requisitos antes de iniciar

Antes de tocar no botão de reset, confirme três coisas: backup concluído (seção 2), saída da conta Steam se for vender/doar, e remoção de dados sensíveis que não devam permanecer em mídia externa. Lembre-se também de que o reset não apaga o cartão microSD — remova-o se ele contiver dados que você quer proteger.

```terminal
$ mount | grep mmcblk
/dev/mmcblk0p1 on /run/media/mmcblk0p1 type ext4 (rw,relatime)
```

Se um cartão SD estiver montado junto, o reset pode ou não formatá-lo dependendo da versão do SteamOS. Na dúvida, ejete e remova fisicamente o cartão antes de prosseguir — assim ele fica intacto seja qual for o comportamento.

:::atencao
Remover a conta Steam antes do reset (em `Configurações → Conta → Fazer logout`) é recomendado quando o aparelho vai mudar de dono. Isso desvincula o dispositivo da sua conta e evita que o próximo usuário encontre rastros.
:::

## Executando o reset passo a passo

Com o backup pronto e o cartão removido, o processo em si é rápido. O sistema exibe um aviso do que será apagado, pede confirmação, e então reinicia para executar a limpeza numa fase de recuperação mínima.

```terminal
$ sudo systemctl reboot
```

Não há comando que acione o reset por terminal de forma direta — ele é orquestrado pela interface Steam. O `reboot` acima ilustra apenas o que o próprio sistema faz ao final: reinicia na partição de recuperação para formatar e reconstituir o estado de fábrica.

Durante o reset, o aparelho pode passar vários minutos na tela do logo. Não interrompa: a formatação e a reconstituição dos overlays acontecem em segundo plano. Quando terminar, o Steam Deck reinicia na tela de configuração inicial (escolha de idioma e login).

## A primeira inicialização pós-reset

Após o reset, o aparelho se comporta como recém-saído da caixa: pede idioma, hora e login da conta Steam. Se você reseta para uso próprio, basta logar novamente e deixar o Steam Cloud baixar os saves dos jogos que têm suporte.

```terminal
$ ls ~/
Desktop  Documents  Downloads  Music  Pictures  Public  Templates  Videos
```

O home recém-criado terá apenas as pastas padrão. Confirme aqui que o conteúdo antigo realmente se foi — se algo crítico ainda aparecer, significa que o backup não foi validado ou que um cartão SD residual estava montado.

:::dica
Após o reset e o novo login, os saves em nuvem só voltam quando cada jogo é instalado/aberto. Instale primeiro os jogos que você terminou recentemente para verificar que o save retornou íntegro.
:::

## Quando o reset falha

Se o reset engasgar (aparelho trava no logo por muito tempo, ou reinicia com os dados ainda lá), o problema pode ser corrupção na partição de recuperação. Nesse caso, a saída é a imagem de recuperação gravada em pendrive — exatamente a rota da próxima seção.

```terminal
$ sudo journalctl -b -g 'reset|factory|recovery'
```

Consultar o log do boot atual com `-b` e filtrar termos relevantes pode revelar em que etapa a limpeza parou. Se a partição de recovery estiver íntegra, o log normalmente indica conclusão; se não, prepare o pendrive de recuperação.

## Resumo

- O reset fica em `Configurações → Sistema → Redefinir para padrões de fábrica`, no modo jogo ou desktop.
- Antes de resetar: conclua e valide o backup, remova o cartão SD e faça logout da conta se for mudar de dono.
- O processo reinicia o aparelho numa fase de recuperação que formata e reconstrói o estado de fábrica.
- A primeira inicialização é como um aparelho novo: idioma, hora e login.
- Se o reset travar, a partição de recuperação pode estar corrompida — recorra à imagem de recuperação da próxima seção.

## Exercícios

1. Navegue até a página de sistema das configurações Steam e localize a opção de reset (não execute).
2. Liste, em ordem, os cinco pré-requisitos que você cumpriria antes de um reset real.
3. Explique por que remover o cartão microSD antes do reset é uma medida de segurança.
4. Descreva o que você espera ver na primeira inicialização após o reset.
5. **Desafio.** Simule a verificação pós-reset: escreva um roteiro de testes (pastas do home, login, retorno de saves em nuvem) que confirme que o reset foi bem-sucedido sem perder o que importa.