import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Upload, X, Loader2, Wallet } from 'lucide-react'
import EntityCard from '../components/EntityCard'

interface AccountFormData {
  name: string
  account_type: string
  family_id: number | null
  current_balance: string
  account_number_last_4: string
}

export default function Accounts() {
  const [showForm, setShowForm] = useState(false)
  const [showCSVUpload, setShowCSVUpload] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    account_type: 'savings',
    family_id: null,
    current_balance: '0',
    account_number_last_4: '',
  })

  const queryClient = useQueryClient()

  // Get families for dropdown
  const { data: families } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const response = await api.get('/families')
      return response.data
    },
  })

  // Get accounts
  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/accounts')
      return response.data
    },
  })

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (accountData: any) => {
      const response = await api.post('/accounts', accountData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account created successfully')
      setShowForm(false)
      setFormData({
        name: '',
        account_type: 'savings',
        family_id: null,
        current_balance: '0',
        account_number_last_4: '',
      })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create account')
    },
  })

  // CSV upload mutation
  const csvUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/accounts/import/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('CSV imported successfully')
      setShowCSVUpload(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to import CSV')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.family_id) {
      toast.error('Please select a family')
      return
    }
    createAccountMutation.mutate({
      name: formData.name,
      account_type: formData.account_type,
      family_id: formData.family_id,
      current_balance: parseFloat(formData.current_balance) || 0,
      account_number_last_4: formData.account_number_last_4 || undefined,
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
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">Accounts</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your family's financial accounts
            </p>
          </div>
          <div className="flex gap-3">
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
              Add Account
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
                Upload a CSV file with account data. Format: name, account_type, balance, account_number_last_4
              </p>
            </div>
          </div>
        )}

        {/* Add Account Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-foreground">Add New Account</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="name">
                    Account Name<span className="text-primary">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., HDFC Savings"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="account_type">
                    Account Type<span className="text-primary">*</span>
                  </label>
                  <select
                    id="account_type"
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="savings">Savings</option>
                    <option value="current">Current</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="fixed_deposit">Fixed Deposit</option>
                    <option value="mutual_fund">Mutual Fund</option>
                    <option value="stock">Stock</option>
                    <option value="debt">Debt</option>
                    <option value="collection">Collection</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="family_id">
                    Family<span className="text-primary">*</span>
                  </label>
                  <select
                    id="family_id"
                    required
                    value={formData.family_id || ''}
                    onChange={(e) => setFormData({ ...formData, family_id: parseInt(e.target.value) })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select a family</option>
                    {families?.map((family: any) => (
                      <option key={family.id} value={family.id}>
                        {family.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="current_balance">
                    Current Balance<span className="text-primary">*</span>
                  </label>
                  <input
                    id="current_balance"
                    type="number"
                    step="0.01"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="account_number_last_4">
                    Account Number (Last 4 digits)
                  </label>
                  <input
                    id="account_number_last_4"
                    type="text"
                    maxLength={4}
                    value={formData.account_number_last_4}
                    onChange={(e) => setFormData({ ...formData, account_number_last_4: e.target.value })}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="1234"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createAccountMutation.isPending}
                    className="hover:-translate-y-0.5 flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
                  >
                    {createAccountMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Account'
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

        {/* Accounts Grid - Stat Cards */}
        <div className="rounded border border-sidebar-border bg-sidebar shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 border-sidebar-border border-b px-4 py-3 sm:flex-row">
            <div>
              <h2 className="font-semibold text-lg text-sidebar-foreground tracking-tight">
                All Accounts
              </h2>
              <p className="text-sidebar-foreground/70 text-sm mt-1">
                {data?.length || 0} account{data?.length !== 1 ? 's' : ''}
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
                {data.map((account: any) => {
                  const balance = parseFloat(account.current_balance) || 0
                  return (
                    <EntityCard
                      key={account.id}
                      title={account.name}
                      subtitle={account.account_type}
                      value={balance}
                      icon={Wallet}
                      onClick={() => setSelectedAccount(account)}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium text-foreground capitalize">{account.account_type.replace('_', ' ')}</span>
                      </div>
                      {account.account_number_last_4 && (
                        <div className="flex items-center justify-between text-xs mt-2">
                          <span className="text-muted-foreground">Account</span>
                          <span className="font-medium text-foreground">****{account.account_number_last_4}</span>
                        </div>
                      )}
                    </EntityCard>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-6">No accounts found. Add an account to get started.</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add Your First Account
              </button>
            </div>
          )}
        </div>

        {/* Account Detail Modal */}
        {selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-xl text-foreground">Account Details</h3>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account Name</label>
                    <p className="mt-1 text-lg font-semibold text-foreground">{selectedAccount.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account Type</label>
                    <p className="mt-1 text-lg font-semibold text-foreground capitalize">{selectedAccount.account_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Balance</label>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      ₹{parseFloat(selectedAccount.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  {selectedAccount.account_number_last_4 && (
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account Number</label>
                      <p className="mt-1 text-lg font-semibold text-foreground">****{selectedAccount.account_number_last_4}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</label>
                    <p className="mt-1">
                      <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {selectedAccount.status || 'Active'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</label>
                    <p className="mt-1 text-sm text-foreground">
                      {new Date(selectedAccount.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
