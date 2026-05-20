(function (global) {
  function hasCompletedSetup() {
    if (localStorage.getItem("storx_setup_complete") === "true") return true;
    try {
      return JSON.parse(localStorage.getItem("storx_accounts") || "[]").length > 0;
    } catch (_) {
      return false;
    }
  }

  function nameFromEmail(email) {
    const local = email.split("@")[0] || "User";
    return local
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Mock Google OAuth — replace with real OAuth in production */
  function mockGoogleAuth(isConnect) {
    const email = prompt(
      isConnect
        ? "Connect with Google (demo)\nChoose the Gmail account to back up:"
        : "Sign in with Google (demo)\nEnter your Gmail:",
      localStorage.getItem("user_email") || "you@gmail.com"
    );
    if (!email?.trim()) return null;
    const trimmed = email.trim();
    return { email: trimmed, name: nameFromEmail(trimmed) };
  }

  function applyGoogleProfile(profile, options) {
    const { isConnect = false, clearSetup = false } = options || {};
    localStorage.setItem("is_authenticated", "true");
    localStorage.setItem("user_email", profile.email);
    localStorage.setItem("user_name", profile.name);

    if (isConnect) {
      localStorage.setItem("is_new_user", "true");
      if (clearSetup) {
        localStorage.removeItem("storx_setup_complete");
        localStorage.removeItem("storx_accounts");
      }
    }
  }

  function getPostAuthDestination() {
    const returnTo = sessionStorage.getItem("storx_auth_return");
    if (returnTo) {
      sessionStorage.removeItem("storx_auth_return");
      return returnTo;
    }
    return "../setup/index.html";
  }

  function setAuthReturn(url) {
    if (url) sessionStorage.setItem("storx_auth_return", url);
  }

  function completeGoogleSignIn(profile) {
    applyGoogleProfile(profile, { isConnect: false });
    localStorage.removeItem("is_new_user");
    window.location.href = getPostAuthDestination();
  }

  function bindGoogleButton(buttonId, isConnect) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener("click", () => {
      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = "Opening Google…";

      setTimeout(() => {
        const profile = mockGoogleAuth(isConnect);
        btn.disabled = false;
        btn.textContent = label;
        if (profile) completeGoogleSignIn(profile);
      }, 400);
    });
  }

  function redirectIfAuthenticated() {
    if (localStorage.getItem("is_authenticated") !== "true") return false;
    window.location.href = getPostAuthDestination();
    return true;
  }

  global.StorxAuth = {
    mockGoogleAuth,
    applyGoogleProfile,
    bindGoogleButton,
    redirectIfAuthenticated,
    setAuthReturn,
    hasCompletedSetup,
  };
})(window);
