import { Plus } from "lucide-react";
import { changeOwnPasswordAction, createUserAction, resetPasswordAction, updateUserAction } from "@/app/actions";
import { PasswordInput, ResultForm, SubmitButton } from "@/components/client";
import { Avatar, PageHeader } from "@/components/ui";
import { listUsers, requireUser, type AppUser } from "@/lib/auth";

export default async function UsersPage() {
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const users = await listUsers();
  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Users" subtitle={`${activeCount} of 10 active. Admins manage users, skills, models and billing.`} />
      <div className="space-y-4">
        <section className="card p-5">
          <h3 className="mb-3 text-[15px] font-semibold tracking-tight">Your password</h3>
          <ResultForm action={changeOwnPasswordAction} okText="Password changed. Your other devices are signed out." className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="current-password">Current password</label>
                <PasswordInput id="current-password" name="current" autoComplete="current-password" required className="input" />
              </div>
              <div>
                <label className="label" htmlFor="new-password">New password</label>
                <PasswordInput id="new-password" name="next" autoComplete="new-password" minLength={10} required className="input" />
              </div>
            </div>
            <SubmitButton className="btn btn-ghost btn-sm">Change Password</SubmitButton>
          </ResultForm>
        </section>

        {users.filter((u) => isAdmin || u.active).map((u) =>
          isAdmin ? <UserCard key={u.username} user={u} isMe={u.username === me.username} /> : <UserRow key={u.username} user={u} />,
        )}

        {isAdmin && (
          <details className="card p-5">
            <summary className="flex cursor-pointer items-center gap-2 text-[15px] font-medium text-accent">
              <span className="grid size-7 place-items-center rounded-full bg-accent/12">
                <Plus className="size-4" strokeWidth={2.2} />
              </span>
              Add a User
            </summary>
            <ResultForm action={createUserAction} okText="User added. Send them the password and ask them to change it here." className="mt-5 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="new-username">Username</label>
                  <input id="new-username" name="username" required maxLength={20} autoComplete="off" className="input" />
                  <p className="mt-1 text-[11px] text-faint">Can&apos;t be changed later.</p>
                </div>
                <div>
                  <label className="label" htmlFor="new-name">Name</label>
                  <input id="new-name" name="name" className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="new-user-password">Temporary password</label>
                  <PasswordInput id="new-user-password" name="password" autoComplete="new-password" minLength={10} required className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="new-role">Role</label>
                  <RoleSelect id="new-role" value="member" />
                </div>
              </div>
              <SubmitButton className="btn btn-primary btn-sm">Add User</SubmitButton>
            </ResultForm>
          </details>
        )}
      </div>
    </div>
  );
}

function RoleSelect({ id, value }: { id: string; value: string }) {
  return (
    <select id={id} name="role" defaultValue={value} className="input">
      <option value="member">Member</option>
      <option value="admin">Admin</option>
    </select>
  );
}

function UserRow({ user }: { user: AppUser }) {
  return (
    <section className="card flex items-center gap-3 p-4">
      <Avatar username={user.username} size={28} />
      <div className="min-w-0 flex-1 truncate text-[14px] font-medium">{user.name}</div>
      <span className="text-xs capitalize text-muted">{user.role}</span>
    </section>
  );
}

function UserCard({ user, isMe }: { user: AppUser; isMe: boolean }) {
  return (
    <section className={`card p-5 ${user.active ? "" : "opacity-70"}`}>
      <div className="mb-3 flex items-center gap-2.5">
        <Avatar username={user.username} size={28} />
        <span className="font-mono text-[13px]">{user.username}</span>
        {isMe && <span className="text-xs text-muted">You</span>}
        {!user.active && <span className="text-xs text-danger">Disabled</span>}
      </div>
      <ResultForm action={updateUserAction.bind(null, user.username)} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor={`name-${user.username}`}>Name</label>
            <input id={`name-${user.username}`} name="name" defaultValue={user.name} required className="input" />
          </div>
          <div>
            <label className="label" htmlFor={`role-${user.username}`}>Role</label>
            <RoleSelect id={`role-${user.username}`} value={user.role} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" name="active" defaultChecked={user.active} />
            Can sign in
          </label>
          <SubmitButton className="btn btn-ghost btn-sm">Save</SubmitButton>
        </div>
      </ResultForm>
      {!isMe && (
        <ResultForm action={resetPasswordAction.bind(null, user.username)} okText="Password reset. They're signed out everywhere." className="mt-4 space-y-2 border-t border-line pt-4">
          <label className="label" htmlFor={`reset-${user.username}`}>Set a new password</label>
          <div className="flex gap-2">
            <PasswordInput id={`reset-${user.username}`} name="password" autoComplete="new-password" minLength={10} required className="input" />
            <SubmitButton className="btn btn-ghost btn-sm shrink-0">Reset</SubmitButton>
          </div>
        </ResultForm>
      )}
    </section>
  );
}
