# Product

## Register

product

## Users

Dueños de complejos deportivos. Gestionan canchas y reservas día a día desde un escritorio. No necesariamente técnicos — muchos vienen de Excel o del papel. Su contexto de uso es la oficina del complejo, atendiendo clientes mientras miran la pantalla. El trabajo principal en cualquier pantalla: saber qué canchas están ocupadas, qué viene después, y no perder ninguna reserva.

## Product Purpose

Ulee es el dashboard operativo para dueños de sedes deportivas. Centraliza canchas, reservas y disponibilidad en un solo lugar. El éxito se mide en que un dueño pueda operar su negocio completo desde la app sin sentirse abrumado ni confundido.

## Brand Personality

Cálido, claro, confiable. El tono es de herramienta que trabaja para vos, no contra vos. Referencia de sensación: Notion/Loom — familiar, cercano, sin frialdad corporativa. No habla como SaaS, habla como el negocio del dueño.

## Anti-references

- SaaS genérico: paleta azul-blanca, hero-metrics con números grandes, grillas de cards con iconos. Si alguien puede adivinar que es "un SaaS de gestión" por el look solo, fallamos.
- Dark mode agresivo tipo herramienta de monitoreo o infra (Grafana, PagerDuty). Esto es para luz del día en una oficina.
- Complejidad intimidante: nada que un dueño de complejo deportivo sienta que necesita un manual. Viene del Excel.
- Estética deportiva estereotipada: sin gradientes neon, sin tipografías tipo jersey/Impact, sin paleta de camiseta de fútbol.

## Design Principles

1. **Claridad antes que densidad.** Mostrar solo lo que el dueño necesita en este momento. Más info solo cuando la pide.
2. **Lenguaje del negocio.** Los labels, títulos y mensajes hablan como habla un dueño de cancha, no como un PM de SaaS.
3. **Calidez sin decoración.** La app se siente amigable a través del layout, el espacio y el tono — no de ornamentos, ilustraciones o gradientes.
4. **Autoridad tranquila.** UI confiada que no grita. Jerarquía visual clara, sin competencia entre elementos.
5. **Consistencia como confianza.** Mismo patrón en todos lados. El dueño aprende una vez, opera para siempre.

## Reglas de negocio — Reservas

### Estados de una reserva
- **Señado**: el cliente dejó una seña. Paga el saldo al llegar. Si no viene → Ausente.
- **En cancha**: el turno está activo. Pueden extender el tiempo desde el dashboard.
- **Pagado**: el cliente pagó el total completo al momento de reservar. No requiere cobro al finalizar.
- **Jugado**: el turno terminó y todavía hay cobro pendiente (saldo + extensiones). El empleado confirma el cobro con método de pago.
- **Ausente**: el cliente no se presentó. Se marca antes de que empiece el turno o durante, nunca después de que ya terminó (jugado).
- **Recurrente**: turno fijo semanal/mensual. Se puede cancelar el turno individual sin afectar los siguientes.
- **Mantenimiento**: la cancha no está disponible por limpieza, reparación u otro motivo operativo.
- **Evento**: uso especial del espacio (torneo, clínica, evento social). No necesariamente tiene cobro individual por persona.

### Extensión de turno
Cuando una reserva está **en cancha**, el empleado puede extender el tiempo (+30 o +60 min) siempre que el slot siguiente esté libre. La extensión **no requiere cobro inmediato** — el cargo adicional se acumula y se cobra al finalizar el turno extendido, junto con el saldo pendiente. Flujo: seleccionar duración → confirmar extensión → cobrar todo al finalizar.

### Cobro con método de pago
El cobro siempre es en dos pasos: (1) seleccionar método (Efectivo o Mercado Pago), (2) confirmar. Esto permite al empleado corroborar el monto antes de registrar el pago, sin interrumpir el flujo del cliente.

## Accessibility & Inclusion

WCAG AA como base. Buen contraste en modo claro. Navegación por teclado básica. Reducción de movimiento respetada donde aplique.
