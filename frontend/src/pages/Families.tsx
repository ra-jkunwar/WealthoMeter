import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, X, Loader2, Users, UserPlus, Mail, Shield, Eye, Edit, FileText, UserCheck, Trash2 } from 'lucide-react'
import EntityCard from '../components/EntityCard'
import { useAuth } from '../hooks/useAuth'

export default function Families() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState<any>(null)
  const [familyName, setFamilyName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [invitePermissions, setInvitePermissions] = useState({
    can_view_all_accounts: true,
    can_edit_accounts: false,
    can_invite_members: false,
    can_export_reports: false,
  })
  const [memberToRemove, setMemberToRemove] = useState<any>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['families'],
    queryFn: async () => {
      const response = await api.get('/families')
      return response.data
    },
  })

  // Fetch family members when a family is selected
  const { data: familyMembers, isLoading: membersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['family-members', selectedFamily?.id],
    queryFn: async () => {
      if (!selectedFamily?.id) return []
      const response = await api.get(`/families/${selectedFamily.id}/members`)
      return response.data
    },
    enabled: !!selectedFamily?.id,
  })

  const createFamilyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/families', { name })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] })
      toast.success('Family created successfully')
      setShowForm(false)
      setFamilyName('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create family')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim()) {
      toast.error('Please enter a family name')
      return
    }
    createFamilyMutation.mutate(familyName)
  }

  const inviteMemberMutation = useMutation({
    mutationFn: async (inviteData: {
      email: string
      role: string
      can_view_all_accounts: boolean
      can_edit_accounts: boolean
      can_invite_members: boolean
      can_export_reports: boolean
    }) => {
      const response = await api.post(`/families/${selectedFamily.id}/members`, inviteData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members', selectedFamily?.id] })
      queryClient.invalidateQueries({ queryKey: ['families'] })
      toast.success('Member invited successfully')
      setShowInviteForm(false)
      setInviteEmail('')
      setInviteRole('viewer')
      setInvitePermissions({
        can_view_all_accounts: true,
        can_edit_accounts: false,
        can_invite_members: false,
        can_export_reports: false,
      })
      refetchMembers()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to invite member')
    },
  })

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }
    inviteMemberMutation.mutate({
      email: inviteEmail,
      role: inviteRole,
      ...invitePermissions,
    })
  }

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await api.delete(`/families/${selectedFamily.id}/members/${memberId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members', selectedFamily?.id] })
      queryClient.invalidateQueries({ queryKey: ['families'] })
      toast.success('Member removed successfully')
      setMemberToRemove(null)
      refetchMembers()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to remove member')
      setMemberToRemove(null)
    },
  })

  const handleRemoveMember = (member: any) => {
    setMemberToRemove(member)
  }

  const confirmRemoveMember = () => {
    if (memberToRemove) {
      removeMemberMutation.mutate(memberToRemove.id)
    }
  }

  // Check if current user is owner of the selected family
  const isOwner = familyMembers?.some(
    (member: any) => member.user_id === user?.id && member.role === 'owner'
  ) || false

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Shield className="h-4 w-4 text-primary" />
      case 'admin':
        return <Shield className="h-4 w-4 text-primary/70" />
      case 'editor':
        return <Edit className="h-4 w-4 text-muted-foreground" />
      default:
        return <Eye className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner'
      case 'admin':
        return 'Admin'
      case 'editor':
        return 'Editor'
      default:
        return 'Viewer'
    }
  }

  return (
    <div className="px-6 pt-0 pb-6 sm:pt-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
          <div>
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">Families</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your family groups and members
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Family
          </button>
        </div>

        {/* Create Family Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-foreground">Create New Family</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="familyName">
                    Family Name<span className="text-primary">*</span>
                  </label>
                  <input
                    id="familyName"
                    type="text"
                    required
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., My Family"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createFamilyMutation.isPending}
                    className="hover:-translate-y-0.5 flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
                  >
                    {createFamilyMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Family'
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

        {/* Families Grid - Stat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded border border-border/50 bg-card p-4">
                <div className="space-y-3">
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="h-6 w-24 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((family: any) => (
              <EntityCard
                key={family.id}
                title={family.name}
                subtitle={`Created ${new Date(family.created_at).toLocaleDateString()}`}
                value="Family"
                icon={Users}
                onClick={() => setSelectedFamily(family)}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-medium text-foreground">{family.member_count || 0}</span>
                </div>
              </EntityCard>
            ))}
          </div>
        ) : (
          <div className="rounded border border-sidebar-border bg-sidebar p-12 text-center shadow-sm">
            <p className="text-muted-foreground mb-6">No families found. Create one to get started.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Your First Family
            </button>
          </div>
        )}

        {/* Family Detail Modal */}
        {selectedFamily && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-3xl rounded-lg border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-xl text-foreground">Family Details</h3>
                <button
                  onClick={() => {
                    setSelectedFamily(null)
                    setShowInviteForm(false)
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Family Name</label>
                    <p className="mt-1 text-lg font-semibold text-foreground">{selectedFamily.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</label>
                    <p className="mt-1 text-sm text-foreground">
                      {new Date(selectedFamily.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Members Section */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg text-foreground">Members</h4>
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
                    >
                      <UserPlus className="h-4 w-4" />
                      Invite Member
                    </button>
                  </div>

                  {membersLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : familyMembers && familyMembers.length > 0 ? (
                    <div className="space-y-3">
                      {familyMembers.map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-input/50 p-4 hover:bg-input transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              {getRoleIcon(member.role)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {member.user?.full_name || member.user?.email || 'Unknown User'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {member.user?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">{getRoleLabel(member.role)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {member.can_view_all_accounts && (
                                  <span className="text-xs text-muted-foreground" title="Can view all accounts">
                                    <Eye className="h-3 w-3" />
                                  </span>
                                )}
                                {member.can_edit_accounts && (
                                  <span className="text-xs text-muted-foreground" title="Can edit accounts">
                                    <Edit className="h-3 w-3" />
                                  </span>
                                )}
                                {member.can_invite_members && (
                                  <span className="text-xs text-muted-foreground" title="Can invite members">
                                    <UserPlus className="h-3 w-3" />
                                  </span>
                                )}
                                {member.can_export_reports && (
                                  <span className="text-xs text-muted-foreground" title="Can export reports">
                                    <FileText className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {member.joined_at && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <UserCheck className="h-3 w-3" />
                                  <span>Joined</span>
                                </div>
                              )}
                              {isOwner && member.user_id !== user?.id && (
                                <button
                                  onClick={() => handleRemoveMember(member)}
                                  className="flex items-center justify-center rounded-md p-1.5 text-primary transition-colors hover:bg-primary/10"
                                  title="Remove member"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No members found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invite Member Modal */}
        {showInviteForm && selectedFamily && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-foreground">Invite Member</h3>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="inviteEmail">
                    Email Address<span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="inviteEmail"
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="h-11 w-full rounded-md border-none bg-input pl-10 pr-3 text-foreground transition-all duration-200 placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20"
                      placeholder="user@example.com"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The user must already have an account. They will be added to this family.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="font-medium text-foreground" htmlFor="inviteRole">
                    Role<span className="text-primary">*</span>
                  </label>
                  <select
                    id="inviteRole"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="h-11 w-full rounded-md border-none bg-input px-3 text-foreground transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="advisor">Advisor</option>
                  </select>
                </div>
                <div className="space-y-3 border-t border-border pt-4">
                  <label className="font-medium text-foreground">Permissions</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitePermissions.can_view_all_accounts}
                        onChange={(e) =>
                          setInvitePermissions({ ...invitePermissions, can_view_all_accounts: e.target.checked })
                        }
                        className="h-4 w-4 cursor-pointer rounded border-border bg-input text-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="text-sm text-foreground">Can view all accounts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitePermissions.can_edit_accounts}
                        onChange={(e) =>
                          setInvitePermissions({ ...invitePermissions, can_edit_accounts: e.target.checked })
                        }
                        className="h-4 w-4 cursor-pointer rounded border-border bg-input text-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="text-sm text-foreground">Can edit accounts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitePermissions.can_invite_members}
                        onChange={(e) =>
                          setInvitePermissions({ ...invitePermissions, can_invite_members: e.target.checked })
                        }
                        className="h-4 w-4 cursor-pointer rounded border-border bg-input text-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="text-sm text-foreground">Can invite members</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitePermissions.can_export_reports}
                        onChange={(e) =>
                          setInvitePermissions({ ...invitePermissions, can_export_reports: e.target.checked })
                        }
                        className="h-4 w-4 cursor-pointer rounded border-border bg-input text-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="text-sm text-foreground">Can export reports</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={inviteMemberMutation.isPending}
                    className="hover:-translate-y-0.5 flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
                  >
                    {inviteMemberMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Invite Member
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Remove Member Confirmation Modal */}
        {memberToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-foreground">Remove Member</h3>
                <button
                  onClick={() => setMemberToRemove(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-foreground">
                  Are you sure you want to remove{' '}
                  <span className="font-semibold">
                    {memberToRemove.user?.full_name || memberToRemove.user?.email || 'this member'}
                  </span>{' '}
                  from the family?
                </p>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. The member will lose access to all family accounts and data.
                </p>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={confirmRemoveMember}
                    disabled={removeMemberMutation.isPending}
                    className="hover:-translate-y-0.5 flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
                  >
                    {removeMemberMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Remove Member
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(null)}
                    disabled={removeMemberMutation.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
