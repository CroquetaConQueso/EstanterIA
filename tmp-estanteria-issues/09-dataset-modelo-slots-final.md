## Objetivo
Refinar el dataset final por slots y evaluar el modelo de clasificación sin bloquear el desarrollo del resto de la aplicación.

## Alcance
- Tomar nuevas fotografías de anomalías X más limpias.
- Evitar:
  - anomalías demasiado pequeñas
  - oclusiones ambiguas delante/detrás
  - invasiones laterales difíciles de atribuir a un único slot
- Reconstruir dataset.
- Reentrenar modelo.
- Comparar matrices de confusión.
- Elegir el modelo definitivo para la integración real de Vision.

## Criterios de cierre
- Dataset refinado.
- Métricas comparadas con iteraciones previas.
- Modelo final seleccionado o justificación clara del modelo mantenido.
- Resultado preparado para conectarse a Vision FastAPI.

## Naturaleza
Trabajo paralelo y no bloqueante respecto a Backend, Frontend y Plano.

## Rama prevista
`chore/<issue>-dataset-modelo-slots-final`
