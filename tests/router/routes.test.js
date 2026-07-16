import { describe, it, expect, vi } from "vitest";

// Mock all layout/page imports since they use Quasar aliases
vi.mock("layouts/MainLayout.vue", () => ({ default: {} }));
vi.mock("layouts/PageLayout.vue", () => ({ default: {} }));
vi.mock("layouts/AdminLayout.vue", () => ({ default: {} }));
vi.mock("pages/MainPage.vue", () => ({ default: {} }));
vi.mock("pages/IndexPage.vue", () => ({ default: {} }));
vi.mock("pages/AdminPage.vue", () => ({ default: {} }));
vi.mock("pages/LoginPage.vue", () => ({ default: {} }));
vi.mock("pages/NewEstablishmentPage.vue", () => ({ default: {} }));
vi.mock("pages/ForgotPasswordPage.vue", () => ({ default: {} }));
vi.mock("pages/ResetPasswordPage.vue", () => ({ default: {} }));
vi.mock("pages/ErrorNotFound.vue", () => ({ default: {} }));

import routes from "src/router/routes";

describe("router routes", () => {
  it("has all required routes defined", () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/nuevo-establecimiento");
    expect(paths).toContain("/recuperar-contrasena");
    expect(paths).toContain("/restablecer-contrasena");
    expect(paths).toContain("/:slug");
    expect(paths).toContain("/:slug/admin");
    expect(paths).toContain("/admin");
    expect(paths).toContain("/:catchAll(.*)*");
  });

  it("admin routes require authentication", () => {
    const slugAdmin = routes.find((r) => r.path === "/:slug/admin");
    const adminChild = slugAdmin.children.find((c) => c.path === "");
    expect(adminChild.meta.requiresAuth).toBe(true);

    const superAdmin = routes.find((r) => r.path === "/admin");
    const superAdminChild = superAdmin.children.find((c) => c.path === "");
    expect(superAdminChild.meta.requiresAuth).toBe(true);
  });

  it("login routes do NOT require auth", () => {
    const slugAdmin = routes.find((r) => r.path === "/:slug/admin");
    const loginChild = slugAdmin.children.find(
      (c) => c.path === "iniciar-sesion"
    );
    expect(loginChild.meta).toBeUndefined();

    const superAdmin = routes.find((r) => r.path === "/admin");
    const superLoginChild = superAdmin.children.find(
      (c) => c.path === "iniciar-sesion"
    );
    expect(superLoginChild.meta).toBeUndefined();
  });

  it("has catch-all 404 route as last entry", () => {
    const lastRoute = routes[routes.length - 1];
    expect(lastRoute.path).toBe("/:catchAll(.*)*");
  });

  it("slug admin has both main and login children", () => {
    const slugAdmin = routes.find((r) => r.path === "/:slug/admin");
    expect(slugAdmin.children).toHaveLength(2);
    expect(slugAdmin.children.map((c) => c.path)).toContain("");
    expect(slugAdmin.children.map((c) => c.path)).toContain("iniciar-sesion");
  });

  it("super admin has both main and login children", () => {
    const superAdmin = routes.find((r) => r.path === "/admin");
    expect(superAdmin.children).toHaveLength(2);
    expect(superAdmin.children.map((c) => c.path)).toContain("");
    expect(superAdmin.children.map((c) => c.path)).toContain("iniciar-sesion");
  });

  it("password recovery routes exist with children", () => {
    const forgot = routes.find((r) => r.path === "/recuperar-contrasena");
    expect(forgot).toBeDefined();
    expect(forgot.children).toHaveLength(1);

    const reset = routes.find((r) => r.path === "/restablecer-contrasena");
    expect(reset).toBeDefined();
    expect(reset.children).toHaveLength(1);
  });

  it("new establishment route exists", () => {
    const newEst = routes.find((r) => r.path === "/nuevo-establecimiento");
    expect(newEst).toBeDefined();
    expect(newEst.children).toHaveLength(1);
  });

  it("slug menu route exists", () => {
    const slug = routes.find((r) => r.path === "/:slug");
    expect(slug).toBeDefined();
    expect(slug.children).toHaveLength(1);
  });

  it("total route count is correct", () => {
    expect(routes).toHaveLength(9);
  });
});
