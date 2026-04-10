const stats = [
  { number: "500+", label: "Study Materials" },
  { number: "10+", label: "Departments Covered" },
  { number: "3 Roles", label: "Student · Moderator · Admin" },
  { number: "100% Free", label: "Always, for everyone" },
];

const StatsRow = () => {
  return (
    <section className="py-16 px-6 border-y border-border/50">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-display font-bold text-3xl gradient-text">
              {s.number}
            </div>
            <div className="font-body text-sm text-muted-foreground mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsRow;
