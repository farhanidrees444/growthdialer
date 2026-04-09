const testimonials = [
  { quote: "\"We 3x'd our connect rate in the first month.\"", name: "Ryan M., Head of Sales" },
  { quote: "\"Finally a dialer that doesn't feel like a spreadsheet.\"", name: "Lena K., VP Revenue" },
  { quote: "\"Booked 40% more meetings without adding headcount.\"", name: "Carlos T., SDR Lead" },
  { quote: "\"The AI coaching alone is worth the price of admission.\"", name: "Priya N., Director of Ops" },
  { quote: "\"GrowthDialer replaced 3 separate tools for us.\"", name: "Jake W., RevOps Manager" },
  { quote: "\"Our reps actually love using it — that never happens.\"", name: "Maya S., Sales Director" },
  { quote: "\"Pipeline up 2x in Q2 after switching.\"", name: "Tom H., CEO" },
  { quote: "\"Onboarded the whole team in under a day.\"", name: "Dana L., CRO" },
];

// Duplicate for seamless loop
const items = [...testimonials, ...testimonials];

export default function Ticker() {
  return (
    <div className="relative overflow-hidden py-5 border-y border-white/8 bg-[oklch(0.068_0.020_284)]">
      {/* Fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[oklch(0.068_0.020_284)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[oklch(0.068_0.020_284)] to-transparent z-10 pointer-events-none" />

      <div className="ticker-track flex gap-8 w-max">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0">
            <span className="text-brand text-lg">✦</span>
            <div>
              <p className="text-sm text-foreground/85 font-medium whitespace-nowrap">{item.quote}</p>
              <p className="text-xs text-muted-foreground">{item.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
