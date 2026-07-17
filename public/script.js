(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const progress = document.querySelector("[data-scroll-progress]");
  const year = document.querySelector("[data-year]");
  const form = document.querySelector("#application-form");
  const status = document.querySelector("#form-status");
  const themedSections = Array.from(document.querySelectorAll("[data-scroll-theme]"));
  const headerLogo = header ? header.querySelector(".brand-mark") : null;
  const lightLogoSrc = "/assets/cgi-logo-mark-transparent.png";
  const darkLogoSrc = "/assets/cgi-logo-mark-ivory.svg";

  if (header) {
    const navShell = header.querySelector(".nav-shell");
    const navLinks = header.querySelector(".nav-links");
    if (navShell && navLinks && !header.querySelector(".mobile-nav-toggle")) {
      const toggle = document.createElement("button");
      const navId = navLinks.id || "primary-navigation";
      navLinks.id = navId;
      toggle.type = "button";
      toggle.className = "mobile-nav-toggle";
      toggle.setAttribute("aria-label", "Open navigation menu");
      toggle.setAttribute("aria-controls", navId);
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = "<span></span>";
      navShell.insertBefore(toggle, navLinks);

      function setNavOpen(isOpen) {
        header.classList.toggle("is-nav-open", isOpen);
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
      }

      toggle.addEventListener("click", () => {
        setNavOpen(!header.classList.contains("is-nav-open"));
      });

      navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setNavOpen(false));
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setNavOpen(false);
      });

      window.addEventListener("resize", () => {
        if (window.matchMedia("(min-width: 860px)").matches) setNavOpen(false);
      });
    }
  }

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  function setHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  function setScrollProgress() {
    if (!progress) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    progress.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
  }

  function setSectionParallax() {
    if (prefersReducedMotion) return;
    document.querySelectorAll(".section-image").forEach((image) => {
      const rect = image.parentElement.getBoundingClientRect();
      const shift = Math.max(Math.min(rect.top * -0.04, 28), -28);
      image.style.transform = `translate3d(0, ${shift}px, 0) scale(1.04)`;
    });
    document.querySelectorAll(".hero-media img, .orbital-field, .security-orbit-field, .section-watermark").forEach((layer) => {
      const rect = layer.getBoundingClientRect();
      const shift = Math.max(Math.min(rect.top * -0.025, 34), -34);
      layer.style.transform = `translate3d(0, ${shift}px, 0)`;
    });
  }

  function setScrollTheme(theme) {
    const nextTheme = theme || "paper";
    document.body.dataset.scrollTheme = nextTheme;
    if (header) header.dataset.scrollTheme = nextTheme;
    if (headerLogo) {
      const useDarkLogo = nextTheme === "navy" || nextTheme === "security" || nextTheme === "lunar";
      const nextSrc = useDarkLogo ? darkLogoSrc : lightLogoSrc;
      if (!headerLogo.src.endsWith(nextSrc)) headerLogo.src = nextSrc;
    }
  }

  if (themedSections.length && "IntersectionObserver" in window) {
    const themeObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setScrollTheme(visible.target.dataset.scrollTheme);
    }, { threshold: [0.22, 0.42, 0.62], rootMargin: "-18% 0px -46% 0px" });

    themedSections.forEach((section) => themeObserver.observe(section));
    const current = themedSections.find((section) => section.getBoundingClientRect().top <= window.innerHeight * 0.45 && section.getBoundingClientRect().bottom > window.innerHeight * 0.2);
    setScrollTheme(current ? current.dataset.scrollTheme : themedSections[0].dataset.scrollTheme);
  } else {
    setScrollTheme("paper");
  }

  setHeaderState();
  setScrollProgress();
  setSectionParallax();
  window.addEventListener("scroll", () => {
    setHeaderState();
    setScrollProgress();
    setSectionParallax();
  }, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });

  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -40px 0px" });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt-card]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", `${(-y * 4).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(x * 5).toFixed(2)}deg`);
        card.style.setProperty("--pointer-x", `${((x + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty("--pointer-y", `${((y + 0.5) * 100).toFixed(1)}%`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
        card.style.setProperty("--pointer-x", "50%");
        card.style.setProperty("--pointer-y", "35%");
      });
    });
  }

  const statValues = Array.from(document.querySelectorAll("[data-count]"));
  function animateCount(element) {
    const end = Number(element.dataset.count);
    const suffix = element.dataset.suffix || "";
    const duration = 1200;
    const startTime = performance.now();

    function frame(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${Math.floor(end * eased).toLocaleString()}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  if ("IntersectionObserver" in window && statValues.length) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      });
    }, { threshold: 0.45 });

    statValues.forEach((value) => statObserver.observe(value));
  } else {
    statValues.forEach((value) => {
      value.textContent = `${Number(value.dataset.count).toLocaleString()}${value.dataset.suffix || ""}`;
    });
  }

  const researchLibrary = document.querySelector("[data-research-library]");
  if (researchLibrary) {
    const filters = Array.from(researchLibrary.querySelectorAll("[data-filter]"));
    const items = Array.from(researchLibrary.querySelectorAll("[data-library-item]"));

    filters.forEach((filter) => {
      filter.addEventListener("click", () => {
        const value = filter.dataset.filter;
        filters.forEach((button) => button.classList.toggle("is-active", button === filter));
        items.forEach((item) => {
          const tags = String(item.dataset.libraryItem || "").split(/\s+/);
          const isVisible = value === "all" || tags.includes(value);
          item.hidden = !isVisible;
        });
      });
    });
  }

  const pathwayExplorer = document.querySelector("[data-research-pathways]");
  if (pathwayExplorer) {
    const pathways = {
      treaty: {
        label: "OSTGAP",
        title: "Outer Space Treaty implementation gaps",
        copy: "Start with treaty obligations, national implementation, and the gaps that matter for Articles II, VI, and IX.",
        primaryText: "Open OSTGAP",
        primaryHref: "/projects/ostgap",
        secondaryText: "Read topic guide",
        secondaryHref: "/topics/outer-space-treaty-gaps"
      },
      lunar: {
        label: "Lunar Project",
        title: "Governance before routine lunar activity",
        copy: "Explore administration, landing zones, safety, infrastructure access, science protection, and dispute intake through a scenario model.",
        primaryText: "Explore Lunar Project",
        primaryHref: "/projects/lunar",
        secondaryText: "Lunar governance guide",
        secondaryHref: "/topics/lunar-governance"
      },
      security: {
        label: "Golden Dome",
        title: "Space security law and interceptor characterization",
        copy: "Review CGI's public-safe legal questions around kinetic, directed-energy, co-orbital, and non-kinetic capability categories.",
        primaryText: "View legal preview",
        primaryHref: "/projects/golden-dome",
        secondaryText: "Related treaty work",
        secondaryHref: "/projects/ostgap"
      }
    };
    const fields = {
      label: pathwayExplorer.querySelector("[data-pathway-label]"),
      title: pathwayExplorer.querySelector("[data-pathway-title]"),
      copy: pathwayExplorer.querySelector("[data-pathway-copy]"),
      primary: pathwayExplorer.querySelector("[data-pathway-primary]"),
      secondary: pathwayExplorer.querySelector("[data-pathway-secondary]")
    };
    pathwayExplorer.querySelectorAll("[data-pathway]").forEach((button) => {
      button.addEventListener("click", () => {
        const state = pathways[button.dataset.pathway] || pathways.treaty;
        pathwayExplorer.querySelectorAll("[data-pathway]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", active ? "true" : "false");
        });
        if (fields.label) fields.label.textContent = state.label;
        if (fields.title) fields.title.textContent = state.title;
        if (fields.copy) fields.copy.textContent = state.copy;
        if (fields.primary) {
          fields.primary.textContent = state.primaryText;
          fields.primary.href = state.primaryHref;
        }
        if (fields.secondary) {
          fields.secondary.textContent = state.secondaryText;
          fields.secondary.href = state.secondaryHref;
        }
      });
    });
  }

  const missionControl = document.querySelector("[data-lunar-mission-control]");
  if (missionControl) {
    const modes = {
      rover: {
        mode: "Rover traverse",
        signal: "8.4 s delay",
        power: "72%",
        risk: "Dust corridor review",
        governance: "Route notice and dust buffer",
        action: "Publish traverse window"
      },
      base: {
        mode: "Base systems",
        signal: "Nominal relay",
        power: "91%",
        risk: "Thermal margin watch",
        governance: "Shared power priority",
        action: "Confirm emergency reserve"
      },
      governance: {
        mode: "Governance queue",
        signal: "Notice logged",
        power: "N/A",
        risk: "Landing-zone deconfliction",
        governance: "Consultation threshold",
        action: "Route dispute intake"
      }
    };
    const fields = {
      mode: missionControl.querySelector("[data-mission-mode]"),
      signal: missionControl.querySelector("[data-mission-signal]"),
      power: missionControl.querySelector("[data-mission-power]"),
      risk: missionControl.querySelector("[data-mission-risk]"),
      governance: missionControl.querySelector("[data-mission-governance]"),
      action: missionControl.querySelector("[data-mission-action]")
    };
    missionControl.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        const state = modes[button.dataset.mode] || modes.rover;
        missionControl.querySelectorAll("[data-mode]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", active ? "true" : "false");
        });
        Object.entries(fields).forEach(([key, field]) => {
          if (field) field.textContent = state[key];
        });
        missionControl.querySelectorAll(".telemetry-board article").forEach((card, index) => {
          card.style.setProperty("--telemetry-delay", `${index * 45}ms`);
          card.classList.remove("is-updated");
          window.requestAnimationFrame(() => card.classList.add("is-updated"));
        });
        missionControl.dataset.activeMode = button.dataset.mode;
        const section = missionControl.closest(".mission-control-section");
        if (section) section.dataset.activeMode = button.dataset.mode;
      });
    });
  }

  const legalMatrix = document.querySelector("[data-legal-matrix]");
  if (legalMatrix) {
    const states = {
      kinetic: {
        label: "Kinetic",
        title: "Hit-to-kill systems",
        copy: "Research questions include debris creation, target characterization, testing conditions, proportionality, and harmful interference risk.",
        treaty: "Article IX due regard and harmful interference consultation.",
        posture: "Analytic category only; no conclusion about any specific architecture."
      },
      energy: {
        label: "Energy-based",
        title: "Directed-energy capabilities",
        copy: "Research questions include reversibility, dazzling or damage thresholds, attribution, warning, and escalation dynamics.",
        treaty: "Article III links to applicable international law and UN Charter analysis.",
        posture: "Capability category for legal characterization, not operational endorsement."
      },
      dual: {
        label: "Co-orbital",
        title: "Dual-use proximity operations",
        copy: "Research questions include inspection, servicing, rendezvous, command authority, evidence, and the line between benign and counterspace uses.",
        treaty: "Articles VI and IX supervision, responsibility, due regard, and consultation.",
        posture: "Public preview separates dual-use ambiguity from adopted conclusions."
      },
      nonkinetic: {
        label: "Non-kinetic",
        title: "Non-kinetic and offensive-overmatch effects",
        copy: "Research questions include interference, degradation, cyber-adjacent effects, reversibility, attribution, and strategic characterization.",
        treaty: "Articles III, IV, and IX depending on effect, target, and context.",
        posture: "Source language is treated as a starting point for analysis, not proof of system design."
      }
    };
    const fields = {
      label: legalMatrix.querySelector("[data-matrix-label]"),
      title: legalMatrix.querySelector("[data-matrix-title]"),
      copy: legalMatrix.querySelector("[data-matrix-copy]"),
      treaty: legalMatrix.querySelector("[data-matrix-treaty]"),
      posture: legalMatrix.querySelector("[data-matrix-posture]")
    };
    legalMatrix.querySelectorAll("[data-matrix]").forEach((button) => {
      button.addEventListener("click", () => {
        const state = states[button.dataset.matrix] || states.kinetic;
        legalMatrix.querySelectorAll("[data-matrix]").forEach((item) => {
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", active ? "true" : "false");
        });
        Object.entries(fields).forEach(([key, field]) => {
          if (field) field.textContent = state[key];
        });
      });
    });
  }

  const canvas = document.querySelector("[data-starfield]");
  if (canvas && !prefersReducedMotion) {
    const context = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let stars = [];

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = Array.from({ length: Math.min(160, Math.floor(width / 8)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.35,
        speed: Math.random() * 0.18 + 0.04,
        alpha: Math.random() * 0.55 + 0.25
      }));
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#050505";
      context.fillRect(0, 0, width, height);
      stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(244, 241, 232, ${star.alpha})`;
        context.fill();
      });
      requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
  }

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.classList.remove("is-success", "is-error");
    if (type) status.classList.add(`is-${type}`);
  }

  function validateForm(formData) {
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (fullName.length < 2) return "Please enter your full name.";
    if (!emailPattern.test(email)) return "Please enter a valid email address.";
    return "";
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      const formData = new FormData(form);
      const validationError = validateForm(formData);

      if (validationError) {
        setStatus(validationError, "error");
        return;
      }

      const payload = Object.fromEntries(formData.entries());
      submitButton.disabled = true;
      setStatus("Submitting your application...", "");

      try {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Unable to submit application.");
        form.reset();
        setStatus("Application received. CGI will respond by email.", "success");
      } catch (error) {
        setStatus(`${error.message} You may also email contact@celestialgovernance.org directly.`, "error");
      } finally {
        submitButton.disabled = false;
      }
    });
  }
})();
