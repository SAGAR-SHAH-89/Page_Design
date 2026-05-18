(function () {
  const views = document.querySelectorAll(".view");
  const navItems = document.querySelectorAll(".nav-item");
  const toast = document.getElementById("toast");
  const setupProgress = document.getElementById("setup-progress");
  const setupProgressFill = document.getElementById("setup-progress-fill");
  const setupProgressLabel = document.getElementById("setup-progress-label");

  const setupSteps = {
    onboarding: { num: 1, pct: 50, label: "Step 1 of 2 — Connect your account" },
    "data-sources": { num: 2, pct: 100, label: "Step 2 of 2 — Connect your data sources" },
    "service-listing": { num: 2, pct: 100, label: "Step 2 of 2 — Sync your data" }
  };

  const setupViews = new Set(["onboarding", "data-sources", "service-listing"]);
  let toastTimer;

  const isLoggedIn = localStorage.getItem("is_logged_in") === "true";
  let refreshDataSources = () => { };

  function showView(name) {
    views.forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
    navItems.forEach((n) => {
      // When viewing a service listing, keep the 'data-sources' nav item active.
      const viewToMatch = name === 'service-listing' ? 'data-sources' : name;
      n.classList.toggle("active", n.dataset.view === viewToMatch);
    });

    // Hide the sidebar completely when on the login or landing page
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.style.display = (name === "login" || name === "landing" || name === "signup") ? "none" : "";
    }

    updateSetupProgress(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.showView = showView; // Make globally accessible for inline handlers

  function updateSetupProgress(viewName) {
    if (!setupProgress || !setupProgressFill || !setupProgressLabel) return;

    if (isLoggedIn) {
      setupProgress.hidden = true;
      setupProgress.style.display = "none";
      return;
    }

    if (viewName === "dashboard") {
      setupProgress.hidden = false;
      setupProgress.classList.add("is-complete");
      setupProgressFill.style.width = "100%";
      setupProgressLabel.textContent = "Setup complete — you’re all set!";
      return;
    }

    if (!setupViews.has(viewName)) {
      setupProgress.hidden = true;
      setupProgress.style.display = "none";
      return;
    }

    setupProgress.hidden = false;
    setupProgress.style.display = "";
    setupProgress.classList.remove("is-complete");
    const step = setupSteps[viewName];
    if (step) {
      setupProgressFill.style.width = `${step.pct}%`;
      setupProgressLabel.textContent = step.label;
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 4000);
  }

  window.showToast = showToast; // Expose globally for inline preview buttons

  window.selectCorpUser = function (email) {
    document.getElementById("corp-users-modal").classList.add("hidden");
    showToast("Opening Google setup for your organization…");

    localStorage.setItem("account_type", "workspace");
    localStorage.setItem("user_email", email);

    let connectedAccounts = [{
      providerName: "Google Workspace",
      logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
      email: email,
      status: "Active",
      services: ["Google Mail", "Google Drive", "Google Photos", "Google Contacts"].map(s => ({ name: s, active: true }))
    }];
    localStorage.setItem("storx_accounts", JSON.stringify(connectedAccounts));

    if (window.refreshConnectedAccounts) window.refreshConnectedAccounts();

    setTimeout(() => window.openServiceListing(email, "Google Mail"), 700);
  };

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const next = btn.dataset.next;
      const account = btn.dataset.account;

      if (account === "personal") {
        showToast("Opening Google sign-in…");
      } else if (account === "microsoft") {
        showToast("Opening Microsoft sign-in…");
      }
      if (account === "personal" || account === "microsoft") {
        localStorage.setItem("account_type", account);
        const mockEmail = account === "microsoft" ? "admin@microsoft.com" : "user@gmail.com";
        localStorage.setItem("user_email", mockEmail);

        // Auto-connect a mock account based on the onboarding path selected
        let connectedAccounts = [];
        if (account === "personal") {
          connectedAccounts.push({
            providerName: "Google Workspace",
            logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
            email: mockEmail,
            status: "Active",
            services: ["Google Mail", "Google Drive", "Google Photos", "Google Contacts"].map(s => ({ name: s, active: true }))
          });
        } else if (account === "microsoft") {
          connectedAccounts.push({
            providerName: "Microsoft 365",
            logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
            email: mockEmail,
            status: "Active",
            services: ["Outlook Exchange", "OneDrive", "SharePoint", "Microsoft Teams"].map(s => ({ name: s, active: true }))
          });
        }
        localStorage.setItem("storx_accounts", JSON.stringify(connectedAccounts));

        if (window.refreshConnectedAccounts) window.refreshConnectedAccounts();

        const delay = 700;
        if (account === "personal") {
          setTimeout(() => window.openServiceListing(mockEmail, "Google Mail"), delay);
        } else if (account === "microsoft") {
          setTimeout(() => window.openServiceListing(mockEmail, "Outlook Exchange"), delay);
        }

        return; // Skip standard routing to avoid flash/reload
      }

      refreshDataSources(); // Update the provider cards dynamically without a page refresh

      const delay = account ? 700 : 0;
      if (next === 'open-service-modal') {
        setTimeout(() => {
          const modal = document.getElementById("add-service-modal");
          if (modal) modal.classList.remove("hidden");
        }, delay);
      } else {
        setTimeout(() => showView(next), delay);
      }
    });
  });

  document.querySelectorAll(".brand, #view-login .brand-mark, #view-signup .brand-mark").forEach((logo) => {
    logo.style.cursor = "pointer";
    logo.addEventListener("click", () => {
      if (isLoggedIn) {
        const connectedAccounts = JSON.parse(localStorage.getItem("storx_accounts")) || [];
        showView(connectedAccounts.length === 0 ? "data-sources" : "dashboard");
      } else {
        showView("landing");
      }
    });
  });

  document.querySelectorAll(".service-card input").forEach((input) => {
    input.addEventListener("change", () => {
      input.closest(".service-card").classList.toggle("on", input.checked);
    });
  });

  document.getElementById("btn-finish-setup")?.addEventListener("click", () => {
    showToast("You’re all set! Backups will run automatically.");
  });

  document.getElementById("help-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    showToast("Support: help@storx.io — we typically reply within one business day.");
  });

  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevents the page from doing a standard form POST
    localStorage.setItem("is_logged_in", "true");

    const email = document.getElementById("login-email")?.value.toLowerCase() || "";
    // A simple mock logic to determine account type for demo purposes
    const accountType = email.includes("microsoft") || email.includes("outlook") || email.includes("hotmail") ? "microsoft" : "workspace";
    localStorage.setItem("account_type", accountType);
    localStorage.setItem("user_email", email);

    window.location.hash = ""; // Clean up the URL
    showToast("Logged in successfully!");
    setTimeout(() => {
      window.location.reload();
    }, 800);
  });

  document.getElementById("signup-form")?.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevents the page from doing a standard form POST
    showToast("Account created! Let's get you set up.");
    setTimeout(() => showView("onboarding"), 800);
  });

  document.getElementById("btn-logout")?.addEventListener("click", () => {
    localStorage.removeItem("is_logged_in");
    localStorage.removeItem("storx_accounts");
    localStorage.removeItem("selected_storage_location");
    localStorage.removeItem("account_type");
    localStorage.removeItem("user_email");
    window.location.hash = "";
    window.location.reload();
  });

  // --- DATA SOURCES INTEGRATION ---
  function initDataSources() {
    const startupView = document.getElementById("startup-view");
    const accountsListView = document.getElementById("accounts-list-view");
    const tableBody = document.getElementById("accounts-table-body");

    const dsPageTitle = document.getElementById("ds-page-title");
    const dsPageSubtitle = document.getElementById("ds-page-subtitle");
    const dsHeaderActions = document.getElementById("ds-header-actions");

    const modal = document.getElementById("add-service-modal");
    const btnAddService = document.getElementById("btn-add-service");
    const btnCloseModal = document.getElementById("close-modal");

    if (!startupView) return; // Exit if HTML snippet isn't present

    let connectedAccounts = JSON.parse(localStorage.getItem("storx_accounts")) || [];

    // Onboarding flow checks
    if (localStorage.getItem("is_new_user") === "true") {
      const onboardingModal = document.getElementById("onboarding-modal");
      if (onboardingModal) onboardingModal.classList.remove("hidden");
      document.getElementById("btn-start-onboarding")?.addEventListener("click", () => {
        onboardingModal.classList.add("hidden");
        localStorage.removeItem("is_new_user");
        modal?.classList.remove("hidden"); // Go straight to service selection
      });
    }

    // Data Source Configuration
    const serviceProviders = [
      // {
      //   id: "google",
      //   name: "Google Workspace",
      //   logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
      //   btnClass: "google-btn",
      //   btnText: "Sign in with Google",
      //   mockEmail: "admin@company.com",
      //   servicesList: ["Google Mail", "Google Drive", "Google Photos", "Google Contacts"],
      //   brandHTML: `
      //     <div style="color: #4285f4; font-size: 1.8rem; font-weight: 500; line-height: 1;">
      //         <span style="color:#4285f4">G</span><span style="color:#ea4335">o</span><span style="color:#fbbc05">o</span><span style="color:#4285f4">g</span><span style="color:#34a853">l</span><span style="color:#ea4335">e</span>
      //     </div>
      //     <span style="color: #757575; font-size: 1.1rem; font-weight: 300; margin-top: 4px;">Workspace</span>
      //   `
      // },
      {
        id: "gmail",
        name: "Google Mail",
        logo: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
        btnClass: "google-btn",
        btnText: "Sign in with Google",
        mockEmail: "personal@gmail.com",
        servicesList: ["Google Mail"],
        brandHTML: `
          <div style="display: flex; align-items: center; gap: 10px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" height="28" alt="Gmail">
              <span style="font-size: 1.3rem; color: #4a5568;">Google Mail</span>
          </div>
        `
      },
      {
        id: "gdrive",
        name: "Google Drive",
        logo: "https://api.iconify.design/logos/google-drive.svg",
        btnClass: "google-btn",
        btnText: "Sign in with Google",
        mockEmail: "personal@gmail.com",
        servicesList: ["Google Drive"],
        brandHTML: `
          <div style="display: flex; align-items: center; gap: 10px;">
              <img src="https://api.iconify.design/logos/google-drive.svg" height="28" alt="Google Drive">
              <span style="font-size: 1.3rem; color: #4a5568;">Google Drive</span>
          </div>
        `
      },
      {
        id: "gphotos",
        name: "Google Photos",
        logo: "https://api.iconify.design/logos/google-photos.svg",
        btnClass: "google-btn",
        btnText: "Sign in with Google",
        mockEmail: "personal@gmail.com",
        servicesList: ["Google Photos"],
        brandHTML: `
          <div style="display: flex; align-items: center; gap: 10px;">
              <img src="https://api.iconify.design/logos/google-photos.svg" height="28" alt="Google Photos">
              <span style="font-size: 1.3rem; color: #4a5568;">Google Photos</span>
          </div>
        `
      },
      {
        id: "microsoft",
        name: "Microsoft 365",
        logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
        btnClass: "ms-btn",
        btnText: "Sign in with Microsoft",
        mockEmail: "it-admin@company.onmicrosoft.com",
        servicesList: ["Outlook Exchange", "OneDrive", "SharePoint", "Microsoft Teams"],
        brandHTML: `
          <div style="display: flex; align-items: center; gap: 10px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" height="24" alt="MS">
              <span style="font-size: 1.3rem; color: #4a5568;">Microsoft 365</span>
          </div>
        `
      },
      {
        id: "local",
        name: "Local Device",
        logo: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNGE1NTY4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIyIDEySDIiPjwvcGF0aD48cGF0aCBkPSJNNS40NSA1LjExTDIgMTJ2NmEyIDIgMCAwIDAgMiAyaDE2YTIgMiAwIDAgMCAyLTJ2LTZsLTMuNDUtNi44OUEyIDIgMCAwIDAgMTYuNzYgNEg3LjI0YTIgMiAwIDAgMC0xLjc5IDEuMTF6Ij48L3BhdGg+PGxpbmUgeDE9IjYiIHkxPSIxNiIgeDI9IjYuMDEiIHkyPSIxNiI+PC9saW5lPjxsaW5lIHgxPSIxMCIgeTE9IjE2IiB4Mj0iMTAuMDEiIHkyPSIxNiI+PC9saW5lPjwvc3ZnPg==",
        btnClass: "ms-btn",
        btnText: "Connect Local Device",
        mockEmail: "admin@local-machine.dev",
        servicesList: ["Documents", "Desktop", "Downloads", "Pictures"],
        brandHTML: `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12H2"></path><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line></svg>
              <span style="font-size: 1.2rem; color: #4a5568; font-weight: 500;">Local Data</span>
          </div>
        `
      }
    ];

    refreshDataSources = function () {
      // Show all providers, not just the one matching the initial account type.
      const availableProviders = serviceProviders;
      function renderCards(containerId, isModal = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = availableProviders.map(sp => `
          <div class="source-card">
              <div class="brand-text">${sp.brandHTML}</div>
              <div class="btn-wrapper ${sp.btnClass}" onclick="handleAuth('${sp.id}', this, ${isModal})">
                  <div class="btn-icon-box"><img src="${sp.logo}" alt="${sp.name}"></div>
                  <button class="btn-label">${sp.btnText}</button>
              </div>
          </div>
        `).join("");
      }

      renderCards("startup-cards-container", false);
      renderCards("modal-cards-container", true);
    };

    refreshDataSources(); // Render cards initially

    window.refreshConnectedAccounts = function () {
      connectedAccounts = JSON.parse(localStorage.getItem("storx_accounts")) || [];
      if (connectedAccounts.length > 0) {
        startupView.classList.add("hidden");
        accountsListView.classList.remove("hidden");
        if (dsPageTitle) dsPageTitle.innerText = "Connected Accounts";
        if (dsPageSubtitle) dsPageSubtitle.innerText = "Manage your authorized service providers.";
        if (dsHeaderActions) dsHeaderActions.classList.remove("hidden");
        renderAccountsList();
      }
    };

    if (connectedAccounts.length > 0) {
      startupView.classList.add("hidden");
      accountsListView.classList.remove("hidden");
      if (dsPageTitle) dsPageTitle.innerText = "Connected Accounts";
      if (dsPageSubtitle) dsPageSubtitle.innerText = "Manage your authorized service providers.";
      if (dsHeaderActions) dsHeaderActions.classList.remove("hidden");
      renderAccountsList();
    }

    window.handleAuth = function (providerId, btnElement, isFromModal) {
      const provider = serviceProviders.find(p => p.id === providerId);
      const btnLabel = btnElement.querySelector(".btn-label");
      const originalText = btnLabel.innerText;

      btnElement.style.pointerEvents = "none";
      btnElement.style.opacity = "0.7";
      btnLabel.innerText = "Authenticating...";

      setTimeout(() => {
        btnElement.style.pointerEvents = "auto";
        btnElement.style.opacity = "1";
        btnLabel.innerText = originalText;

        const newAccount = {
          providerName: provider.name,
          logo: provider.logo,
          email: provider.mockEmail.replace("@", `${connectedAccounts.length}@`),
          status: "Active",
          services: provider.servicesList.map(s => ({ name: s, active: true }))
        };
        connectedAccounts.push(newAccount);

        localStorage.setItem("storx_accounts", JSON.stringify(connectedAccounts));

        if (isFromModal) modal.classList.add("hidden");

        // Always update the data sources view in the background
        startupView.classList.add("hidden");
        accountsListView.classList.remove("hidden");
        if (dsPageTitle) dsPageTitle.innerText = "Connected Accounts";
        if (dsPageSubtitle) dsPageSubtitle.innerText = "Manage your authorized service providers.";
        if (dsHeaderActions) dsHeaderActions.classList.remove("hidden");
        renderAccountsList();
        showToast(`Successfully linked ${provider.name}!`);

        // Route to the correct page
        if (provider.id === 'gmail' || provider.id === 'gdrive' || provider.id === 'gphotos') {
          const serviceName = newAccount.services[0].name;
          window.openServiceListing(newAccount.email, serviceName);
        } else {
          // For other providers, just show the updated data sources list
          showView("data-sources");
        }
      }, 1200);
    };

    function getServiceIcon(serviceName) {
      const nameLower = serviceName.toLowerCase();
      if (nameLower.includes('mail') || nameLower.includes('outlook')) return '✉️';
      if (nameLower.includes('drive') || nameLower.includes('onedrive') || nameLower.includes('sharepoint')) return '📁';
      if (nameLower.includes('photo') || nameLower.includes('picture')) return '🖼️';
      if (nameLower.includes('contact')) return '📇';
      if (nameLower.includes('team')) return '💬';
      if (nameLower.includes('document')) return '📄';
      if (nameLower.includes('desktop')) return '🖥️';
      if (nameLower.includes('download')) return '⬇️';
      return '📦';
    }

    function renderRecentActivity() {
      const tbody = document.getElementById("recent-activity-tbody");
      const activityTbody = document.getElementById("activity-page-tbody");
      const alertEmail = document.getElementById("alert-email");

      // Update dashboard alert dynamically to match the first connected account
      if (connectedAccounts.length > 0 && alertEmail) {
        alertEmail.textContent = `Account: ${connectedAccounts[0].email} · 412 files in about 8 minutes`;
      }

      if (connectedAccounts.length === 0) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 1.5rem 1rem;">No recent activity. Connect a data source to begin.</td></tr>`;
        if (activityTbody) activityTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem 1rem;">No logs available yet.</td></tr>`;
        return;
      }

      let html = "";
      let activityHtml = "";
      connectedAccounts.forEach((acc, i) => {
        const activeServices = acc.services.filter(s => s.active);
        if (activeServices.length > 0) {
          html += `<tr>
            <td>${acc.email}</td>
            <td>${activeServices[0].name}</td>
            <td><span class="status-pill status-pill--ok">Saved</span></td>
          </tr>`;
          activityHtml += `<tr>
            <td>${acc.email}</td>
            <td>${activeServices[0].name} (Backup)</td>
            <td><span class="status-pill status-pill--ok">Success</span></td>
            <td>Just now</td>
          </tr>`;
        }
        if (activeServices.length > 1) {
          const statusOk = i % 2 === 0; // Just alternating status for variety
          html += `<tr>
            <td>${acc.email}</td>
            <td>${activeServices[1].name}</td>
            <td><span class="status-pill ${statusOk ? 'status-pill--ok' : 'status-pill--warn'}">${statusOk ? 'Saved' : 'Trying again'}</span></td>
          </tr>`;
          activityHtml += `<tr>
            <td>${acc.email}</td>
            <td>${activeServices[1].name} (Backup)</td>
            <td><span class="status-pill ${statusOk ? 'status-pill--ok' : 'status-pill--warn'}">${statusOk ? 'Success' : 'Failed'}</span></td>
            <td>10 mins ago</td>
          </tr>`;
        }
      });
      if (tbody) tbody.innerHTML = html;
      if (activityTbody) activityTbody.innerHTML = activityHtml;
    }

    function renderAccountsList() {
      if (!tableBody) return;
      tableBody.innerHTML = connectedAccounts.map((acc, index) => `
        <div class="account-wrapper" id="acc-wrapper-${index}">
            <div class="account-row" onclick="toggleDetails(${index})">
                <div class="provider-cell"><img src="${acc.logo}" alt="${acc.providerName}"> ${acc.providerName}</div>
                <div style="color: var(--text);">${acc.email}</div>
                <div><span class="status-pill status-pill--ok">${acc.status}</span></div>
                <div class="action-cell">
                    <button class="btn btn-sm btn-ghost" onclick="removeAccount(event, ${index})">Disconnect</button>
                </div>
            </div>
            <div class="account-details">
                <h4 class="services-title">Protected Services</h4>
                <table class="sub-table data-table--interactive">
                    <thead>
                        <tr>
                            <th>Service Name</th>
                            <th>Status</th>
                            <th>Autobackup</th>
                            <th>Manual Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(acc.services || []).map((srv, sIdx) => `
                            <tr onclick="openServiceListing('${acc.email}', '${srv.name}')" title="View ${srv.name} list">
                                <td style="font-weight: 500;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 16px;">${getServiceIcon(srv.name)}</span>
                                        <span class="service-link">${srv.name}</span>
                                    </div>
                                </td>
                                <td style="color: var(--storx-green); font-size: 12px;">Active</td>
                                <td>
                                    <div class="toggle ${srv.active ? 'active' : ''}" onclick="toggleService(event, ${index}, ${sIdx}, this)"></div>
                                </td>
                                <td>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="btn btn-sm btn-ghost" onclick="triggerManualBackup(event, this)">Backup Now</button>
                                        <button class="btn btn-sm btn-ghost" onclick="triggerRestore(event, this)">Restore</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
      `).join("");
      renderRecentActivity();
    }

    window.removeAccount = function (event, index) {
      event.stopPropagation();
      if (confirm("Are you sure you want to disconnect this account?")) {
        connectedAccounts.splice(index, 1);
        localStorage.setItem("storx_accounts", JSON.stringify(connectedAccounts));
        renderAccountsList();

        if (connectedAccounts.length === 0) {
          accountsListView.classList.add("hidden");
          startupView.classList.remove("hidden");
          if (dsPageTitle) dsPageTitle.innerText = "Welcome to storX";
          if (dsPageSubtitle) dsPageSubtitle.innerText = "Add your first data source to begin protecting your infrastructure.";
          if (dsHeaderActions) dsHeaderActions.classList.add("hidden");
        }
        showToast("Data source disconnected.");
      }
    };

    window.toggleDetails = function (index) {
      const acc = connectedAccounts[index];
      if (acc.providerName === "Google Workspace") {
        window.openServiceListing(acc.email, "Google Mail");
      } else if (acc.providerName === "Microsoft 365") {
        window.openServiceListing(acc.email, "Outlook Exchange");
      } else if (["Google Mail", "Google Drive", "Google Photos"].includes(acc.providerName)) {
        window.openServiceListing(acc.email, acc.providerName);
      } else {
        const wrapper = document.getElementById(`acc-wrapper-${index}`);
        if (wrapper) wrapper.classList.toggle("expanded");
      }
    };

    window.toggleService = function (event, accIndex, srvIndex, el) {
      event.stopPropagation();
      connectedAccounts[accIndex].services[srvIndex].active = !connectedAccounts[accIndex].services[srvIndex].active;
      localStorage.setItem("storx_accounts", JSON.stringify(connectedAccounts));
      el.classList.toggle("active");
    };

    window.triggerManualBackup = function (event, btnEl) {
      event.stopPropagation();
      const originalText = btnEl.innerHTML;
      btnEl.innerHTML = 'Running...';
      btnEl.style.pointerEvents = 'none';
      btnEl.style.opacity = '0.7';

      setTimeout(() => {
        btnEl.innerHTML = '<span style="color: var(--storx-green);">✔ Success</span>';
        setTimeout(() => {
          btnEl.innerHTML = originalText;
          btnEl.style.pointerEvents = 'auto';
          btnEl.style.opacity = '1';
        }, 2000);
      }, 1500);
    };

    window.triggerRestore = function (event, btnEl) {
      event.stopPropagation();
      const originalText = btnEl.innerHTML;
      btnEl.innerHTML = 'Restoring...';
      btnEl.style.pointerEvents = 'none';
      btnEl.style.opacity = '0.7';

      setTimeout(() => {
        btnEl.innerHTML = '<span style="color: var(--storx-green);">✔ Restored</span>';
        setTimeout(() => {
          btnEl.innerHTML = originalText;
          btnEl.style.pointerEvents = 'auto';
          btnEl.style.opacity = '1';
        }, 2000);
      }, 1500);
    };

    window.triggerAutoSync = function (btnEl) {
      if (!btnEl) return;

      const originalText = btnEl.innerHTML;
      btnEl.innerHTML = 'Syncing...';
      btnEl.style.pointerEvents = 'none';
      btnEl.style.opacity = '0.7';

      const statusTh = document.getElementById('sync-status-th');
      if (statusTh) statusTh.classList.remove('hidden');

      const statusCells = document.querySelectorAll('.sync-status-cell');
      let delay = 0;
      statusCells.forEach(cell => {
        setTimeout(() => {
          cell.innerHTML = '<span style="color: var(--storx-green); font-weight: 600;">✔</span>';
        }, delay);
        delay += 100; // Stagger the appearance of ticks
      });

      // Reset after some time
      setTimeout(() => {
        btnEl.innerHTML = originalText;
        btnEl.style.pointerEvents = 'auto';
        btnEl.style.opacity = '1';
        if (statusTh) statusTh.classList.add('hidden');
        statusCells.forEach(cell => { cell.innerHTML = ''; });
        showToast('Auto-sync complete.');

        // Go to the overview page without logging in
        showView("dashboard");
      }, delay + 1500); // Wait for ticks, then transition 1.5 seconds later
    };

    // Mock data schema for categories and listing details
    const mockData = {
      email: {
        categories: ['Inbox', 'Sent', 'Spam', 'Trash'],
        items: {
          'Inbox': [
            { title: 'Q1 Budget Review', extra: 'finance@acme.com', date: 'Today, 10:42 AM', content: 'Please find the attached budget review for Q1. Let me know if you have any questions before the meeting.' },
            { title: 'Project Kickoff', extra: 'j.smith@acme.com', date: 'Yesterday, 4:15 PM', content: 'Are we still on for the kickoff tomorrow? I have prepared the slide deck.' }
          ],
          'Sent': [
            { title: 'Re: Project Update', extra: 'manager@acme.com', date: 'Mon, 9:00 AM', content: 'The project is on track. I will share the report on Friday.' }
          ],
          'Spam': [
            { title: 'You won a lottery!', extra: 'scam@sketchy.com', date: 'Last Week', content: 'Click here to claim your prize.' }
          ],
          'Trash': [
            { title: 'Old Newsletter', extra: 'news@daily.com', date: 'Jan 1', content: 'Here is the old news.' }
          ]
        }
      },
      photo: {
        categories: ['Camera Roll', 'Favorites', 'Albums', 'Recently Deleted'],
        items: {
          'Camera Roll': [
            { title: 'IMG_8932.jpg', extra: '4032 x 3024', date: 'Mar 8, 2025', content: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80' },
            { title: 'Headshot.png', extra: '1024 x 1024', date: 'Feb 20, 2025', content: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80' }
          ],
          'Favorites': [],
          'Albums': [],
          'Recently Deleted': []
        }
      },
      file: {
        categories: ['My Files', 'Shared with me', 'Recent', 'Trash'],
        items: {
          'My Files': [
            { title: 'Q1_Report.pdf', extra: '2.4 MB', date: 'Mar 10, 2025', content: 'PDF Document' },
            { title: 'Team_Roster.xlsx', extra: '14 KB', date: 'Mar 1, 2025', content: 'Spreadsheet Data' }
          ],
          'Shared with me': [
            { title: 'Design_Assets.zip', extra: '45.1 MB', date: 'Mar 5, 2025', content: 'ZIP Archive' }
          ],
          'Recent': [],
          'Trash': []
        }
      }
    };

    let currentListingType = 'file';
    let currentListingCategory = '';
    let currentListingEmail = '';

    window.openServiceListing = function (email, service) {
      document.getElementById('listing-title').innerText = service;
      document.getElementById('listing-subtitle').innerText = `Browsing data for ${email}`;
      currentListingEmail = email;

      const serviceLower = service.toLowerCase();
      if (serviceLower.includes('mail') || serviceLower.includes('outlook')) currentListingType = 'email';
      else if (serviceLower.includes('photo') || serviceLower.includes('picture')) currentListingType = 'photo';
      else currentListingType = 'file';

      const autoSyncBtn = document.getElementById('btn-auto-sync');
      if (autoSyncBtn) {
        autoSyncBtn.classList.toggle('hidden', currentListingType !== 'email');
      }

      const typeData = mockData[currentListingType];
      currentListingCategory = typeData.categories[0]; // Set default category

      renderListingCategories();
      renderListingTable();
      closeItemPreview();
      showView('service-listing');
    };

    window.selectListingCategory = function (categoryName) {
      currentListingCategory = categoryName;
      renderListingCategories();
      renderListingTable();
      closeItemPreview();
    };

    function renderListingCategories() {
      const categories = mockData[currentListingType].categories;
      document.getElementById('listing-categories').innerHTML = categories.map(cat => `
        <li class="${cat === currentListingCategory ? 'active' : ''}" onclick="selectListingCategory('${cat}')">${cat}</li>
      `).join('');
    }

    function renderListingTable() {
      const tbody = document.getElementById('listing-tbody');
      const theadTr = document.getElementById('listing-thead-tr');
      const items = mockData[currentListingType].items[currentListingCategory] || [];

      if (currentListingType === 'email') {
        theadTr.innerHTML = '<th>Subject</th><th>From</th><th>Date</th><th id="sync-status-th" class="hidden" style="width: 80px; text-align: center;">Status</th>';
      } else if (currentListingType === 'photo') {
        theadTr.innerHTML = '<th>File Name</th><th>Dimensions</th><th>Date</th>';
      } else {
        theadTr.innerHTML = '<th>File Name</th><th>Size</th><th>Modified</th>';
      }

      tbody.innerHTML = items.length > 0 ? items.map((item, index) => `
        <tr onclick="openItemPreview('${item.title}', '${currentListingType}', '${item.content}', '${item.extra}')">
          <td><strong>${item.title}</strong></td>
          <td>${item.extra}</td>
          <td>${item.date}</td>
          ${currentListingType === 'email' ? `<td class="sync-status-cell" id="sync-status-${index}" style="text-align: center;"></td>` : ''}
        </tr>
      `).join('') : `<tr><td colspan="${currentListingType === 'email' ? 4 : 3}" style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">No items found in ${currentListingCategory}.</td></tr>`;
    }

    window.openItemPreview = function (title, type, content, extra) {
      document.getElementById('inline-preview-title').innerText = title;
      const container = document.getElementById('inline-preview-content');
      document.getElementById('inline-preview-context').innerText = `Browsing data for ${currentListingEmail}`;

      let previewHTML = '';
      if (type === 'email') {
        previewHTML = `
          <div class="inline-preview-header"><p style="margin:0; color:var(--text-muted);">From: <strong>${extra}</strong><br>To: You</p></div>
          <div style="padding: 1rem 0; line-height: 1.6; font-size: 0.95rem;">${content}</div>`;
      } else if (type === 'photo') {
        previewHTML = `
          <div style="text-align: center; background: var(--storx-bg); padding: 2rem; border-radius: var(--radius-sm);">
            <img src="${content}" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: var(--shadow-sm);" alt="${title}" />
          </div>`;
      } else {
        previewHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 0; color: var(--text-muted);">
            <span style="font-size: 4rem; margin-bottom: 1rem;">📄</span><p>Preview not available for this file type.</p><p style="font-size: 0.85rem;">${content}</p>
          </div>`;
      }

      container.innerHTML = previewHTML;
      document.getElementById('listing-preview-container').classList.remove('hidden');
    };

    window.closeItemPreview = function () {
      document.getElementById('listing-preview-container').classList.add('hidden');
    }

    btnAddService?.addEventListener("click", () => modal?.classList.remove("hidden"));
    btnCloseModal?.addEventListener("click", () => modal?.classList.add("hidden"));
    modal?.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });
  }

  initDataSources();

  // Routing based on login status
  if (isLoggedIn) {
    const onboardingBtn = document.querySelector('[data-view="onboarding"]');
    if (onboardingBtn) onboardingBtn.classList.add("hidden");

    const dataSourcesBtn = document.querySelector('[data-view="data-sources"]');
    if (dataSourcesBtn) {
      dataSourcesBtn.classList.remove("setup-nav-item");
      dataSourcesBtn.classList.add("nav-item--tool");
      const stepSpan = dataSourcesBtn.querySelector(".nav-step");
      if (stepSpan) {
        stepSpan.classList.add("nav-step--icon");
        stepSpan.textContent = "🔌";
      }
      const descSpan = dataSourcesBtn.querySelector(".nav-desc");
      if (descSpan) {
        descSpan.textContent = "Manage accounts";
      }
    }
    const navIntro = document.querySelector(".nav-intro");
    if (navIntro) navIntro.classList.add("hidden");

    // Shift Overview to the top of the sidebar
    const nav = document.querySelector(".nav");
    const dashboardBtn = document.querySelector('[data-view="dashboard"]');
    if (nav && dashboardBtn) {
      nav.prepend(dashboardBtn);
      dashboardBtn.classList.remove("nav-item--tool");
    }

    let connectedAccounts = JSON.parse(localStorage.getItem("storx_accounts")) || [];
    if (connectedAccounts.length === 0) {
      showView("data-sources");
    } else {
      showView("dashboard");
    }

    const userEmail = localStorage.getItem("user_email");
    if (userEmail) {
      const nameEl = document.getElementById("sidebar-user-name");
      const avatarEl = document.getElementById("sidebar-avatar");
      if (nameEl) nameEl.textContent = `Signed in as ${userEmail}`;
      if (avatarEl) avatarEl.textContent = userEmail.substring(0, 2).toUpperCase();
    }

    const userChip = document.getElementById("sidebar-user-chip");
    const btnLogout = document.getElementById("btn-logout");
    if (userChip) userChip.classList.remove("hidden");
    if (btnLogout) btnLogout.classList.remove("hidden");

    const continueBtn = document.getElementById("btn-dashboard-continue");
    if (continueBtn) continueBtn.classList.add("hidden");
  } else {
    // Hide the Activity menu item for logged-out users
    const activityBtn = document.querySelector('[data-view="activity"]');
    if (activityBtn) activityBtn.classList.add("hidden");

    if (window.location.hash === "#login") {
      showView("login");
    } else if (window.location.hash === "#signup") {
      showView("signup");
    } else if (window.location.hash === "#onboarding") {
      showView("onboarding");
    } else {
      showView("landing");
    }
  }
})();
