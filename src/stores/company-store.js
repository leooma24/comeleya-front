import { defineStore } from "pinia";

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
    },
    setScheduleForm() {
      const defaults = [
        { day_of_week: "lunes", open_time: "09:00", close_time: "18:00", is_closed: false },
        { day_of_week: "martes", open_time: "09:00", close_time: "18:00", is_closed: false },
        { day_of_week: "miércoles", open_time: "09:00", close_time: "18:00", is_closed: false },
        { day_of_week: "jueves", open_time: "09:00", close_time: "18:00", is_closed: false },
        { day_of_week: "viernes", open_time: "09:00", close_time: "18:00", is_closed: false },
        { day_of_week: "sábado", open_time: "09:00", close_time: "18:00", is_closed: true },
        { day_of_week: "domingo", open_time: "09:00", close_time: "18:00", is_closed: true },
      ];
      const existing = this.company.hours ?? [];
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
