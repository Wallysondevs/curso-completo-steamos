Capítulos de personalização tendem a terminar com uma galeria de fotos e links. Esta seção fecha o capítulo com o contrário: um checklist técnico, sequencial e verificável, que cobre todas as camadas — do arquivo de backup à remontagem final — com comandos que confirmam cada etapa. É o roteiro para quem quer sair do "li sobre" para o "fiz e está tudo certo".

:::objetivos
- Executar um checklist completo de personalização do Steam Deck
- Validar cada camada com comandos objetivos, não com impressões visuais
- Integrar o que foi visto nas oito seções anteriores num fluxo único
- Produzir um script de validação reutilizável
- Conhecer os recursos da comunidade para skins e peças físicas
:::

## O checklist integrado

O checklist cruza todas as camadas que o capítulo percorreu. Cada item é uma ação (você executa) seguida de uma verificação (você confere com um comando, não com os olhos). A ordem é intencional: software primeiro, depois físico, depois validação cruzada.

```text
1. BACKUP
   [ ] ~/lab/backup-total/ criado, ~/.steam e Steam local copiados
   [ ] personalizacao.log iniciado com modelo, build do Steam, canal

2. SOFTWARE (sem abrir)
   [ ] Decky Loader instalado (ls ~/homebrew/plugins)
   [ ] CSS Loader instalado (ls ~/homebrew/plugins/CSSLoader)
   [ ] Perfil "limpo" salvo no CSS Loader
   [ ] Skin escolhida ativada e verificada no modo jogo

3. BOTÕES (abrir, mas só mecânica)
   [ ] Ferramentas reunidas (PH00, espátula, pinça, antiestática)
   [ ] Aparelho desligado, bateria abaixo de 50%, fotos do "antes"
   [ ] Botões trocados, todos os parafusos de volta ao lugar correto
   [ ] Teste de controles: todos os botões respondem

4. CASE (se aplicável)
   [ ] Modelo do case confirmado com board_name
   [ ] Pasta térmica limpa e reaplicada ao remontar dissipador
   [ ] Temperatura pós-montagem dentro da faixa esperada (30–50 °C ocioso)
   [ ] Ventoinha girando (cat /sys/class/hwmon/hwmon*/fan1_input > 0)

5. FINALIZAÇÃO
   [ ] personalizacao.log atualizado com todas as alterações
   [ ] Perfil "meu deck" salvo com skins em uso
   [ ] Teste em modo jogo: biblioteca navegável, jogo inicia sem erro
```

Execute na ordem. Pular etapas é o principal motivo de "não sei o que deu errado".

Um hábito que torna o checklist verificável é registrar cada bloco concluído no `personalizacao.log` assim que ele termina, em vez de no fim:

```terminal
$ echo "[$(date +%F)] backup-total criado, build $(steam -version 2>/dev/null | head -1)" >> ~/lab/personalizacao.log
$ tail -3 ~/lab/personalizacao.log
[2025-02-10] backup-total criado, build Steam Version: 1738026274
[2025-02-10] Decky Loader e CSS Loader instalados
[2025-02-10] skin "skin-cores-blue" ativada, perfil "limpo" salvo
```

O `date +%F` grava a data em formato `AAAA-MM-DD`, e o `tail` confirma que as entradas foram anexadas. Com isso, cada marcador do checklist deixa de ser uma intenção e vira um fato registrado no disco.

## Comandos de validação, juntos

Aqui está cada comando usado ao longo do capítulo, reunido num bloco único para copiar, colar e rodar sempre que quiser verificar o estado do sistema.

```terminal
$ cat /sys/devices/virtual/dmi/id/board_name
Jupiter
$ steam -version 2>/dev/null | head -1
Steam Version: 1738026274
$ ls ~/homebrew/plugins
CSSLoader
$ ls ~/homebrew/settings/CSSLoader/settings.json 2>/dev/null && echo "CSS Loader config OK"
$ sensors 2>/dev/null | grep -i "temp1\|Composite" | head -4
$ cat /sys/class/hwmon/hwmon*/fan1_input 2>/dev/null
$ upower -i $(upower -e | grep -i battery) | grep -E "percentage|capacity" | head -3
$ brightnessctl -l 2>/dev/null | grep -i "brightness"
$ cat /proc/bus/input/devices | grep -A4 -i "Steam Deck" | head -20
```

Cada comando responde uma pergunta específica: "qual é a placa?", "qual build está rodando?", "o CSS Loader está configurado?", "qual a temperatura?", "a ventoinha está girando?", "qual a bateria?", "qual o brilho?", "quais controles estão conectados?". Juntos, eles formam o atestado de saúde do aparelho pós-personalização.

## Script de validação reutilizável

Para não digitar tudo de novo, encapsule a validação num pequeno script:

