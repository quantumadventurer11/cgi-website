(function () {
  const form = document.querySelector("#admin-token-form");
  const tokenInput = document.querySelector("#admin-token");
  const status = document.querySelector("#admin-status");
  const body = document.querySelector("#applications-body");
  let token = "";

  function setStatus(message, type) {
    status.textContent = message;
    status.classList.remove("is-success", "is-error");
    if (type) status.classList.add(`is-${type}`);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function headers() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }

  async function updateStatus(id, nextStatus) {
    const response = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: nextStatus })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Unable to update status.");
    }
  }

  function renderRows(applications) {
    if (!applications.length) {
      body.innerHTML = '<tr><td colspan="7">No applications yet.</td></tr>';
      return;
    }

    body.innerHTML = applications.map((application) => `
      <tr>
        <td data-label="Name">${escapeHtml(application.full_name)}</td>
        <td data-label="Email"><a href="mailto:${escapeHtml(application.email)}">${escapeHtml(application.email)}</a></td>
        <td data-label="Affiliation">${escapeHtml(application.affiliation)}</td>
        <td data-label="Interest">${escapeHtml(application.area_of_interest)}</td>
        <td data-label="Message">${escapeHtml(application.message)}</td>
        <td data-label="Created">${escapeHtml(new Date(application.created_at).toLocaleString())}</td>
        <td data-label="Status">
          <span class="status-pill">${escapeHtml(application.status)}</span>
          <select data-id="${application.id}" aria-label="Status for ${escapeHtml(application.full_name)}">
            ${["new", "reviewed", "contacted"].map((statusValue) => `<option value="${statusValue}" ${application.status === statusValue ? "selected" : ""}>${statusValue}</option>`).join("")}
          </select>
        </td>
      </tr>
    `).join("");

    body.querySelectorAll("select[data-id]").forEach((select) => {
      select.addEventListener("change", async () => {
        try {
          await updateStatus(select.dataset.id, select.value);
          const pill = select.parentElement.querySelector(".status-pill");
          if (pill) pill.textContent = select.value;
          setStatus("Status updated.", "success");
        } catch (error) {
          setStatus(error.message, "error");
        }
      });
    });
  }

  async function loadApplications() {
    setStatus("Loading applications...", "");
    const response = await fetch("/api/admin/applications", { headers: headers() });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Unable to load applications.");
    renderRows(result.applications || []);
    setStatus("Applications loaded.", "success");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    token = tokenInput.value.trim();
    if (!token) {
      setStatus("Enter the admin token.", "error");
      return;
    }
    tokenInput.value = "";

    try {
      await loadApplications();
    } catch (error) {
      setStatus(error.message, "error");
    }
  });
})();
