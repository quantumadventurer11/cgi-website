(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const progress = document.querySelector("[data-scroll-progress]");
  const year = document.querySelector("[data-year]");
  const form = document.querySelector("#application-form");
  const status = document.querySelector("#form-status");

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
      context.fillStyle = "#06122E";
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

  const lunarAtlas = document.querySelector("[data-lunar-atlas]");
  if (lunarAtlas) {
    const baseData = {
      amity: {
        phase: "Phase I governance node",
        name: "Amity City",
        coordinates: "Diplomatic and administrative coordination",
        purpose: "Diplomatic, administrative, and standards-setting hub for early multilateral activity.",
        layout: "Administrative forum, civil services district, logistics port, public research campus, and settlement commons.",
        governance: "Tests secretariat functions, registry support, dispute intake, and public transparency reporting.",
        infrastructure: "Landing safety zone, communications spine, habitation district, data archive, and visiting delegation facilities.",
        function: "Coordination center for science access, civil administration, and public-interest settlement planning.",
        status: "Proposed international administrative district under a treaty-based lunar authority."
      },
      mycenae: {
        phase: "Phase II science and heritage node",
        name: "Mycenae",
        coordinates: "Science, heritage, and long-duration research",
        purpose: "Scientific operations, heritage protection, and long-duration research governance.",
        layout: "Research campus, protected heritage buffer, instrument fields, habitat clusters, and rover corridors.",
        governance: "Administers science access protocols, heritage safeguards, and research data transparency.",
        infrastructure: "Laboratories, observatories, archive vaults, sample handling facilities, and controlled mobility routes.",
        function: "Science, preservation, education, and public-interest research access.",
        status: "Proposed protected science district with special administrative safeguards."
      },
      hattusa: {
        phase: "Phase III power and logistics node",
        name: "Hattusa",
        coordinates: "Power, logistics, and volatile-access governance",
        purpose: "Power, volatile-access logistics, and infrastructure support for the broader lunar network.",
        layout: "Solar ridge arrays, cold-trap operations support, cryogenic storage, industrial safety buffers, and logistics yards.",
        governance: "Coordinates resource activity licensing, environmental monitoring, and shared infrastructure rules.",
        infrastructure: "Power grids, landing pads, storage tanks, maintenance bays, and robotic survey corridors.",
        function: "Resource support, energy distribution, water-ice logistics, and industrial safety coordination.",
        status: "Proposed regulated resource-support district under international oversight."
      },
      tycho: {
        phase: "Phase IV resilience and deep-field node",
        name: "Tycho",
        coordinates: "Resilience, contingency, and exploration support",
        purpose: "Resilient infrastructure, deep-field exploration support, and distributed emergency capability.",
        layout: "Shielded habitats, emergency reserves, deep-field mission control, construction yards, and science outposts.",
        governance: "Provides redundancy for administration, emergency coordination, and inter-node operational continuity.",
        infrastructure: "Radiation-shielded shelters, backup communications, repair depots, and long-range rover staging.",
        function: "Settlement resilience, engineering, exploration staging, and contingency administration.",
        status: "Proposed resilient operations district with network continuity responsibilities."
      }
    };

    const fields = {
      phase: lunarAtlas.querySelector("[data-base-phase]"),
      name: lunarAtlas.querySelector("[data-base-name]"),
      coordinates: lunarAtlas.querySelector("[data-base-coordinates]"),
      purpose: lunarAtlas.querySelector("[data-base-purpose]"),
      layout: lunarAtlas.querySelector("[data-base-layout]"),
      governance: lunarAtlas.querySelector("[data-base-governance]"),
      infrastructure: lunarAtlas.querySelector("[data-base-infrastructure]"),
      function: lunarAtlas.querySelector("[data-base-function]"),
      status: lunarAtlas.querySelector("[data-base-status]")
    };

    function selectBase(key) {
      const data = baseData[key];
      if (!data) return;

      Object.entries(fields).forEach(([field, element]) => {
        if (element) element.textContent = data[field];
      });

      lunarAtlas.querySelectorAll("[data-base]").forEach((button) => {
        const isActive = button.dataset.base === key;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    }

    lunarAtlas.querySelectorAll("[data-base]").forEach((button) => {
      button.addEventListener("click", () => selectBase(button.dataset.base));
    });
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
