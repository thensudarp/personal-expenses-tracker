


const API_URL = "/api/expenses";

const expenseForm = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const formHeading = document.getElementById("formHeading");
const messageElement = document.getElementById("message");

const totalExpensesElement = document.getElementById("totalExpenses");
const monthlyExpensesElement = document.getElementById("monthlyExpenses");
const transactionCountElement = document.getElementById("transactionCount");
const expenseTableBody = document.getElementById("expenseTableBody");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const monthFilter = document.getElementById("monthFilter");

let expenses = [];
let editingId = null;

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function showMessage(message, type = "success") {
  if (!messageElement) return;

  messageElement.textContent = message;
  messageElement.className = `message ${type}`;
  messageElement.hidden = false;

  window.clearTimeout(showMessage.timeoutId);
  showMessage.timeoutId = window.setTimeout(() => {
    messageElement.hidden = true;
  }, 4000);
}

async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" && data !== null
        ? data.error || data.message
        : data;

    throw new Error(
      errorMessage || `Request failed with status ${response.status}`
    );
  }

  return data;
}

async function loadExpenses() {
  try {
    const data = await requestJSON(API_URL);
    expenses = Array.isArray(data) ? data : [];
    renderExpenses();
  } catch (error) {
    console.error("Could not load expenses:", error);
    showMessage(
      `Could not load expenses. ${error.message}. Check that the server is running.`,
      "error"
    );
    expenseTableBody.innerHTML = `
      <tr>
        <td colspan="6">Could not load expenses. Please restart the server.</td>
      </tr>`;
  }
}

function getFilteredExpenses() {
  const searchTerm = (searchInput?.value || "").trim().toLowerCase();
  const selectedCategory = categoryFilter?.value || "";
  const selectedMonth = monthFilter?.value || "";

  return expenses.filter((expense) => {
    const matchesSearch =
      !searchTerm ||
      String(expense.title || "").toLowerCase().includes(searchTerm) ||
      String(expense.description || "").toLowerCase().includes(searchTerm) ||
      String(expense.category || "").toLowerCase().includes(searchTerm);

    const matchesCategory =
      !selectedCategory || expense.category === selectedCategory;

    const matchesMonth =
      !selectedMonth || String(expense.date || "").startsWith(selectedMonth);

    return matchesSearch && matchesCategory && matchesMonth;
  });
}

function renderExpenses() {
  const filteredExpenses = getFilteredExpenses();

  updateSummary();

  if (filteredExpenses.length === 0) {
    expenseTableBody.innerHTML = `
      <tr>
        <td colspan="6">No expenses found. Add an expense to get started.</td>
      </tr>`;
    return;
  }

  expenseTableBody.innerHTML = filteredExpenses
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map((expense) => `
      <tr>
        <td>${escapeHTML(expense.title)}</td>
        <td>${formatMoney(expense.amount)}</td>
        <td>${escapeHTML(expense.category)}</td>
        <td>${escapeHTML(expense.date)}</td>
        <td>${escapeHTML(expense.description || "—")}</td>
        <td class="action-buttons">
          <button type="button" class="edit-btn" data-action="edit" data-id="${escapeHTML(expense.id)}">Edit</button>
          <button type="button" class="delete-btn" data-action="delete" data-id="${escapeHTML(expense.id)}">Delete</button>
        </td>
      </tr>
    `)
    .join("");
}

function updateSummary() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const monthlyTotal = expenses
    .filter((expense) => String(expense.date || "").startsWith(currentMonth))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  totalExpensesElement.textContent = formatMoney(total);
  monthlyExpensesElement.textContent = formatMoney(monthlyTotal);
  transactionCountElement.textContent = String(expenses.length);
}

function resetForm() {
  expenseForm.reset();
  editingId = null;

  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  formHeading.textContent = "Add Expense";
  submitButton.textContent = "Add Expense";
  cancelEditButton.hidden = true;
}

expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;
  const description = descriptionInput.value.trim();

  if (!title || !category || !date || !Number.isFinite(amount) || amount <= 0) {
    showMessage("Enter a title, a valid amount, a category, and a date.", "error");
    return;
  }

  const expenseData = { title, amount, category, date, description };
  const isEditing = editingId !== null;
  const url = isEditing
    ? `${API_URL}/${encodeURIComponent(editingId)}`
    : API_URL;

  submitButton.disabled = true;
  submitButton.textContent = isEditing ? "Saving..." : "Adding...";

  try {
    await requestJSON(url, {
      method: isEditing ? "PUT" : "POST",
      body: JSON.stringify(expenseData)
    });

    await loadExpenses();
    resetForm();
    showMessage(isEditing ? "Expense updated successfully." : "Expense added successfully.");
  } catch (error) {
    console.error("Could not save expense:", error);
    showMessage(`Could not save expense: ${error.message}`, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingId !== null ? "Save Changes" : "Add Expense";
  }
});

expenseTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  const expense = expenses.find((item) => String(item.id) === String(id));

  if (!expense) {
    showMessage("That expense could not be found. Refresh and try again.", "error");
    return;
  }

  if (action === "edit") {
    editingId = expense.id;

    titleInput.value = expense.title || "";
    amountInput.value = expense.amount ?? "";
    categoryInput.value = expense.category || "";
    dateInput.value = expense.date || "";
    descriptionInput.value = expense.description || "";

    formHeading.textContent = "Edit Expense";
    submitButton.textContent = "Save Changes";
    cancelEditButton.hidden = false;

    expenseForm.scrollIntoView({ behavior: "smooth", block: "start" });
    titleInput.focus();
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm(`Delete "${expense.title}"?`);
    if (!confirmed) return;

    button.disabled = true;

    try {
      await requestJSON(`${API_URL}/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });

      if (String(editingId) === String(id)) {
        resetForm();
      }

      await loadExpenses();
      showMessage("Expense deleted successfully.");
    } catch (error) {
      console.error("Could not delete expense:", error);
      showMessage(`Could not delete expense: ${error.message}`, "error");
      button.disabled = false;
    }
  }
});

cancelEditButton.addEventListener("click", resetForm);

searchInput.addEventListener("input", renderExpenses);
categoryFilter.addEventListener("change", renderExpenses);
monthFilter.addEventListener("change", renderExpenses);

dateInput.value = new Date().toISOString().slice(0, 10);
loadExpenses();
