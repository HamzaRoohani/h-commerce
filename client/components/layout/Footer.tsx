export function Footer() {
  return (
    <footer className="border-t border-border bg-paper">
      <div className="mx-auto max-w-container px-6 py-12 text-sm text-muted">
        <p className="font-serif text-lg text-ink">H.</p>
        <p className="mt-2 max-w-md">
          Placeholder footer — store info, shipping/returns policy, and social
          links land in a later pass.
        </p>
        <p className="mt-8 text-xs">&copy; {new Date().getFullYear()} H. All rights reserved.</p>
      </div>
    </footer>
  );
}
