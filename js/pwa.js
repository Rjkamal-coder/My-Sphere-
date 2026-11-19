// PWA setup and installation experience.
// The browser only offers installation when the site is served over HTTPS
// (or localhost) and meets its installability requirements.
let deferredInstallPrompt = null;

function createInstallNotice() {
  if (document.getElementById("pwa-install-notice")) return;

  const notice = document.createElement("aside");
  notice.id = "pwa-install-notice";
  notice.setAttribute("role", "region");
  notice.setAttribute("aria-label", "Install My Daily Routine");
  notice.innerHTML = `
    <div class="pwa-install-copy">
      <strong>Install My Daily Routine</strong>
      <span>Add the app to your home screen for quick access.</span>
    </div>
    <div class="pwa-install-actions">
      <button type="button" id="pwa-install-button">Install</button>
      <button type="button" id="pwa-install-dismiss" aria-label="Dismiss install message">Not now</button>
    </div>
  `;

  const style = document.createElement("style");
  style.id = "pwa-install-style";
  style.textContent = `
    #pwa-install-notice {
      position: fixed; z-index: 99999; left: 16px; right: 16px; bottom: 18px;
      max-width: 560px; margin: 0 auto; padding: 15px;
      display: flex; align-items: center; justify-content: space-between; gap: 14px;
      color: #f8fafc; background: #172337; border: 1px solid rgba(255,255,255,.16);
      border-radius: 16px; box-shadow: 0 12px 36px rgba(0,0,0,.28);
      font: 14px/1.4 system-ui, sans-serif;
    }
    #pwa-install-notice .pwa-install-copy { display:flex; flex-direction:column; gap:3px; }
    #pwa-install-notice .pwa-install-copy strong { font-size:15px; }
    #pwa-install-notice .pwa-install-copy span { color:#cbd5e1; font-size:12px; }
    #pwa-install-notice .pwa-install-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    #pwa-install-notice button { border:0; border-radius:9px; padding:9px 12px; font-weight:700; cursor:pointer; }
    #pwa-install-button { color:#102033; background:#fff; }
    #pwa-install-dismiss { color:#e2e8f0; background:transparent; }
    @media(max-width:420px) {
      #pwa-install-notice { left:10px; right:10px; bottom:10px; padding:12px; gap:8px; }
      #pwa-install-notice .pwa-install-copy span { max-width:180px; }
      #pwa-install-notice .pwa-install-actions { gap:3px; }
      #pwa-install-notice button { padding:8px 9px; font-size:12px; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(notice);

  document.getElementById("pwa-install-dismiss").addEventListener("click", () => notice.remove());
  document.getElementById("pwa-install-button").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    notice.remove();
  });
}

function hideInstallNotice() {
  document.getElementById("pwa-install-notice")?.remove();
}

// Register the offline app shell. Supabase data/API requests are never cached.
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
      .catch(error => console.warn("Service worker registration failed:", error));
  });
}

// Chrome/Edge fire this event when the website is eligible to be installed.
// It is intentionally triggered by a user click, as required by the browser.
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createInstallNotice, { once: true });
  } else {
    createInstallNotice();
  }
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  hideInstallNotice();
});

document.addEventListener("DOMContentLoaded", () => {
  const shareButton = document.getElementById("share-site-btn");
  if (shareButton) {
    shareButton.addEventListener("click", async () => {
      const shareData = {
        title: document.title || "My Daily Routine",
        text: "Manage your daily routine and track your progress with My Daily Routine.",
        url: window.location.href.split("#")[0]
      };
      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareData.url);
          if (typeof toast === "function") toast("Website link copied. Share it with your friends!");
          else alert("Website link copied. Share it with your friends!");
        } else {
          window.prompt("Copy this website link to share with your friends:", shareData.url);
        }
      } catch (error) {
        if (error.name !== "AbortError" && typeof toast === "function") {
          toast("Unable to share right now. Please copy the website link.", "error");
        }
      }
    });
  }
});
