/**
 * Helpers de path (APP_BASE / assetUrl já são definidos no HTML inline).
 * Mantido para scripts que queiram reutilizar a API.
 */
(function (global) {
  if (typeof global.APP_BASE !== "string") {
    const path = global.location.pathname || "/";
    let base;
    if (path.includes("/admin")) {
      base = path.replace(/\/admin(?:\/.*)?$/, "/");
    } else if (/\.html?$/i.test(path)) {
      base = path.replace(/\/[^/]+$/, "/");
    } else {
      base = path.endsWith("/") ? path : path + "/";
    }
    global.APP_BASE = base;
  }

  if (typeof global.assetUrl !== "function") {
    global.assetUrl = function (path) {
      const clean = String(path || "").replace(/^\.\//, "").replace(/^\//, "");
      return global.APP_BASE + clean;
    };
  }
})(window);
