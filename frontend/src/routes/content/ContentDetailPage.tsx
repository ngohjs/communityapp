import { useParams } from "react-router-dom";

export default function ContentDetailPage() {
  const { contentId } = useParams();
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
      Content detail view for <span className="text-white">{contentId}</span> coming soon.
    </section>
  );
}
