import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
const hasSupabaseEnv = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

if (!hasSupabaseEnv) {
  root.render(
    <div className="min-h-screen bg-stone-950 px-6 py-12 text-stone-100">
      <div className="mx-auto max-w-md rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6">
        <h1 className="text-xl font-semibold">Supabase config is missing</h1>
        <p className="mt-3 text-sm text-stone-300">
          Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to `.env.local`,
          then restart the dev server.
        </p>
      </div>
    </div>
  );
} else {
  import('./App.jsx').then(({ default: App }) => {
    root.render(<App />);
  });
}
