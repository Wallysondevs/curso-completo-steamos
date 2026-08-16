O *boot loop* — o aparelho reinicia sozinho depois do logo, num ciclo interminável — é diferente da tela preta: aqui o sistema chega a começar a subir e depois desiste e recomeça. Isso aponta para uma falha num ponto específico da inicialização, quase sempre um serviço ou um kernel novo que não termina de carregar. A boa notícia é que o GRUB e o própria systemd dão ganchos para interromper o ciclo e voltar a um estado que funciona.

:::objetivos
- Reconhecer um boot loop e separá-lo de outras falhas de inicialização
- Interromper o ciclo pelo menu do GRUB e pelo modo failsafe
- Identificar o serviço ou kernel que derrubou o boot
- Recuperar o sistema revertendo o kernel ou desabilitando o serviço culpado
:::

## O que o ciclo está tentando contar

Num boot loop, o firmware carrega, o GRUB aparece (ou nem isso), o kernel inicia e, em algum momento antes de completar a sessão, a máquina reinicia. O ponto exato onde o ciclo recomeça é a informação mais valiosa que você tem.

```terminal
$ journalctl --list-boots
-3 4e5a7f... Mon 2024-12-02 18:30:01—18:30:14
-2 d2f1c9... Mon 2024-12-02 18:31:02—18:31:15
-1 8a3b4d... Mon 2024-12-02 18:32:05—18:32:18
 0 1c7e9a... Mon 2024-12-02 18:35:00—18:35:03
```

Repare que cada boot dura ~13 segundos e morre no mesmo ponto. `--list-boots` enumera cada tentativa de inicialização que deixou rastro no journal persistente. O padrão de durações idênticas e curtas é a assinatura de um boot loop: algo falha de forma determinística, sempre no mesmo segundo, e o systemd ou o watchdog derruba a máquina.

## Parando o ciclo para poder pensar

Você não conserta nada enquanto o aparelho reinicia sozinho a cada poucos segundos. O primeiro objetivo é **interromper o ciclo**. Dois caminhos:

- **Menu do GRUB**: segure o botão de volume menos (ou a tecla correspondente no teclado do dock) durante o boot para forçar o menu. Escolha *Advanced options* e pegue um **kernel anterior**.
- **Modo failsafe/emergency**: na linha de boot do GRUB, adicione `systemd.unit=emergency.target` para cair direto num shell de manutenção, sem iniciar nada além do mínimo.

```terminal
# systemctl --failed
  UNIT              LOAD   ACTIVE SUB    DESCRIPTION
● disk-localhome.service loaded failed failed Local home mounting
```

Já em *emergency target* (prompt de root, sem login), `systemctl --failed` lista as unidades que falharam. O `●` marcado indica que o serviço `disk-localhome.service` — um montador de partição — quebrou. Se a partição `/home` não monta, o gerenciador de sessão não sobe e o boot aborta, reiniciando.

:::dica
No *emergency target* o teclado pode estar em layout US. Se as letras saírem trocadas ao digitar, ajuste com `loadkeys br-abnt2` (ou o layout correspondente) antes de prosseguir — evita que um comando digitado "certo" na verdade saia errado.
:::

## Encontrando o serviço que derruba o boot

Com o ciclo interrompido, o passo seguinte é ler por que o boot falhou. O journal do boot que morreu está a um comando de distância.

```terminal
# journalctl -b -1 -p err --no-pager | tail -20
Dec 02 18:32:18 steamdeck systemd[1]: Failed to start Mount /home.
Dec 02 18:32:18 steamdeck mount[512]: /home: mount(2) system call failed: Structure needs cleaning.
Dec 02 18:32:18 steamdeck systemd[1]: Timed out waiting for device dev-disk-by-uuid-....device.
Dec 02 18:32:18 steamdeck systemd[1]: Dependency failed for Local File Systems.
Dec 02 18:32:18 steamdeck systemd[1]: Reached target Emergency Mode.
```

A linha `mount(2) system call failed: Structure needs cleaning` é o diagnóstico clássico de **sistema de arquivos com inconsistência**. O kernel se recusa a montar uma partição que precisa de checagem (`fsck`) e, com `/home` fora do ar, todo o resto desmorona e o systemd decide reiniciar.

## Corrigindo a causa raiz

Identificado que a partição precisa de reparo, o conserto é rodar `fsck` nela — **desmontada**, nunca montada. No *emergency target* a partição problemática ainda não está em uso, o que é exatamente o ambiente certo.

```terminal
# fsck -y /dev/nvme0n1p8
fsck from util-linux 2.39.3
e2fsck 1.47.0 (5-Feb-2023)
/dev/nvme0n1p8 contains a file system with errors, check forced.
Pass 1: Checking inodes, blocks, and sizes
Pass 2: Checking directory structure
Pass 3: Checking directory connectivity
Pass 4: Checking reference counts
Pass 5: Checking group summary information
/dev/nvme0n1p8: 12452/655360 files (0.9% non-contiguous), 584921/2621440 blocks
```

A flag `-y` responde "sim" automaticamente a todas as perguntas de reparo. Após o `fsck` terminar limpo (a última linha resume arquivos e blocos sem listar erros restantes), reinicie com `reboot` e o boot deve completar normalmente.

:::perigo
Nunca rode `fsck` numa partição montada. Montar um sistema de arquivos com metadados corrompidos e depois "consertá-lo" por cima pode piorar a corrupção e causar perda de dados definitiva. O *emergency target* existe justamente para dar um ambiente com as partições desmontadas.
:::

## Quando o culpado foi um kernel novo

Um subcaso importantíssimo de boot loop vem depois de uma atualização de sistema: o kernel novo sobe, trava no `amdgpu` ou em outro driver, e reinicia. A recuperação é trivial e não destrutiva — basta voltar ao kernel anterior pelo GRUB e marcar o pacote novo como "segurar" até a Valve corrigir.

```terminal
# grub-mkconfig -o /boot/grub/grub.cfg 2>/dev/null | tail -3
done
```

Selecionar o kernel anterior no menu *Advanced options* já resolve a sessão imediata. Para tornar a escolha persistente até a correção definitiva, você pode segurar a versão do pacote, mas o mais prático é simplesmente reiniciar pelo kernel anterior enquanto o problema é reportado.

## Resumo

- Boot loop reinicia sempre no mesmo ponto; a duração repetida de cada tentativa é a assinatura do problema.
- `journalctl --list-boots` enumera cada tentativa e revela o padrão determinístico.
- Interromper o ciclo é a prioridade: menu do GRUB com kernel anterior ou `systemd.unit=emergency.target`.
- `systemctl --failed` dentro do emergency target aponta a unidade que quebrou.
- `Structure needs cleaning` indica sistema de arquivos que exige `fsck` antes de montar.
- Reverter para o kernel anterior trata boot loops causados por atualização, sem ação destrutiva.

## Exercícios

1. Rode `journalctl --list-boots` e calcule a duração de cada boot na sua máquina. Há alguma tentativa anormalmente curta?
2. No GRUB, explore o menu *Advanced options* e liste os kernels disponíveis como plano B de recuperação.
3. Dentro de uma sessão normal, identifique a unidade de montagem da sua partição raiz com `systemctl list-units --type=mount`.
4. Verifique o estado de saúde dos seus sistemas de arquivos com `df -T` e anote quais estão em ext4 ou btrfs.
5. **Desafio.** Sem consultar a seção 8, projete um procedimento de resgate que combine o que você aprendeu sobre emergency target e fsck com uma checagem manual do `/etc/fstab` para conferir se o UUID apontado para `/home` ainda corresponde ao da partição (`lsblk -f`).
