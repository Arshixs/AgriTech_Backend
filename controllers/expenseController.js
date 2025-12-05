const Expense = require("../models/Expense");

// Helper to extract ID regardless of Role
const getUserId = (user) => {
  return user.vendorId || user.buyerId || user.userId || user._id;
};

// 1. ADD EXPENSE
exports.addExpense = async (req, res) => {
  try {
    const { title, category, amount, date } = req.body;
    const { role } = req.user;
    const userId = getUserId(req.user);

    if (!userId)
      return res.status(401).json({ message: "User ID not found in token" });

    const expense = new Expense({
      userId,
      userType: role,
      title,
      category,
      amount,
      date: date || Date.now(),
    });

    const savedExpense = await expense.save();
    res.status(201).json({ message: "Expense added", expense: savedExpense });
  } catch (error) {
    console.error("Add Expense Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. GET MY EXPENSES (With Optional Month/Year Filter)
exports.getExpenses = async (req, res) => {
  try {
    const userId = getUserId(req.user);
    const { month, year } = req.query; // Expecting month (1-12) and year (e.g. 2025)

    let query = { userId };

    // Add Date Filter if params exist
    if (month && year) {
      // Javascript Date: Month is 0-indexed (0 = Jan, 11 = Dec)
      // Start: 1st day of month
      const startOfMonth = new Date(year, month - 1, 1);
      // End: Last day of month
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      query.date = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    // Find expenses for THIS specific user
    const expenses = await Expense.find(query).sort({ date: -1 });

    // Calculate total for the filtered result
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    res.status(200).json({
      count: expenses.length,
      total,
      expenses,
    });
  } catch (error) {
    console.error("Get Expenses Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. GET MONTHLY STATS (Aggregation)
exports.getMonthlyStats = async (req, res) => {
  try {
    const userId = getUserId(req.user);

    const stats = await Expense.aggregate([
      { $match: { userId: userId } }, // Filter by User
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }, // Sort: Latest month first
    ]);

    // Format for frontend
    const formattedStats = stats.map((item) => {
      // Create a date object to get Month Name (e.g., "October")
      const date = new Date(item._id.year, item._id.month - 1);
      return {
        label: `${date.toLocaleString("default", { month: "short" })} ${
          item._id.year
        }`,
        month: item._id.month,
        year: item._id.year,
        totalAmount: item.totalAmount,
        count: item.count,
      };
    });

    res.status(200).json({ stats: formattedStats });
  } catch (error) {
    console.error("Get Monthly Stats Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 4. DELETE EXPENSE
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req.user);

    // Ensure user can only delete THEIR OWN expense
    const expense = await Expense.findOneAndDelete({ _id: id, userId });

    if (!expense) {
      return res
        .status(404)
        .json({ message: "Expense not found or unauthorized" });
    }

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
