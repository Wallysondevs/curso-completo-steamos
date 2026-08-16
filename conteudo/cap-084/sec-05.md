O SSD fica na lateral direita do Deck, escondido sob um escudo metálico que também serve de dissipador de interferência eletromagnética (EMI). A troca em si é a mais curta de todas: um parafuso, o módulo sai, o novo entra. A parte que realmente demanda atenção está no antes e no depois — o modo de armazenamento, a reinstalação ou clonagem e a expansão da partição final. Feito com calma, é um upgrade de vinte minutos.

:::objetivos
- Localizar e remover o escudo EMI que protege o SSD
- Substituir a unidade 2230 pelo novo SSD corretamente alinhado
- Reinstalar o SteamOS com a imagem de recuperação após a troca
- Clonar ou reimagear conforme o caso, com expansão de partição
- Validar a nova unidade com `lsblk`, `nvme` e verificação de saúde
:::

## Localizando o SSD sob o escudo EMI

Com a tampa traseira removida e a bateria já desconectada (seção anterior), olhe o canto superior direito. Você verá uma placa de metal prateada presa por parafusos pequenos: é o **escudo EMI**. Ele reduz a interferência que o SSD de alta frequência pode irradiar para antenas e sensores próximos. Ele precisa sair para revelar o módulo, e precisa voltar na remontagem.

```terminal
$ sudo nvme list
Node             Model Number                             Namespace Usage
/dev/nvme0n1     KINGSTON OM3PDP3512B-A01                  512 GB
```

Antes de mexer fisicamente, confirme pelo software qual unidade está presente. O `nvme list` do pacote `nvme-cli` mostra modelo e capacidade; compare com a etiqueta física depois de remover o escudo. É um bom hábito registrar o antes para conferir o depois.

:::nota
Se o seu Deck for o modelo de 64 GB, ele pode usar um módulo eMMC soldado em vez de SSD em slot em algumas revisões — mas a grande maioria dos 64 GB ainda traz SSD 2230 substituível. O `lsblk` anterior já revelou um `nvme0n1`, o que confirma slot NVMe presente.
:::

## Removendo o módulo antigo

Remova o parafuso que prende o SSD (costuma ser um único parafuso pequeno) e desfaça o escudo. O SSD 2230 fica inclinado num ângulo pequeno. Levante-o levemente pela extremidade livre e puxe para fora do conector na direção oposta ao soquete — nunca force para os lados. Ele deve sair sem resistência.

```terminal
$ sudo umount /run/media/ana/* 2>/dev/null; echo "mídia externa desmontada"
```

Apague do roteiro qualquer escrita pendente: desmonte mídias externas e encerre processos que gravam. Embora você já tenha desligado o aparelho, esse comando documenta o hábito de não arrancar um SSD "quente". Em uso normal (sem desligar), remover um NVMe montado pode corromper o sistema de arquivos.

:::perigo
Nunca remova o SSD com o aparelho em funcionamento ou apenas suspenso. O NVMe grava em lote e um desligamento abrupto no meio de uma gravação pode destruir o sistema de arquivos e levar o Deck a nem inicializar. Desligue por completo, drene a bateria e remova o conector de energia antes desta etapa.
:::

## Instalando o novo SSD

Encaixe o novo 2230 no conector no mesmo ângulo, empurre-o suavemente até o fundo e deite-o para baixo, fixando com o parafuso. Recoloque o escudo EMI. A regra de ouro da instalação é o **alinhamento**: o entalhe do conector do SSD só permite uma posição, então se não entrar fácil, vire-o — nunca force.

```terminal
$ sudo nvme id-ctrl /dev/nvme0n1 | grep -E 'mn |sn '
mn      : WD_BLACK SN770M
sn      : XXXXXXXXXXXXXXXX
```

Depois de religar, o `nvme id-ctrl` (de `nvme-cli`) lê o modelo (`mn`) e o número de série (`sn`) da unidade nova direto do firmware. Se o modelo novo aparecer, a instalação física foi reconhecida — o passo seguinte é colocar o sistema nela.

## Reinstalando ou clonando o sistema

Dois caminhos, vistos em detalhe na seção de backup. **Reinstalar** (reimage) é o padrão: ligue segurando `[[Volume-]]` + energia para dar boot pelo pendrive de recuperação, escolha "Reimage Steam Deck" e aguarde. **Clonar** exige ter feito a cópia antes — neste caso você conecta o SSD novo no leitor USB e roda o `dd` inverso, ou restaura a imagem.

```terminal
$ sudo dd if=/home/ana/ssd-backup.img of=/dev/nvme0n1 bs=4M status=progress conv=fsync
```

Se você gravou uma imagem de disco inteira (`.img`) antes, ela volta exatamente como estava com um `dd` no sentido inverso: `if=` aponta para o arquivo de imagem, `of=` para o SSD novo. Ao final, a unidade é indistinguível da antiga — inclusive com o espaço não alocado, caso o novo seja maior.

## Expandindo a partição final

Quando o SSD novo é maior que o antigo e você clonou, sobra espaço não alocado no fim do disco. Expandir a partição `/home` (ou a última partição de dados) aproveita os gigabytes extras. O caminho seguro é usar uma ferramenta gráfica de particionamento no modo Desktop — como o GParted/KDE Partition Manager — pois o SteamOS usa um layout de oito partições que não deve ser desenhado à mão.

```terminal
$ lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT /dev/nvme0n1
NAME        SIZE FSTYPE  MOUNTPOINT
nvme0n1     931.5G
├─nvme0n1p1  64M 
├─nvme0n1p2  32M 
...
└─nvme0n1p8 907.6G ext4   /home
```

Aqui o SSD novo de 1 TB já aparece, com a partição `nvme0n1p8` (`/home`) cobrindo quase todo o disco. O `lsblk` é o mapa que você usa para confirmar, antes e depois, que a expansão deu certo e que nenhuma partição sumiu. Conte as partições: o SteamOS espera um número específico delas.

## Resumo

- O SSD fica sob um escudo EMI metálico no canto superior direito; o escudo deve voltar na remontagem.
- A troca é um parafuso + encaixe em ângulo + alinhamento único do entalhe, sem forçar.
- Reinstalar pela imagem de recuperação é o fluxo padrão; clonar preserva tudo, mas exige peça de mesmo tamanho ou maior.
- `nvme list` e `nvme id-ctrl` validam a unidade nova pelo modelo e número de série.
- Espaço não alocado após clonagem é expandido com particionador gráfico, verificando com `lsblk`.

## Exercícios

1. Com o SSD antigo ainda instalado, rode `sudo nvme list` e `sudo nvme id-ctrl /dev/nvme0n1 | grep -E 'mn|sn'`. Registre modelo e série.
2. Desenhe (em papel) o layout de partições que o `lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT /dev/nvme0n1` mostra. Quantas partições existem e qual é a função da que monta em `/home`?
3. Simule a sequência de troca por escrito: liste os passos na ordem exata, do Battery Storage Mode até o primeiro boot, incluindo onde o escudo EMI entra e sai.
4. Se você clonasse um SSD de 512 GB para um de 1 TB, explique (sem executar) o que o `dd` faria com os ~488 GB excedentes e como você os recuperaria.
5. **Desafio.** Relacione o aviso "nunca remova NVMe com sistema montado" com o conceito de *write-back cache* do kernel. Por que desligar "limpo" (`systemctl poweroff`) protege contra corrupção, e o que acontece se o cache ainda não foi gravado quando o disco some?
