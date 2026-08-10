import { defineStore } from "pinia";
import { api } from "boot/axios";

import { useUserStore } from "./user-store";
import { useOrderStore } from "./order-store";
import { useCompanyStore } from "./company-store";
import { useMessageStore } from "./message-store";

export const useAdminStore = defineStore({
  id: "admin",
  state: () => ({
    productFormDrawer: false,
    productForm: {},
    categoryFormDrawer: false,
    categoryForm: {},
    groupFormDrawer: false,
    groupForm: {},
    groups: [],
    establishmentDrawer: false,
    scheduleDrawer: false,
    configurationDrawer: false,
    profileDrawer: false,
    addressDrawer: false,
    establishmentCategoryFormDrawer: false,
    establishmentCategories: [],
    establishmentTypeFormDrawer: false,
    establishmentTypesForm: {},
    establishmentTypes: [],
    packages: [],
    packageFormDrawer: false,
    packageForm: {},
    isExternal: true,
    isNotMyProfile: false,
    showBanners: false,
    // Add your state here
    userStore: useUserStore(),
    orderStore: useOrderStore(),
    companyStore: useCompanyStore(),
    messageStore: useMessageStore(),
    extraDrawer: false,
    extras: [],
    loading: false,
    uploadingImage: false,
    tab: "dashboard",
    orderTab: "pedidos_pendientes",
    product: null,
    slug: "",
    products: [],
    categories: [],
    qr: "",
    searchUser: "",
    // CRM
    prospects: [],
    prospectForm: {},
    prospectDrawer: false,
    activeProspect: null,
    activityDrawer: false,
    activityPrefill: null,
  }),
  getters: {
    // Add your getters here
    hideIfExternal() {
      return !this.isExternal;
    },
    user() {
      return this.userStore ?? {};
    },
    orders() {
      return this.orderStore.orders;
    },
    companyConfiguration() {
      return this.companyStore.configuration;
    },
    company() {
      return this.companyStore.company ?? {};
    },
    companies() {
      return this.companyStore.companies ?? [];
    },
    userForm() {
      return this.userStore.userForm ?? {};
    },
    addressForm() {
      return this.companyStore.addressForm;
    },
    isEstablishment() {
      return this.slug !== "";
    },
    establishments() {
      return this.companyStore.companies ?? [];
    },
    users() {
      return this.userStore.users ?? [];
    },
    usersToSearch() {
      if (this.searchUser) {
        return this.userStore.users
          .filter((user) => {
            return user.name
              .toLowerCase()
              .includes(this.searchUser.toLowerCase());
          })
          .slice(0, 8);
      }
      return this.userStore.users.slice(0, 8);
    },
  },
  actions: {
    async saveNewEstablishment() {
      if (this.loading) return;
      this.loading = true;
      try {
        const { data } = await api.post(`/admin/new-establishment`, {
          company: this.companyStore.companyForm,
          user: this.userStore.userForm,
        });
        this.messageStore.success("Establecimiento guardado");
        this.userStore.token = data.token;

        return this.userStore.router.push(`/${data.establishment.slug}/admin`);
      } catch (e) {
        console.error("Error al guardar el nuevo establecimiento", e);
        this.messageStore.error(e.response?.data?.msg ?? "Error al guardar el establecimiento");
      } finally {
        this.loading = false;
      }
    },
    addPackage() {
      this.packageForm = {
        status: "Activo",
        max_products: 0,
        max_categories: 0,
        max_orders_per_month: 0,
        max_image_improvements: 0,
        has_analytics: false,
        has_loyalty: false,
        has_reservations: false,
        has_drivers: false,
        has_online_payments: false,
        has_notifications: false,
        has_ticket_printing: false,
        has_seo: false,
        has_theme_customization: false,
        has_google_business: false,
        has_facebook: false,
      };
      this.packageFormDrawer = true;
    },
    editPackage(row) {
      this.packageForm = Object.assign({}, row);
      this.packageFormDrawer = true;
    },
    async getPackages() {

      try {
        const { data } = await api.get(`/admin/packages`);
        this.packages = data.packages;
      } catch (error) {
        this.messageStore.error("Error al obtener los paquetes");
      }
    },
    async savePackage() {
      if (this.loading) return; // evita doble envío
      this.loading = true;
      try {
        if (this.packageForm.id) {
          const { data } = await api.put(
            `/admin/packages/${this.packageForm.id}/update`,
            this.packageForm
          );
          this.packages = this.packages.map((p) =>
            p.id === data.package.id ? data.package : p
          );
          this.messageStore.success("Paquete actualizado");
        } else {
          const { data } = await api.post(`/admin/packages`, this.packageForm);
          this.packages.push(data.package);
          this.messageStore.success("Paquete guardado");
        }
        this.packageFormDrawer = false;
      } catch (error) {
        this.messageStore.error(
          error.response?.data?.message ?? "Error al guardar el paquete"
        );
      } finally {
        this.loading = false;
      }
    },
    async deletePackage(row) {
      try {
        await api.delete(`/admin/packages/${row.id}`);
        this.packages = this.packages.filter((p) => p.id !== row.id);
        this.messageStore.success("Paquete eliminado");
      } catch (error) {
        this.messageStore.error(
          error.response?.data?.message ?? "Error al eliminar el paquete"
        );
      }
    },
    addEstablishmentType() {
      this.establishmentTypeFormDrawer = true;
      this.establishmentTypesForm = {};
    },
    editEstablishmentType(type) {
      this.establishmentTypeFormDrawer = true;
      this.establishmentTypesForm = Object.assign({}, type);
    },
    deleteEstablishmentType(type) {

      api
        .delete(`/admin/establishment/types/${type.id}`)
        .then(({ data }) => {
          this.establishmentTypes = this.establishmentTypes.filter(
            (t) => t.id !== type.id
          );
          this.messageStore.success("Tipo de establecimiento eliminado");
        })
        .catch((error) => {
          this.messageStore.error(
            "Error al eliminar el tipo de establecimiento"
          );
        });
    },
    async saveEstablishType() {
      if (this.loading) return;
      this.loading = true;
      try {
        if (this.establishmentTypesForm.id) {
          const { data } = await api.put(
            `/admin/establishment/types/${this.establishmentTypesForm.id}`,
            this.establishmentTypesForm
          );
          this.establishmentTypes = this.establishmentTypes.map((type) =>
            type.id === data.type.id ? data.type : type
          );
          this.messageStore.success("Tipo de establecimiento actualizado");
        } else {
          const { data } = await api.post(
            `/admin/establishment/types`,
            this.establishmentTypesForm
          );
          this.establishmentTypes.push(data.type);
          this.messageStore.success("Tipo de establecimiento guardado");
        }
        this.establishmentTypeFormDrawer = false;
      } catch (error) {
        this.messageStore.error(
          error.response?.data?.message ?? "Error al guardar el tipo de establecimiento"
        );
      } finally {
        this.loading = false;
      }
    },
    getEstablishmentTypes() {

      api
        .get(`/admin/establishment/types/list`)
        .then(({ data }) => {
          this.establishmentTypes = data.types;
        })
        .catch((error) => {
          this.messageStore.error(
            "Error al obtener los tipos de establecimiento"
          );
        });
    },
    addEstablishmentCategory() {
      this.categoryForm = {
        status: "Activa",
      };
      this.establishmentCategoryFormDrawer = true;
    },
    deleteEstablishmentCategory(category) {

      api
        .delete(`/admin/establishment/categories/${category.id}`)
        .then(({ data }) => {
          this.establishmentCategories = this.establishmentCategories.filter(
            (c) => c.id !== category.id
          );
          this.messageStore.success("Categoría eliminada");
        })
        .catch((error) => {
          this.messageStore.error("Error al eliminar la categoría");
        });
    },
    getEstablishmentCategories() {

      api
        .get(`/admin/categories`)
        .then(({ data }) => {
          this.establishmentCategories = data.categories;
        })
        .catch((error) => {
          this.messageStore.error("Error al obtener las categorías");
        });
    },
    editEstablishmentCategory(category) {
      this.categoryForm = Object.assign({}, category);
      this.establishmentCategoryFormDrawer = true;
    },
    async saveEstablishCategory() {
      if (this.loading) return;
      this.loading = true;
      try {
        if (this.categoryForm.id) {
          const { data } = await api.put(
            `/admin/establishment/categories/${this.categoryForm.id}`,
            this.categoryForm
          );
          this.establishmentCategories = this.establishmentCategories.map(
            (category) => (category.id === data.category.id ? data.category : category)
          );
          this.messageStore.success("Categoría actualizada");
        } else {
          const { data } = await api.post(
            `/admin/establishment/categories`,
            this.categoryForm
          );
          this.establishmentCategories.push(data.category);
          this.messageStore.success("Categoría guardada");
        }
        this.establishmentCategoryFormDrawer = false;
      } catch (error) {
        this.messageStore.error(
          error.response?.data?.message ?? "Error al guardar la categoría"
        );
      } finally {
        this.loading = false;
      }
    },

    addUserToEstablishment(user, establishment) {
      const e = this.companyStore.companies.find(
        (c) => c.id === establishment.id
      );
      e.users.push(user);
      this.searchUser = "";
      this.addEstablishmentToUser(user, establishment);
    },
    downloadQr() {
      fetch(this.qr)
        .then((response) => response.blob())
        .then((blob) => {
          // Crear un objeto URL para el blob
          const blobUrl = URL.createObjectURL(blob);

          // Crear un enlace temporal
          const link = document.createElement("a");
          link.href = blobUrl;
          link.setAttribute("download", `${this.slug}-qr.png`);

          // Agregar el enlace al DOM
          document.body.appendChild(link);

          // Simular un clic para descargar la imagen
          link.click();

          // Eliminar el enlace del DOM
          document.body.removeChild(link);

          // Liberar el objeto URL creado
          URL.revokeObjectURL(blobUrl);
        })
        .catch((error) => {
          console.error("Error al descargar la imagen:", error);
        });
    },
    async getQr() {
      //Generate QR
      const url = window.location.href.replace("/admin", "");

      const data = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${url}`;

      this.qr = data;
    },
    addUser() {
      this.isNotMyProfile = true;
      this.userStore.setForm();
      this.profileDrawer = true;
    },
    editUser(user) {
      this.isNotMyProfile = true;
      this.userStore.setForm(user);
      this.profileDrawer = true;
    },
    addEstablishment() {
      this.companyStore.setCompany({});
      this.companyStore.setForm();
      this.establishmentDrawer = true;
    },
    editEstablishment(company) {
      this.companyStore.setCompany(company);
      this.companyStore.setForm();
      this.establishmentDrawer = true;
    },
    async getEstablishments() {

      try {
        const { data } = await api.get("/admin/establishments");
        this.companyStore.setCompanies(data.establishments);
      } catch (error) {
        console.error("Error al obtener los establecimientos", error);
        this.messageStore.error("Error al obtener los establecimientos");
      }
    },
    async getUsers() {

      try {
        const { data } = await api.get("/admin/users");
        this.userStore.setUsers(data.users);
      } catch (error) {
        console.error("Error al obtener los usuarios", error);
        this.messageStore.error("Error al obtener los usuarios");
      }
    },
    async getTowns() {
      try {
        const { data } = await api.get(
          `/towns/${this.addressForm.postal_code}/all`
        );
        this.addressForm.towns = data.towns;
        this.addressForm.city = data.d_ciudad;
        this.addressForm.state = data.d_estado;
        this.addressForm.country = "México";
      } catch (error) {
        this.messageStore.error("No se encontraron colonias para ese código postal");
      }
    },
    clearDrawers() {
      this.productFormDrawer = false;
      this.categoryFormDrawer = false;
      this.establishmentDrawer = false;
      this.scheduleDrawer = false;
      this.configurationDrawer = false;
      this.profileDrawer = false;
      this.addressDrawer = false;
    },
    setAddressDrawer(value) {
      this.clearDrawers();
      if (value) {
        this.companyStore.setAddressForm();
      }
      this.addressDrawer = value;
    },
    setConfigurationDrawer(value) {
      this.clearDrawers();
      this.configurationDrawer = value;
    },
    setProfileDrawer(value) {
      this.clearDrawers();
      if (value) {
        this.isNotMyProfile = false;
        this.userStore.setProfileForm();
      }
      this.profileDrawer = value;
    },
    setScheduleDrawer(value) {
      this.clearDrawers();
      if (value) {
        this.companyStore.setScheduleForm();
      }
      this.scheduleDrawer = value;
    },
    setEstablishmentDrawer(value) {
      this.clearDrawers();
      if (value) {
        this.companyStore.setForm();
      }
      this.establishmentDrawer = value;
    },
    async getMoreOrders(status) {
      return await this.orderStore.getMoreOrders(status, this.slug);
    },
    async startOrder(order) {
      const data = await this.orderStore.startOrder(order, this.slug);
      this.orderTab = "pedidos_en_preparacion";
      this.messageStore.success(data.message);
    },
    async sendOrder(order) {
      const data = await this.orderStore.sendOrder(order, this.slug);
      this.orderTab = "pedidos_enviados";
      this.messageStore.success(data.message);
    },
    async deliverOrder(order) {
      const data = await this.orderStore.deliverOrder(order, this.slug);
      this.orderTab = "pedidos_entregados";
      this.messageStore.success(data.message);
    },
    async cancelOrder(order) {
      const data = await this.orderStore.cancelOrder(order, this.slug);
      this.orderTab = "pedidos_cancelados";
      this.messageStore.success(data.message);
    },
    async getOrders(status) {
      this.orderStore.getOrders(this.slug, status);
    },
    async uploadDishImage(image) {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("type", "dish");
      this.uploadingImage = true;
      try {
        const { data } = await api.post(
          `/admin/${this.slug}/uploadImage`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        this.productForm.photo = data.ruta;
      } catch (error) {
        // Limpiar el preview base64 para no enviarlo al backend (rompe la columna photo)
        this.productForm.photo = "";
        this.messageStore.error("Error al subir la imagen. Inténtalo de nuevo.");
        console.error("Error al subir la imagen", error);
      } finally {
        this.uploadingImage = false;
      }
    },
    async uploadEstablishmentImage(image) {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("type", "company");
      this.uploadingImage = true;
      try {
        const { data } = await api.post(
          `/admin/${this.slug}/uploadImage`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        this.companyStore.companyForm.logo = data.ruta;
      } catch (error) {
        // Limpiar el preview base64 para no enviarlo al backend
        this.companyStore.companyForm.logo = "";
        this.messageStore.error("Error al subir la imagen. Inténtalo de nuevo.");
      } finally {
        this.uploadingImage = false;
      }
    },
    async deleteProduct(product) {

      try {
        const { data } = await api.delete(`/admin/${this.slug}/${product.id}`);
        this.products = this.products.filter((p) => p.id !== product.id);
        this.messageStore.success("Platillo eliminado");
      } catch (error) {
        this.messageStore.error("Error al eliminar el platillo");
      }
    },
    async addEstablishmentToUser(user, establishment) {

      try {
        const { data } = await api.post(
          `/admin/${user.id}/establishment/${establishment.id}`
        );
        this.messageStore.success("Establecimiento agregado");
      } catch (error) {
        this.messageStore.error("Error al agregar el establecimiento");
      }
    },
    async removeUserFromEstablishment(user, establishment) {
      const e = this.companyStore.companies.find(
        (c) => c.id === establishment.id
      );
      e.users = e.users.filter((u) => u.id !== user.id);

      try {
        const { data } = await api.delete(
          `/admin/${user.id}/establishment/${establishment.id}`
        );
        this.messageStore.success("Usuario removido");
      } catch (error) {
        this.messageStore.error("Error al eliminar el establecimiento");
      }
    },
    async deleteEstablishment(establishment) {
      try {
        await api.delete(`/admin/establishments/${establishment.id}`);
        this.companyStore.companies = this.companyStore.companies.filter((e) => e.id !== establishment.id);
        this.messageStore.success("Establecimiento eliminado");
      } catch (error) {
        this.messageStore.error(
          error.response?.data?.message ?? "Error al eliminar establecimiento"
        );
      }
    },
    async deleteUser(user) {
      try {
        await api.delete(`/admin/users/${user.id}`);
        this.userStore.users = this.userStore.users.filter((u) => u.id !== user.id);
        this.messageStore.success("Usuario eliminado");
      } catch (error) {
        this.messageStore.error(
          error.response?.data?.message ?? "Error al eliminar usuario"
        );
      }
    },
    async deleteEstablishmentFromUser(user, establishment) {

      try {
        const { data } = await api.delete(
          `/admin/${user.id}/establishment/${establishment.id}`
        );
        this.messageStore.success("Establecimiento eliminado");
      } catch (error) {
        this.messageStore.error("Error al eliminar el establecimiento");
      }
    },
    async saveAddress() {

      try {
        this.loading = true;
        const { data } = await api.put(
          `/admin/${this.slug}/address`,
          this.addressForm
        );
        this.companyStore.setCompany(data.establishment);
        this.messageStore.success("Dirección actualizada");
        this.addressDrawer = false;
      } catch (err) {
        this.checkErrorFields(err.response);
      } finally {
        this.loading = false;
      }
    },
    async saveProfile() {

      try {
        this.loading = true;
        if (this.userForm.id) {
          const { data } = await api.put(
            `/admin/${this.slug ? this.slug : "admin"}/profile/${
              this.userForm.id
            }`,
            this.userForm
          );
          if (!this.isNotMyProfile) {
            this.userStore.user = data.user;
          } else {
            this.userStore.users = this.userStore.users.map((u) => {
              if (u.id === data.user.id) {
                return data.user;
              }
              return u;
            });
          }

          this.messageStore.success("Perfil actualizado");
        } else {
          const { data } = await api.post(`/admin/profile`, this.userForm);
          this.userStore.addUser(data.user);
        }
      } catch (err) {
        this.checkErrorFields(err.response);
        this.messageStore.error("Error al actualizar el perfil");
      } finally {
        this.loading = false;
      }
    },
    async getEstablishmentsByUser(user) {

      try {
        const { data } = await api.get(`/admin/${user.id}/establishments`);
        return data.establishments;
      } catch (error) {
        console.error("Error al obtener los establecimientos", error);
        this.messageStore.error("Error al obtener los establecimientos");
      }
    },
    checkErrorFields(response) {
      if (response?.status === 422) {
        const errors = response.data?.errors;
        if (errors) {
          Object.keys(errors).forEach((key) => {
            this.messageStore.error(errors[key][0]);
          });
        }
      }
    },
    async saveSchedule() {

      try {
        this.loading = true;
        const { data } = await api.put(
          `/admin/establishment/${this.slug}/schedule`,
          {
            hours: this.companyStore.scheduleForm,
          }
        );
        const savedHours = data.hours || data.post || this.companyStore.scheduleForm;
        this.companyStore.companyForm.hours = savedHours;
        this.companyStore.company.hours = savedHours;
        this.messageStore.success("Horarios actualizados");
      } catch (err) {
        this.messageStore.error("Error al actualizar los horarios");
      } finally {
        this.loading = false;
      }
    },

    async saveProduct() {
      if (this.uploadingImage) {
        this.messageStore.error("Espera a que termine de subir la imagen");
        return false;
      }
      if (this.productForm.photo && !/^https?:\/\//i.test(this.productForm.photo)) {
        this.messageStore.error("La imagen no se subió correctamente. Vuelve a seleccionarla.");
        return false;
      }
      if (!this.productForm.name) {
        this.messageStore.error("El nombre es obligatorio");
        return false;
      }
      if (!this.productForm.dish_category?.id) {
        this.messageStore.error("La categoría es obligatoria");
        return false;
      }
      // Precio: 0 es válido (productos de cortesía). Solo se rechaza vacío o negativo.
      if (
        this.productForm.price === "" ||
        this.productForm.price === null ||
        this.productForm.price === undefined ||
        Number(this.productForm.price) < 0
      ) {
        this.messageStore.error("El precio es obligatorio (0 o mayor)");
        return false;
      }
      if (!this.productForm.description) {
        this.messageStore.error("La descripción es obligatoria");
        return false;
      }

      // Evita doble/triple envío: si ya se está guardando, no vuelve a disparar.
      if (this.loading) return false;

      try {
        this.loading = true;
        if (this.productForm.id) {
          const { data } = await api.put(
            `/admin/${this.slug}/${this.productForm.id}`,
            this.productForm
          );
          this.products = this.products.map((product) => {
            if (parseInt(product.id) === parseInt(data.product.id)) {
              return data.product;
            }
            return product;
          });
          this.messageStore.success("Platillo actualizado");
        } else {
          const { data } = await api.post(
            `/admin/${this.slug}/dish`,
            this.productForm
          );
          this.products.push(data.product);
          this.messageStore.success("Platillo guardado");
        }
        this.productFormDrawer = false;
      } catch (error) {
        this.messageStore.error(
          error.response?.data?.message ?? "Error al guardar el platillo"
        );
      } finally {
        this.loading = false;
      }
    },
    async cloneProduct(product) {
      if (this.loading) return;
      this.loading = true;
      try {
        const { data } = await api.post(`/admin/${this.slug}/dish/clone`, {
          id: product.id,
        });
        this.products.push(data.product);
        this.messageStore.success("Platillo clonado");
      } catch (error) {
        this.messageStore.error("Error al clonar el platillo");
      } finally {
        this.loading = false;
      }
    },
    async toggleFeatured(product) {
      try {
        const { data } = await api.put(
          `/admin/${this.slug}/${product.id}/featured`
        );
        this.products = this.products.map((p) => {
          if (p.id === product.id) {
            return { ...p, is_featured: data.is_featured };
          }
          return p;
        });
        this.messageStore.success(
          data.is_featured ? "Platillo destacado" : "Platillo sin destacar"
        );
      } catch (error) {
        this.messageStore.error("Error al actualizar el platillo");
      }
    },
    async downloadMenuPdf() {
      const { data } = await api.get(`/admin/${this.slug}/menu-pdf`, {
        responseType: "blob",
      });
      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${this.slug}-menu.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    },
    async bulkDishAction(ids, action) {
      if (!ids || !ids.length) return;
      try {
        this.loading = true;
        const { data } = await api.post(`/admin/${this.slug}/dishes/bulk`, {
          ids,
          action,
        });
        const idset = new Set(ids);
        if (action === "delete") {
          this.products = this.products.filter((p) => !idset.has(p.id));
        } else {
          const patch = {
            feature: { is_featured: true },
            unfeature: { is_featured: false },
            activate: { status: "Activo" },
            deactivate: { status: "Inactivo" },
            sold_out: { is_sold_out: true },
            available: { is_sold_out: false },
          }[action];
          if (patch) {
            this.products = this.products.map((p) =>
              idset.has(p.id) ? { ...p, ...patch } : p
            );
          }
        }
        this.messageStore.success(`Acción aplicada a ${data.updated} platillo(s)`);
        return true;
      } catch (error) {
        this.messageStore.error("Error al aplicar la acción en lote");
        return false;
      } finally {
        this.loading = false;
      }
    },
    async clearAllFeatured() {
      try {
        this.loading = true;
        const { data } = await api.put(`/admin/${this.slug}/dishes/clear-featured`);
        this.products = this.products.map((p) => ({ ...p, is_featured: false }));
        this.messageStore.success(
          data.updated > 0
            ? `Se quitó el destacado a ${data.updated} platillo(s)`
            : "No había platillos destacados"
        );
      } catch (error) {
        this.messageStore.error("Error al quitar los destacados");
      } finally {
        this.loading = false;
      }
    },
    async toggleSoldOut(product) {
      try {
        const { data } = await api.put(
          `/admin/${this.slug}/${product.id}/sold-out`
        );
        this.products = this.products.map((p) => {
          if (p.id === product.id) {
            return { ...p, is_sold_out: data.is_sold_out };
          }
          return p;
        });
        this.messageStore.success(
          data.is_sold_out ? "Producto agotado" : "Producto disponible"
        );
      } catch (error) {
        this.messageStore.error("Error al actualizar el platillo");
      }
    },
    async setSpecialOffer(product, specialPrice, specialUntil) {
      if (this.loading) return;
      this.loading = true;
      try {
        const { data } = await api.put(
          `/admin/${this.slug}/${product.id}/special-offer`,
          { special_price: specialPrice || null, special_until: specialUntil || null }
        );
        this.products = this.products.map((p) => {
          if (p.id === product.id) return data.product;
          return p;
        });
        this.messageStore.success(
          specialPrice ? "Oferta especial activada" : "Oferta especial removida"
        );
      } catch (error) {
        this.messageStore.error("Error al actualizar la oferta");
      } finally {
        this.loading = false;
      }
    },
    async saveCategory() {
      if (this.loading) return; // evita doble envío y activa el loading del botón
      this.loading = true;
      if (this.categoryForm.id) {
        try {
          const { data } = await api.put(
            `/admin/${this.slug}/category/${this.categoryForm.id}`,
            this.categoryForm
          );
          this.categories = this.categories.map((category) => {
            if (category.id === data.id) {
              return data;
            }
            return category;
          });
          this.messageStore.success("Categoría actualizada");
          this.categoryFormDrawer = false;
        } catch (error) {
          this.checkErrorFields(error.response);
        } finally {
          this.loading = false;
        }
      } else {
        try {
          const { data } = await api.post(
            `/admin/${this.slug}/category`,
            this.categoryForm
          );
          this.categories.push(data.category);
          this.messageStore.success("Categoría guardada");
          this.categoryFormDrawer = false;
        } catch (error) {
          this.checkErrorFields(error.response);
        } finally {
          this.loading = false;
        }
      }
    },
    async deleteCategory(id) {

      try {
        await api.delete(`/admin/${this.slug}/category/${id}`);
        this.categories = this.categories.filter((c) => c.id !== id);
        this.messageStore.success("Categoría eliminada");
      } catch (error) {
        this.messageStore.error("Error al eliminar la categoría");
      }
    },
    editCategory(category) {
      this.categoryForm = Object.assign({}, category);
      this.categoryFormDrawer = true;
    },
    addCategory() {
      this.categoryForm = {
        status: "Activa",
      };
      this.categoryFormDrawer = true;
    },
    editGroup(group) {
      this.groupForm = Object.assign({}, group);
      this.groupFormDrawer = true;
    },
    editProduct(product) {
      this.productForm = Object.assign({}, product);
      this.productFormDrawer = true;
    },
    addProduct() {
      this.productForm = {
        status: "Activo",
      };
      this.productFormDrawer = true;
    },
    addGroup() {
      this.groupForm = {
        status: "Activo",
        items: [
          {
            name: "Item 1",
            price: "",
          },
        ],
      };

      this.groupFormDrawer = true;
    },
    addOptionGroup() {
      this.groupForm.items.push({
        name: `Item ${this.groupForm.items.length + 1}`,
        price: "",
      });
    },
    updateCategoriesOrder(newOrder) {

      api
        .post(`/admin/${this.slug}/categories/order`, { newOrder })
        .then(() => {
          this.messageStore.success("Orden Actualizado");
        })
        .catch((error) => {
          this.messageStore.error("Error al actualizar el orden");
        });
    },
    updateProductsOrder(newOrder) {

      api
        .post(`/admin/${this.slug}/dishes/order`, { newOrder })
        .then(() => {
          this.messageStore.success("Orden Actualizado");
        })
        .catch((error) => {
          this.messageStore.error("Error al actualizar el orden");
        });
    },
    saveGroup() {
      this.loading = true;
      if (this.groupForm.id) {
  
        api
          .put(`/admin/${this.slug}/group/${this.groupForm.id}`, this.groupForm)
          .then(({ data }) => {
            this.groups = this.groups.map((group) => {
              if (group.id === data.id) {
                return data;
              }
              return group;
            });
            this.messageStore.success("Grupo actualizado");
          })
          .catch((error) => {
            this.messageStore.error("Error al actualizar el grupo");
          })
          .finally(() => {
            this.loading = false;
            this.groupFormDrawer = false;
          });
      } else {
  
        api
          .post(`/admin/${this.slug}/group`, this.groupForm)
          .then(({ data }) => {
            this.groups.push(data);
            this.messageStore.success("Grupo guardado");
          })
          .catch((error) => {
            this.messageStore.error("Error al guardar el grupo");
          })
          .finally(() => {
            this.loading = false;
            this.groupFormDrawer = false;
          });
      }
    },
    async deleteGroup(group) {

      try {
        const { data } = await api.delete(
          `/admin/${this.slug}/group/${group.id}`
        );
        this.groups = this.groups.filter((p) => p.id !== group.id);
        this.messageStore.success("Extra eliminado");
      } catch (error) {
        this.messageStore.error("Error al eliminar el extra");
      }
    },
    // Add your actions here
    setSlug(slug) {
      this.slug = slug;
      if (!slug) {
        this.tab = "inicio";
      } else {
        this.tab = "dashboard";
      }
    },
    async saveConfiguration() {
      this.loading = true;

      try {
        const { data } = await api.put(
          `/admin/${this.slug}/configuration`,
          this.companyConfiguration
        );
        //this.companyStore.setConfiguration(data.configuration);
        this.messageStore.success("Configuración actualizada");
      } catch (error) {
        this.messageStore.error("Error al actualizar la configuración");
      } finally {
        this.loading = false;
      }
    },
    async improveImage() {
      if (!this.productForm.id) {
        this.messageStore.error("Guarda el producto antes de mejorar su imagen");
        return false;
      }
      try {
        this.loading = true;
        const { data } = await api.post(
          `/admin/${this.slug}/${this.productForm.id}/improve/image`
        );
        this.messageStore.success("Imagen mejorada");
        this.productForm.photo = data.image;
        return true;
      } catch (error) {
        this.messageStore.error("Error al mejorar la imagen");
        return false;
      } finally {
        this.loading = false;
      }
    },
    async removeExtraOption(extra, optionIndex) {
      const option = extra.options.splice(optionIndex, 1)[0];
      if (option.id) {

        try {
          this.loading = true;
          const { data } = await api.delete(
            `/admin/${this.slug}/${this.product.id}/extras/${extra.id}/option/${option.id}`
          );
          this.syncProductExtras(null, extra.id, option.id);
          this.messageStore.success("Opción eliminada");
        } catch (error) {
          this.messageStore.error("Error al eliminar la opción");
        } finally {
          this.loading = false;
        }
      } else {
        this.messageStore.success("Opción eliminada");
      }
    },
    async removeExtra(index) {
      const extra = this.extras.splice(index, 1)[0];
      if (extra.id) {

        try {
          const { data } = await api.delete(
            `/admin/${this.slug}/${this.product.id}/extras/${extra.id}`
          );
          this.syncProductExtras(extra.id);
          this.messageStore.success("Extra eliminado");
        } catch (error) {
          console.error("Error al eliminar el extra", error);
          this.messageStore.error("Error al eliminar el extra");
        } finally {
          this.loading = false;
        }
      } else {
        this.messageStore.success("Extra eliminado");
      }
    },
    // Mantiene sincronizado el estado en memoria del producto (this.product y
    // this.products) tras borrar un extra/opción, para que al reabrir el drawer
    // no reaparezca lo borrado.
    syncProductExtras(deletedExtraId = null, extraId = null, deletedOptionId = null) {
      if (!this.product?.extras) return;

      if (deletedExtraId) {
        this.product.extras = this.product.extras.filter(
          (e) => e.id !== deletedExtraId
        );
      } else if (extraId && deletedOptionId) {
        const target = this.product.extras.find((e) => e.id === extraId);
        if (target?.options) {
          target.options = target.options.filter(
            (o) => o.id !== deletedOptionId
          );
        }
      }

      this.products = this.products.map((p) =>
        p.id === this.product.id ? { ...p, extras: this.product.extras } : p
      );
    },
    async saveExtras() {

      try {
        this.loading = true;
        const { data } = await api.post(
          `/admin/${this.slug}/${this.product.id}/extras`,
          {
            extras: this.extras,
          }
        );
        this.extraProduct(data.product);
        this.products = this.products.map((product) => {
          if (product.id === data.product.id) {
            return data.product;
          }
          return product;
        });
        this.messageStore.success("Extras actualizados");
      } catch (error) {
        this.messageStore.error("Error al actualizar los extras");
      } finally {
        this.loading = false;
      }
    },
    async saveEstablishment() {
      if (this.uploadingImage) {
        this.messageStore.error("Espera a que termine de subir la imagen");
        return false;
      }
      const logo = this.companyStore.companyForm.logo;
      if (logo && !/^https?:\/\//i.test(logo)) {
        this.messageStore.error("El logo no se subió correctamente. Vuelve a seleccionarlo.");
        return false;
      }

      let slug = this.slug;
      if (!slug) {
        slug = this.companyStore.companyForm.slug;
      }

      try {
        this.loading = true;
        if (!slug) {
          const { data } = await api.post(
            "/admin/establishment",
            this.companyStore.companyForm
          );
          this.companyStore.setCompany(data.establishment);
          this.companyStore.addCompany(data.establishment);
          this.messageStore.success("Establecimiento guardado");
        } else {
          const form = { ...this.companyStore.companyForm };
          form.delivery_charge = parseFloat(form.delivery_charge) || 0;
          const { data } = await api.put(
            `/admin/establishment/${slug}`,
            form
          );
          this.companyStore.setCompany(data.establishment ?? form);
          this.messageStore.success("Establecimiento actualizado");
          if (this.slug !== (data.establishment?.slug ?? form.slug)) {
            this.slug = data.establishment?.slug ?? form.slug;
            this.userStore.router.push(`/${this.slug}/admin`);
          }
        }
        this.establishmentDrawer = false;
      } catch (err) {
        this.checkErrorFields(err.response);
      } finally {
        this.loading = false;
      }
    },
    hasService(service) {
      return this.companyConfiguration.features.find((f) => f.id === service)
        ?.value;
    },
    async getEstablishment() {
      this.showBanners = false;
      if (!this.slug) {
        this.companyStore.setCompany({});
        return;
      }


      try {
        const { data } = await api.get(`/admin/establishment/${this.slug}`);
        this.products = data.establishment.dishes ?? [];
        this.categories = data.establishment.categories ?? [];
        this.groups = data.establishment.groups ?? [];

        data.establishment.dishes = null;
        data.establishment.categories = null;
        data.establishment.groups = null;

        this.companyStore.setCompany(data.establishment);
        this.companyStore.setCategories(data.categories);
        this.companyStore.setFeatures(data.features);
        this.companyStore.setTypes(data.types);
        this.orderStore.setCounts(data.counts);
        this.showBanners = true;
      } catch (e) {
        console.error("Error al obtener el establecimiento", e);
        this.messageStore.error(
          "Error al obtener el establecimiento, Verifica tu conexión a internet"
        );
      } finally {
        this.loading = false;
      }
    },
    addGroupToProduct(group) {
      this.extras = this.extras || [];
      this.extras.push({
        name: group.name,
        is_required: 0,
        qty: 1,
        options: group.items.map((item) => {
          return {
            name: item.name,
            price: item.price,
          };
        }),
      });
    },
    addExtra() {
      this.extras = this.extras || [];
      this.extras.push({
        name: "",
        qty: 1,
        is_required: 0,
        selection_type: "radio",
        price_mode: "add",
        options: [
          {
            name: "",
            price: "",
          },
        ],
      });
    },
    addOption(extra) {
      if (!extra.options) {
        extra.options = [];
      }
      extra.options.push({
        name: "",
        price: 0,
      });
    },
    extraProduct(product) {
      this.product = product;
      this.extraDrawer = true;
      if (product.extras.length > 0) {
        this.extras = [...product.extras].sort((a, b) => a.order - b.order);
      } else {
        this.extras = [
          {
            name: "Opciones",
            is_required: 0,
            qty: 1,
            selection_type: "radio",
            // "add" y no "replace": la opción base va en $0 y las demás llevan la
            // diferencia. Es la forma correcta de configurar variantes.
            price_mode: "add",
            options: [
              {
                name: "Base",
                price: 0,
              },
            ],
          },
        ];
      }
    },
    getOrderCounts(order_status) {
      return this.orderStore.counts[order_status] ?? 0;
    },

    // --- CRM Prospects ---
    addProspect() {
      this.prospectForm = { source: "otro" };
      this.prospectDrawer = true;
    },
    editProspect(prospect) {
      this.prospectForm = Object.assign({}, prospect);
      this.prospectDrawer = true;
    },
    async getProspects() {
      try {
        const { data } = await api.get("/admin/prospects");
        this.prospects = data.prospects?.data ?? data.prospects ?? [];
      } catch (e) {
        this.messageStore.error("Error al obtener prospectos");
      }
    },
    async saveProspect() {
      if (this.loading) return;
      this.loading = true;
      try {
        if (this.prospectForm.id) {
          const { data } = await api.put(`/admin/prospects/${this.prospectForm.id}`, this.prospectForm);
          this.prospects = this.prospects.map((p) => p.id === data.prospect.id ? data.prospect : p);
          this.messageStore.success("Prospecto actualizado");
        } else {
          const { data } = await api.post("/admin/prospects", this.prospectForm);
          this.prospects.unshift(data.prospect);
          this.messageStore.success("Prospecto creado");
        }
        this.prospectDrawer = false;
      } catch (e) {
        this.messageStore.error(e.response?.data?.message ?? "Error al guardar prospecto");
      } finally {
        this.loading = false;
      }
    },
    async deleteProspect(prospect) {
      try {
        await api.delete(`/admin/prospects/${prospect.id}`);
        this.prospects = this.prospects.filter((p) => p.id !== prospect.id);
        this.messageStore.success("Prospecto eliminado");
      } catch (e) {
        this.messageStore.error("Error al eliminar prospecto");
      }
    },

    logout() {
      this.userStore.logout();
    },
  },
});
