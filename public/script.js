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
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
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
        setStatus(`${error.message} You may also email cgi@dfh.org.il directly.`, "error");
      } finally {
        submitButton.disabled = false;
      }
    });
  }
})();
