Até aqui você viu o terreno: canais, partições A/B, sistema imutável. Agora é hora de acompanhar uma atualização de fato, do clique no botão até o reinício. O processo parece simples visto de fora, mas por baixo há uma sequência de passos com pontos de verificação que explicam por que ele raramente falha — e o que fazer quando o check não encontra nada, ou encontra demais.

:::objetivos
- Acompanhar o ciclo completo de uma atualização do SteamOS
- Interpretar a saída do `steamos-update` durante o processo
- Inspecionar os logs da atualização com `journalctl`
- Entender o que muda no boot após a troca de partição A/B
:::

## O caminho de uma atualização

Uma atualização típica passa por cinco etapas, e vale nomeá-las para reconhecê-las nos comandos:

1. **Checagem** — o cliente pergunta ao servidor da Valve se há imagem nova no canal atual.
2. **Download** — a imagem (comprimida) é baixada e sua assinatura verificada.
3. **Aplicação** — a imagem é gravada na partição inativa (o par que não está em uso).
4. **Marca de boot** — a partição recém-gravada é marcada como a próxima a iniciar.
5. **Reinício** — o bootloader troca a partição ativa e o sistema sobe na versão nova.

Nos notebooks e desktops SteamOS, as três primeiras etapas podem ser disparadas manualmente. No Steam Deck, o modo Gaming cuida de tudo: ele baixa em segundo plano enquanto você joga, e só pede o reinício na hora oportuna. Mas o mecanismo por trás é o mesmo.

## Disparando e acompanhando manualmente

No modo Desktop, o ponto de partida é o `check`:

```terminal
$ steamos-update check
Checking for available updates...
An update is available: 3.6.21 (build_id 20241105.100)
```

Para baixar e aplicar, há um subcomando dedicado que faz o download da imagem. A saída é progressiva e longa, mas o trecho inicial e o final são os mais informativos:

```terminal
$ sudo steamos-update check
Checking for available updates...
Downloading update 3.6.21...
  [##########----------]  42%  512,3 MB / 1,2 GB
Verifying image signature...
Signature OK.
Applying update to inactive partition...
Update staged successfully. Reboot to activate.
```

Dois detalhes merecem atenção. Primeiro, `Verifying image signature...` seguido de `Signature OK.` — é a verificação criptográfica que impede instalar uma imagem falsa ou corrompida por man-in-the-middle. Segundo, a frase final `Update staged successfully. Reboot to activate.`: a atualização foi **escalonada** (gravada na partição inativa), mas **ainda não está ativa**. Só o reinício efetiva a troca.

Note que usamos `sudo` aqui. Baixar e gravar na partição de sistema exige privilégio de root, enquanto o simples `check` (só consultar) roda sem `sudo`. Essa distinção importa: a consulta é inofensiva, a gravação é destrutiva para a partição inativa.

:::atencao
`Update staged` não significa "atualizado". Enquanto você não reiniciar, o sistema continua rodando a versão **antiga**. Se você desligar e religar normalmente, a troca acontece no boot. Mas se ficar dias sem reiniciar, você segue na versão velha com a nova "no gatilho" — comportamento normal e intencional.
:::

## Olhando os logs da atualização

A atualização roda como um serviço do systemd, e tudo o que ela faz fica registrado no journal. O comando `journalctl` com a unidade `steamos-update` devolve esse histórico:

```terminal
$ journalctl -u steamos-update -n 20
Nov 05 10:12:04 steamdeck systemd[1]: Starting SteamOS Update Service...
Nov 05 10:12:04 steamdeck steamos-update[1320]: Checking for available updates...
Nov 05 10:12:06 steamdeck steamos-update[1320]: Update 3.6.21 found (channel: stable)
Nov 05 10:12:06 steamdeck steamos-update[1320]: Downloading from update.steamos.com...
Nov 05 10:14:41 steamdeck steamos-update[1320]: Download complete (1,2 GB)
Nov 05 10:14:41 steamdeck steamos-update[1320]: Verifying signature: OK
Nov 05 10:14:42 steamdeck steamos-update[1320]: Writing to inactive slot (B)...
Nov 05 10:16:20 steamdeck steamos-update[1320]: Write complete. Flushing...
Nov 05 10:16:21 steamdeck steamos-update[1320]: Slot B marked for next boot.
Nov 05 10:16:21 steamdeck steamos-update[1320]: Update staged successfully.
```

Lendo as linhas em ordem: o serviço iniciou, achou a 3.6.21 no canal stable, baixou 1,2 GB em cerca de dois minutos e meio, verificou a assinatura e escreveu no *slot* B — confirmando que o par A estava ativo. Por fim, marcou o slot B como o próximo boot. As colunas de data/hora (aqui `Nov 05 10:12`) permitem reconstruir exatamente quanto tempo cada etapa levou.

Para filtrar apenas erros durante uma atualização problemática:

```terminal
$ journalctl -u steamos-update -p err
Nov 07 08:03:11 steamdeck steamos-update[1410]: Failed to verify image signature (corrupt download?)
Nov 07 08:03:12 steamdeck steamos-update[1410]: Update aborted, no changes made.
```

A linha `Update aborted, no changes made` é a tradução do design atômico para os logs: quando algo falha no caminho, o sistema declara abertamente que **nada foi alterado**. A partição ativa segue intocada; a inativa, no máximo, guarda uma imagem incompleta que nunca será usada.

## O que muda no boot

A troca de partição acontece pela configuração do bootloader. O SteamOS usa um mecanismo que aponta para a partição "boa" conhecida, e a atualização simplesmente atualiza esse ponteiro para o slot recém-gravado. Não é o GRUB clássico de desktop — é um esquema de boot mais enxuto, com uma variável que diz "inicie pelo slot B".

Isso se conecta ao próximo assunto do capítulo: o rollback. Como o bootloader sempre sabe qual foi a última partição "boa", ele pode reverter para ela automaticamente se o novo slot falhar ao subir. Por ora, basta reter que o reinício **é** o momento da troca, e que até ele acontecer o sistema antigo é o que vale.

## Resumo

- Uma atualização passa por checagem, download, verificação, gravação na partição inativa e troca no boot.
- `steamos-update check` consulta sem privilégio; baixar/aplicar exige `sudo`.
- A assinatura da imagem é verificada (`Signature OK`) antes de qualquer escrita.
- `Update staged` significa "gravado, à espera do reinício", não "já aplicado".
- `journalctl -u steamos-update` mostra o histórico da atualização, incluindo falhas atômicas.

## Exercícios

1. Rode `sudo steamos-update check` e descreva o que acontece quando já não há atualização disponível.
2. Execute `journalctl -u steamos-update -n 30` e identifique as cinco etapas da última atualização registrada na sua máquina.
3. Filtre os erros com `journalctl -u steamos-update -p err`. Há algum? O que ele indica?
4. Compare os tempos de download e de escrita no log. Qual etapa levou mais tempo na sua última atualização?
5. **Desafio.** Use o que aprendeu sobre `lsblk` na seção anterior para verificar, **antes** de reiniciar após uma atualização, qual slot recebeu a imagem nova. Depois do reinício, rode `lsblk` de novo e confirme que o slot ativo trocou. O que isso diz sobre a natureza "escalonada" da atualização?