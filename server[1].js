
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3006;

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "expenses.json");

// Create storage folder and file if they do not exist.
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

function readExpenses() {
  try {
    const contents = fs.readFileSync(DATA_FILE, "utf8");
    const expenses = JSON.parse(contents || "[]");
    return Array.isArray(expenses) ? expenses : [];
  } catch (error) {
    console.error("Could not read expenses:", error.message);
    throw new Error("Could not read expense data.");
  }
}

function writeExpenses(expenses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2), "utf8");
}

// Check that the backend is running.
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Expense Tracker API is running." });
});

// Get all expenses.
app.get("/api/expenses", (req, res) => {
  try {
    res.json(readExpenses());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add an expense.
app.post("/api/expenses", (req, res) => {
  try {
    const { title, amount, category, date, description = "" } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      amount === undefined ||
      amount === "" ||
      !category ||
      !date
    ) {
      return res.status(400).json({
        error: "Please provide a title, amount, category, and date."
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: "Amount must be a number greater than zero."
      });
    }

    const expenses = readExpenses();

    const newExpense = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title: title.trim(),
      amount: numericAmount,
      category: String(category),
      date: String(date),
      description: String(description).trim(),
      createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    writeExpenses(expenses);

    return res.status(201).json(newExpense);
  } catch (error) {
    console.error("Add expense failed:", error);
    return res.status(500).json({
      error: error.message || "Unable to save expense."
    });
  }
});

// Edit an expense.
app.put("/api/expenses/:id", (req, res) => {
  try {
    const expenses = readExpenses();
    const index = expenses.findIndex(
      (expense) => String(expense.id) === String(req.params.id)
    );

    if (index === -1) {
      return res.status(404).json({ error: "Expense not found." });
    }

    const { title, amount, category, date, description = "" } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      amount === undefined ||
      amount === "" ||
      !category ||
      !date
    ) {
      return res.status(400).json({
        error: "Please provide a title, amount, category, and date."
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: "Amount must be a number greater than zero."
      });
    }

    const updatedExpense = {
      ...expenses[index],
      title: title.trim(),
      amount: numericAmount,
      category: String(category),
      date: String(date),
      description: String(description).trim(),
      updatedAt: new Date().toISOString()
    };

    expenses[index] = updatedExpense;
    writeExpenses(expenses);

    return res.json(updatedExpense);
  } catch (error) {
    console.error("Update expense failed:", error);
    return res.status(500).json({
      error: error.message || "Unable to update expense."
    });
  }
});

// Delete an expense.
app.delete("/api/expenses/:id", (req, res) => {
  try {
    const expenses = readExpenses();
    const remaining = expenses.filter(
      (expense) => String(expense.id) !== String(req.params.id)
    );

    if (remaining.length === expenses.length) {
      return res.status(404).json({ error: "Expense not found." });
    }

    writeExpenses(remaining);
    return res.json({ success: true, message: "Expense deleted." });
  } catch (error) {
    console.error("Delete expense failed:", error);
    return res.status(500).json({
      error: error.message || "Unable to delete expense."
    });
  }
});

// Return clear errors for unknown API routes.
app.use("/api", (req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`Expense Tracker running at http://localhost:${PORT}`);
});
