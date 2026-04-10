const rootElement = document.documentElement;
const header = document.getElementById("siteHeader");
const menuToggle = document.getElementById("menuToggle");
const navPanel = document.getElementById("navPanel");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const themeToggle = document.getElementById("themeToggle");
const scrollTopButton = document.getElementById("scrollTop");
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
const yearTargets = Array.from(document.querySelectorAll("[data-current-year]"));

const PREFERS_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const THEME_KEY = "pom-theme";
const COOKIE_CONSENT_KEY = "pom-cookie-consent-v1";
const VISIBILITY_ATTEMPT_KEY = "pom-visibility-attempt";

const storedTheme = localStorage.getItem(THEME_KEY);
let hasCookieConsent = localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
let cookieGateElement = null;

if (!rootElement.getAttribute("data-theme")) {
  rootElement.setAttribute("data-theme", "light");
}

if (storedTheme === "light" || storedTheme === "dark") {
  rootElement.setAttribute("data-theme", storedTheme);
}

const updateThemeButton = () => {
  if (!themeToggle) {
    return;
  }

  const icon = themeToggle.querySelector("i");
  if (!icon) {
    return;
  }

  const isLight = rootElement.getAttribute("data-theme") === "light";
  icon.className = isLight ? "bx bx-moon" : "bx bx-sun";
  themeToggle.setAttribute("aria-label", isLight ? "Activar modo oscuro" : "Activar modo claro");
};

const lockPageForConsent = () => {
  rootElement.classList.add("consent-locked");
  document.body.classList.add("consent-locked");
};

const unlockPageAfterConsent = () => {
  rootElement.classList.remove("consent-locked");
  document.body.classList.remove("consent-locked");
};

const nudgeCookieGate = (message) => {
  if (!cookieGateElement) {
    return;
  }

  const note = cookieGateElement.querySelector("[data-cookie-note]");
  if (note) {
    note.textContent =
      message ||
      "Debes aceptar los términos y la política de cookies para navegar entre páginas o cambiar de pestaña.";
  }

  cookieGateElement.classList.remove("is-pulsing");
  void cookieGateElement.offsetWidth;
  cookieGateElement.classList.add("is-pulsing");
};

const destroyCookieGate = () => {
  if (!cookieGateElement) {
    return;
  }

  cookieGateElement.remove();
  cookieGateElement = null;
  unlockPageAfterConsent();
};

const createCookieGate = () => {
  if (hasCookieConsent || !document.body) {
    return;
  }

  lockPageForConsent();

  cookieGateElement = document.createElement("section");
  cookieGateElement.className = "cookie-gate";
  cookieGateElement.setAttribute("role", "dialog");
  cookieGateElement.setAttribute("aria-modal", "true");
  cookieGateElement.setAttribute("aria-labelledby", "cookieGateTitle");

  cookieGateElement.innerHTML = `
    <div class="cookie-gate__panel">
      <p class="cookie-gate__eyebrow">Política obligatoria</p>
      <h2 id="cookieGateTitle">Debes aceptar términos, seguridad y cookies para continuar.</h2>
      <p>
        Este portal bloquea navegación, cambio de pestañas internas y salida de la página hasta que confirmes tu aceptación.
        Al aceptar, autorizas el uso de cookies necesarias para sesión, seguridad, preferencias y analítica institucional.
      </p>
      <ul class="cookie-gate__list">
        <li>Uso de datos conforme a la política de privacidad.</li>
        <li>Condiciones de seguridad y uso responsable de la plataforma.</li>
        <li>Cookies esenciales para funcionamiento y experiencia.</li>
      </ul>
      <p class="cookie-gate__note" data-cookie-note>
        Acepta para habilitar navegación completa del sitio.
      </p>
      <div class="cookie-gate__actions">
        <button type="button" class="btn btn-primary" data-accept-cookies data-consent-allowed>
          Aceptar términos y cookies <i class='bx bx-check-circle'></i>
        </button>
      </div>
    </div>
  `;

  document.body.append(cookieGateElement);

  const acceptButton = cookieGateElement.querySelector("[data-accept-cookies]");
  acceptButton?.addEventListener("click", () => {
    hasCookieConsent = true;
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    sessionStorage.removeItem(VISIBILITY_ATTEMPT_KEY);
    destroyCookieGate();
  });

  cookieGateElement.addEventListener("animationend", () => {
    cookieGateElement?.classList.remove("is-pulsing");
  });

  acceptButton?.focus();
};

const guardInteractionUntilConsent = (event) => {
  if (hasCookieConsent) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (target.closest("[data-consent-allowed]")) {
    return;
  }

  if (target.closest(".cookie-gate")) {
    return;
  }

  const interactiveTarget = target.closest("a, button, input, select, textarea, [role='button']");
  if (!interactiveTarget) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  nudgeCookieGate();
};

updateThemeButton();
createCookieGate();

document.addEventListener("click", guardInteractionUntilConsent, true);
document.addEventListener(
  "submit",
  (event) => {
    if (hasCookieConsent) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    nudgeCookieGate();
  },
  true
);

