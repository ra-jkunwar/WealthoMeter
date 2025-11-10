import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Plus, Upload, X, Loader2, Receipt, Download } from 'lucide-react'
import EntityCard from '../components/EntityCard'

export default function Transactions() {
  const [showForm, setShowForm] = useState(false)
  const [showCSVUpload, setShowCSVUpload] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [formData, setFormData] = useState({
    account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    amount: '',
    transaction_type: 'debit',
    category: 'other',
    description: '',
  })

  const queryClient = useQueryClient()

  // Get accounts for dropdown
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/accounts')
      return response.data
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions?limit=50')
      return response.data
    },
  })

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await api.post('/transactions', transactionData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction created successfully')
      setShowForm(false)
      setFormData({
        account_id: '',
        transaction_date: new Date().toISOString().split('T')[0],
        amount: '',
        transaction_type: 'debit',
        category: 'other',
        description: '',
      })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create transaction')
    },
  })

  const csvUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/transactions/import/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('CSV imported successfully')
      setShowCSVUpload(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to import CSV')
    },
  })

  // Export function
  const exportCSV = async () => {
    try {
      const response = await api.get('/exports/transactions/csv', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `transactions_${format(new Date(), 'yyyyMMdd')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('CSV report downloaded successfully')
    } catch (error: any) {
      console.error('Error exporting CSV:', error)
      toast.error(error.response?.data?.detail || 'Failed to export CSV report')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.account_id) {
      toast.error('Please select an account')
      return
    }
    createTransactionMutation.mutate({
      account_id: parseInt(formData.account_id),
      transaction_date: new Date(formData.transaction_date).toISOString(),
      amount: parseFloat(formData.amount) || 0,
      transaction_type: formData.transaction_type,
      category: formData.category,
      description: formData.description || undefined,
      transaction_id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      csvUploadMutation.mutate(file)
    }
  }

  return (
    <div className="px-6 pt-0 pb-6 sm:pt-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
          <div>
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">Transactions</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track all your financial transactions
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportCSV}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowCSVUpload(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
            >
              <Upload className="h-4 w-4" />
              Upload CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* CSV Upload Modal */}
        {showCSVUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-foreground">Upload CSV</h3>
                <button
                  onClick={() => setShowCSVUpload(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                disabled={csvUploadMutation.isPending}
                className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer disabled:opacity-50"
              />
              <p className="mt-4 text-sm text-muted-foreground">
                Upload a CSV file with transaction data. Format: account_id, date, amount, type, category, description
              </p>
            </div>
          </div>
        )}

        {/* Add Transaction Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-foreground">Add Transaction</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="account_id">
                    Account<span className="text-primary">*</span>
                  </label>
                  <select
                    id="account_id"
                    required
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select an account</option>
                    {accounts?.map((account: any) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.account_type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="transaction_date">
                    Date<span className="text-primary">*</span>
                  </label>
                  <input
                    id="transaction_date"
                    type="date"
                    required
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="amount">
                    Amount<span className="text-primary">*</span>
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="transaction_type">
                    Type<span className="text-primary">*</span>
                  </label>
                  <select
                    id="transaction_type"
                    value={formData.transaction_type}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                    <option value="transfer">Transfer</option>
                    <option value="investment">Investment</option>
                    <option value="redemption">Redemption</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="category">
                    Category<span className="text-primary">*</span>
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="food">Food</option>
                    <option value="transport">Transport</option>
                    <option value="shopping">Shopping</option>
                    <option value="bills">Bills</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="investment">Investment</option>
                    <option value="salary">Salary</option>
                    <option value="transfer">Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="description">
                    Description
                  </label>
                  <input
                    id="description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Transaction description"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createTransactionMutation.isPending}
                    className="hover:-translate-y-0.5 flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
                  >
                    {createTransactionMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Transaction'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transactions Grid - Stat Cards */}
        <div className="rounded border border-sidebar-border bg-sidebar shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 border-sidebar-border border-b px-4 py-3 sm:flex-row">
            <div>
              <h2 className="font-semibold text-lg text-sidebar-foreground tracking-tight">
                All Transactions
              </h2>
              <p className="text-sidebar-foreground/70 text-sm mt-1">
                {data?.length || 0} transaction{data?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse rounded border border-border/50 bg-card p-4">
                    <div className="space-y-3">
                      <div className="h-4 w-20 rounded bg-muted" />
                      <div className="h-6 w-24 rounded bg-muted" />
                      <div className="h-3 w-16 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : data && data.length > 0 ? (
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.map((transaction: any) => {
                  const amount = parseFloat(transaction.amount) || 0
                  const isCredit = transaction.transaction_type === 'credit'
                  return (
                    <EntityCard
                      key={transaction.id}
                      title={transaction.description || transaction.category}
                      subtitle={format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                      value={isCredit ? amount : -amount}
                      icon={Receipt}
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Type</span>
                        <span className={`font-medium capitalize ${isCredit ? 'text-success' : 'text-destructive'}`}>
                          {transaction.transaction_type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium text-foreground capitalize">{transaction.category}</span>
                      </div>
                    </EntityCard>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-6">No transactions found. Add a transaction to get started.</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add Your First Transaction
              </button>
            </div>
          )}
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-xl text-foreground">Transaction Details</h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</label>
                    <p className={`mt-1 text-2xl font-bold ${
                      selectedTransaction.transaction_type === 'credit' ? 'text-success' : 'text-destructive'
                    }`}>
                      {selectedTransaction.transaction_type === 'credit' ? '+' : '-'}₹{Math.abs(parseFloat(selectedTransaction.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</label>
                    <p className="mt-1">
                      <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${
                        selectedTransaction.transaction_type === 'credit'
                          ? 'border-success/20 bg-success/10 text-success'
                          : 'border-destructive/20 bg-destructive/10 text-destructive'
                      }`}>
                        {selectedTransaction.transaction_type}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</label>
                    <p className="mt-1 text-sm text-foreground">
                      {format(new Date(selectedTransaction.transaction_date), 'PPp')}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</label>
                    <p className="mt-1 text-lg font-semibold text-foreground capitalize">{selectedTransaction.category}</p>
                  </div>
                  {selectedTransaction.description && (
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
                      <p className="mt-1 text-sm text-foreground">{selectedTransaction.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
