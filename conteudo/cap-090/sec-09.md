O processo de garantia termina, de fato, quando o aparelho volta (ou o novo chega) e você confirma que tudo funciona. Receber sem validar, jogar a caixa fora e não registrar os dados novos são erros que transformam um problema resolvido num problema futuro. Esta seção fecha o capítulo transformando tudo o que foi visto num checklist verificável para a vida útil inteira do aparelho.

:::objetivos
- Validar um aparelho recebido de RMA ou troca
- Registrar os dados novos de serial e cobertura
- Restaurar backup e confirmar a integridade dos dados
- Manter um histórico que agiliza qualquer garantia futura
:::

## Validando o aparelho que chegou

Quando o aparelho retorna do reparo ou você recebe um de troca, a primeira tarefa é validar antes de comemorar. Ligue, confira o serial novo contra o antigo (a troca pode trazer outro aparelho), e teste especificamente o defeito que motivou o RMA — além de uma checagem geral de tela, controles, áudio e bateria.

```terminal
$ cat /sys/class/dmi/id/product_serial
FWYYYYY5678
```

O serial que aparece após uma troca costuma ser diferente do original. Registre o novo valor imediatamente, porque toda a garantia e o histórico passam a valer para ele — e o seu dossiê antigo (nota, logs) continua valendo como prova da compra original.

:::atencao
Teste o defeito original **no mesmo cenário** em que ele aparecia. Se era uma linha na tela visível em jogo, abra o jogo. Validar superficialmente ("ligou, tá ok") deixa passar justamente o problema que motivou o envio.
:::

## Restaurando o backup

Com o aparelho validado, é hora de trazer seus dados de volta. O mesmo `rsync` do backup agora roda na direção inversa, do cartão/pendrive de volta para o aparelho. Vale configurar o Wi-Fi e logar na conta Steam antes, para que a nuvem também sincronize saves e o ambiente fique como estava.

```terminal
$ rsync -avh /run/media/deck/BACKUP/home-deck/ ~/
```

O caminho invertido restaura o home. Repare na barra final dos dois lados — ela garante que o conteúdo seja copiado para dentro do destino, não criando uma subpasta duplicada. Depois, confira abrindo os arquivos mais importantes e rode os jogos que tinham save local.

:::dica
Restaurar é tão crítico quanto o backup: confira que os arquivos abrem, que os saves aparecem e que as capturas de tela estão lá. Só então considere o cartão de backup "livre" para outro uso.
:::

## Atualizando seu dossiê

Todo este capítulo girou em torno de evidência e registro. Mantenha um arquivo com o serial atual, a versão de BIOS, a data da compra, o número do RMA e o que foi feito. No futuro, qualquer novo chamado já sai da metade do caminho.

```terminal
$ printf "serial: %s\nbios: %s\n" "$(cat /sys/class/dmi/id/product_serial)" "$(cat /sys/class/dmi/id/bios_version)"
serial: FWYYYYY5678
bios: F7A0121
```

Gerar e guardar essa linha de identificação num arquivo `registro.md` é um hábito barato que economiza horas no próximo imprevisto. Some a ele a data e o resumo de cada manutenção ou troca.

## O checklist definitivo

Fechando o capítulo, o resumo operacional em formato de verificação: assinalar cada item garante que nenhuma etapa — do primeiro sintoma ao pós-RMA — fique para trás.

```terminal
$ cat ~/registro.md
serial: FWYYYYY5678
bios: F7A0121
compra: 2024-01-15
rma: RMA-000000-XXXXXXXX (2024-02-20)
status: trocado e validado
```

Manter o registro simples e à mão transforma a memória esparsa num histórico confiável. É a diferença entre "acho que estava na garantia" e "aqui está a nota, o serial e o número do RMA".

## Erros comuns no pós-RMA

O erro mais perigoso é receber o aparelho, validar superficialmente ("ligou, tá ok") e depois descobrir, dias depois, que o defeito original volta sob determinada condição. Outro erro: jogar fora os documentos do RMA antigo — se o aparelho novo também der defeito, o histórico anterior fortalece seu novo chamado.

```terminal
$ diff <(sort ~/registro-pre-rma.md) <(sort ~/registro-pos-rma.md)
5c5
< serial: FWXXXXX1234
---
> serial: FWYYYYY5678
```

Comparar o registro de antes com o de depois revela o que mudou (serial, BIOS, talvez capacidade). É uma boa prática gerar essa diferença e guardar junto com o dossiê — se houver divergência não explicada (ex: capacidade diferente da esperada), ela precisa ser reportada imediatamente.

| O que validar | Como validar | Por que |
|---|---|---|
| Serial novo | `cat /sys/class/dmi/id/product_serial` | Garantia futura depende do serial correto |
| Defeito original | Reproduzir o cenário exato de antes | Confirmar que foi corrigido |
| Tela e áudio | Teste visual e sonoro rápido | Danos de trânsito não são cobertos depois |
| Backup restaurado | Abrir arquivos e jogos principais | Última chance antes de descartar o cartão |
| Atualização | `systemctl status steamos-update` | Versão estável pode ser diferente da anterior |

## Resumo

- Valide o aparelho recebido testando o defeito original no mesmo cenário, não só a ligação.
- Registre o serial novo imediatamente após uma troca, pois a garantia passa a valer para ele.
- Restaure o backup na direção inversa do `rsync` e confira que os dados abrem de verdade.
- Mantenha um dossiê com serial, BIOS, data de compra e histórico de RMA.
- O checklist completo cobre do primeiro sintoma ao pós-RMA sem pular etapas.

## Exercícios

1. Liste os testes que você faria ao receber um aparelho de RMA, ordenando pelo defeito original.
2. Execute um `rsync` de restauração de um diretório de teste e confira o resultado no destino.
3. Gere e salve a linha de identificação (serial + BIOS) em um arquivo `registro.md` como no exemplo.
4. Descreva por que o serial antigo e a nota fiscal continuam relevantes depois de uma troca de aparelho.
5. **Desafio.** Monte o checklist completo do ciclo (sintoma → diagnóstico → ticket → RMA → envio → recebimento → validação → backup) como um script ou documento, e explique como ele se conecta com as seções anteriores deste capítulo e com o diagnóstico por logs que você aprendeu ao longo do curso.
