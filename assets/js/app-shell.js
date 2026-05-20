(function (global) {
  const P = {
    authLogin: "../auth/login.html",
    setup: "../setup/index.html",
    overview: "overview.html",
    dashboard: "dashboard.html",
    activity: "activity.html",
  };

  function getFindRestoreHref(email) {
    const accountEmail = email || getAccounts()[0]?.email || localStorage.getItem("user_email");
    if (!accountEmail) return P.overview;
    return `service-listing.html?account=${encodeURIComponent(accountEmail)}&service=Gmail`;
  }

  const NAV_ITEMS = [
    { id: "overview", href: P.overview, icon: "⌂", label: "Overview", desc: "Mailboxes & usage" },
    { id: "sources", href: P.dashboard, icon: "⊞", label: "Data sources", desc: "Connected accounts" },
    { id: "activity", href: P.activity, icon: "≡", label: "Activity logs", desc: "Backup history" },
  ];

  function getInitials(name, email) {
    const trimmed = (name || "").trim();
    if (trimmed.includes(" ")) {
      return trimmed.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
    }
    if (trimmed) return trimmed.slice(0, 2).toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return "U";
  }

  function getAccounts() {
    try {
      return JSON.parse(localStorage.getItem("storx_accounts") || "[]");
    } catch (_) {
      return [];
    }
  }

  function hasSetup() {
    if (localStorage.getItem("storx_setup_complete") === "true") return true;
    return getAccounts().length > 0;
  }

  function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  function isEmailConnected(email) {
    const target = normalizeEmail(email);
    return getAccounts().some((a) => normalizeEmail(a.email) === target);
  }

  function openFindRestore(email) {
    window.location.assign(getFindRestoreHref(email));
  }

  function openConnectFlow(email, sync) {
    const params = new URLSearchParams({ connect: "1", email, sync: sync || "auto" });
    window.location.href = `${P.setup}?${params.toString()}`;
  }

  function navItem(item, activeId) {
    const active = item.id === activeId ? " active" : "";
    return `<a href="${item.href}" class="nav-item${active}">
      <span class="nav-step nav-step--icon" aria-hidden="true">${item.icon}</span>
      <span class="nav-text">
        <span class="nav-label">${item.label}</span>
        <span class="nav-desc">${item.desc}</span>
      </span>
    </a>`;
  }

  function renderSidebar(activeId) {
    const el = document.querySelector("[data-storx-sidebar]");
    if (!el) return;

    const navHtml = NAV_ITEMS.map((item) => navItem(item, activeId)).join("");

    el.innerHTML = `
      <div class="brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <div>
          <strong>Storx.io</strong>
          <span class="brand-tag">Safe backup for Google</span>
        </div>
      </div>
      <nav class="nav" aria-label="Main">
        ${navHtml}
      </nav>
      <div class="sidebar-footer">
        <a href="mailto:help@storx.io" class="help-link">Need help? Contact support</a>
        <p class="user-chip">
          <span class="avatar" id="user-avatar">U</span>
          <span class="user-chip__text" id="user-display">Signed in</span>
          <button type="button" class="btn-logout" id="btn-logout">Log out</button>
        </p>
      </div>`;

    const userEmail = localStorage.getItem("user_email") || "";
    const displayName = localStorage.getItem("user_name") || userEmail.split("@")[0] || "User";
    const avatarEl = document.getElementById("user-avatar");
    const displayEl = document.getElementById("user-display");
    if (avatarEl) avatarEl.textContent = getInitials(displayName, userEmail);
    if (displayEl) {
      displayEl.textContent = userEmail ? `Signed in as ${userEmail}` : `Signed in as ${displayName}`;
    }

    document.getElementById("btn-logout")?.addEventListener("click", () => {
      localStorage.removeItem("is_authenticated");
      localStorage.removeItem("is_new_user");
      window.location.href = P.authLogin;
    });
  }

  function init(options) {
    const { active = "", requireAuth = true, requireSetup = false, breadcrumb = "" } = options || {};

    if (requireAuth && localStorage.getItem("is_authenticated") !== "true") {
      window.location.href = P.authLogin;
      return false;
    }

    if (requireSetup && !hasSetup()) {
      window.location.href = P.setup;
      return false;
    }

    renderSidebar(active);

    const crumbEl = document.getElementById("breadcrumb-current");
    if (crumbEl && breadcrumb) crumbEl.textContent = breadcrumb;

    return true;
  }

  global.StorxApp = {
    init,
    hasSetup,
    getAccounts,
    isEmailConnected,
    openConnectFlow,
    openFindRestore,
    getFindRestoreHref,
    getInitials,
    paths: P,
  };
})(window);
