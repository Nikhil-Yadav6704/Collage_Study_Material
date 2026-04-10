const steps = [
  {
    num: "01",
    title: "Sign up with Google",
    body: "One click with Google, then fill a quick college form — name, department, year, and roll number. Your account is live.",
    color: "text-primary",
    borderColor: "border-primary/30",
    bgColor: "bg-primary/10",
  },
  {
    num: "02",
    title: "Find your material",
    body: "Search by subject name or abbreviation, or drill through the folder system: Department → Semester → Subject → Files.",
    color: "text-accent",
    borderColor: "border-accent/30",
    bgColor: "bg-accent/10",
  },
  {
    num: "03",
    title: "Study, rate, contribute",
    body: "Download notes, bookmark favorites, rate what you've used, and submit your own notes for the community.",
    color: "text-success",
    borderColor: "border-success/30",
    bgColor: "bg-success/10",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-28 px-6 max-w-5xl mx-auto">
      <p className="text-xs font-body text-accent uppercase tracking-widest mb-3 text-center">
        How It Works
      </p>
      <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground text-center mb-16">
        Your first study session in 3 steps
      </h2>

      <div className="flex flex-col gap-0 relative">
        <div className="absolute left-[27px] top-12 bottom-12 w-px bg-gradient-to-b from-primary via-accent to-transparent" />

        {steps.map((step, i) => (
          <div
            key={step.num}
            className={`flex items-start gap-6 relative ${i < steps.length - 1 ? "pb-12" : ""}`}
          >
            <div
              className={`w-14 h-14 rounded-2xl ${step.bgColor} border ${step.borderColor} flex items-center justify-center flex-shrink-0`}
            >
              <span className={`font-display font-bold text-lg ${step.color}`}>
                {step.num}
              </span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                {step.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {step.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorksSection;
