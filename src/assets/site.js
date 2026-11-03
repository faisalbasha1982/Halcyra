// Readiness self-check: answers never leave the browser.
(() => {
  const qs = document.getElementById("qs");
  if (!qs) return;
  const boxes = [...qs.querySelectorAll("input[type=checkbox]")];
  const pct = document.getElementById("pct");
  const bar = document.getElementById("bar");
  const band = document.getElementById("band");
  const advice = document.getElementById("advice");
  const update = () => {
    const p = Math.round((boxes.filter((b) => b.checked).length / boxes.length) * 100);
    pct.textContent = p + "%";
    bar.style.width = p + "%";
    if (p < 40) {
      band.textContent = "Starting out";
      advice.textContent = "Start with a gap assessment and a scoped ISMS. Our 90-day package is built for this stage.";
    } else if (p < 80) {
      band.textContent = "Partly ready";
      advice.textContent = "The core is in place. A focused gap review and internal audit will show what blocks certification.";
    } else {
      band.textContent = "Audit-ready soon";
      advice.textContent = "Book an internal audit and a pentest to close the last gaps before the certification body arrives.";
    }
  };
  qs.addEventListener("change", update);
  update();
})();

// Contact form: posts JSON to the Pages Function at /api/contact.
(() => {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const btn = form.querySelector("button[type=submit]");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "status";
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    data.token = data["cf-turnstile-response"] || "";
    delete data["cf-turnstile-response"];
    btn.disabled = true;
    status.textContent = "Sending…";
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Something went wrong. Please email us instead.");
      status.textContent = "Thanks. We'll reply within one working day.";
      status.classList.add("ok");
      form.reset();
      if (window.turnstile) window.turnstile.reset();
    } catch (err) {
      status.textContent = err.message;
      status.classList.add("err");
      if (window.turnstile) window.turnstile.reset();
    } finally {
      btn.disabled = false;
    }
  });
})();
