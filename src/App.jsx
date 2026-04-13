import { useEffect, useMemo, useState } from 'react'
import './App.css'

const seedTransactions = [
  {
    id: 'tx-001',
    date: '2026-01-05',
    description: 'Salary payout',
    amount: 4200,
    category: 'Salary',
    type: 'income',
  },
  {
    id: 'tx-002',
    date: '2026-01-08',
    description: 'Groceries',
    amount: 180,
    category: 'Food',
    type: 'expense',
  },
  {
    id: 'tx-003',
    date: '2026-01-12',
    description: 'Electricity bill',
    amount: 96,
    category: 'Utilities',
    type: 'expense',
  },
  {
    id: 'tx-004',
    date: '2026-02-01',
    description: 'Freelance website project',
    amount: 950,
    category: 'Freelance',
    type: 'income',
  },
  {
    id: 'tx-005',
    date: '2026-02-11',
    description: 'Monthly rent',
    amount: 1300,
    category: 'Housing',
    type: 'expense',
  },
  {
    id: 'tx-006',
    date: '2026-02-18',
    description: 'Cinema and dinner',
    amount: 120,
    category: 'Entertainment',
    type: 'expense',
  },
  {
    id: 'tx-007',
    date: '2026-03-02',
    description: 'Salary payout',
    amount: 4200,
    category: 'Salary',
    type: 'income',
  },
  {
    id: 'tx-008',
    date: '2026-03-09',
    description: 'Ride share',
    amount: 54,
    category: 'Transport',
    type: 'expense',
  },
  {
    id: 'tx-009',
    date: '2026-03-19',
    description: 'Stock dividend',
    amount: 210,
    category: 'Investments',
    type: 'income',
  },
  {
    id: 'tx-010',
    date: '2026-03-21',
    description: 'Online shopping',
    amount: 300,
    category: 'Shopping',
    type: 'expense',
  },
  {
    id: 'tx-011',
    date: '2026-04-01',
    description: 'Salary payout',
    amount: 4200,
    category: 'Salary',
    type: 'income',
  },
  {
    id: 'tx-012',
    date: '2026-04-03',
    description: 'Weekend trip',
    amount: 680,
    category: 'Travel',
    type: 'expense',
  },
]

const emptyForm = {
  date: '',
  description: '',
  amount: '',
  category: '',
  type: 'expense',
}

function toCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function useLocalStorageState(key, fallback) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  })

  const updateValue = (next) => {
    setValue((previous) => {
      const resolved = typeof next === 'function' ? next(previous) : next
      localStorage.setItem(key, JSON.stringify(resolved))
      return resolved
    })
  }

  return [value, updateValue]
}

function monthLabel(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', { month: 'short' })
}

function formatDateForExport(dateString) {
  return dateString
}

