interface Props {
  label: string;
}

export function UserMenu({ label }: Props) {
  return (
    <div className="flex items-center gap-4 font-mono text-xs">
      <span className="text-muted-foreground">{label}</span>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="-my-3 px-2 py-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          sign out
        </button>
      </form>
    </div>
  );
}
