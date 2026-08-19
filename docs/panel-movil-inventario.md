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

- [ ] Pedidos, ingresos y ticket promedio del día, con comparativa
- [ ] Gráfica de los últimos 7 días
- [ ] Salud del menú y sus avisos
- [ ] Oportunidades de mejora, cada una con su acción
- [ ] Lista de clientes con segmentación (nuevo / frecuente / VIP / inactivo)
- [ ] WhatsApp por cliente
- [ ] Botones de oferta flash, corte de caja, insertar en web y compartir
- [ ] Selector de periodo: hoy / semana / mes

---

## Menú (`Products.vue`)

- [ ] Lista con foto, nombre, categoría, estado y precio
- [ ] Filtros: todos, destacados, en oferta, agotados, disponibles, activos, inactivos
- [ ] Buscador y filtro por categoría
- [ ] Marcar agotado (`toggleSoldOut`) y destacado (`toggleFeatured`)
- [ ] Crear oferta / editar oferta
- [ ] Editar, clonar y borrar platillo
- [ ] Acciones masivas y orden por arrastre
- [ ] Exportar menú a PDF
- [ ] Agregar platillo

---

## Reglas que no se tocan

1. **De 1024 px para arriba no cambia nada.** El panel de escritorio se queda como está.
2. **El menú embebido en iframe no se toca.** Ahí `position: fixed` se ancla al alto del
   iframe, que crece con el contenido, así que una barra fija quedaría clavada al final
   del menú y no flotando. Ver `mainStore.isExternal`.
3. **Una sola fuente de verdad.** La vista de celular usa los mismos datos y las mismas
   funciones que la de escritorio; no se duplica lógica.
