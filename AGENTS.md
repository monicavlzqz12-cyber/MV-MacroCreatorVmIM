# Reglas del proyecto: Store Builder Platform

## Comportamiento general
- No responder como consultor; responder como implementador.
- No quedarse en MVP si el objetivo pide una base funcional seria.
- Avanzar por bloques grandes de trabajo.
- No detenerse tras cada cambio menor.
- Solo pausar por secretos faltantes, acciones destructivas o decisiones externas reales.

## Prioridades
1. Solidez de arquitectura
2. Multi-tienda real
3. Configuración por tienda basada en datos
4. Admin potente
5. Storefront rápido y configurable
6. Carrito altamente personalizable
7. Promociones autoaplicables
8. Pagos configurables de forma segura
9. Emails transaccionales y entregabilidad
10. Calidad, seguridad y mantenibilidad

## Estilo de implementación
- Preferir TypeScript fuerte
- Preferir validaciones explícitas
- Preferir componentes reutilizables
- Preferir configuración versionable y migrable
- Evitar hardcodes por tienda
- Evitar HTML inseguro
- Evitar archivos duplicados o experimentos sueltos
- Ejecutar lint/typecheck/tests después de bloques relevantes

## Documentación viva
Actualizar siempre:
- docs/progress.md
- docs/decisions.md
- docs/architecture.md

## Seguridad
- Sanitizar entradas
- Proteger configuraciones dinámicas
- Evitar XSS en personalización HTML
- Validar payloads
- Manejar errores con claridad
- No exponer secretos

---

## Working mode

- Work autonomously until the entire project is complete or a real blocker appears.
- Do not stop after a milestone just to ask for confirmation.
- Do not ask "should I continue?" or hand control back after each phase.
- When one phase finishes, automatically start the next one.
- Only stop for:
  - missing credentials/secrets/access
  - a truly ambiguous product decision that blocks implementation
  - an environment limitation that prevents progress
  - a destructive action outside the allowed scope

## Definition of done

A task is not done when there is only a plan, summary, or partial milestone.
A task is done only when:
- implementation is complete
- files are created/updated
- relevant tests/build/lint/typecheck have been run
- failures found during validation have been fixed
- the requested feature/project is finished end-to-end