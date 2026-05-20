(function () {
  function hasCompletedSetup() {
    if (localStorage.getItem("storx_setup_complete") === "true") return true;
    try {
      return JSON.parse(localStorage.getItem("storx_accounts") || "[]").length > 0;
    } catch (_) {
      return false;
    }
  }

  function redirectIfLoggedIn() {
    if (localStorage.getItem("is_authenticated") !== "true") return false;

    if (
      localStorage.getItem("is_new_user") === "true" ||
      !hasCompletedSetup()
    ) {
      window.location.replace("setup/index.html");
      return true;
    }

    window.location.replace("app/overview.html");
    return true;
  }

  if (redirectIfLoggedIn()) return;

  document.querySelectorAll(
    "#btn-lets-try, #btn-lets-try-header, #btn-lets-try-gmail, #btn-lets-try-footer"
  ).forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = "setup/index.html";
    });
  });
})();
