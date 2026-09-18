import { defineStore } from "pinia";
import { marcar } from "src/utils/embudo";

export const useCompanyStore = defineStore("company", {
  persist: true,
  state: () => ({
    slug: "",
    categories: [],
    color: "",
    types: [],
    company: {},
    companies: [],
    companyForm: {},
    scheduleForm: [],
    addressForm: {},
    companyTip: {
      type: "price",
      value: 0,
    },
    companyPayment: {
      type: "Efectivo",
      value: 0,
    },
    configuration: {
      features: [],
      min_order: 0,
      orders_paused: false,
      paused_message: "",
      delivery_mode: "flat",
      delivery_charge: 0,
      delivery_base_fee: 0,
      delivery_base_km: 0,
      delivery_per_km: 0,
      delivery_max_km: 0,
      delivery_free_from: 0,
      coordinates: "",
      ticket_config: {
        business_legal_name: "",
        rfc: "",
        footer_text: "",
        suggestions_email: "",
        show_business_address: true,
      },
    },
  }),
  getters: {
    name() {
      return this.company.name ?? "";
    },
    logo() {
      return this.company.logo ?? "";
    },
    isOpen() {
      return this.company.isOpen ?? false;
    },
    coordinates() {
      return this.company.coordinates ?? "";
    },
    companyData() {
      return this.company.data;
    },
    companyCategories() {
      return this.company.categories ?? [];
    },
    hours() {
      return this.company.hours ?? [];
    },
    companyProduct() {
      return this.company.product;
    },
    companyAddress() {
      const address = this.company.address ?? {};
      return `${address.street} ${address.exterior_number}, ${address.city}, ${address.state}, ${address.country}`;
    },
    companyMap() {
      return this.company.coordinates ?? "";
    },
    companyDeliveryCharge() {
      return this.company.data?.delivery !== "Envio"
        ? 0
        : this.company.delivery_charge ?? 0;
    },

    companyTotalToPay() {
      return this.company.payment?.value;
    },
    whatsapp() {
      return this.company.whatsapp ?? "6682493398";
    },
    features() {
      return this.company.features ?? [];
    },
    bank() {
      return this.company.bank_account ?? {};
    },
  },
  actions: {
    setPrimaryColor(color) {
      this.color = color;
    },
    setCompanies(companies) {
      this.companies = companies;
    },
    setAddressForm() {
      this.addressForm = Object.assign({}, this.company.address);
    },
    setFeatures(features) {
      this.configuration.features = features.map((feature) => {
        return {
          ...feature,
          value:
            this.company.features.find((f) => f.feature_id === feature.id)
              ?.value == "1" ?? false,
        };
      });
      // Precarga los ajustes de pedidos configurables por el dueño.
      this.configuration.min_order = Number(this.company.min_order ?? 0);
      this.configuration.orders_paused = !!this.company.orders_paused;
      this.configuration.paused_message = this.company.paused_message ?? "";
      // Envío
      this.configuration.delivery_mode = this.company.delivery_mode ?? "flat";
      this.configuration.delivery_charge = Number(this.company.delivery_charge ?? 0);
      this.configuration.delivery_base_fee = Number(this.company.delivery_base_fee ?? 0);
      this.configuration.delivery_base_km = Number(this.company.delivery_base_km ?? 0);
      this.configuration.delivery_per_km = Number(this.company.delivery_per_km ?? 0);
      this.configuration.delivery_max_km = Number(this.company.delivery_max_km ?? 0);
      this.configuration.delivery_free_from = Number(this.company.delivery_free_from ?? 0);
      this.configuration.coordinates = this.company.coordinates ?? "";
      // Config del ticket impreso (razón social, RFC, pie legal, email de sugerencias).
      const tc = this.company.ticket_config ?? {};
      this.configuration.ticket_config = {
        business_legal_name: tc.business_legal_name ?? "",
        rfc: tc.rfc ?? "",
        footer_text: tc.footer_text ?? "",
        suggestions_email: tc.suggestions_email ?? "",
        show_business_address: tc.show_business_address ?? true,
      };
    },
    /**
     * Arma el formulario de horarios.
     *
     * `horas` es la lista del local que se esta editando. Sin ella, la del negocio,
     * que es lo de siempre y lo que ve un negocio de un solo local.
     */
    setScheduleForm(horas = null) {
      const defaults = [
        { day_of_week: "lunes", open_time: "09:00", close_time: "18:00", is_closed: false },
        { day_of_week: "martes", open_time: "09:00", close_time: "18:00", is_closed: false },
        { day_of_week: "miércoles", open_time: "09:00", close_time: "18:00", is_closed: false },
        { day_of_week: "jueves", open_time: "09:00", close_time: "18:00", is_closed: false },
        { day_of_week: "viernes", open_time: "09:00", close_time: "18:00", is_closed: false },
        { day_of_week: "sábado", open_time: "09:00", close_time: "18:00", is_closed: true },
        { day_of_week: "domingo", open_time: "09:00", close_time: "18:00", is_closed: true },
      ];
      const existing = horas ?? this.company.hours ?? [];
      this.scheduleForm = defaults.map((d) => {
        const found = existing.find(
          (h) => h.day_of_week?.toLowerCase() === d.day_of_week.toLowerCase()
            || h.day_of_week?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === d.day_of_week.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        );
        return found ? { ...found } : { ...d };
      });
    },
    setForm() {
      this.companyForm = Object.assign({}, this.company);
    },
    setCategories(categories) {
      this.categories = categories;
    },
    setTypes(types) {
      this.types = types;
    },
    clear() {
      this.company = {};
      this.companyTip.type = "price";
      this.companyTip.value = 0;
      this.companyPayment = {
        type: "Efectivo",
        value: 0,
      };
    },
    changeSlug(slug) {
      return this.slug !== slug;
    },
    setSlug(slug) {
      if (this.slug !== slug) {
        this.clear();
      }
      this.slug = slug;
    },
    setCompany(company) {
      this.company = company;
      // Primer paso del embudo. Aqui y no en el router: aqui es donde consta que el
      // menu de verdad cargo y el comensal esta viendo algo.
      if (company?.slug) marcar(company.slug, "menu");
    },
    addCompany(company) {
      this.companies.push(company);
    },

    setCompanyTip(tip) {
      this.companyTip = tip;
    },
    setCompanyPayment(payment) {
      this.companyPayment = payment;
    },
    setAddress(address) {
      this.company.address = address;
    },
  },
});