```bash
#!/usr/bin/env bash
# ~/lab/check-personalizacao.sh
echo "=== MODELO ==="
cat /sys/devices/virtual/dmi/id/board_name
echo "=== STEAM BUILD ==="
steam -version 2>/dev/null | head -1
echo "=== PLUGINS ==="
ls ~/homebrew/plugins 2>/dev/null || echo "Decky não encontrado"
echo "=== TEMPERATURA ==="
sensors 2>/dev/null | grep -iE "temp1|Composite" | head -4
echo "=== VENTOINHA ==="
cat /sys/class/hwmon/hwmon*/fan1_input 2>/dev/null || echo "hwmon não disponível"
echo "=== BATERIA ==="
upower -i "$(upower -e | grep -i battery)" 2>/dev/null | grep -E "percentage|capacity" | head -3
echo "=== CONTROLES ==="
cat /proc/bus/input/devices 2>/dev/null | grep -A4 -i "Steam" | head -12
echo "=== PRONTO ==="
```

Salve em `~/lab/check-personalizacao.sh`, torne executável com `chmod +x` e rode sempre que terminar uma camada da personalização. A saída é o seu "certificado de remontagem".

```terminal
$ chmod +x ~/lab/check-personalizacao.sh
$ ~/lab/check-personalizacao.sh
=== MODELO ===
Jupiter
=== STEAM BUILD ===
Steam Version: 1738026274
=== PLUGINS ===
CSSLoader
=== TEMPERATURA ===
Composite:    +39.9°C  (high = +81.8°C)
temp1:        +42.0°C  (crit = +105.0°C)
=== VENTOINHA ===
3500
=== BATERIA ===
  percentage:     78%
  capacity:       40.6 Wh
=== CONTROLES ===
N: Name="Steam Deck Controller"
...
=== PRONTO ===
```

Guarde uma cópia dessa saída junto com o `personalizacao.log`. Se algo quebrar no futuro, essa é a sua linha de base comprovada.

:::dica
Rode o script **antes** de cada intervenção e salve a saída com uma extensão de data: `check-2025-02-10.txt`. Assim você tem uma linha de base para comparar depois.
:::

## Recursos e comunidade

A personalização do Steam Deck é um ecossistema vivo, atualizado com frequência que um livro impresso não acompanha. Os endereços oficiais (e oficiosos confiáveis) para manter seu conhecimento atualizado estão listados a seguir:

| Recurso | Descrição |
|---|---|
| [SteamDeckHomebrew/decky-loader](https://github.com/SteamDeckHomebrew/decky-loader) | Repositório oficial do Decky Loader |
| [SuchMeme/SD-CSSLoader](https://github.com/SuchMeme/SD-CSSLoader) | CSS Loader e documentação de temas |
| [iFixit Steam Deck](https://www.ifixit.com/Device/Steam_Deck) | Guias de desmontagem e troca de componentes |
| [r/SteamDeck](https://reddit.com/r/SteamDeck) | Comunidade com discussões de skins, cases e problemas |

A comunidade no Reddit e no Discord do SteamDeckHomebrew é o lugar onde skins novas aparecem, bugs são reportados e versões de compatibilidade são anunciadas. Visite antes de instalar qualquer coisa que pareça nova demais.

:::atencao
Não baixe skins, plugins ou "pacotes de personalização" de sites fora dos repositórios oficiais listados acima. Pacotes de fonte duvidosa podem embutir scripts que leem seus dados ou travam o aparelho. A comunidade oficial concentra versões revisadas — e ainda assim, leia a descrição antes de instalar.
:::

## Resumo

- O checklist integrado cobre backup, software, botões, case e validação final nessa ordem.
- Os comandos de validação juntos respondem todas as perguntas de saúde do aparelho.
- O script `check-personalizacao.sh` automatiza a verificação e serve de linha de base.
- Rode o script antes e depois de cada intervenção e guarde a saída com data.
- A comunidade (GitHub, Reddit, Discord) é a fonte atualizada de skins e versões compatíveis.
- Personalização feita com método é controle; feita sem método é aposta.

## Exercícios

1. Execute o checklist do começo ao fim, marcando cada item como feito. Anote os itens que você pulou e explique por quê.
2. Crie o script `check-personalizacao.sh` e rode-o. Compare a saída com a referência da seção e identifique qualquer diferença.
3. Guarde uma linha de base com data no nome do arquivo. Depois de uma mudança (ativar uma skin, por exemplo), rode de novo e compare as saídas com `diff`.
4. Visite a loja do CSS Loader e liste três skins que você ainda não testou. Leia a descrição de cada uma e verifique se declaram compatibilidade com o seu build do Steam.
5. **Desafio.** Propõe uma melhoria para o script de validação que cubra um item que este capítulo não abordou (por exemplo: áudio, Wi-Fi, sensor de luz ambiente, microfone). Implemente a melhoria e explique como a testou.