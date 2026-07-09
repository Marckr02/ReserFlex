const DARK_THEMES = new Set(['SALON_BARBERIA', 'CANCHA_GIMNASIO']);

export const BUSINESS_THEMES = {
  SALON_BARBERIA: {
    primaryBg: 'bg-zinc-900',
    primaryText: 'text-zinc-900',
    hoverBg: 'hover:bg-zinc-800',
    hoverText: 'hover:text-zinc-800',
    softBg: 'bg-zinc-100',
    softText: 'text-zinc-800',
    border: 'border-zinc-300',
    ring: 'focus:ring-zinc-500 focus:border-zinc-500',
    gradient: 'from-zinc-950 via-neutral-950 to-stone-950',
    accentText: 'text-amber-500',
    badge: 'border-amber-200 bg-amber-50 text-amber-800',
    button: 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm hover:shadow-md transition-all duration-300',
    selectedSlot: 'border-zinc-900 bg-zinc-900 text-white shadow-md',
    heroBg: 'bg-neutral-950',
    heroAccent: 'text-amber-400',
    cardBg: 'bg-white',
    cardBorder: 'border-zinc-200',
  emptyStateBg: 'bg-zinc-50',
  emptyStateText: 'text-zinc-600',
  microcopy: {
    emptyTitle: 'El silencio es oro, pero los servicios desaparecieron.',
    emptyAction: 'Ajusta los filtros'
  }
},
CONSULTORIO: {
    primaryBg: 'bg-emerald-700',
    primaryText: 'text-emerald-700',
    hoverBg: 'hover:bg-emerald-800',
    hoverText: 'hover:text-emerald-800',
    softBg: 'bg-emerald-50',
    softText: 'text-emerald-800',
    border: 'border-emerald-200',
    ring: 'focus:ring-emerald-500 focus:border-emerald-500',
    gradient: 'from-slate-50 via-emerald-50/30 to-teal-50/20',
    accentText: 'text-emerald-600',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    button: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow-md transition-all duration-300',
    selectedSlot: 'border-emerald-700 bg-emerald-700 text-white shadow-md',
    heroBg: 'bg-slate-50',
    heroAccent: 'text-emerald-600',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
  emptyStateBg: 'bg-slate-50',
  emptyStateText: 'text-slate-600',
  microcopy: {
    emptyTitle: 'No hay servicios que coincidan con tu búsqueda.',
    emptyAction: 'Limpia los filtros'
  }
},
RESTAURANTE: {
    primaryBg: 'bg-rose-700',
    primaryText: 'text-rose-700',
    hoverBg: 'hover:bg-rose-800',
    hoverText: 'hover:text-rose-800',
    softBg: 'bg-orange-50',
    softText: 'text-orange-800',
    border: 'border-orange-200',
    ring: 'focus:ring-orange-500 focus:border-orange-500',
    gradient: 'from-stone-100 via-orange-50/40 to-amber-50/30',
    accentText: 'text-orange-600',
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    button: 'bg-orange-700 hover:bg-orange-800 text-white shadow-sm hover:shadow-md transition-all duration-300',
    selectedSlot: 'border-orange-700 bg-orange-700 text-white shadow-md',
    heroBg: 'bg-stone-100',
    heroAccent: 'text-orange-700',
    cardBg: 'bg-white',
    cardBorder: 'border-stone-200',
  emptyStateBg: 'bg-amber-50/50',
  emptyStateText: 'text-amber-700',
  microcopy: {
    emptyTitle: 'La carta está en otra mesa.',
    emptyAction: 'Prueba con otros filtros'
  }
},
HOTEL: {
    primaryBg: 'bg-indigo-800',
    primaryText: 'text-indigo-800',
    hoverBg: 'hover:bg-indigo-900',
    hoverText: 'hover:text-indigo-900',
    softBg: 'bg-indigo-50',
    softText: 'text-indigo-800',
    border: 'border-indigo-200',
    ring: 'focus:ring-indigo-500 focus:border-indigo-500',
    gradient: 'from-slate-100 via-indigo-50/50 to-slate-100',
    accentText: 'text-indigo-600',
    badge: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    button: 'bg-indigo-800 hover:bg-indigo-900 text-white shadow-sm hover:shadow-md transition-all duration-300',
    selectedSlot: 'border-indigo-800 bg-indigo-800 text-white shadow-md',
    heroBg: 'bg-slate-100',
    heroAccent: 'text-indigo-700',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
  emptyStateBg: 'bg-indigo-50/50',
  emptyStateText: 'text-indigo-700',
  microcopy: {
    emptyTitle: 'No encontramos lo que buscas.',
    emptyAction: 'Revisa los filtros'
  }
},
CANCHA_GIMNASIO: {
    primaryBg: 'bg-zinc-800',
    primaryText: 'text-zinc-800',
    hoverBg: 'hover:bg-zinc-900',
    hoverText: 'hover:text-zinc-900',
    softBg: 'bg-emerald-50',
    softText: 'text-emerald-800',
    border: 'border-emerald-200',
    ring: 'focus:ring-emerald-500 focus:border-emerald-500',
    gradient: 'from-zinc-950 via-emerald-950/60 to-zinc-900',
    accentText: 'text-emerald-400',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-300',
    selectedSlot: 'border-emerald-600 bg-emerald-600 text-white shadow-md',
    heroBg: 'bg-zinc-950',
    heroAccent: 'text-emerald-400',
    cardBg: 'bg-zinc-900',
    cardBorder: 'border-zinc-700',
  emptyStateBg: 'bg-zinc-900',
  emptyStateText: 'text-zinc-300',
  microcopy: {
    emptyTitle: 'Sin resultados. Ajusta los filtros.',
    emptyAction: 'Limpiar búsqueda'
  }
},
GENERICO: {
    primaryBg: 'bg-slate-700',
    primaryText: 'text-slate-700',
    hoverBg: 'hover:bg-slate-800',
    hoverText: 'hover:text-slate-800',
    softBg: 'bg-slate-100',
    softText: 'text-slate-800',
    border: 'border-slate-300',
    ring: 'focus:ring-slate-500 focus:border-slate-500',
    gradient: 'from-slate-50 via-blue-50/30 to-slate-50',
    accentText: 'text-slate-500',
    badge: 'border-slate-200 bg-slate-50 text-slate-600',
    button: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm hover:shadow-md transition-all duration-300',
    selectedSlot: 'border-slate-800 bg-slate-800 text-white shadow-md',
    heroBg: 'bg-slate-50',
    heroAccent: 'text-slate-600',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    emptyStateBg: 'bg-slate-50',
    emptyStateText: 'text-slate-600',
    microcopy: {
      emptyTitle: 'No se encontraron servicios.',
      emptyAction: 'Limpiar filtros'
    }
  }
};

export function getTheme(type) {
  return BUSINESS_THEMES[type] || BUSINESS_THEMES.GENERICO;
}

export function isDarkTheme(type) {
  return DARK_THEMES.has(type);
}
