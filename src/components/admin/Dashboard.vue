<template>
  <div :class="{ 'mc-hoy-orden': modoApp }">
    <!-- ONBOARDING WIZARD (only if setup incomplete) -->
    <q-card v-if="showWizard && !loading" flat class="mc-admin-card q-mb-md">
      <div class="mc-admin-card__header">
        <div class="mc-admin-card__title">
          <q-icon name="rocket_launch" size="24px" color="primary" class="q-mr-sm" />
          Configura tu negocio
        </div>
        <q-chip dense :color="wizardProgress >= 100 ? 'positive' : 'primary'" text-color="white">
          {{ wizardProgress }}% completado
        </q-chip>
      </div>
      <div class="q-pa-lg">
        <q-linear-progress :value="wizardProgress / 100" color="primary" rounded size="8px" class="q-mb-lg" />

        <div class="mc-wizard-steps">
          <div
            v-for="step in wizardSteps"
            :key="step.key"
            :class="['mc-wizard-step', step.done ? 'mc-wizard-step--done' : '']"
          >
            <div class="mc-wizard-step__check">
              <q-icon :name="step.done ? 'check_circle' : 'radio_button_unchecked'" :color="step.done ? 'positive' : 'grey-4'" size="24px" />
            </div>
            <div class="mc-wizard-step__content">
              <div class="mc-wizard-step__title">{{ step.title }}</div>
              <div class="mc-wizard-step__desc">{{ step.desc }}</div>
            </div>
            <q-btn
              v-if="!step.done"
              unelevated
              no-caps
              color="primary"
              :label="step.btnLabel"
              :icon="step.btnIcon"
              size="sm"
              class="mc-wizard-step__btn"
              @click="step.action"
            />
            <q-icon v-else name="done" color="positive" size="20px" />
          </div>
        </div>
      </div>
    </q-card>

    <!-- OPTIMIZATION CHECKLIST (after wizard is done) -->
    <q-card v-if="!showWizard && optimizations.length && !loading" flat class="mc-admin-card q-mb-md">
      <div class="mc-admin-card__header">
        <div class="mc-admin-card__title">
          <q-icon name="lightbulb" size="24px" color="amber-8" class="q-mr-sm" />
          Oportunidades de mejora
        </div>
      </div>
      <div class="q-px-lg q-pb-lg">
        <div v-for="opt in optimizations" :key="opt.key" class="mc-optimization-row">
          <q-icon :name="opt.icon" :color="opt.color" size="20px" />
          <div class="mc-optimization-row__text">
            <span class="text-weight-medium">{{ opt.title }}</span>
            <span class="text-caption text-grey-6">{{ opt.desc }}</span>
          </div>
          <q-btn outline no-caps :color="opt.color" :label="opt.btnLabel" size="sm" @click="opt.action" />
        </div>
      </div>
    </q-card>

    <!-- ASESOR DE MENÚ -->
    <q-card v-if="menuHealth && !loading" flat class="mc-admin-card q-mb-md">
      <div class="mc-admin-card__header">
        <div class="mc-admin-card__title">
          <q-icon name="menu_book" size="24px" color="primary" class="q-mr-sm" />
          Salud de tu menú
        </div>
        <div class="mc-mh-score" :class="`mc-mh-score--${scoreColor(menuHealth.score)}`">
          {{ menuHealth.score }}<small>/100</small>
        </div>
      </div>
      <div class="q-px-lg q-pb-lg">
        <q-linear-progress
          :value="menuHealth.score / 100"
          :color="scoreColor(menuHealth.score)"
          size="10px"
          rounded
          class="q-mb-md"
        />

        <div v-if="!menuHealth.findings.length" class="mc-mh-empty">
          <q-icon name="check_circle" color="positive" size="28px" />
          <span>¡Tu menú está bien optimizado! Sigue así.</span>
        </div>

        <div v-for="f in menuHealth.findings" :key="f.key" class="mc-mh-finding">
          <q-icon :name="f.icon" size="22px" :color="sevColor(f.severity)" class="mc-mh-finding__icon" />
          <div class="mc-mh-finding__body">
            <div class="mc-mh-finding__title">{{ f.title }}</div>
            <div class="mc-mh-finding__tip">{{ f.tip }}</div>
            <div v-if="f.dishes.length" class="mc-mh-finding__dishes">
              <q-chip
                v-for="d in f.dishes"
                :key="d.id"
                dense size="sm" color="grey-3" text-color="grey-8"
              >{{ d.name }}</q-chip>
            </div>
          </div>
          <q-btn
            flat dense no-caps color="primary" size="sm" label="Arreglar"
            class="mc-mh-finding__btn"
            @click="handleSuggestion(f.action)"
          />
        </div>
      </div>
    </q-card>

    <!-- MAIN DASHBOARD (existing stats) -->
    <q-card flat class="mc-admin-card" :class="{ 'mc-hoy-app': modoApp }">
      <!-- Cabecera de celular: la seccion, la fecha y el periodo como control
           segmentado. Las acciones pasan a dos botones parejos abajo. -->
      <mc-encabezado
        v-if="modoApp"
        titulo="Hoy"
        :subtitulo="fechaLarga"
      >
        <template v-slot:acciones>
          <button
            type="button" class="mc-head__ic mc-head__ic--fuerte"
            title="Oferta flash" aria-label="Oferta flash"
            @click="showFlashOffer = true"
          >
            <mc-icon name="cupon" :size="16" />
          </button>
          <button
            type="button" class="mc-head__ic"
            title="Corte de caja" aria-label="Corte de caja"
            @click="openCashCut"
          >
            <mc-icon name="caja" :size="16" />
          </button>
        </template>

        <template v-slot:pie>
          <div class="mc-head__seg">
            <button
              v-for="op in [{ l: 'Hoy', v: 'today' }, { l: 'Semana', v: 'week' }, { l: 'Mes', v: 'month' }]"
              :key="op.v"
              type="button"
              :class="{ on: period === op.v }"
              @click="period = op.v"
            >
              {{ op.l }}
            </button>
          </div>
        </template>
      </mc-encabezado>

      <div class="mc-admin-card__header" v-if="!modoApp">
        <div class="mc-admin-card__title">
          <q-icon name="dashboard" size="24px" color="primary" class="q-mr-sm" />
          Dashboard
        </div>
        <div class="row q-gutter-sm items-center">
          <q-btn unelevated no-caps color="red" icon="local_fire_department" label="Oferta flash" size="sm" @click="showFlashOffer = true" />
          <q-btn outline no-caps color="primary" icon="point_of_sale" label="Corte de caja" size="sm" @click="openCashCut" />
          <q-btn outline no-caps color="primary" icon="code" label="Insertar en web" size="sm" @click="showEmbed = true" class="gt-xs" />
          <q-btn outline no-caps color="green" icon="fab fa-whatsapp" label="Compartir" size="sm" @click="shareMenuWa" class="gt-xs" />
          <q-btn-toggle
            v-model="period"
            no-caps rounded unelevated toggle-color="primary" size="sm"
            :options="[
              { label: 'Hoy', value: 'today' },
              { label: 'Semana', value: 'week' },
              { label: 'Mes', value: 'month' },
            ]"
          />
          <!-- Elegir otro mes. Vacio = el actual, que es lo que ve quien nunca lo
               toca. Pedido por un negocio que queria comparar contra el mes pasado. -->
          <q-select
            v-model="mesElegido"
            :options="mesesDisponibles"
            emit-value map-options clearable dense outlined rounded
            label="Ver otro mes"
            style="min-width: 170px"
            :loading="cargandoMes"
            @update:model-value="cargarMes"
          >
            <template v-slot:prepend><q-icon name="calendar_month" size="18px" /></template>
          </q-select>
        </div>
      </div>

      <div v-if="loading" class="mc-dashboard-loading">
        <q-spinner-dots size="40px" color="primary" />
      </div>

      <template v-else>
        <!-- El dia 1 el panel amanece en ceros y se ve igual que si estuviera roto:
             se dice en pantalla en vez de dejar al dueno adivinando si fallo algo. -->
        <q-banner v-if="mesRecienEmpezado" dense rounded class="mc-dash-aviso q-mb-md">
          <template v-slot:avatar><q-icon name="info" color="primary" /></template>
          {{ mesRecienEmpezado }} Arriba puedes elegir otro mes para ver los anteriores.
        </q-banner>

        <!-- De que mes son los numeros, cuando NO es el mes en curso. Sin esto, los
             de agosto se leen como los de hoy. -->
        <q-banner
          v-else-if="stats.periodo && !stats.periodo.es_mes_actual && period === 'month'"
          dense rounded class="mc-dash-aviso q-mb-md"
        >
          <template v-slot:avatar><q-icon name="calendar_month" color="primary" /></template>
          Estás viendo <strong>{{ stats.periodo.etiqueta }}</strong>, un mes ya cerrado.
        </q-banner>

        <!-- Stats Cards with comparison -->
        <div class="mc-stats-grid">
          <div class="mc-stat-card">
            <div class="mc-stat-card__icon mc-stat-card__icon--orders">
              <q-icon name="receipt_long" size="24px" />
            </div>
            <div class="mc-stat-card__content">
              <span class="mc-stat-card__value">{{ stats.orders[period] }}</span>
              <span class="mc-stat-card__label">Pedidos</span>
              <span v-if="ordersChange !== null" :class="['mc-stat-card__change', ordersChange >= 0 ? 'mc-stat-card__change--up' : 'mc-stat-card__change--down']">
                <q-icon :name="ordersChange >= 0 ? 'trending_up' : 'trending_down'" size="12px" />
                {{ Math.abs(ordersChange) }}% {{ comparisonLabel }}
              </span>
            </div>
          </div>
          <div class="mc-stat-card">
            <div class="mc-stat-card__icon mc-stat-card__icon--revenue">
              <q-icon name="attach_money" size="24px" />
            </div>
            <div class="mc-stat-card__content">
              <span class="mc-stat-card__value">${{ formatNumber(stats.revenue[period]) }}</span>
              <span class="mc-stat-card__label">Ingresos</span>
              <span v-if="revenueChange !== null" :class="['mc-stat-card__change', revenueChange >= 0 ? 'mc-stat-card__change--up' : 'mc-stat-card__change--down']">
                <q-icon :name="revenueChange >= 0 ? 'trending_up' : 'trending_down'" size="12px" />
                {{ Math.abs(revenueChange) }}% {{ comparisonLabel }}
              </span>
            </div>
          </div>
          <div class="mc-stat-card">
            <div class="mc-stat-card__icon mc-stat-card__icon--avg">
              <q-icon name="trending_up" size="24px" />
            </div>
            <div class="mc-stat-card__content">
              <span class="mc-stat-card__value">${{ formatNumber(stats.avgTicket[period]) }}</span>
              <span class="mc-stat-card__label">Ticket promedio</span>
            </div>
          </div>
          <div class="mc-stat-card" v-if="stats.reviews">
            <div class="mc-stat-card__icon" style="background: #FFF8E1; color: #FFB300;">
              <q-icon name="star" size="24px" />
            </div>
            <div class="mc-stat-card__content">
              <span class="mc-stat-card__value">{{ stats.reviews.avg || '—' }}</span>
              <span class="mc-stat-card__label">{{ stats.reviews.total }} reseñas</span>
            </div>
          </div>
        </div>

        <!-- SMART SUGGESTIONS -->
        <div v-if="stats.suggestions?.length" class="q-px-lg q-pb-md">
          <div v-for="sug in stats.suggestions" :key="sug.title" class="mc-suggestion">
            <q-icon :name="sug.icon" :color="sug.color" size="20px" />
            <div class="mc-suggestion__text">
              <span class="text-weight-bold">{{ sug.title }}</span>
              <span class="text-caption text-grey-6">{{ sug.desc }}</span>
            </div>
            <q-btn v-if="sug.action" flat no-caps :color="sug.color" size="sm" :label="actionLabel(sug.action)" @click="handleSuggestion(sug.action)" />
          </div>
        </div>

        <!-- Chart -->
        <div class="mc-chart-section">
          <h4 class="mc-chart-title">Pedidos - Últimos 7 días</h4>
          <div class="mc-chart">
            <div class="mc-chart-bar-wrapper" v-for="(day, index) in stats.chart" :key="index">
              <span class="mc-chart-bar__value">{{ day.count }}</span>
              <div class="mc-chart-bar" :style="{ height: getBarHeight(day.count) + '%' }" />
              <span class="mc-chart-bar__label">{{ day.label }}</span>
            </div>
          </div>
        </div>

        <!-- Peak hours -->
        <div class="mc-chart-section" v-if="peakTotal > 0">
          <h4 class="mc-chart-title">Horas pico - últimos 30 días</h4>
          <div class="mc-hours-chart">
            <div
              class="mc-hour-bar-wrapper"
              v-for="h in stats.peakHours"
              :key="h.hour"
              :class="{ 'mc-hour-bar-wrapper--peak': h.hour === peakHour }"
            >
              <div class="mc-hour-bar" :style="{ height: getHourHeight(h.count) + '%' }">
                <q-tooltip v-if="h.count">{{ h.count }} pedidos ~ {{ formatHour(h.hour) }}</q-tooltip>
              </div>
              <span v-if="h.hour % 3 === 0" class="mc-hour-bar__label">{{ formatHour(h.hour) }}</span>
            </div>
          </div>
          <p v-if="peakHour !== null" class="mc-hours-hint">
            <q-icon name="bolt" size="14px" color="amber-8" />
            Tu hora más fuerte es alrededor de las <strong>{{ formatHour(peakHour) }}</strong>. Ten personal y stock listos.
          </p>
        </div>

        <!-- Top Products -->
        <div class="mc-top-products" v-if="stats.topProducts?.length">
          <h4 class="mc-chart-title">Top productos del mes</h4>
          <div class="mc-top-product" v-for="(product, index) in stats.topProducts" :key="index">
            <div class="mc-top-product__rank">{{ index + 1 }}</div>
            <div class="mc-top-product__info">
              <span class="mc-top-product__name">{{ product.name }}</span>
              <span class="mc-top-product__qty">{{ product.total_qty }} vendidos</span>
            </div>
            <span class="mc-top-product__revenue">${{ formatNumber(product.total_revenue) }}</span>
          </div>
        </div>

        <!-- Tips -->
        <div class="mc-tips-section" v-if="currentTip">
          <q-card flat bordered class="mc-tip-card">
            <q-card-section class="row items-center no-wrap q-py-md">
              <q-icon name="tips_and_updates" size="28px" color="amber-8" class="q-mr-md" />
              <div class="col">
                <div class="text-weight-bold text-body2">{{ currentTip.title }}</div>
                <div class="text-caption text-grey-6">{{ currentTip.desc }}</div>
              </div>
              <q-btn v-if="currentTip.action" flat no-caps color="primary" :label="currentTip.btnLabel" size="sm" @click="currentTip.action" />
            </q-card-section>
          </q-card>
        </div>
      </template>
    </q-card>

    <!-- CUSTOMERS SECTION -->
    <q-card
      v-if="stats.customers?.length && !loading"
      flat
      class="mc-admin-card q-mt-md"
      :class="{ 'mc-clicard': modoApp }"
    >
      <div class="mc-admin-card__header">
        <div class="mc-admin-card__title">
          <!-- El icono grande de escritorio ocupa en celular el ancho de dos palabras
               del titulo y no dice nada que el titulo no diga. -->
          <q-icon v-if="!modoApp" name="people" size="24px" color="primary" class="q-mr-sm" />
          Tus clientes ({{ stats.customers.length }})
        </div>
        <div class="row q-gutter-sm">
          <q-btn
            outline no-caps color="green" icon="fab fa-whatsapp"
            :label="modoApp ? 'Compartir' : 'Compartir menú'"
            :dense="modoApp" size="sm" @click="shareMenuWa"
          />
        </div>
      </div>

      <!-- ===== Filtro por segmento en celular =====
           Las fichas de escritorio se envuelven en tres renglones y empujan la lista
           fuera de la pantalla. Aqui van en una tira que se desliza, y los segmentos
           sin nadie no se dibujan: una ficha "VIP (0)" ocupa lugar y no lleva a ningun
           lado. Debajo, el segmento elegido dice que significa, porque "Inactivo" solo
           sirve si uno sabe que son los que ya no vuelven. -->
      <div class="mc-cfil" v-if="modoApp">
        <div class="mc-cfil__tira">
          <button
            v-for="s in segmentosVisibles"
            :key="s"
            type="button"
            :class="['mc-cfil__c', 'mc-cfil__c--' + s, { 'mc-cfil__c--on': segmentFilter === s }]"
            @click="segmentFilter = s"
          >
            {{ s === "all" ? "Todos" : segmentMeta[s].label }}
            <i>{{ segmentCounts[s] }}</i>
          </button>
        </div>
        <div class="mc-cfil__pie" v-if="segmentFilter !== 'all'">
          {{ SEGMENTO_EXPLICA[segmentFilter] }}
        </div>
      </div>

      <!-- Filtros por segmento -->
      <div class="mc-segment-filters" v-if="!modoApp">
        <q-chip
          v-for="s in ['all', 'nuevo', 'frecuente', 'vip', 'inactivo']"
          :key="s"
          clickable
          :selected="segmentFilter === s"
          :color="segmentFilter === s ? (s === 'all' ? 'primary' : segmentMeta[s]?.color) : 'grey-3'"
          :text-color="segmentFilter === s ? 'white' : 'grey-8'"
          @click="segmentFilter = s"
        >
          {{ s === 'all' ? 'Todos' : segmentMeta[s].label }} ({{ segmentCounts[s] }})
        </q-chip>
      </div>

      <!-- ===== Clientes en celular =====
           La tabla tenia siete columnas: en 390 px se corta y deja fuera justo lo que
           dispara la accion -cuanto gasto y hace cuanto no vuelve-. Aqui va en una
           fila, con el WhatsApp a la mano, que es la herramienta de venta mas directa
           que tiene el dueño. Mismos datos y misma funcion de siempre. -->
      <div class="mc-cli" v-if="modoApp">
        <q-input
          v-model="customerSearch" filled dense rounded debounce="300"
          placeholder="Buscar cliente..." class="q-mb-sm"
        >
          <template v-slot:prepend><q-icon name="search" size="18px" /></template>
        </q-input>

        <div v-for="c in clientesMovil" :key="c.phone" class="mc-cli__fila">
          <span class="mc-cli__ini" :class="'mc-cli__ini--' + segmentOf(c)">
            {{ (c.customer_name || '?').trim().slice(0, 2).toUpperCase() }}
          </span>
          <div class="mc-cli__txt">
            <div class="mc-cli__nom">{{ c.customer_name || 'Sin nombre' }}</div>
            <div class="mc-cli__meta">
              {{ c.order_count }} {{ c.order_count === 1 ? 'pedido' : 'pedidos' }}
              · ${{ Number(c.total_spent || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 }) }}
              <span :class="{ 'mc-cli__frio': segmentOf(c) === 'inactivo' }">
                · {{ hace(c.last_order_at) }}
              </span>
            </div>
          </div>
          <button type="button" class="mc-cli__wa" @click="sendWaToCustomer(c)" aria-label="Escribir por WhatsApp">
            <mc-icon name="chat" :size="17" />
          </button>
        </div>

        <div v-if="!clientesMovil.length" class="mc-cli__vacio">
          {{ customerSearch ? "Ningún cliente con ese nombre o teléfono." : "Todavía no hay clientes en este segmento." }}
        </div>
      </div>

      <q-table v-if="!modoApp" flat :rows="filteredCustomers" :columns="customerColumns" row-key="phone"
        :pagination="{ rowsPerPage: 10 }" rows-per-page-label="Por página:" class="mc-inner-table"
        :filter="customerSearch"
      >
        <template v-slot:top-left>
          <q-input v-model="customerSearch" filled dense rounded debounce="300" placeholder="Buscar cliente..." class="mc-admin-search" style="min-width: 200px">
            <template v-slot:prepend><q-icon name="search" size="18px" color="grey-5" /></template>
          </q-input>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="customer_name" :props="props">
              <span class="text-weight-medium">{{ props.row.customer_name }}</span>
            </q-td>
            <q-td key="segment" :props="props">
              <q-chip dense size="sm" :color="segmentMeta[segmentOf(props.row)].color" text-color="white">
                {{ segmentMeta[segmentOf(props.row)].label }}
              </q-chip>
            </q-td>
            <q-td key="phone" :props="props">{{ props.row.phone }}</q-td>
            <q-td key="order_count" :props="props">
              <q-badge :color="props.row.order_count >= 5 ? 'positive' : props.row.order_count >= 3 ? 'primary' : 'grey'" :label="props.row.order_count" />
            </q-td>
            <q-td key="total_spent" :props="props">
              <span class="text-weight-bold text-positive">${{ formatNumber(props.row.total_spent) }}</span>
            </q-td>
            <q-td key="last_order" :props="props">
              <span class="text-caption">{{ timeAgo(props.row.last_order_at) }}</span>
            </q-td>
            <q-td key="actions" :props="props">
              <q-btn flat dense round size="xs" icon="fab fa-whatsapp" color="green" @click="sendWaToCustomer(props.row)">
                <q-tooltip>Enviar promo por WhatsApp</q-tooltip>
              </q-btn>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card>

    <!-- Corte de caja. Vive en CorteDeCaja.vue porque tambien se abre desde Pedidos. -->
    <corte-de-caja v-model="cashCutDialog" />

    <!-- FLASH OFFER DIALOG -->
    <q-dialog v-model="showFlashOffer">
      <q-card style="min-width: 360px; border-radius: 16px">
        <q-card-section>
          <div class="row items-center q-gutter-sm">
            <q-icon name="local_fire_department" size="24px" color="red" />
            <span style="font-size: 18px; font-weight: 700">Oferta flash</span>
          </div>
          <p class="text-caption text-grey-6 q-mt-sm">Crea una oferta temporal en segundos</p>
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="flashForm.dish_id"
            :options="adminStore.products.map(p => ({ label: `${p.name} — $${p.price}`, value: p.id }))"
            emit-value map-options filled dense label="Platillo" class="q-mb-md"
          />
          <q-input v-model.number="flashForm.special_price" type="number" filled dense label="Precio de oferta" prefix="$" class="q-mb-md" />
          <q-select
            v-model="flashForm.hours"
            :options="[{ label: '2 horas', value: 2 }, { label: '4 horas', value: 4 }, { label: '8 horas', value: 8 }, { label: '24 horas', value: 24 }, { label: '48 horas', value: 48 }]"
            emit-value map-options filled dense label="Duración"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn unelevated no-caps color="red" label="Activar oferta" icon="local_fire_department" :loading="flashLoading" @click="activateFlash" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- EMBED / IFRAME DIALOG -->
    <q-dialog v-model="showEmbed">
      <q-card style="min-width: 360px; max-width: 520px; border-radius: 16px">
        <q-card-section>
          <div class="row items-center q-gutter-sm">
            <q-icon name="code" size="24px" color="primary" />
            <span style="font-size: 18px; font-weight: 700">Insertar en tu web</span>
          </div>
          <p class="text-caption text-grey-6 q-mt-sm">
            Copia el código y pégalo como HTML en tu sitio (Wix, WordPress, etc.) para mostrar tu menú dentro de tu página.
          </p>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input :model-value="embedUrl" readonly filled dense label="Enlace del menú" class="q-mb-md">
            <template v-slot:append>
              <q-btn flat dense round icon="content_copy" color="primary" @click="copyText(embedUrl, 'Enlace copiado')">
                <q-tooltip>Copiar enlace</q-tooltip>
              </q-btn>
            </template>
          </q-input>
          <q-input :model-value="embedCode" readonly filled type="textarea" autogrow label="Código para insertar (iframe)" />

          <!-- El carrusel es lo contrario del iframe: no mete el menú completo, sino
               unos cuantos platillos que se actualizan solos donde el dueño ya tiene
               su propio diseño. -->
          <q-separator class="q-my-lg" />
          <div style="font-weight: 700">Solo unos platillos (carrusel)</div>
          <p class="text-caption text-grey-6 q-mt-xs q-mb-md">
            Muestra unos cuantos platillos en tu página y se actualizan solos cuando
            cambies el menú. Cada uno lleva a tu carta, listo para pedir.
          </p>
          <div class="row q-col-gutter-sm q-mb-md">
            <div :class="showcaseTipo === 'categoria' ? 'col-6' : 'col-12'">
              <q-select
                v-model="showcaseTipo"
                :options="showcaseTipos"
                emit-value map-options filled dense
                label="Qué mostrar"
              />
            </div>
            <div class="col-6" v-if="showcaseTipo === 'categoria'">
              <q-select
                v-model="showcaseCat"
                :options="showcaseCategorias"
                emit-value map-options filled dense clearable
                label="Categoría"
              />
            </div>
          </div>
          <q-input :model-value="showcaseCode" readonly filled type="textarea" autogrow label="Código del carrusel">
            <template v-slot:append>
              <q-btn flat dense round icon="content_copy" color="primary" @click="copyText(showcaseCode, 'Código copiado')">
                <q-tooltip>Copiar código del carrusel</q-tooltip>
              </q-btn>
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cerrar" v-close-popup />
          <q-btn unelevated no-caps color="primary" icon="content_copy" label="Copiar código" @click="copyText(embedCode, 'Código copiado')" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DISH TEMPLATES DIALOG -->
    <q-dialog v-model="showTemplates" maximized>
      <q-card style="max-width: 600px; margin: auto; border-radius: 16px">
        <q-card-section class="row items-center">
          <q-icon name="restaurant_menu" size="24px" color="primary" class="q-mr-sm" />
          <span style="font-size: 18px; font-weight: 700">Platillos sugeridos</span>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p class="text-grey-6 text-caption q-mb-md">Selecciona los platillos que quieras agregar. Puedes editarlos después.</p>

          <q-list>
            <q-item v-for="tpl in dishTemplates" :key="tpl.name" tag="label" v-ripple>
              <q-item-section side>
                <q-checkbox v-model="selectedTemplates" :val="tpl" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ tpl.name }}</q-item-label>
                <q-item-label caption>{{ tpl.description }} — ${{ tpl.price }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions class="q-px-lg q-pb-lg">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-space />
          <q-btn
            unelevated no-caps color="primary"
            :label="`Agregar ${selectedTemplates.length} platillos`"
            icon="add"
            :disable="!selectedTemplates.length"
            :loading="addingTemplates"
            @click="addSelectedTemplates"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
defineOptions({ name: "DashboardComponent" });

import { ref, computed, onMounted } from "vue";
import { api } from "boot/axios";
import { useAdminStore } from "src/stores/admin-store";
import { useModoApp } from "src/composables/useModoApp";
import McIcon from "./movil/McIcon.vue";
import McEncabezado from "./movil/Encabezado.vue";
import CorteDeCaja from "./CorteDeCaja.vue";

const adminStore = useAdminStore();
const { modoApp } = useModoApp();
const fechaLarga = new Date().toLocaleDateString("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const loading = ref(true);
const period = ref("today");
const showTemplates = ref(false);
const selectedTemplates = ref([]);
const addingTemplates = ref(false);
const customerSearch = ref("");
const showFlashOffer = ref(false);
const flashForm = ref({ dish_id: null, special_price: null, hours: 4 });
const flashLoading = ref(false);

// --- CORTE DE CAJA ---
// El dialogo vive en CorteDeCaja.vue, que tambien se abre desde Pedidos: aqui solo se abre.
const cashCutDialog = ref(false);
const openCashCut = () => {
  cashCutDialog.value = true;
};

// --- Insertar en web (iframe) ---
const showEmbed = ref(false);
const embedUrl = computed(() => `${window.location.origin}/${adminStore.slug}?isExternal=true`);
// allow="web-share": sin eso el navegador le niega la hoja de compartir a todo lo que
// vive dentro del iframe, y los botones de compartir del menu se quedan mudos. Los
// codigos ya pegados en sitios de negocios no lo traen y para esos el menu se va por
// WhatsApp; esto arregla los que se copien de aqui en adelante.
const embedCode = computed(
  () =>
    `<iframe src="${embedUrl.value}" data-comeleya allow="web-share" style="width:100%;border:0;" height="700"></iframe>\n` +
    `<script src="${window.location.origin}/embed.js" defer><\/script>`
);

// --- Carrusel de platillos (public/widget.js) ---
const showcaseTipo = ref("destacados");
const showcaseCat = ref(null);
const showcaseTipos = [
  { label: "Destacados (los que marcas tú)", value: "destacados" },
  { label: "Los más pedidos", value: "populares" },
  { label: "Promociones vigentes", value: "ofertas" },
  { label: "Una categoría", value: "categoria" },
];
const showcaseCategorias = computed(() =>
  (adminStore.categories || []).map((c) => ({ label: c.name, value: c.id }))
);
const showcaseCode = computed(() => {
  const attrs = [
    "data-comeleya-showcase",
    `data-slug="${adminStore.slug}"`,
    `data-tipo="${showcaseTipo.value}"`,
  ];
  // La categoría solo viaja cuando aplica: un data-cat suelto confunde a quien lea
  // el código pegado en su sitio.
  if (showcaseTipo.value === "categoria" && showcaseCat.value) {
    attrs.push(`data-cat="${showcaseCat.value}"`);
  }
  return (
    `<div ${attrs.join(" ")}></div>\n` +
    `<script src="${window.location.origin}/widget.js" defer><\/script>`
  );
});
const copyText = async (text, okMsg) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    adminStore.messageStore.success(okMsg || "Copiado");
  } catch (e) {
    adminStore.messageStore.error("No se pudo copiar. Copia el texto manualmente.");
  }
};

