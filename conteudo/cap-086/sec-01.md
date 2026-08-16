O Steam Deck não é um aparelho lacrado: a própria Valve publica os guias de desmontagem, vende peças de reposição e reconhece que o dono tem o direito de abrir, consertar e modificar o próprio hardware. Este capítulo começa justamente por aí — antes de qualquer parafuso, você precisa entender *o que* pode ser reparado, *como* o aparelho foi construído para isso e *onde* ficam os limites da garantia.

:::objetivos
- Entender o que é reparabilidade e por que o Deck foi desenhado para isso
- Conhecer a relação entre Valve, iFixit e peças de reposição
- Navegar pelos subsistemas modulares do Deck (bateria, SSD, tela, sticks)
- Saber o que a garantia cobre e o que não cobre depois de abrir
- Compreender o conceito de "direito ao reparo" na prática
:::

## O que torna um aparelho reparável

Reparabilidade não é só "dá pra abrir". É um conjunto de decisões de engenharia: parafusos padrão em vez de adesivo e clipes frágeis, conectores que se desconectam sem romper cabos, componentes de alto desgaste (bateria, SSD, manche analógico) montados como módulos trocáveis, e documentação pública de cada passo.

O Steam Deck foi analisado pelo iFixit — site referência mundial em reparos — e recebeu nota alta (em torno de 7/10 no modelo LCD), com elogios ao SSD removível, à bateria acessível (ainda que colada) e à tampa traseira que abre com parafusos comuns. A crítica principal foi o adesivo forte da bateria e os conectores delicados.

```terminal
$ sudo dmidecode -t system | grep -Ei 'product|manufacturer'
	Manufacturer: Valve
	Product Name: Jupiter
```

O `dmidecode` revela o codinome da placa-mãe. No LCD a placa interna é "Jupiter" (e "Galileo" no OLED) — nomes que aparecem nos guias da Valve e nos fóruns quando você procura peças compatíveis. Saber o modelo exato do interior evita comprar a peça errada.

## A relação Valve + iFixit

Desde 2022 a Valve firmou parceria com o iFixit: as peças oficiais de reposição (telas, sticks, ventoinhas, baterias, botões) são vendidas pelo catálogo do iFixit, acompanhadas de guias passo a passo com fotos. Isso significa que trocar um stick não anula a garantia automaticamente — desde que o dano não seja causado pela sua intervenção.

As peças vêm com notas de dificuldade e tempo estimado, no mesmo formato dos guias comunitários. Um stick leva em média 10–15 minutos e nota "fácil/moderado"; a tela é a operação mais arriscada (adesivo + calor).

```terminal
$ lsblk -o NAME,SIZE,MODEL,TRAN | head
NAME        SIZE MODEL              TRAN
nvme0n1   953.9G WD_BLACK SN770     nvme
```

Esse `lsblk` mostra algo importante: muita gente que repara o Deck começa pelo SSD. Como ele usa NVMe M.2 2230 (formato curto), dá para trocar por um maior sem tocar no sistema — o SteamOS reinstala a imagem a partir de um pendrive recuperação.

:::dica
Antes de comprar SSD, confirme o formato 2230 (22 × 30 mm), não o 2280 comum de desktop. Drive de 2280 não cabe no Deck. O `lsblk` confirma o modelo do que já está instalado.
:::

## Os subsistemas modulares

O Deck é organizado em camadas que se desmontam em ordem. Da mais acessível para a mais profunda:

1. **Tampa traseira** — 8 parafusos, acesso direto ao SSD, à ventoinha e ao dissipador.
2. **SSD** — atrás de um escudo metálico, um único parafuso; o troque mais frequente.
3. **Ventoinha (fan)** — conector próprio; troca comum por ruído ou falha.
4. **Bateria** — adesivo forte + parafusos; troca por desgaste de capacidade.
5. **Sticks analógicos** — dois módulos com placa própria; troca por drift.
6. **Tela** — a peça mais cara e delicada, fixada com adesivo térmico.
7. **Placa-mãe** — coração; raramente trocada fora de RMA.

```terminal
$ sudo lsusb | grep -i valve
```

O Deck não "esconde" seus sinais: no Linux você enxerga cada subsistema como um dispositivo. Quando uma peça falha, ela costuma deixar rastro em `dmesg`, `lsusb`, `lspci` ou nos sensores — o que transforma o diagnóstico físico numa extensão do diagnóstico de software que você já conhece.

## Garantia e direito ao reparo

No Brasil e na maioria dos mercados, abrir o aparelho para trocar SSD ou stick **não anula** a garantia — a menos que o defeito reclamado tenha sido causado pela sua própria intervenção (por exemplo, rompeu um cabo e a tela parou). A Valve adota postura explícita de "abrir não invalida a garantia", alinhada ao movimento *right to repair*.

O que realmente anula cobertura de garantia:
- Dano causado por abertura incorreta (conector rasgado, parafuso espanado, componente arrancado).
- Dano por líquido ou impacto (isso já não é coberto mesmo sem abrir).
- Modificação de potência térmica via hardware (dessolda, shunts).

:::atencao
Documente tudo antes de abrir: tire fotos do estado original, guarde os parafusos por posição e anote cada conector desconectado. Se você precisar acionar a garantia depois, um registro limpo ajuda a provar que o defeito não veio da sua mexeção.
:::

## Preparando o terreno mental

Reparo físico é 80% paciência e 20% habilidade. Antes de abrir qualquer coisa, confirme: temperatura ambiente razoável, bancada limpa e antiestática, luz forte, e o guia oficial (iFixit/Valve) aberto em outro dispositivo. Nunca trabalhe "de memória".

O restante deste capítulo constrói, em sequência, o caminho completo: reunir ferramentas (seção 2), abrir com segurança (seção 3), diagnosticar a causa (seção 4) e executar as trocas específicas (seções 5–7), fechando com manutenção preventiva e, se tudo falhar, assistência e garantia.