document.addEventListener(
  "keydown",
  (event) => {
    if (hasCookieConsent) {
      return;
    }

    const key = event.key.toLowerCase();
    const blockedShortcut =
      (event.ctrlKey || event.metaKey) && ["r", "w", "t", "l", "n", "p"].includes(key);

    if (blockedShortcut || key === "f5") {
      event.preventDefault();
      event.stopPropagation();
      nudgeCookieGate("Debes aceptar primero para habilitar navegación y cambios de pestaña.");
    }
  },
  true
);

document.addEventListener("visibilitychange", () => {
  if (hasCookieConsent) {
    return;
  }

  if (document.visibilityState === "hidden") {
    sessionStorage.setItem(VISIBILITY_ATTEMPT_KEY, "1");
  }
});

window.addEventListener("focus", () => {
  if (hasCookieConsent) {
    return;
  }

  if (sessionStorage.getItem(VISIBILITY_ATTEMPT_KEY) === "1") {
    sessionStorage.removeItem(VISIBILITY_ATTEMPT_KEY);
    nudgeCookieGate("Cambio de pestaña detectado. Acepta para continuar usando el sitio.");
  }
});

window.addEventListener("beforeunload", (event) => {
  if (hasCookieConsent) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = rootElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    rootElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    updateThemeButton();
  });
}

const closeMenu = () => {
  if (!navPanel || !menuToggle) {
    return;
  }

  navPanel.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
};

if (menuToggle && navPanel) {
  menuToggle.addEventListener("click", () => {
    const willOpen = !navPanel.classList.contains("is-open");
    navPanel.classList.toggle("is-open", willOpen);
    menuToggle.setAttribute("aria-expanded", String(willOpen));
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!navPanel.contains(target) && !menuToggle.contains(target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1120) {
      closeMenu();
    }
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeMenu();
  });
});

const normalizePath = (value) => {
  if (!value) {
    return "";
  }

  return value.split("#")[0].split("?")[0].replace(/^\.\//, "").trim().toLowerCase();
};

const currentPage = normalizePath(window.location.pathname.split("/").pop()) || "index.html";

navLinks.forEach((link) => {
  const href = link.getAttribute("href") || "";
  const normalizedHref = normalizePath(href);

  if (!normalizedHref || normalizedHref.startsWith("http")) {
    return;
  }

  link.classList.toggle("is-active", normalizedHref === currentPage);
});

yearTargets.forEach((target) => {
  target.textContent = String(new Date().getFullYear());
});

const updateScrollElements = () => {
  const scrolled = window.scrollY > 28;
  const showScrollTop = window.scrollY > 460;

  header?.classList.toggle("is-scrolled", scrolled);
  scrollTopButton?.classList.toggle("is-visible", showScrollTop);
};

let isTicking = false;
const requestTick = () => {
  if (isTicking) {
    return;
  }

  isTicking = true;
  window.requestAnimationFrame(() => {
    updateScrollElements();

    if (!PREFERS_REDUCED_MOTION) {
      const offset = window.scrollY;
      parallaxItems.forEach((item) => {
        const speed = Number(item.getAttribute("data-parallax")) || 0;
        item.style.setProperty("--parallax-y", `${offset * speed}px`);
      });
    }

    isTicking = false;
  });
};

window.addEventListener("scroll", requestTick, { passive: true });
window.addEventListener("resize", requestTick);
updateScrollElements();
requestTick();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const delay = entry.target.getAttribute("data-delay");
        if (delay) {
          entry.target.style.setProperty("--delay", delay);
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const initStarfield = () => {
  const canvas = document.getElementById("starfield");
  if (!(canvas instanceof HTMLCanvasElement) || PREFERS_REDUCED_MOTION) {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let stars = [];
  let animationId = 0;

  const getStarColor = () => {
    const value = getComputedStyle(rootElement).getPropertyValue("--star-rgb").trim();
    return value || "138, 255, 209";
  };

  const makeStar = () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.2,
    drift: Math.random() * 0.35 + 0.08,
    alpha: Math.random() * 0.6 + 0.2,
    pulse: Math.random() * 0.018 + 0.004
  });

  const setup = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const density = width < 640 ? 0.00012 : 0.0002;
    const count = Math.max(45, Math.floor(width * height * density));
    stars = Array.from({ length: count }, makeStar);
  };

  const render = () => {
    const starColor = getStarColor();
    ctx.clearRect(0, 0, width, height);

    stars.forEach((star) => {
      star.y += star.drift;
      if (star.y > height + 3) {
        star.y = -3;
        star.x = Math.random() * width;
      }

      star.alpha += (Math.random() > 0.5 ? 1 : -1) * star.pulse;
      star.alpha = Math.max(0.15, Math.min(0.95, star.alpha));

      ctx.beginPath();
      ctx.fillStyle = `rgba(${starColor}, ${star.alpha})`;
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    animationId = window.requestAnimationFrame(render);
  };

  setup();
  render();

  const onResize = () => {
    window.cancelAnimationFrame(animationId);
    setup();
    render();
  };

  window.addEventListener("resize", onResize);
};

initStarfield();
