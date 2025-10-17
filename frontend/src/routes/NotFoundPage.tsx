import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="flex flex-col items-center gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 px-10 py-16 text-center shadow-lg">
      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        404
      </span>
      <h2 className="text-3xl font-semibold text-white">Page not found</h2>
      <p className="max-w-md text-sm text-slate-400">
        The page you&rsquo;re looking for either moved or has not been built yet. Use the app navigation
        or head back to the dashboard.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground shadow hover:bg-indigo-500"
      >
        Return home
      </Link>
    </section>
  );
}

export default NotFoundPage;
