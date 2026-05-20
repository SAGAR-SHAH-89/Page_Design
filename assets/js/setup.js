(function () {
  const views = document.querySelectorAll(".view");
  const toast = document.getElementById("toast");
  const setupProgress = document.getElementById("setup-progress");
  const setupProgressFill = document.getElementById("setup-progress-fill");
  const setupProgressLabel = document.getElementById("setup-progress-label");
  const navIntro = document.getElementById("nav-intro");

  const DEFAULT_LOCATION = "US East (N. Virginia)";
  const DEFAULT_RETENTION = "2 years, then remove older copies";

  const SYNC_COPY = {
    auto: {
      title: "Auto sync",
      desc: "Ongoing backups on a schedule you choose below.",
    },
    once: {
      title: "One-time sync",
      desc: "Runs a single backup right after you connect.",
    },
    browse: {
      title: "Browse email",
      desc: "Opens your backed-up mailbox to search and restore.",
    },
  };

  const setupSteps = {
    onboarding: { pct: 50, label: "Step 1 of 2 — Connect with Google" },
    "backup-config": { pct: 100, label: "Step 2 of 2 — Choose sync" },
  };

  let toastTimer;

  function isAuthenticated() {
    return localStorage.getItem("is_authenticated") === "true";
  }

  function getFlowContext() {
    const params = new URLSearchParams(window.location.search);
    const isConnect = params.get("connect") === "1" || params.has("email");
    return {
      isConnect,
      isInitialConnect:
        !isConnect &&
        (localStorage.getItem("is_new_user") === "true" || !hasCompletedSetup()),
      email: params.get("email") || localStorage.getItem("user_email") || "",
      sync: params.get("sync") || "auto",
    };
  }

  const flow = getFlowContext();

  function getInitials(name, email) {
    const trimmed = (name || "").trim();
    if (trimmed.includes(" ")) {
      return trimmed
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    if (trimmed) return trimmed.slice(0, 2).toUpperCase();
    if (email) return email.slice(0, 2).toUpperCase();
    return "U";
  }

  function hasCompletedSetup() {
    if (localStorage.getItem("storx_setup_complete") === "true") return true;
    try {
      return JSON.parse(localStorage.getItem("storx_accounts") || "[]").length > 0;
    } catch (_) {
      return false;
    }
  }

  function updateShellForAuth() {
    const signedIn = isAuthenticated();
    const exitLink = document.getElementById("setup-exit-link");
    const signinLink = document.getElementById("setup-signin-link");
    const userChip = document.getElementById("user-chip");

    if (exitLink) exitLink.hidden = !signedIn || !hasCompletedSetup();
    if (signinLink) signinLink.hidden = signedIn;
    if (userChip) userChip.hidden = !signedIn;
  }

  function bindUserProfile() {
    if (!isAuthenticated()) return;

    const userEmail = localStorage.getItem("user_email") || "";
    const displayName = localStorage.getItem("user_name") || userEmail.split("@")[0] || "User";
    const avatarEl = document.getElementById("user-avatar");
    const displayEl = document.getElementById("user-display");

    if (avatarEl) avatarEl.textContent = getInitials(displayName, userEmail);
    if (displayEl) {
      displayEl.textContent = userEmail
        ? `Signed in as ${userEmail}`
        : `Signed in as ${displayName}`;
    }

    document.getElementById("btn-logout")?.addEventListener("click", () => {
      localStorage.removeItem("is_authenticated");
      localStorage.removeItem("is_new_user");
      window.location.href = "../index.html";
    });
  }

  function updateNavIntro() {
    if (!navIntro) return;
    if (flow.isConnect) {
      navIntro.innerHTML = `Adding <strong>${flow.email || "mailbox"}</strong>. Confirm sync, then return to the app.`;
    } else if (!isAuthenticated()) {
      navIntro.textContent = "Connect with Google below to get started. Returning users can sign in from the footer.";
    } else {
      navIntro.textContent = "Pick how to sync this mailbox, then you’re done.";
    }
  }

  function bindOnboardingEmail() {
    const email = flow.email || localStorage.getItem("user_email") || "you@gmail.com";
    const name = localStorage.getItem("user_name") || email.split("@")[0] || "User";
    const emailEl = document.getElementById("onboard-email-display");
    const nameEl = document.getElementById("onboard-name-display");
    if (emailEl) emailEl.textContent = email;
    if (nameEl) nameEl.textContent = `${name} · Gmail`;
  }

  function getSelectedSyncMode() {
    return (
      document.querySelector('input[name="sync-mode"]:checked')?.value ||
      flow.sync ||
      "auto"
    );
  }

  function updateSyncIntentSummary() {
    const sync = getSelectedSyncMode();
    const copy = SYNC_COPY[sync] || SYNC_COPY.auto;
    const textEl = document.getElementById("sync-intent-text");
    const descEl = document.getElementById("sync-intent-desc");
    if (textEl) textEl.textContent = copy.title;
    if (descEl) descEl.textContent = copy.desc;
  }

  function setSyncPickerVisible(showPicker) {
    const summary = document.getElementById("sync-intent-summary");
    const panel = document.getElementById("sync-mode-panel");
    const useSummary = flow.isConnect && !showPicker;

    if (summary) summary.hidden = !useSummary;
    if (panel) panel.hidden = useSummary;
    if (useSummary) updateSyncIntentSummary();
  }

  function updateSyncOptionPanels() {
    const sync = getSelectedSyncMode();
    const frequencyPanel = document.getElementById("sync-frequency-panel");
    const isAuto = sync === "auto";

    if (frequencyPanel) frequencyPanel.hidden = !isAuto;
    updateSyncIntentSummary();

    const finishBtn = document.getElementById("btn-finish-setup");
    if (!finishBtn) return;

    if (flow.isInitialConnect) {
      finishBtn.textContent = "Finish & go to Overview";
      return;
    }
    if (sync === "browse") finishBtn.textContent = "Connect & browse email";
    else if (sync === "once") finishBtn.textContent = "Connect & run backup";
    else finishBtn.textContent = "Connect & enable auto sync";
  }

  function bindSyncMode() {
    const sync = flow.sync || "auto";
    document.querySelectorAll('input[name="sync-mode"]').forEach((input) => {
      input.checked = input.value === sync;
      input.addEventListener("change", () => {
        updateSyncOptionPanels();
        if (flow.isConnect) setSyncPickerVisible(false);
      });
    });

    document.getElementById("btn-change-sync")?.addEventListener("click", () => {
      setSyncPickerVisible(true);
    });

    setSyncPickerVisible(false);
    updateSyncOptionPanels();
  }

  function handleConnectGoogle() {
    const btn = document.getElementById("btn-connect-google");
    const label = btn?.textContent?.trim() || "Connect with Google";

    if (flow.isConnect && isAuthenticated()) {
      showToast("Confirming Google access…");
      setTimeout(() => showView("backup-config"), 400);
      return;
    }

    if (!isAuthenticated()) {
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Opening Google…";
      }
      showToast("Opening Google connect…");

      setTimeout(() => {
        const profile = StorxAuth.mockGoogleAuth(true);
        if (btn) {
          btn.disabled = false;
          btn.textContent = label;
        }
        if (!profile) return;

        StorxAuth.applyGoogleProfile(profile, { isConnect: true, clearSetup: true });
        bindUserProfile();
        updateShellForAuth();
        updateNavIntro();
        bindOnboardingEmail();
        showView("backup-config");
      }, 400);
      return;
    }

    showView("backup-config");
  }

  function bindStepNavigation() {
    const backBtn = document.getElementById("btn-back-connect");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (flow.isConnect) {
          window.location.href = "../app/overview.html";
          return;
        }
        showView("onboarding");
      });
    }

    document.getElementById("btn-connect-google")?.addEventListener("click", handleConnectGoogle);

  }

  function getInitialView() {
    if (flow.isConnect) {
      if (!isAuthenticated()) {
        if (typeof StorxAuth !== "undefined") {
          StorxAuth.setAuthReturn(`../setup/index.html${window.location.search}`);
        } else {
          sessionStorage.setItem(
            "storx_auth_return",
            `../setup/index.html${window.location.search}`
          );
        }
        window.location.href = "../auth/login.html";
        return null;
      }
      return "backup-config";
    }

    if (isAuthenticated() && hasCompletedSetup()) {
      window.location.href = "../app/overview.html";
      return null;
    }

    if (isAuthenticated()) return "backup-config";

    return "onboarding";
  }

  function completeSetup() {
    if (!isAuthenticated()) {
      showToast("Connect with Google first.");
      showView("onboarding");
      return;
    }

    const userEmail =
      document.getElementById("onboard-email-display")?.textContent?.trim() ||
      flow.email ||
      localStorage.getItem("user_email") ||
      "you@gmail.com";

    const syncMode = getSelectedSyncMode();
    const syncFrequency =
      syncMode === "auto"
        ? document.getElementById("sync-frequency-select")?.selectedOptions[0]?.textContent ||
          "Once a day (recommended)"
        : null;

    const location =
      localStorage.getItem("selected_storage_location") || DEFAULT_LOCATION;

    const services = [{ name: "Gmail", active: true }];

    let accounts = [];
    try {
      accounts = JSON.parse(localStorage.getItem("storx_accounts") || "[]");
    } catch (_) {
      accounts = [];
    }

    const existing = accounts.findIndex((a) => a.email === userEmail);
    const account = {
      providerName: "Google",
      logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
      email: userEmail,
      location,
      status: syncMode === "once" ? "Syncing…" : "Active",
      syncMode,
      autoSync: syncMode === "auto",
      syncFrequency,
      syncRetention: DEFAULT_RETENTION,
      services,
    };

    if (existing >= 0) accounts[existing] = { ...accounts[existing], ...account };
    else accounts.push(account);

    localStorage.setItem("storx_accounts", JSON.stringify(accounts));
    localStorage.setItem("storx_setup_complete", "true");
    localStorage.removeItem("is_new_user");
    localStorage.setItem("selected_storage_location", location);

    if (syncMode === "browse") {
      window.location.href = `../app/service-listing.html?account=${encodeURIComponent(userEmail)}&service=Gmail`;
      return;
    }
    window.location.href = "../app/overview.html";
  }

  function showView(name) {
    views.forEach((v) => v.classList.toggle("active", v.id === `view-${name}`));
    updateSetupProgress(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateSetupProgress(viewName) {
    if (!setupProgress || !setupProgressFill || !setupProgressLabel) return;
    const step = setupSteps[viewName];
    if (!step) return;
    setupProgress.hidden = false;
    setupProgressFill.style.width = `${step.pct}%`;
    setupProgressLabel.textContent = step.label;
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 4000);
  }

  updateShellForAuth();
  bindUserProfile();
  updateNavIntro();
  bindOnboardingEmail();
  bindSyncMode();
  bindStepNavigation();

  document.getElementById("btn-finish-setup")?.addEventListener("click", () => {
    showToast("Saving your mailbox…");
    setTimeout(completeSetup, 500);
  });

  const initialView = getInitialView();
  if (initialView) showView(initialView);
})();