// El mes que se esta mirando, como "2026-08". Vacio = el mes en curso, que es como
// funciono siempre y como lo ven los 108 negocios que nunca tocan esto.
const mesElegido = ref("");
const cargandoMes = ref(false);

const stats = ref({
  periodo: null,
  orders: { today: 0, week: 0, month: 0 },
  revenue: { today: 0, week: 0, month: 0 },
  avgTicket: { today: 0, week: 0, month: 0 },
  topProducts: [],
  chart: [],
  peakHours: [],
  reviews: null,
});

// Asesor de menú (auditoría + tips).
const menuHealth = ref(null);
const scoreColor = (s) => (s >= 80 ? "positive" : s >= 50 ? "orange" : "negative");
const sevColor = (sev) =>
  sev === "high" ? "negative" : sev === "medium" ? "orange-8" : "primary";

const formatNumber = (num) => Number(num || 0).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const getBarHeight = (count) => {
  const max = Math.max(...(stats.value.chart || []).map((d) => d.count), 1);
  return Math.max((count / max) * 100, 4);
};

// --- COMPARATIVAS por periodo (hoy vs ayer / semana vs semana pasada / mes vs mes pasado) ---
const comparisonLabel = computed(
  () => ({ today: "vs ayer", week: "vs semana anterior", month: "vs mes anterior" })[period.value]
);
const ordersChange = computed(() => {
  const c = stats.value.comparison || {};
  return (period.value === "today" ? c.orders_change_today : period.value === "week" ? c.orders_change_week : c.orders_change) ?? null;
});
const revenueChange = computed(() => {
  const c = stats.value.comparison || {};
  return (period.value === "today" ? c.revenue_change_today : period.value === "week" ? c.revenue_change_week : c.revenue_change) ?? null;
});

