import { useState, useEffect } from 'react';
import { Scale, Utensils, Leaf, CheckCircle2, Activity } from 'lucide-react';
import api from '../api/axios';

export default function ImpactBanner({ refreshTrigger = 0 }) {
  const [stats, setStats] = useState({
    totalWeightKg: 0,
    mealsServed: 0,
    co2SavedKg: 0,
    rescuedCount: 0,
    activeListings: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/donations/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to load impact telemetry:', err);
      }
    };
    fetchStats();
  }, [refreshTrigger]);

  const cards = [
    {
      label: 'Food Diverted',
      value: `${stats.totalWeightKg} kg`,
      sub: `${stats.activeListings} active batches nearby`,
      icon: Scale,
      accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Meals Equivalent',
      value: stats.mealsServed.toLocaleString(),
      sub: 'Based on 400g standard portion',
      icon: Utensils,
      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'CO2e Prevented',
      value: `${stats.co2SavedKg} kg`,
      sub: 'Methane & landfill offset',
      icon: Leaf,
      accent: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
    {
      label: 'NGO Rescues',
      value: stats.rescuedCount,
      sub: 'Claimed & dispatched batches',
      icon: CheckCircle2,
      accent: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        Live Network Impact Telemetry
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 flex items-start justify-between shadow-lg"
            >
              <div>
                <p className="text-xs text-slate-400 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-white tracking-tight mt-1">
                  {card.value}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">{card.sub}</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${card.accent}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}