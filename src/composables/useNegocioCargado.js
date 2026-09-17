import { watch } from "vue";
import { useRoute } from "vue-router";
import { useCompanyStore } from "src/stores/company-store";

/**
 * Corre `alCargar(slug)` cuando el negocio de la ruta ya esta cargado, y otra vez si se
 * navega a otro.
 *
 * El negocio se guarda entre visitas (company-store persiste), asi que al montar el menu
 * companyStore todavia puede traer el de la visita anterior. Pedir en ese momento con
 * companyStore.slug traia las reseñas y los puntos de OTRO restaurante -el menu de
 * Kazuki pedia los de sushi-express- o pedia con slug vacio.
 */
export function useNegocioCargado(alCargar) {
  const route = useRoute();
  const companyStore = useCompanyStore();

  watch(
    () => {
      const slug = route?.params?.slug;
      return slug && companyStore.company?.slug === slug ? slug : null;
    },
    (slug) => {
      if (slug) alCargar(slug);
    },
    { immediate: true }
  );
}