function escapeCsvValue(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function App() {
  const [transactions, setTransactions] = useLocalStorageState(
    'finance-dashboard-transactions',
    seedTransactions,
  )
  const [theme, setTheme] = useLocalStorageState('finance-dashboard-theme', 'light')
  const [role, setRole] = useState('viewer')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [budgets] = useLocalStorageState('e-tracker-budgets', {
    Food: 400,
    Utilities: 150,
    Entertainment: 200,
    Housing: 1400,
    Shopping: 300,
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const categories = useMemo(
    () => [...new Set(transactions.map((item) => item.category))].sort(),
    [transactions],
  )

  const summary = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((acc, item) => acc + item.amount, 0)
    const expenses = transactions
      .filter((item) => item.type === 'expense')
      .reduce((acc, item) => acc + item.amount, 0)

    return {
      income,
      expenses,
      balance: income - expenses,
    }
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = transactions.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter
      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter
      const matchesQuery =
        q.length === 0 ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      return matchesType && matchesCategory && matchesQuery
    })

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'amount-asc':
          return a.amount - b.amount
        case 'amount-desc':
          return b.amount - a.amount
        case 'date-asc':
          return new Date(a.date) - new Date(b.date)
        case 'date-desc':
        default:
          return new Date(b.date) - new Date(a.date)
      }
    })

    return list
  }, [transactions, query, typeFilter, categoryFilter, sortBy])

  const monthlyTrend = useMemo(() => {
    const byMonth = {}
    transactions.forEach((item) => {
      const key = item.date.slice(0, 7)
      if (!byMonth[key]) {
        byMonth[key] = { income: 0, expenses: 0 }
      }
      if (item.type === 'income') {
        byMonth[key].income += item.amount
      } else {
        byMonth[key].expenses += item.amount
      }
    })

    const months = Object.keys(byMonth).sort().slice(-6)
    return months.reduce((acc, key) => {
      const net = byMonth[key].income - byMonth[key].expenses
      const previousBalance = acc.length === 0 ? 0 : acc[acc.length - 1].balance
      return [
        ...acc,
        {
          key,
          month: monthLabel(`${key}-01`),
          net,
          balance: previousBalance + net,
        },
      ]
    }, [])
  }, [transactions])

  const spendingBreakdown = useMemo(() => {
    const expenseMap = {}
    transactions
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        expenseMap[item.category] = (expenseMap[item.category] || 0) + item.amount
      })

    const total = Object.values(expenseMap).reduce((acc, amount) => acc + amount, 0)
    return Object.entries(expenseMap)
      .map(([category, amount]) => ({
        category,
        amount,
        share: total === 0 ? 0 : (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions])

  const insights = useMemo(() => {
    const highestCategory = spendingBreakdown[0]
    const sortedMonthly = monthlyTrend.map((item) => item.net)
    const current = sortedMonthly.at(-1) ?? 0
    const previous = sortedMonthly.at(-2) ?? 0
    const delta = previous === 0 ? 0 : ((current - previous) / Math.abs(previous)) * 100
    const largestExpense = transactions
      .filter((item) => item.type === 'expense')
      .sort((a, b) => b.amount - a.amount)[0]
    
    const expenseTransactions = transactions.filter((item) => item.type === 'expense')
    const avgExpense = expenseTransactions.length > 0 
      ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / expenseTransactions.length 
      : 0
    
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
    const currentMonthExpenses = transactions
      .filter((item) => {
        const date = new Date(item.date)
        const now = new Date()
        return item.type === 'expense' && 
               date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear()
      })
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      highestCategory,
      current,
      previous,
      delta,
      largestExpense,
      avgExpense,
      currentMonth,
      currentMonthExpenses,
    }
  }, [spendingBreakdown, monthlyTrend, transactions])

  const linePoints = useMemo(() => {
    if (monthlyTrend.length === 0) {
      return ''
    }

    const width = 560
    const height = 220
    const values = monthlyTrend.map((item) => item.balance)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    return monthlyTrend
      .map((item, index) => {
        const x = (index / Math.max(monthlyTrend.length - 1, 1)) * width
        const y = height - ((item.balance - min) / range) * height
        return `${x},${y}`
      })
      .join(' ')
  }, [monthlyTrend])

  const exportTransactions = (format) => {
    if (transactions.length === 0) {
      return
    }

    const filename = `finance-transactions-${new Date().toISOString().slice(0, 10)}`
    let content = ''
    let mimeType = 'text/plain'

    if (format === 'csv') {
      const header = ['Date', 'Description', 'Category', 'Type', 'Amount']
      const rows = transactions.map((item) => [
        formatDateForExport(item.date),
        item.description,
        item.category,
        item.type,
        item.amount,
      ])
      content = [header, ...rows]
        .map((row) => row.map(escapeCsvValue).join(','))
        .join('\n')
      mimeType = 'text/csv'
    } else {
      content = JSON.stringify(transactions, null, 2)
      mimeType = 'application/json'
    }

    const blob = new Blob([content], { type: mimeType })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(link.href)
  }

  const deleteTransaction = (id) => {
    const target = transactions.find((item) => item.id === id)
    if (!target) {
      return
    }

    const confirmed = window.confirm(
      `Delete ${target.description} (${toCurrency(target.amount)})?`,
    )

    if (!confirmed) {
      return
    }

    setTransactions((items) => items.filter((item) => item.id !== id))
    if (editingId === id) {
      resetForm()
    }
  }

  const startAddTransaction = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10),
    })
    setIsFormVisible(true)
  }

  const startEditTransaction = (id) => {
    const target = transactions.find((item) => item.id === id)
    if (!target) {
      return
    }
    setEditingId(id)
    setForm({
      date: target.date,
      description: target.description,
      amount: String(target.amount),
      category: target.category,
      type: target.type,
    })
    setIsFormVisible(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setIsFormVisible(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!form.date || !form.description || !form.category || amount <= 0) {
      return
    }

    if (editingId) {
      setTransactions((items) =>
        items.map((item) =>
          item.id === editingId
            ? {
                ...item,
                date: form.date,
                description: form.description,
                amount,
                category: form.category,
                type: form.type,
              }
            : item,
        ),
      )
    } else {
      const newTransaction = {
        id: `tx-${crypto.randomUUID()}`,
        date: form.date,
        description: form.description,
        amount,
        category: form.category,
        type: form.type,
      }
      setTransactions((items) => [newTransaction, ...items])
    }

    resetForm()
  }

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="topbar-left">
          <h1>💰 E-TRACKER</h1>
        </div>
        <div className="topbar-right">
          <div className="role-control">
            <label htmlFor="role">📋 Role</label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="viewer">👁️ Viewer</option>
              <option value="admin">⚙️ Admin</option>
            </select>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <section className="summary-grid">
        <article className="card highlight">
          <h2>Total Balance</h2>
          <p className="big">{toCurrency(summary.balance)}</p>
          <small>Current net position across all transactions</small>
        </article>
        <article className="card income">
          <h2>Total Income</h2>
          <p className="big">{toCurrency(summary.income)}</p>
          <small>All incoming cash flow</small>
        </article>
        <article className="card expense">
          <h2>Total Expenses</h2>
          <p className="big">{toCurrency(summary.expenses)}</p>
          <small>All outgoing cash flow</small>
        </article>
      </section>

      <section className="layout-grid">
        <article className="card chart-card">
          <h2>📈 Balance Trend</h2>
          {monthlyTrend.length > 0 ? (
            <>
              <svg viewBox="0 0 560 250" className="line-chart" role="img" aria-label="Balance trend">
                <defs>
                  <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(10, 118, 91, 0.35)" />
                    <stop offset="100%" stopColor="rgba(10, 118, 91, 0.05)" />
                  </linearGradient>
                </defs>
                <polyline points={linePoints} fill="none" stroke="#0a765b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={`${linePoints} 560,250 0,250`} fill="url(#lineFill)" stroke="none" />
              </svg>
              <div
                className="line-labels"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(monthlyTrend.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                {monthlyTrend.map((item) => (
                  <span key={item.key}>{item.month}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="empty">No monthly trend available yet.</p>
          )}
        </article>

        <article className="card chart-card">
          <h2>🎯 Spending Breakdown</h2>
          {spendingBreakdown.length > 0 ? (
            <div className="bars">
              {spendingBreakdown.map((item) => (
                <div key={item.category} className="bar-row">
                  <div className="bar-meta">
                    <span>{item.category}</span>
                    <span>{toCurrency(item.amount)}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(item.share, 3)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No expense data to break down.</p>
          )}
        </article>
      </section>

      <section className="card insights-card">
        <h2>💡 Quick Insights</h2>
        <div className="insights-grid">
          <article>
            <h3>Highest Spending Category</h3>
            <p>
              {insights.highestCategory
                ? `${insights.highestCategory.category} (${toCurrency(insights.highestCategory.amount)})`
                : 'No expense data yet'}
            </p>
          </article>
          <article>
            <h3>Monthly Net Comparison</h3>
            <p>
              {insights.previous === 0
                ? 'Need at least two months of data'
                : `${insights.delta >= 0 ? '+' : ''}${insights.delta.toFixed(1)}% vs previous month`}
            </p>
          </article>
          <article>
            <h3>Largest Expense</h3>
            <p>
              {insights.largestExpense
                ? `${insights.largestExpense.description} - ${toCurrency(insights.largestExpense.amount)}`
                : 'No expenses recorded'}
            </p>
          </article>
          <article>
            <h3>Average Expense</h3>
            <p>{toCurrency(insights.avgExpense)}</p>
          </article>
          <article>
            <h3>This Month Spent</h3>
            <p>{toCurrency(insights.currentMonthExpenses)}</p>
          </article>
          <article>
            <h3>Period</h3>
            <p>{insights.currentMonth}</p>
          </article>
        </div>
      </section>

      <section className="card insights-card">
        <h2>📊 Budget Overview</h2>
        <div className="budget-grid">
          {Object.entries(budgets).map(([category, limit]) => {
            const spent = spendingBreakdown.find((b) => b.category === category)?.amount || 0
            const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
            const isOverBudget = spent > limit
            return (
              <div key={category} className="budget-item">
                <div className="budget-header">
                  <span className="budget-category">{category}</span>
                  <span className={`budget-amount ${isOverBudget ? 'over-budget' : ''}`}>
                    {toCurrency(spent)} / {toCurrency(limit)}
                  </span>
                </div>
                <div className="budget-bar">
                  <div
                    className={`budget-fill ${isOverBudget ? 'over' : percentage > 80 ? 'warning' : 'ok'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <p className="budget-status">{percentage.toFixed(0)}% used</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card transactions-card">
        <div className="transactions-header">
          <h2>📊 Transactions</h2>
          <div className="action-bar">
            <button
              type="button"
              className="secondary"
              onClick={() => exportTransactions('csv')}
              aria-label="Export transactions as CSV"
              title="Download as CSV"
            >
              📥 CSV
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => exportTransactions('json')}
              aria-label="Export transactions as JSON"
              title="Download as JSON"
            >
              📥 JSON
            </button>
            {role === 'admin' ? (
              <button type="button" className="primary" onClick={startAddTransaction}>
                ➕ Add Transaction
              </button>
            ) : (
              <p className="role-note">Viewer role can only inspect data.</p>
            )}
          </div>
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Search by description or category"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Amount high to low</option>
            <option value="amount-asc">Amount low to high</option>
          </select>
        </div>

        {isFormVisible && role === 'admin' && (
          <form className="editor" onSubmit={handleSubmit}>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              required
            />
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Amount"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              required
            />
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button type="submit" className="primary">
              {editingId ? 'Save changes' : 'Create'}
            </button>
            <button type="button" className="ghost" onClick={resetForm}>
              Cancel
            </button>
          </form>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                {role === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={role === 'admin' ? 6 : 5} className="empty-row">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.description}</td>
                    <td>{item.category}</td>
                    <td>
                      <span className={`pill ${item.type}`}>{item.type}</span>
                    </td>
                    <td className={item.type === 'income' ? 'pos' : 'neg'}>
                      {item.type === 'income' ? '+' : '-'}
                      {toCurrency(item.amount)}
                    </td>
                    {role === 'admin' && (
                      <td className="row-actions">
                        <button
                          type="button"
                          className="mini"
                          onClick={() => startEditTransaction(item.id)}
                          aria-label={`Edit ${item.description}`}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="mini danger"
                          onClick={() => deleteTransaction(item.id)}
                          aria-label={`Delete ${item.description}`}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default App
