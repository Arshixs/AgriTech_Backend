const express = require('express');
const router = express.Router();
const { 
  addExpense, 
  getExpenses, 
  deleteExpense, 
  getMonthlyStats // <--- Import this
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/add', addExpense);
router.get('/', getExpenses); 
router.get('/monthly', getMonthlyStats); // <--- Add this Route
router.delete('/:id', deleteExpense);

module.exports = router;
