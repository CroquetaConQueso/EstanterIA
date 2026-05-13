## Objetivo
Representar en el plano el último estado visual conocido de la estantería y, si encaja sin desviar alcance, de sus slots.

## Alcance
- Asociar la última inspección visual a la estantería representada en el plano.
- Mostrar en el plano el estado general:
  - OK
  - HUECOS_VACIOS
  - ANOMALIAS
  - MIXTO
- Incorporar una lectura visual clara de la estantería inspeccionada.
- Valorar una representación slot a slot si puede realizarse de forma limpia y sin desbordar la iteración.
- Mostrar información útil al seleccionar o consultar la estantería.

## Restricción visual
- No modificar archivos CSS ni alterar el estilo existente sin confirmación expresa previa.
- Si para completar esta iteración pareciera imprescindible tocar CSS, detenerse y solicitar confirmación antes de hacerlo.

## Criterios de cierre
- El plano deja de ser puramente decorativo y refleja datos reales de inspección.
- Existe vínculo visible entre análisis visual y representación espacial.
- El usuario puede entender desde el plano si una estantería presenta huecos o anomalías.

## Rama prevista
`feature/<issue>-plano-estado-visual-slots`
