import { useNavigate } from 'react-router-dom'
import { ArrowRightLeft, Check } from 'lucide-react'
import { cn } from '@/utils/cn'
import { DEMO_ACCOUNTS, DEMO_HINT } from '@/data/constants/accounts'
import { homeForRole, useAuth } from '@/store/auth'
import { useToast } from '@/store/ui'
import { Modal } from '@/components/common/Modal'
import { Avatar } from '@/components/common/Avatar'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import type { DemoAccount } from '@/types'

const ROLE_TONE = {
  chairman: 'brand',
  director: 'info',
  principal: 'brand',
  classTeacher: 'gold',
  subjectTeacher: 'info',
  student: 'success',
  accountant: 'gold',
} as const

function AccountCard({
  account,
  active,
  onSelect,
}: {
  account: DemoAccount
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition',
        active ? 'border-royal/50 bg-royal-soft' : 'border-line bg-panel hover:border-line-strong hover:bg-muted',
      )}
    >
      <Avatar name={account.displayName} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-ink">{account.displayName}</span>
        <span className="mt-0.5 block truncate text-[11px] text-ink2">{account.title}</span>
        <span className="mt-1.5 block">
          <Badge tone={ROLE_TONE[account.role]} size="sm">
            {account.username}
          </Badge>
        </span>
      </span>
      {active ? (
        <Check className="h-4 w-4 shrink-0 text-royal" />
      ) : (
        <ArrowRightLeft className="h-4 w-4 shrink-0 text-ink3 opacity-0 transition group-hover:opacity-100" />
      )}
    </button>
  )
}

/** Modal used by the top bar / profile menu to jump between demo roles. */
export function DemoSwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session, switchAccount } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Switch demonstration account"
      description={DEMO_HINT}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-[11px] text-ink2">
            Role switching simulates access only — this prototype performs no authentication.
          </p>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="grid gap-2.5 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            active={session?.accountId === account.id}
            onSelect={() => {
              switchAccount(account.id)
              navigate(homeForRole(account.role))
              onClose()
              toast.info(`Switched to ${account.displayName}`, account.title)
            }}
          />
        ))}
      </div>
    </Modal>
  )
}

/** Inline picker shown on the login screen under “Explore Demo”. */
export function DemoAccountPicker({ onSelect }: { onSelect: (account: DemoAccount) => void }) {
  const { session } = useAuth()
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {DEMO_ACCOUNTS.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => onSelect(account)}
          className={cn(
            'flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition',
            session?.accountId === account.id
              ? 'border-royal/50 bg-royal-soft'
              : 'border-line bg-panel hover:border-line-strong hover:bg-muted',
          )}
        >
          <Avatar name={account.displayName} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold text-ink">{account.displayName}</span>
            <span className="block truncate text-[11px] text-ink2">{account.title}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