// --- HORAS PICO (últimos 30 días) ---
const peakTotal = computed(() => (stats.value.peakHours || []).reduce((s, h) => s + h.count, 0));
const peakHour = computed(() => {
  const hrs = stats.value.peakHours || [];
  if (!hrs.length) return null;
  const top = hrs.reduce((a, b) => (b.count > a.count ? b : a), hrs[0]);
  return top.count > 0 ? top.hour : null;
});
const getHourHeight = (count) => {
  const max = Math.max(...(stats.value.peakHours || []).map((h) => h.count), 1);
  return Math.max((count / max) * 100, 3);
};
const formatHour = (h) => {
  const suffix = h < 12 ? "am" : "pm";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${suffix}`;
};

// --- WIZARD ---
const wizardSteps = computed(() => {
  const c = adminStore.company || {};
  return [
    {
      key: "logo",
      title: "Sube tu logo",
      desc: "Tu logo aparecerá en tu menú digital y QR",
      done: !!c.logo,
      btnLabel: "Subir",
      btnIcon: "image",
      action: () => adminStore.setEstablishmentDrawer(true),
    },
    {
      key: "hours",
      title: "Configura tu horario",
      desc: "Tus clientes sabrán cuándo estás abierto",
      done: c.hours?.length > 0,
      btnLabel: "Configurar",
      btnIcon: "schedule",
      action: () => adminStore.setScheduleDrawer(true),
    },
    {
      key: "categories",
      title: "Agrega una categoría",
      desc: "Organiza tu menú por tipo de platillo",
      done: adminStore.categories?.length > 0,
      btnLabel: "Agregar",
      btnIcon: "category",
      action: () => { adminStore.tab = "categorias"; adminStore.addCategory(); },
    },
    {
      key: "products",
      title: "Agrega tu primer platillo",
      desc: "Sube fotos, precios y descripción",
      done: adminStore.products?.length > 0,
      btnLabel: "Agregar",
      btnIcon: "restaurant_menu",
      action: () => { adminStore.tab = "productos"; adminStore.addProduct(); },
    },
    {
      key: "address",
      title: "Agrega tu dirección",
      desc: "Para que tus clientes te encuentren",
      done: !!c.address,
      btnLabel: "Agregar",
      btnIcon: "location_on",
      action: () => adminStore.setAddressDrawer(true),
    },
  ];
});

const wizardProgress = computed(() => {
  const done = wizardSteps.value.filter((s) => s.done).length;
  return Math.round((done / wizardSteps.value.length) * 100);
});

const showWizard = computed(() => wizardProgress.value < 100);

// --- OPTIMIZATION CHECKLIST ---
const optimizations = computed(() => {
  const opts = [];
  const c = adminStore.company || {};
  const products = adminStore.products || [];

  const productsNoPhoto = products.filter((p) => !p.photo).length;
  if (productsNoPhoto > 0) {
    opts.push({
      key: "photos",
      icon: "photo_camera",
      color: "orange",
      title: `${productsNoPhoto} platillos sin foto`,
      desc: "Los platillos con foto se venden hasta 3x más",
      btnLabel: "Ir a productos",
      action: () => { adminStore.tab = "productos"; },
    });
  }

  if (!products.some((p) => p.is_featured)) {
    opts.push({
      key: "featured",
      icon: "star",
      color: "amber-8",
      title: "Sin platillos destacados",
      desc: "Destaca tus mejores platillos para que aparezcan primero",
      btnLabel: "Ir a productos",
      action: () => { adminStore.tab = "productos"; },
    });
  }

  const hasCoupons = adminStore.company?.coupons_count > 0;
  if (!hasCoupons && products.length > 0) {
    opts.push({
      key: "coupons",
      icon: "confirmation_number",
      color: "purple",
      title: "Sin cupones activos",
      desc: "Crea un cupón de descuento para atraer nuevos clientes",
      btnLabel: "Crear cupón",
      action: () => { adminStore.tab = "cupones"; },
    });
  }

  if (!c.whatsapp) {
    opts.push({
      key: "whatsapp",
      icon: "fab fa-whatsapp",
      color: "green",
      title: "WhatsApp no configurado",
      desc: "Recibe pedidos directamente a tu WhatsApp",
      btnLabel: "Configurar",
      action: () => adminStore.setEstablishmentDrawer(true),
    });
  }

  return opts;
});

// --- TIPS ---
const allTips = [
  { title: "Comparte tu menú en redes sociales", desc: "Comparte el link de tu menú en Instagram, Facebook y WhatsApp para atraer más clientes.", btnLabel: "Ver menú", action: () => window.open(`/${adminStore.slug}`, "_blank") },
  { title: "Imprime tu QR en tu local", desc: "Coloca tu código QR en mesas, mostrador y entrada para que tus clientes lo escaneen.", btnLabel: "Ver QR", action: () => adminStore.setProfileDrawer(true) },
  { title: "Responde las reseñas de tus clientes", desc: "Los clientes valoran la atención. Responder reseñas aumenta la confianza.", btnLabel: "Ver reseñas", action: () => { adminStore.tab = "resenas"; } },
  { title: "Actualiza tus precios regularmente", desc: "Mantener precios actualizados evita confusiones y mejora la experiencia.", btnLabel: null, action: null },
  { title: "Usa fotos reales de tus platillos", desc: "Las fotos reales generan más confianza que imágenes genéricas. Usa buena iluminación.", btnLabel: null, action: null },
  { title: "Ofrece promociones en días lentos", desc: "Si un día tiene pocos pedidos, crea un cupón especial para ese día.", btnLabel: "Crear cupón", action: () => { adminStore.tab = "cupones"; } },
];

const currentTip = computed(() => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return allTips[dayOfYear % allTips.length];
});

// --- DISH TEMPLATES ---
const restaurantTemplates = {
  pizza: [
    { name: "Hawaiana", description: "Jamón y piña con queso mozzarella", price: 129 },
    { name: "Pepperoni", description: "Pepperoni con extra queso", price: 129 },
    { name: "Mexicana", description: "Chorizo, jalapeño y tomate", price: 139 },
    { name: "Margarita", description: "Tomate fresco, albahaca y mozzarella", price: 119 },
  ],
  hamburguesas: [
    { name: "Clásica", description: "Carne de res, lechuga, tomate, cebolla y queso amarillo", price: 89 },
    { name: "BBQ Bacon", description: "Carne de res, tocino, queso cheddar y salsa BBQ", price: 109 },
    { name: "Doble Queso", description: "Doble carne, doble queso amarillo", price: 119 },
    { name: "Pollo Crispy", description: "Pechuga empanizada, mayonesa y lechuga", price: 99 },
  ],
  tacos: [
    { name: "Tacos al Pastor", description: "Con piña, cilantro y cebolla", price: 18 },
    { name: "Tacos de Bistec", description: "Bistec asado con guacamole", price: 22 },
    { name: "Tacos de Suadero", description: "Suadero con salsa verde", price: 18 },
    { name: "Quesadilla", description: "Tortilla de harina con queso fundido", price: 35 },
  ],
  sushi: [
    { name: "California Roll", description: "Surimi, aguacate y pepino", price: 89 },
    { name: "Philadelphia Roll", description: "Salmón, queso crema y aguacate", price: 109 },
    { name: "Tempura Roll", description: "Camarón empanizado con aguacate", price: 119 },
    { name: "Spicy Tuna", description: "Atún picante con chile serrano", price: 129 },
  ],
  general: [
    { name: "Entrada del día", description: "Pregunta por nuestra entrada especial", price: 59 },
    { name: "Plato fuerte", description: "Platillo principal con guarnición", price: 129 },
    { name: "Ensalada de la casa", description: "Mezcla de lechugas con aderezo", price: 69 },
    { name: "Postre del día", description: "Pregunta por nuestro postre", price: 49 },
    { name: "Agua fresca", description: "Agua de fruta del día (1L)", price: 35 },
    { name: "Refresco", description: "Coca-Cola, Sprite, Fanta", price: 25 },
  ],
};

const dishTemplates = computed(() => {
  const category = adminStore.company?.category?.name?.toLowerCase() || "";
  if (category.includes("pizza")) return restaurantTemplates.pizza;
  if (category.includes("hamburguesa") || category.includes("burger")) return restaurantTemplates.hamburguesas;
  if (category.includes("taco") || category.includes("mexican")) return restaurantTemplates.tacos;
  if (category.includes("sushi") || category.includes("japon")) return restaurantTemplates.sushi;
  return restaurantTemplates.general;
});

const addSelectedTemplates = async () => {
  if (!selectedTemplates.value.length) return;
  addingTemplates.value = true;

  const categoryId = adminStore.categories[0]?.id;
  if (!categoryId) {
    adminStore.messageStore.error("Agrega una categoría primero");
    addingTemplates.value = false;
    return;
  }

  let added = 0;
  for (const tpl of selectedTemplates.value) {
    try {
      const { data } = await api.post(`/admin/${adminStore.slug}/dish`, {
        name: tpl.name,
        description: tpl.description,
        price: tpl.price,
        dish_category: { id: categoryId },
        status: "Activo",
        photo: null,
      });
      if (data.product) {
        adminStore.products.push(data.product);
        added++;
      }
    } catch (e) {}
  }

  adminStore.messageStore.success(`${added} platillos agregados`);
  selectedTemplates.value = [];
  showTemplates.value = false;
  addingTemplates.value = false;
};

// --- SUGGESTION ACTIONS ---
const actionLabel = (action) => ({
  share: "Compartir menú",
  products: "Ir a productos",
  coupons: "Crear cupón",
  loyalty: "Ver lealtad",
  customers: "Ver clientes",
})[action] || "Ver";

const handleSuggestion = (action) => {
  if (action === "share") window.open(`/${adminStore.slug}`, "_blank");
  else if (action === "products") adminStore.tab = "productos";
  else if (action === "coupons") adminStore.tab = "cupones";
  else if (action === "loyalty") adminStore.tab = "lealtad";
  else if (action === "customers") {} // scroll to customers section
};

// --- CUSTOMER TOOLS ---
const timeAgo = (d) => {
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days}d`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem`;
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

const customerColumns = [
  { name: "customer_name", label: "Cliente", align: "left", field: "customer_name", sortable: true },
  { name: "segment", label: "Segmento", align: "left", field: "phone" },
  { name: "phone", label: "Teléfono", align: "left", field: "phone" },
  { name: "order_count", label: "Pedidos", align: "center", field: "order_count", sortable: true },
  { name: "total_spent", label: "Total gastado", align: "right", field: "total_spent", sortable: true },
  { name: "last_order", label: "Último pedido", align: "center", field: "last_order_at", sortable: true },
  { name: "actions", label: "", align: "right" },
];

// --- SEGMENTACIÓN DE CLIENTES (comensales) ---
const segmentFilter = ref("all");
const daysSince = (d) => Math.floor((Date.now() - new Date(d)) / 86400000);
const segmentOf = (c) => {
  if (daysSince(c.last_order_at) > 30) return "inactivo";
  if (c.order_count >= 6) return "vip";
  if (c.order_count >= 3) return "frecuente";
  return "nuevo";
};
const segmentMeta = {
  nuevo: { label: "Nuevo", color: "grey-6" },
  frecuente: { label: "Frecuente", color: "primary" },
  vip: { label: "VIP", color: "amber-8" },
  inactivo: { label: "Inactivo", color: "negative" },
};
const segmentCounts = computed(() => {
  const counts = { all: (stats.value.customers || []).length, nuevo: 0, frecuente: 0, vip: 0, inactivo: 0 };
  (stats.value.customers || []).forEach((c) => { counts[segmentOf(c)]++; });
  return counts;
});
const filteredCustomers = computed(() => {
  const list = stats.value.customers || [];
  if (segmentFilter.value === "all") return list;
  return list.filter((c) => segmentOf(c) === segmentFilter.value);
});

/** Que es cada segmento, en la unica frase que importa: por que llamarlo. */
const SEGMENTO_EXPLICA = {
  nuevo: "Pidieron una o dos veces. La tercera es la que los vuelve clientes.",
  frecuente: "De 3 a 5 pedidos. Ya te conocen: un cupón los sube a VIP.",
  vip: "6 pedidos o más. Son los que sostienen el mes; cuídalos.",
  inactivo: "Llevan más de 30 días sin pedir. Un mensaje suele traerlos de vuelta.",
};

/** Un segmento vacío no lleva a ningún lado: solo ocupa espacio en la tira. */
const segmentosVisibles = computed(() =>
  ["all", "nuevo", "frecuente", "vip", "inactivo"].filter(
    (s) => s === "all" || segmentCounts.value[s] > 0
  )
);

/**
 * En escritorio el buscador lo aplicaba la tabla por dentro (`:filter`). La lista de
 * celular no pasa por la tabla, así que el filtro se hace aquí: sin esto se escribía
 * en el buscador y no pasaba nada. Busca por nombre y por teléfono, que es como el
 * dueño identifica a un cliente cuando le suena el nombre pero no lo recuerda bien.
 */
const clientesMovil = computed(() => {
  const q = customerSearch.value.trim().toLowerCase();
  if (!q) return filteredCustomers.value;
  return filteredCustomers.value.filter((c) =>
    `${c.customer_name || ""} ${c.phone || ""}`.toLowerCase().includes(q)
  );
});

/** "hace 3 meses" mueve a escribirle; "2026-05-12" no le dice nada a nadie. */
const hace = (fecha) => {
  if (!fecha) return "sin pedidos";
  const d = daysSince(fecha);
  if (d <= 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  const m = Math.floor(d / 30);
  return m < 12 ? `hace ${m} ${m === 1 ? "mes" : "meses"}` : "hace +1 año";
};

const sendWaToCustomer = (customer) => {
  const name = adminStore.company?.name || "nuestro restaurante";
  const first = (customer.customer_name || "").split(" ")[0] || "";
  const menu = `https://comeleya.com/${adminStore.slug}`;
  const seg = segmentOf(customer);
  let msg;
  if (seg === "inactivo") {
    msg = `¡Hola ${first}! Te extrañamos en ${name}. Vuelve y disfruta tu platillo favorito. Mira el menú aquí: ${menu}`;
  } else if (seg === "vip") {
    msg = `¡Hola ${first}! Gracias por ser cliente frecuente de ${name}. Tenemos algo especial para ti. Menú: ${menu}`;
  } else {
    msg = `¡Hola ${first}! Gracias por tu preferencia en ${name}. Mira nuestras novedades: ${menu}`;
  }
  const phone = customer.phone.replace(/\D/g, "");
  const normalized = phone.length === 10 ? "52" + phone : phone;
  window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`, "_blank");
};

const shareMenuWa = () => {
  const name = adminStore.company?.name || "mi restaurante";
  const msg = encodeURIComponent(`Mira el menú de ${name}: https://comeleya.com/${adminStore.slug}`);
  window.open(`https://wa.me/?text=${msg}`, "_blank");
};

