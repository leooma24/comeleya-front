# Panel móvil — qué tiene que sobrevivir

Lista de todo lo que el panel hace **hoy** en cada pantalla que vamos a rediseñar. La
regla es simple: el rediseño cambia dónde vive cada cosa en la pantalla, no qué hace el
panel. Si algo de esta lista deja de funcionar en celular, el rediseño está mal.

Se valida en un celular real (o emulado) contra un negocio con datos, no en la maqueta.

---

## Pedidos (`Orders.vue`)

### Datos que muestra cada pedido
- [x] Folio (`order_code`) y hora de creación
- [x] Minutos transcurridos, y el aviso cuando se pasa del tiempo (`isOverdue`) — en
      celular lo dice el anillo, no el texto
- [x] Pedido agendado (`schedule_at`), cuando lo hay
- [x] Cliente: nombre y teléfono
- [x] Tipo de entrega: domicilio o recoger (`getTypeDelivery`, `getDeliveryIcon`)
- [x] Dirección de entrega — **no se mostraba en la tarjeta**, solo en el ticket
- [x] Artículos con cantidad, nombre y **extras con sus opciones**
- [x] Nota del cliente por platillo
- [x] Total a cobrar (`orderTotals`) — **no se mostraba en la tarjeta**, solo en el ticket
- [x] Método de pago — **no se mostraba en la tarjeta**, solo en el ticket
- [x] Repartidor asignado y su estado (asignado / recogido)

### Acciones
- [x] **Preparar** (estado 1 → 2, `doStart`)
- [x] **Enviar** (estado 2 → 3, `handleSendOrder`, con elección de repartidor)
- [x] **Entregar** (estado 3 → 4, `doDeliver`)
- [x] **Cancelar** (estados 1 a 3, `doCancel`, con confirmación)
- [x] **Asignar repartidor** (`handleAssignDriver`) y **reasignar** (`handleReassignDriver`)
- [x] **Imprimir ticket** (`printOrder`)
- [x] Bloqueo por pedido mientras corre una acción (`isBusy`), para no mandar dos veces
- [x] **Cerrar pedidos** del día (`cerrarPedidos`, solo en estados cerrables)

### Comportamiento
- [x] Sondeo cada 10 s (`longPolling`) y su bandera de pausa (`pollingActive`)
- [x] Alarma de pedido nuevo: sonido repetido, título de la pestaña y vibración
- [x] Selector de tono de la alarma (`ALERT_TONES`, `chooseTone`)
- [x] Buscador (`filter`)
- [x] Paginación (`currentPage`, `rowsPerPage`) o su equivalente
- [x] Pestañas de estado: pendientes, en preparación, enviados, entregados, cancelados
- [x] Historial (`esHistorial`, estado 0) con sus propios filtros
- [x] Estados vacíos, distintos por pestaña

### Lo que la tarjeta NO mostraba

Al levantar el inventario salió que **el total, el método de pago y la dirección nunca
estuvieron en la tarjeta**: para saber cuánto valía un pedido había que imprimir el
ticket. En celular ya se muestran, usando `orderTotals()`, que es la misma cuenta del
ticket impreso, para que el papel y la pantalla no digan cosas distintas.

---

## Hoy (`Dashboard.vue`)

- [x] Pedidos, ingresos y ticket promedio del día, con comparativa
- [x] Gráfica de los últimos 7 días
- [x] Salud del menú y sus avisos
- [x] Oportunidades de mejora, cada una con su acción
- [x] Lista de clientes con segmentación — en filas, con el filtro en tira que se
      desliza y sin los segmentos vacíos
- [x] WhatsApp por cliente
- [x] El buscador de clientes **no filtraba nada en celular**: la tabla lo aplicaba por
      dentro con `:filter` y la lista nueva no pasa por la tabla
- [x] Botones de oferta flash, corte de caja, insertar en web y compartir
- [x] Selector de periodo: hoy / semana / mes

---

## Menú (`Products.vue`)

- [x] Lista con foto, nombre, categoría, estado y precio
- [x] Filtros: todos, destacados, en oferta, agotados, disponibles, activos, inactivos
- [x] Buscador y filtro por categoría
- [x] Marcar agotado (`toggleSoldOut`) y destacado (`toggleFeatured`)
- [x] Crear oferta / editar oferta
- [x] Editar, clonar y borrar platillo
- [ ] Acciones masivas y orden por arrastre — **solo escritorio**: arrastrar para
      reordenar no funciona con el dedo mientras la lista scrollea
- [x] Exportar menú a PDF
- [x] Agregar platillo

---

## Categorías (`Categories.vue`)

- [x] Lista con nombre y estado
- [x] Buscador
- [x] Editar y eliminar
- [ ] Arrastrar para reordenar y paginador — **solo escritorio**

## Extras (`Extras.vue`)

- [x] Lista de grupos con su estado
- [x] Cuántas opciones tiene cada grupo — dato nuevo: un grupo sin opciones no le
      aparece al cliente y eso solo se veía entrando a abrirlo
- [x] Buscador, editar y eliminar

## Lo demás (Cupones, Reseñas, Repartidores, Reservaciones, Lealtad, Analíticas,
## Tema, SEO, Facebook, Mi plan)

- [x] Todas reciben la banda desde `AdminPage`, con el título de la sección y el
      regreso a "Más". Su contenido no se tocó: lo que cambia es cómo empieza la
      pantalla.
- [x] La cabecera de escritorio de cada una pierde su título en celular —lo dice la
      banda— y conserva sus acciones, que toman el ancho de la pantalla.
- [x] Los avisos de plan y configuración pendiente pasan a ser una franja de sistema
      pegada al borde, encima de la banda. Siguen diciendo lo mismo.

## Reglas que no se tocan

1. **De 1024 px para arriba no cambia nada.** El panel de escritorio se queda como está.
2. **El menú embebido en iframe no se toca.** Ahí `position: fixed` se ancla al alto del
   iframe, que crece con el contenido, así que una barra fija quedaría clavada al final
   del menú y no flotando. Ver `mainStore.isExternal`.
3. **Una sola fuente de verdad.** La vista de celular usa los mismos datos y las mismas
   funciones que la de escritorio; no se duplica lógica.
4. **Una sola forma de empezar.** Toda pantalla arranca con `Encabezado.vue`. Si una
   sección nueva necesita cifras propias en la banda, se agrega a
   `SECCIONES_CON_BANDA_PROPIA` en `AdminPage` y las pone ella; si no, no hace nada y
   la recibe hecha. Lo que se rompió antes fue justamente que cada pantalla resolvía
   su cabecera y su lista a su manera.
