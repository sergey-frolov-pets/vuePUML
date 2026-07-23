(function () {
  if (window.location.protocol === "file:") {
    return;
  }

  window.__deferredPwaInstallPrompt = null;
  window.__pwaSwRegistrationError = null;

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    window.__deferredPwaInstallPrompt = event;
    window.dispatchEvent(new CustomEvent("pwa-installprompt"));
  });

  window.addEventListener("appinstalled", function () {
    window.__deferredPwaInstallPrompt = null;
    window.dispatchEvent(new CustomEvent("pwa-installed"));
  });

  if (!("serviceWorker" in navigator)) {
    return;
  }

  var swUrl = new URL("sw.js", window.location.href).href;
  var swScope = new URL("./", window.location.href).href;

  function register(url, scope) {
    return navigator.serviceWorker.register(url, {
      scope: scope,
      updateViaCache: "none",
    });
  }

  register(swUrl, swScope).catch(function (error) {
    window.__pwaSwRegistrationError = String(error);
    var fallbackUrl = new URL("/sw.js", window.location.origin).href;
    return register(fallbackUrl, new URL("/", window.location.origin).href).catch(
      function (fallbackError) {
        window.__pwaSwRegistrationError = String(fallbackError);
      },
    );
  }).then(function (registration) {
    if (registration) {
      window.__pwaSwRegistrationError = null;
    }
  });
})();
