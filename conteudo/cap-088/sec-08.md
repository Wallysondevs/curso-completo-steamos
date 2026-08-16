Superaquecimento raramente é um problema único: quase sempre é uma cadeia que começa com poeira nas aletas, passa por pasta seca e termina em throttling. Diagnosticar bem significa percorrer essa cadeia na ordem certa — da causa mais barata para a mais cara — antes de abrir o aparelho. Esta seção oferece um roteiro de diagnóstico e o procedimento de limpeza que resolve a maioria dos casos sem tocar na pasta térmica.

:::objetivos
- Seguir um roteiro de diagnóstico do mais barato ao mais invasivo
- Identificar poeira acumulada e obstrução de fluxo de ar
- Limpar grades e aletas com segurança
- Interpretar logs e temperaturas para localizar o gargalo
- Decidir quando a limpeza resolve e quando exige troca de pasta
:::

## O roteiro de diagnóstico

A ordem importa, porque cada passo descarta uma causa mais provável e menos invasiva que o seguinte. Siga nesta sequência:

1. Verificar temperatura de base e ventoinha (`sensors`)
2. Confirmar que as grades não estão bloqueadas pelo uso
3. Inspecionar e limpar poeira das aletas e da ventoinha
4. Testar curva de ventoinha e resposta ao calor
5. Só então considerar troca de pasta térmica

Pular direto para o passo 5 é o erro mais comum — e o mais caro. A maioria dos Decks "superaquecendo" só precisa do passo 3.

:::dica
Registre tudo antes de mexer. Anote `Tdie`, `junction`, `fan1_input` e o resultado de um `stress` de 60 segundos. Esses números são sua régua para medir se a limpeza funcionou.
:::

## Reunindo as evidências

Comece coletando, em repouso e sob carga, os quatro números que contam:

```terminal
$ sensors k10temp-pci-00c3 amdgpu-pci-0400 steamdeck-hwmon
k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +92.0°C
Tdie:         +92.0°C

amdgpu-pci-0400
Adapter: PCI adapter
edge:         +88.0°C
junction:     +95.0°C

steamdeck-hwmon
Adapter: ISA adapter
fan1:        6900 RPM
temp1:       +71.0°C
```

Um padrão que aponta para obstrução: a ventoinha a 6900 RPM (máximo) enquanto a temperatura do die se mantém em 92 °C — a ventoinha está "gritando" mas o calor não sai, sinal clássico de que o ar não atravessa as aletas. Ao mesmo tempo, a temperatura da placa (temp1) em 71 °C, mais baixa, confirma que o APU está isolado do fluxo.

## Confirmando obstrução de fluxo

Com o aparelho desligado, use uma lanterna contra a grade traseira. A poeira aparece como um feltro acinzentado cobrindo as aletas do dissipador. Outro teste: ligue o Deck, rode um jogo e sinta o ar na grade superior:

```terminal
$ stress --cpu 8 --timeout 60s
$ # enquanto roda, sinta o ar na grade superior
```

Se a grade superior estiver quente mas o fluxo de ar for fraco ou nulo, o duto está bloqueado. Se o ar sair frio com o die a 90 °C, o gargalo está entre o die e o dissipador (pasta), não nas aletas.

## Limpando com segurança

A limpeza básica não exige abrir o Deck se você tiver cuidado. Com o aparelho **desligado e desconectado**:

1. Use um soprador de ar ou lata de ar comprimido contra a grade superior, ejetando a poeira pela traseira.
2. Alterne jatos curtos nas duas direções para desalojar a poeira presa.
3. Evite girar a ventoinha com jatos muito fortes (pode induzir corrente e danificar o rolamento).

:::perigo
Nunca use aspirador com bico metálico diretamente sobre componentes, nem sopre com o aparelho ligado. Jatos de ar muito fortes podem girar a ventoinha além do limite e gerar tensão de volta para a placa. Para sujeira incrustada nas aletas, a remoção da tampa traseira e limpeza com pincel antiestático é mais segura.
:::

Se a poeira não sair pela grade, será preciso remover a tampa traseira (parafusos Torx) e limpar as aletas diretamente com pincel macio e ar. Desconecte a bateria antes de qualquer limpeza interna.

:::atencao
Após a limpeza, rode a mesma carga de `stress` e compare com a linha de base. Uma queda de 10 a 20 °C sob carga é o resultado esperado de um duto que estava de fato obstruído. Se nada mudou, o problema é a pasta térmica, não a poeira.
:::

## Quando limpeza não basta

Se, após limpeza e curva correta, o die ainda atinge 90+ °C com a ventoinha a máximo e o ar saindo quente, a interface die-dissipador (pasta) degraou e precisa de troca — o assunto da seção anterior. A sequência limpeza → curva → pasta cobre quase 100% dos casos de superaquecimento.

O resultado da limpeza bem-sucedida aparece na mesma leitura que antes mostrava 92 °C:

```terminal
$ stress --cpu 8 --timeout 60s &
$ sensors k10temp-pci-00c3 steamdeck-hwmon
k10temp-pci-00c3
Adapter: PCI adapter
Tdie:         +67.0°C

steamdeck-hwmon
Adapter: ISA adapter
fan1:        3850 RPM
```

A ventoinha agora mantém 67 °C com 3850 RPM — menos da metade do RPM anterior — porque o ar passa livremente pelas aletas limpas.

## Resumo

- O diagnóstico deve ir da causa mais barata (obstrução) à mais invasiva (troca de pasta).
- Ventoinha a máximo com o die quente e ar fraco na saída indica obstrução de fluxo.
- Ar na saída frio com o die quente indica gargalo na interface die-dissipador (pasta).
- Limpeza com ar comprimido pelas grades resolve a maioria dos casos sem abrir o Deck.
- Comparar temperatura antes e depois da limpeza mede objetivamente o resultado.

## Exercícios

1. Registre `Tdie`, `junction` e `fan1_input` em idle e sob `stress --cpu 8 --timeout 60s` como linha de base.
2. Com o Deck desligado, inspecione as grades com lanterna. Há poeira visível nas aletas?
3. Durante uma carga, avalie o fluxo e a temperatura do ar na grade superior. Classifique seu caso: obstrução ou interface térmica?
4. Faça a limpeza com ar comprimido e refaça a medição de `stress`. Anote a diferença de temperatura.
5. **Desafio.** Monte uma tabela de diagnóstico com colunas: ventoinha (baixa/máxima), ar na saída (frio/morno/quente), die (baixo/alto) e conclusão (normal/obstruído/pasta seca). Para cada combinação coerente, indique a ação recomendada.