// --- FLASH OFFER ---
const activateFlash = async () => {
  if (!flashForm.value.dish_id || !flashForm.value.special_price) {
    adminStore.messageStore.error("Completa todos los campos");
    return;
  }
  flashLoading.value = true;
  try {
    const { data } = await api.post(`/admin/${adminStore.slug}/flash-offer`, flashForm.value);
    adminStore.messageStore.success(data.message);
    // Update product in admin store
    const dish = adminStore.products.find((p) => p.id === flashForm.value.dish_id);
    if (dish) {
      dish.special_price = flashForm.value.special_price;
      dish.special_until = new Date(Date.now() + flashForm.value.hours * 3600000).toISOString();
    }
    showFlashOffer.value = false;
  } catch (e) {
    adminStore.messageStore.error(e.response?.data?.message || "Error al activar oferta");
  } finally {
    flashLoading.value = false;
  }
};

/**
 * Vuelve a pedir el panel para otro mes. Sin mes, el actual.
 *
 * Nace de un negocio que abrio su panel un dia 1 y no encontro nada: "este mes"
 * llevaba ocho horas de vida y se veia igual que si el sistema estuviera roto.
 */
const cargarMes = async (mes) => {
  mesElegido.value = mes || "";
  cargandoMes.value = true;
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/stats`, {
      params: mes ? { mes } : {},
    });
    stats.value = data;
    // Al elegir un mes, el filtro se pone en "Mes": es lo que se acaba de pedir.
    if (mes) period.value = "month";
  } catch (e) {
    adminStore.messageStore.error("No se pudieron cargar los datos de ese mes");
  } finally {
    cargandoMes.value = false;
  }
};

/**
 * El aviso de "apenas empieza". Solo con el filtro en Mes, en el mes en curso, con
 * pocos dias corridos y sin pedidos: la combinacion exacta en la que los ceros
 * parecen una falla del sistema y no la verdad.
 */
const mesRecienEmpezado = computed(() => {
  const p = stats.value.periodo;
  if (!p || period.value !== "month" || !p.es_mes_actual) return null;
  if (p.dias_transcurridos > 3 || stats.value.orders?.month > 0) return null;

  return p.dias_transcurridos === 1
    ? "El mes apenas empezó hoy, por eso va en ceros."
    : `El mes apenas lleva ${p.dias_transcurridos} días.`;
});

/** Los ultimos 12 meses para el selector, del mas reciente al mas viejo. */
const mesesDisponibles = computed(() => {
  const meses = [];
  const hoy = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const etiqueta = d.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    meses.push({ label: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1), value: valor });
  }
  return meses;
});

// --- LOAD ---
onMounted(async () => {
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/stats`);
    stats.value = data;
  } catch (e) {
    // Stats not available
  }
  try {
    const { data } = await api.get(`/admin/${adminStore.slug}/menu-health`);
    menuHealth.value = data;
  } catch (e) {
    // Asesor de menú no disponible
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>

/* La tarjeta de clientes en celular: sin marco propio, como el resto de "Hoy". */
.mc-clicard {
  &.mc-admin-card { border-radius: 16px; }

  .mc-admin-card__header { padding: 12px 14px 10px !important; }
  .mc-admin-card__title { font-size: 14.5px !important; font-weight: 660; }
  .q-btn { font-size: 11px; border-radius: 10px; }
}


/* ===== Filtro de clientes en celular ===== */
// La tira de filtros se mudo a src/css/app.scss: aqui vivia dentro de un <style
// scoped y ninguna otra seccion podia usarla, aunque todas tienen el mismo
// problema -siete chips que se envuelven en cuatro renglones y empujan los datos
// fuera de la pantalla-.

/* ===== Clientes en celular ===== */
.mc-cli { padding: 4px var(--mc-lado) 8px; }

.mc-cli__fila {
  display: flex;
  align-items: center;
  gap: 11px;
  background: var(--color-surface);
  border-radius: 14px;
  padding: 10px 11px;
  margin-bottom: var(--mc-hueco);
  box-shadow: 0 0 0 0.5px rgba(13, 16, 21, 0.05), 0 1px 1px rgba(13, 16, 21, 0.04);
}

.mc-cli__ini {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: var(--color-surface-variant);
  color: var(--color-text-secondary);

  // El color dice el segmento sin gastar un renglón en decirlo.
  &--vip { background: #fdecec; color: #c62828; }
  &--frecuente { background: #eaf1fc; color: #2560c8; }
  &--inactivo { background: #fdf3e2; color: #b06f00; }
}

.mc-cli__txt { min-width: 0; flex: 1; }
.mc-cli__nom {
  font-size: 13px;
  font-weight: 590;
  letter-spacing: -0.015em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mc-cli__meta {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mc-cli__frio { color: #b06f00; font-weight: 600; }

.mc-cli__wa {
  appearance: none;
  border: 0;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 11px;
  background: #e9f6ee;
  color: #12915a;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.mc-cli__vacio {
  text-align: center;
  padding: 22px 10px;
  font-size: 12.5px;
  color: var(--color-text-secondary);
}


/* El orden importa: en celular lo primero tiene que ser el numero del dia, no el
   asesor del menu. En escritorio el orden de siempre se respeta. */
.mc-hoy-orden {
  display: flex;
  flex-direction: column;

  // La tarjeta de cifras y grafica sube al principio.
  > .mc-hoy-app { order: -1; }
}

/* Los bloques de consejo se aprietan: en 390 px sus titulos grandes y sus parrafos
   completos gastaban dos pantallas antes de la primera cifra. */
.mc-hoy-orden {
  .mc-admin-card__title { font-size: 15px !important; letter-spacing: -0.02em; }
  .mc-admin-card__header { padding: 12px 14px !important; }
  .mc-mh-finding,
  .mc-optimization-row { padding: 11px 14px !important; }
  .mc-mh-finding p,
  .mc-optimization-row p { font-size: 12px; line-height: 1.4; }
}


/* ===== Hoy en celular =====
   El tablero de escritorio es correcto en pantalla ancha, pero en 390 px sus tarjetas
   con cuadro de icono parten el texto en tres renglones y las cifras -que son lo unico
   que importa- quedan chicas. Aqui manda el numero. */
.mc-hoy-app {
  background: transparent !important;
  box-shadow: none !important;
  margin: calc(-1 * var(--mc-lado)) calc(-1 * var(--mc-lado)) 0 !important;
  border-radius: 0 !important;
}

/* La banda de arriba la pone ahora Encabezado.vue, igual que en las otras tres. */

.mc-hoy-app .mc-dash-aviso {
  background: var(--color-primary-soft);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.mc-stats-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  padding: 11px var(--mc-lado) 0 !important;
}
.mc-hoy-app .mc-stat-card {
  display: block !important;
  padding: 12px var(--mc-lado) !important;
  border-radius: 15px;
  min-height: 0 !important;

  &__icon { display: none !important; }
  &__value { font-size: 22px !important; font-weight: 700; letter-spacing: -0.045em; font-variant-numeric: tabular-nums; }
  &__label { font-size: 10.5px !important; color: var(--color-text-secondary); }
  &__change { font-size: 10px !important; margin-top: 3px; }
}

/* Los avisos: tarjeta propia, no renglones apretados contra el borde. */
.mc-hoy-app .mc-suggestion {
  background: var(--color-surface);
  border-radius: 14px;
  padding: 12px var(--mc-lado);
  margin-bottom: 8px;
  box-shadow: 0 0 0 0.5px rgba(13, 16, 21, 0.05), 0 1px 1px rgba(13, 16, 21, 0.04);
}
.mc-hoy-app .q-px-lg { padding-left: var(--mc-lado) !important; padding-right: var(--mc-lado) !important; }

.mc-dashboard-loading { display: flex; justify-content: center; align-items: center; min-height: 300px; }

// Wizard
.mc-wizard-steps { display: flex; flex-direction: column; gap: 8px; }
.mc-wizard-step {
  display: flex; align-items: center; gap: 12px; padding: 12px var(--mc-lado);
  border: 1px solid var(--color-border-subtle); border-radius: 10px;
  transition: all 0.2s;
  &:hover { background: var(--color-surface-variant); }
  &--done { opacity: 0.6; }
  &__content { flex: 1; }
  &__title { font-weight: 600; font-size: 14px; color: var(--color-text-primary); }
  &__desc { font-size: 12px; color: var(--color-text-secondary); }
  &__btn { flex-shrink: 0; }
}

// Asesor de menú
.mc-mh-score {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  small { font-size: 12px; font-weight: 600; opacity: 0.6; }
  &--positive { color: var(--q-positive); }
  &--orange { color: #f57c00; }
  &--negative { color: var(--q-negative); }
}
.mc-mh-empty {
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; color: var(--color-text-primary); padding: 8px 0;
}
.mc-mh-finding {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--color-border-subtle);
  &:first-of-type { border-top: none; }
  &__icon { flex-shrink: 0; margin-top: 2px; }
  &__body { flex: 1; min-width: 0; }
  &__title { font-weight: 600; font-size: 14px; color: var(--color-text-primary); }
  &__tip { font-size: 12.5px; color: var(--color-text-secondary); line-height: 1.45; margin-top: 2px; }
  &__dishes { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
  &__btn { flex-shrink: 0; align-self: center; }
}

// Segmentación de clientes
.mc-segment-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 var(--space-lg) var(--space-sm);
}

// Optimization
.mc-optimization-row {
  display: flex; align-items: center; gap: 12px; padding: 10px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  &:last-child { border-bottom: none; }
  &__text { flex: 1; display: flex; flex-direction: column; }
}

// Stats
.mc-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-md); padding: var(--space-lg); }
.mc-stat-card {
  display: flex; align-items: center; gap: var(--space-md); padding: var(--space-lg);
  background: var(--color-surface); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg);
  transition: box-shadow var(--transition-fast);
  &:hover { box-shadow: var(--shadow-md); }
  &__icon { width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    &--orders { background: color-mix(in srgb, var(--q-primary) 12%, transparent); color: var(--q-primary); }
    &--revenue { background: color-mix(in srgb, var(--q-positive) 12%, transparent); color: var(--q-positive); }
    &--avg { background: color-mix(in srgb, var(--q-info) 12%, transparent); color: var(--q-info); }
  }
  &__content { display: flex; flex-direction: column; }
  &__value { font-size: var(--text-2xl); font-weight: 700; color: var(--color-text-primary); font-variant-numeric: tabular-nums; line-height: 1.2; }
  &__label { font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: 2px; }
}

// Chart
.mc-chart-section { padding: 0 var(--space-lg) var(--space-lg); }
.mc-chart-title { font-size: var(--text-base); font-weight: 600; color: var(--color-text-primary); margin: 0 0 var(--space-md) 0; }
.mc-chart { display: flex; align-items: flex-end; gap: var(--space-sm); height: 180px; padding: var(--space-md) 0; border-bottom: 1px solid var(--color-border-subtle); }
.mc-chart-bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; gap: var(--space-xs); }
.mc-chart-bar { width: 100%; max-width: 48px; background: var(--q-primary); border-radius: var(--radius-sm) var(--radius-sm) 0 0; transition: height 0.5s ease; min-height: 4px; opacity: 0.85; &:hover { opacity: 1; } }
.mc-chart-bar__value { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-primary); }
.mc-chart-bar__label { font-size: var(--text-xs); color: var(--color-text-tertiary); white-space: nowrap; text-transform: capitalize; }

// Peak hours
.mc-hours-chart { display: flex; align-items: flex-end; gap: 3px; height: 130px; padding: var(--space-md) 0 22px; }
.mc-hour-bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; position: relative; }
.mc-hour-bar { width: 100%; max-width: 22px; background: var(--q-info); border-radius: 3px 3px 0 0; min-height: 3px; opacity: 0.55; transition: opacity var(--transition-fast); &:hover { opacity: 1; } }
.mc-hour-bar-wrapper--peak .mc-hour-bar { background: var(--q-primary); opacity: 1; }
.mc-hour-bar__label { position: absolute; bottom: -20px; font-size: 10px; color: var(--color-text-tertiary); white-space: nowrap; }
.mc-hours-hint { font-size: var(--text-xs); color: var(--color-text-secondary); margin: var(--space-sm) 0 0; display: flex; align-items: center; gap: 4px; }

// Top products
.mc-top-products { padding: 0 var(--space-lg) var(--space-lg); }
.mc-top-product {
  display: flex; align-items: center; gap: var(--space-md); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-md);
  transition: background var(--transition-fast); &:hover { background: var(--color-surface-variant); }
  &__rank { width: 28px; height: 28px; border-radius: var(--radius-full); background: var(--color-surface-variant); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: var(--text-sm); color: var(--q-primary); flex-shrink: 0; }
  &__info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  &__name { font-weight: 500; font-size: var(--text-sm); color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__qty { font-size: var(--text-xs); color: var(--color-text-tertiary); }
  &__revenue { font-weight: 700; font-size: var(--text-sm); color: var(--q-positive); font-variant-numeric: tabular-nums; flex-shrink: 0; }
}

// Suggestions
.mc-suggestion {
  display: flex; align-items: center; gap: 12px; padding: 10px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  &:last-child { border-bottom: none; }
  &__text { flex: 1; display: flex; flex-direction: column; }
}

// Stat change
.mc-stat-card__change {
  font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 2px; margin-top: 2px;
  &--up { color: var(--q-positive); }
  &--down { color: var(--q-negative); }
}

// Tips
.mc-tips-section { padding: 0 var(--space-lg) var(--space-lg); }
.mc-tip-card { border-radius: 10px; border-left: 4px solid #FFB300; }

// Inner table
.mc-inner-table { box-shadow: none; background: transparent; }
.mc-admin-search .q-field__control { border-radius: 20px !important; }

@media screen and (max-width: 600px) {
  .mc-stats-grid { grid-template-columns: 1fr 1fr; padding: var(--space-md); }
  .mc-chart-section, .mc-top-products, .mc-tips-section { padding: 0 var(--space-md) var(--space-md); }
  .mc-wizard-step { flex-wrap: wrap; &__btn { width: 100%; margin-top: 4px; } }
}
</style>
