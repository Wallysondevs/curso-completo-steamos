O capítulo percorreu três rotas — reset de fábrica, reinstalação por imagem de recuperação e particionamento manual — cada uma com seu lugar no espectro entre "apagar dados" e "reconstruir o disco do zero". Esta seção final organiza todo o conhecimento num checklist verificável e cobre os problemas mais frequentes que surgem depois que o sistema volta a iniciar, para que você não passe duas vezes pelo mesmo sufoco.

:::objetivos
- Consolidar as três rotas de recuperação num checklist de decisão
- Diagnosticar e corrigir os problemas mais comuns pós-reinstalação
- Saber quando parar e pedir ajuda (RMA, suporte Valve)
- Registrar o histórico do procedimento para referência futura
:::

## Árvore de decisão: qual rota seguir?

A escolha entre reset, reinstalação "Reinstall" (keep /home) e "Reimage" (wipe) depende da gravidade do problema e do estado do sistema. O diagrama abaixo resume:

| Sintoma | Rota recomendada | Por quê |
|---|---|---|
| Sistema lento, cheio de plugins, vai vender | Reset de fábrica | Resolve sem pendrive, apaga só /home e overlays |
| Erros estranhos, boot normal, /home parece ok | Reinstall (keep /home) | Regrava sistema mas preserva dados |
| Boot quebrado, trocou SSD, canal errado | Reimage (wipe) | Recria tabela de partições do zero |
| Tabela GPT corrompida, EFI sumiu | Rescue + sgdisk | Acesso manual para reconstruir partições |
| Dual boot quebrado pós-Windows | Rescue + efibootmgr | Recria entrada UEFI sem reinstalar tudo |

```terminal
$ sudo journalctl -b -g 'mount|filesystem|partition|EFI'
```

Esse comando filtra o log do boot atual por palavras-chave de particionamento e montagem, dando um raio-X rápido da saúde do sistema de arquivos. Se aparecerem erros, suba um degrau na tabela acima: de reset para reinstall, de reinstall para reimage.

## Problemas comuns e soluções

**Sintoma: após reset, o sistema volta exatamente como estava.**
Causa provável: cartão SD com dados do usuário montado durante o reset. Solução: remova o cartão SD e repita o reset. Se persistir, vá para Reimage.

```terminal
$ mount | grep mmcblk
# Se aparecer algo, ejete antes de resetar
```

**Sintoma: reinstalação conclui, mas /home tem tamanho errado.**
Causa: clonagem anterior com `dd` que copiou a tabela de partições antiga (tamanho original) para o SSD novo. Solução: no recovery, use `parted resizepart 9 100%` seguido de `resize2fs /dev/nvme0n1p9`.

**Sintoma: boot trava no logo do Steam Deck após reinstalação.**
Causa: corrupção no slot A ou B durante a gravação, ou EFI inconsistente. Solução: entre no recovery, monte a p6 e confira os arquivos em `/efi/loader/entries/`. Se `steamos.conf` estiver ausente, recrie a entrada com `efibootmgr`.

```terminal
steamdeck-recovery ~ # ls /mnt/efi/loader/entries/
steamos.conf  # deve existir; se não, o bootloader não sabe o que iniciar
```

**Sintoma: após dual boot, SteamOS inicia mas controles não funcionam.**
Causa: driver do controlador Steam Deck não carregado. Solução: reinstale o SteamOS por cima com "Reinstall (keep /home)" — isso restaura kernel, módulos e initramfs sem perder dados.

:::atencao
Se nenhuma das soluções acima funcionar e o sistema continuar sem iniciar, a partição de recuperação (p1-p3) pode estar corrompida. Isso exige um pendrive de recovery em outro PC para gerar a imagem — o Steam Deck não consegue se auto-recuperar nesse estado.
:::

## Checklist final de reinstalação

Use este checklist como roteiro daqui para frente. Cada item deriva de uma seção deste capítulo e, se assinalado em ordem, garante que a reinstalação — qualquer que seja a rota — termine com o sistema pronto para uso.

```terminal
$ cat ~/reinstalacao-checklist.md
- [ ] Backup validado (rsync + diff + find | wc -l)
- [ ] Cartão SD removido
- [ ] Logout da Steam (se for vender/doar)
- [ ] Imagem de recuperação baixada e sha256 conferido
- [ ] Pendrive gravado com dd e testado (boota?)
- [ ] Rota escolhida conforme tabela de decisão
- [ ] Reinstalação concluída (9 partições em lsblk)
- [ ] Atualizações aplicadas até versão estável mais recente
- [ ] Backup restaurado (rsync reverso)
- [ ] Pastas críticas conferidas (Steam, Emulation, Downloads)
- [ ] Hardware validado: serial, BIOS, journalctl -b -p err
- [ ] Flatpaks essenciais reinstalados
- [ ] Registro final com data, rota usada e versão do sistema
```

Marque os itens à medida que avança. A última linha — o registro — é o que transforma a experiência em aprendizado: na próxima reinstalação, você saberá exatamente o que fez, quando e por quê.

## Quando desistir e pedir ajuda

Há um limite para a auto-recuperação. Se o aparelho não reconhece o NVMe em nenhum cenário (recovery incluso), se a tela permanece preta mesmo com o pendrive bootando (backlight apagado), ou se há dano físico evidente (cheiro de queimado, líquido, queda), pare e acione o suporte Valve — o capítulo 90 cobre o processo completo.

```terminal
steamdeck-recovery ~ # dmesg | grep -i nvme
```

Se `dmesg` não mostrar o NVMe, o problema é físico: controlador, slot ou SSD. Nenhuma ferramenta de software resolve isso — é RMA ou troca de peça por conta própria (seção 7 do capítulo 90).

## Resumo

- A escolha da rota (reset, reinstall, reimage, rescue) depende do sintoma e da integridade do disco.
- Os problemas mais comuns — reset não efetivo, /home com tamanho errado, boot travado, controles mortos — têm soluções catalogadas.
- O checklist cobre do backup ao registro final; use-o em toda reinstalação.
- Se o NVMe não aparece no recovery ou há dano físico, a solução não é software: acione o suporte Valve.

## Exercícios

1. Copie o checklist de reinstalação para um arquivo no seu Steam Deck e marque quais itens você já cumpriu em reinstalações passadas.
2. Para cada problema da seção "Problemas comuns", escreva uma frase explicando a causa raiz e a solução.
3. Execute `journalctl -b -g 'mount|filesystem|partition|EFI'` e classifique a saúde do seu sistema atual.
4. Descreva um cenário em que você tentaria Reinstall antes de Reimage e explique o raciocínio.
5. **Desafio.** Crie um único script `recovery-doctor.sh` que: (a) detecta se o sistema iniciou normalmente, (b) sugere a rota de recuperação conforme os sintomas, (c) se executado no terminal recovery, guia o usuário pelas etapas do checklist. Explique como ele se integra com os scripts de backup e pós-instalação das seções anteriores.