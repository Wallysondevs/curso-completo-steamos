A ventoinha (*fan* ou *cooler*) é a responsável por manter o Steam Deck dentro da faixa segura de temperatura durante o uso real. Ela trabalha em conjunto com o dissipador — que abordamos na [seção do dissipador](#/cap-085/sec-02) — removendo o calor gerado pela APU e pelos componentes da placa. Se a ventoinha falhar, todo o sistema térmico entra em colapso em poucos minutos de carga, com redução de desempenho (*thermal throttling*) e, em casos extremos, desligamento de emergência.

Nesta seção você vai entender como a ventoinha regula a temperatura, identificar os sintomas de uma ventoinha estragada, diagnosticar o problema por software antes de abrir o aparelho e, por fim, executar a troca com segurança. Ao terminar, os testes de rotação e temperatura aqui descritos alimentam diretamente os procedimentos da [seção de testes pós-reparo](#/cap-085/sec-08).

:::objetivos

- Entender o papel da ventoinha no controle térmico e os dois conectores envolvidos.
- Reconhecer sintomas de ventoinha defeituosa: ruído, *coil whine*, parada e superaquecimento.
- Diagnosticar a ventoinha via `sysfs` e `sensors` no SteamOS 3.6.
- Executar a remoção da ventoinha antiga e a instalação da nova com segurança.
- Validar a rotação (RPM) e a temperatura da nova ventoinha na bancada.

:::

## Como a ventoinha regula a temperatura

O Steam Deck usa uma ventoinha axial pequena, montada diretamente sobre as aletas do dissipador. O controle de rotação é feito com base na leitura de temperatura da APU: quanto maior a temperatura, mais rápido a ventoinha gira. Esse controle usa modulação por largura de pulso (*PWM* — *Pulse Width Modulation*), que permite variar a velocidade de forma contínua em vez de apenas "ligar" e "desligar".

A ventoinha possui dois circuitos distintos, que chegam à placa por um único cabo fino (*flat* flexível):

- **Alimentação**: fornece a energia para o motor girar.
- **Sensor/PWM**: carrega o sinal de controle de rotação e a leitura de velocidade (tacômetro, medido em RPM).

No SteamOS, a ventoinha aparece como um dispositivo `hwmon`, expondo arquivos em `/sys/class/hwmon` a partir dos quais você pode ler a rotação atual e, em alguns modelos, a entrada de controle. Para descobrir qual diretório `hwmon` corresponde à ventoinha, inspecione os nomes:

```terminal
$ ls /sys/class/hwmon/
hwmon0  hwmon1  hwmon2

$ for d in /sys/class/hwmon/hwmon*; do
>   echo "$d => $(cat $d/name 2>/dev/null)"
> done
/sys/class/hwmon/hwmon0 => amdgpu
/sys/class/hwmon/hwmon1 => acpitz
/sys/class/hwmon/hwmon2 => steamdeck_hwmon
```

Repare que o `steamdeck_hwmon` é o controlador dedicado do aparelho. Nele ficam as leituras de ventoinha e de algumas tensões. A leitura de RPM, quando disponível, é acessada assim:

```terminal
$ cat /sys/class/hwmon/hwmon2/fan1_input
3120
```

O valor `3120` indica que a ventoinha está girando a aproximadamente 3.120 RPM naquele instante. Em repouso (*idle*) o valor costuma ficar abaixo disso; em carga, pode ultrapassar 6.000 RPM nos momentos de pico.

## Sintomas de ventoinha estragada

Antes de abrir o Steam Deck, vale observar o comportamento do aparelho para confirmar que o problema é mesmo a ventoinha. Os sintomas mais comuns são:

- **Ruído mecânico**: um "grilo" ou "chiado" intermitente, que piora em determinadas rotações. Indica rolamento desgastado ou sujeira acumulada no eixo.
- **Coil whine**: um zumbido agudo e constante, diferente do ruído mecânico. Nem sempre é defeito — muitos aparelhos apresentam *coil whine* leve —, mas se surgir de repente junto com vibração, merece atenção.
- **Parada total**: a ventoinha não gira, mesmo sob carga. O sistema esquenta até limitar o desempenho e, depois, desligar.
- **Superaquecimento**: temperaturas de APU acima de 95 °C em carga moderada, acompanhadas de queda de FPS.
- **RPM zerada ou oscilante**: a leitura de rotação fica em `0`, ou salta erraticamente entre valores incompatíveis com o estado do aparelho.

Para detectar parada ou RPM inconsistente, monitore a leitura em tempo real com `watch`. O comando abaixo atualiza a cada dois segundos:

```terminal
$ watch -n 2 cat /sys/class/hwmon/hwmon2/fan1_input
```

Enquanto o comando roda, abra um jogo ou execute uma carga. Se o valor permanecer em `0` apesar do aquecimento, a ventoinha (ou o conector) está comprometido.

O comando `sensors` também resume as leituras de temperatura e ventoinha de uma só vez. Em um aparelho saudável, a saída se parece com isto:

```terminal
$ sensors
steamdeck_hwmon-isa-0000
Adapter: ISA adapter
fan1:        3120 RPM  (min =    0 RPM)
in0:          7.60 V

amdgpu-pci-0400
Adapter: PCI adapter
edge:         +51.0°C
junction:     +54.0°C
mem:          +53.0°C
```

Aqui temos a leitura `fan1` (RPM) do controlador e as temperaturas da APU (`edge`, `junction` e `mem`) no pacote `amdgpu`. Em carga, a `junction` — a mais importante para o *throttling* — pode chegar perto dos 90 °C sem que isso seja necessariamente um problema, desde que a ventoinha esteja acompanhando o aumento.

## Diagnóstico por software no SteamOS

Além das leituras de RPM pelo `hwmon`, o kernel do SteamOS expõe as zonas térmicas em `/sys/class/thermal`. Essas zonas informam qual o estado do controle térmico e qual dispositivo está mais quente. Liste as zonas disponíveis:

```terminal
$ ls /sys/class/thermal/
cooling_device0  thermal_zone0  thermal_zone1

$ for z in /sys/class/thermal/thermal_zone*; do
>   echo "$z => $(cat $z/type 2>/dev/null) | $(cat $z/temp 2>/dev/null)"
> done
/sys/class/thermal/thermal_zone0 => apu | 54000
/sys/class/thermal/thermal_zone1 => board | 48000
```

O sufixo `000` nos valores de `temp` indica miligraus Celsius, então `54000` equivale a 54 °C. A zona `apu` é a mais relevante para o controle da ventoinha: quando ela sobe, o firmware aumenta a rotação.

Para confirmar que o problema é mesmo a ventoinha e não um sensor defeituoso, compare as leituras:

```terminal
## temperatura da APU
$ cat /sys/class/thermal/thermal_zone0/temp
82000

## rotação da ventoinha no mesmo instante
$ cat /sys/class/hwmon/hwmon2/fan1_input
0
```

Se a APU está em 82 °C e a ventoinha em `0` RPM por vários segundos, o diagnóstico aponta para ventoinha parada ou conector solto. Antes de trocar a peça, reinicie o aparelho e rode uma carga curta para descartar falha momentânea de firmware.

Uma tabela de referência ajuda a interpretar os valores:

| Estado | RPM típico | Temperatura da APU (`junction`) |
| --- | --- | --- |
| Ocioso (menu principal) | 1.500–3.500 | 40–55 °C |
| Carga média (jogos leves) | 3.500–5.000 | 60–75 °C |
| Carga alta (títulos pesados) | 5.000–7.000+ | 80–90 °C |
| Pico/sustentado por minutos | até ~7.300 | 90–96 °C (limite) |

Valores muito fora dessas faixas — especialmente RPM zerada com temperatura alta — são fortes indícios de defeito.

:::atencao

**Conectores frágeis**: o cabo da ventoinha é um *flat* fino e o conector na placa é pequeno. Não puxe pelo cabo; segure sempre pela base do conector com uma pinça ou com a unha. Dobrar o *flat* em ângulo fechado pode romper as trilhas internas e transformar uma troca simples em um defeito intermitente difícil de diagnosticar.

:::

## Troca da ventoinha

Com o diagnóstico confirmado, desligue o Steam Deck e desconecte-o do carregador. Antes de prosseguir, remova a bateria ou desconecte o conector dela, conforme a [seção do dissipador](#/cap-085/sec-02), para eliminar o risco de curto durante o manuseio.

A ventoinha é fixada ao conjunto do dissipador por parafusos curtos, normalmente três. Eles podem estar cobertos por adesivos ou etiquetas; remova-os com cuidado e guarde os parafusos separados pelo tamanho.

```terminal
## desligue o Steam Deck e desconecte o carregador
$ shutdown -h now
```

Depois de remover a tampa traseira e a blindagem interna, localize a ventoinha. Use uma chave Phillips compatível (PH0 ou PH00) e solte os parafusos em cruz, um pouco de cada vez, para evitar torção na base. A sequência em cruz reduz a tensão sobre a moldura plástica.

Em seguida, desconecte o *flat* da ventoinha. Ele encaixa por pressão, com um pequeno trava ou simplesmente por fricção. A regra de ouro é puxar pelo conector, nunca pelo cabo:

```terminal
## depois de soltar os parafusos, desconecte o flat segurando a base
## puxe o conector para cima, devagar e em linha reta
```

:::perigo

**Não force o *flat*.** Se o conector não sair com pressão leve e constante, pare e inspecione: alguns modelos têm uma lingueta que deve ser levantada antes da remoção. Forçar pode arrancar o conector da placa ou romper as trilhas do cabo, danificando a placa-mãe de forma irreversível.

:::

Instale a nova ventoinha no sentido inverso. Conecte o *flat* primeiro, garantindo que ele entre reto e até o fim, e só então fixe os parafusos. Aperte-os até ficarem firmes, mas sem excesso — o material é termoplástico e pode trincar.

Depois de montar tudo, ligue o aparelho e confirme a rotação:

```terminal
$ cat /sys/class/hwmon/hwmon2/fan1_input
3180

## monitore por alguns segundos para confirmar estabilidade
$ watch -n 1 cat /sys/class/hwmon/hwmon2/fan1_input
```

Se a leitura subir gradualmente conforme você abre um jogo e pairar numa faixa estável, a troca foi bem-sucedida. A ausência de leitura pode indicar má conexão do *flat*: desligue, reconecte o cabo e teste novamente.

## Validação de rotação e temperatura

Após a instalação, valide o comportamento completo. Rode um jogo por alguns minutos e compare as temperaturas com a rotação em intervalos regulares:

```terminal
## capture um retrato de temperatura e RPM a cada dois segundos
$ watch -n 2 'cat /sys/class/thermal/thermal_zone0/temp; cat /sys/class/hwmon/hwmon2/fan1_input'
```

Uma ventoinha saudável responde rapidamente ao aumento de temperatura. Se a APU subir de 50 °C para 80 °C, a RPM deve subir na mesma janela de tempo. Atrasos grandes ou uma rotação travada num valor alto e constante mesmo em repouso indicam problema de controle ou sensor.

Por fim, escute o aparelho em repouso. A nova ventoinha deve ser praticamente silenciosa no menu principal e produzir apenas um sopro de ar em carga. Ruído mecânico persistente após a troca — como atrito no eixo — sugere peça com defeito ou montagem desalinhada.

```terminal
## em repouso, a rotação deve estar baixa e o ruído mínimo
$ cat /sys/class/hwmon/hwmon2/fan1_input
1620
```

Esses testes formam a base do que será aprofundado na [seção de testes pós-reparo](#/cap-085/sec-08), onde você confirma o funcionamento do conjunto completo antes de devolver o aparelho ao uso.

## Resumo

- A ventoinha remove o calor do dissipador e é controlada por PWM com base na temperatura da APU.
- O cabo único reúne dois circuitos: alimentação do motor e sensor/PWM de controle e leitura de RPM.
- Sintomas típicos de defeito incluem ruído mecânico, *coil whine*, parada e superaquecimento.
- O diagnóstico por software usa os arquivos em `/sys/class/hwmon` e `/sys/class/thermal`, além do comando `sensors`.
- A troca exige cuidado redobrado com o *flat* frágil: puxe sempre pela base do conector.
- A validação final confere RPM e temperatura juntas, com resposta rápida da ventoinha à carga.

## Exercícios

1. Execute `sensors` no seu Steam Deck e identifique a linha que reporta a rotação da ventoinha e a temperatura `junction`. Anote os valores em repouso.

2. Usando `watch -n 2 cat /sys/class/thermal/thermal_zone0/temp` e a leitura de `fan1_input`, abra um jogo e registre pelo menos cinco pares de temperatura/RPM. Interprete se a ventoinha respondeu corretamente.

3. Descreva o procedimento correto para desconectar o *flat* da ventoinha e explique por que puxar pelo cabo é perigoso.

4. Liste três sintomas que diferenciam uma ventoinha com rolamento desgastado de um *coil whine* normal, usando as leituras de RPM como apoio.

5. **Integrador**: com o Steam Deck aberto na bancada, simule um cenário em que a leitura de `fan1_input` permanece em `0` apesar de a APU estar em 85 °C. Descreva o passo a passo completo — do diagnóstico por software à troca e validação — relacionando as leituras de `/sys/class/hwmon` e `/sys/class/thermal` com os cuidados de conectores do [dissipador](#/cap-085/sec-02) e os testes finais da [seção de testes pós-reparo](#/cap-085/sec-08).
