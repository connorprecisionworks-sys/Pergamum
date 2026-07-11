/**
 * No dedicated mockup exists for this band, so it is composed from the page's
 * own system: the finale's section-head scale, the nav's hairline, the label
 * tracking used throughout. Copy is verbatim from the brief.
 */
const BENEFITS = [
  {
    number: "01",
    title: "Send a product, not a PDF.",
    body: "Your prompt opens as a polished tool people use in one tap, so the freebie finally looks like it's worth what you charge.",
  },
  {
    number: "02",
    title: "It keeps working after you send it.",
    body: "Edit once and everyone who saved it gets the new version. Your lead magnet stops going stale the day you post it.",
  },
  {
    number: "03",
    title: "See who actually used it.",
    body: "Not a flat list of emails, a ranked pipeline: who they are, what they need, and who's ready to buy.",
  },
  {
    number: "04",
    title: "Turn a free prompt into a booked call.",
    body: "Your offer appears the moment the prompt proves its worth, so the people it impressed can hire you on the spot.",
  },
];

const CONTRAST = [
  ["A Google Doc link", "A prompt they use in one tap"],
  ["Paste the link in your DMs 400 times", "One link that delivers itself"],
  ["Dead the moment you send it", "Updates itself and pulls them back"],
  ["A flat list of emails", "A ranked list of buyers"],
  ["You hope someone books", "Your offer lands at the moment of value"],
];

export function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-[72px] bg-background py-28 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <h2 className="m-0 max-w-[820px] text-[clamp(1.9rem,3.6vw,40px)] font-semibold leading-[1.08] -tracking-[0.02em] text-foreground">
          A prompt store sells files.
          <br />
          prmpt books clients.
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <div key={benefit.number}>
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-subtle">
                {benefit.number}
              </div>
              <h3 className="mt-3.5 text-[18px] font-semibold leading-[1.3] -tracking-[0.01em] text-foreground">
                {benefit.title}
              </h3>
              <p className="mt-2.5 text-[15px] leading-[1.6] text-foreground-muted">
                {benefit.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-28 border-t border-border">
          <div className="grid grid-cols-2 gap-x-8 py-5 md:gap-x-16">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground-subtle">
              Old way
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground">
              prmpt way
            </div>
          </div>

          {CONTRAST.map(([oldWay, prmptWay]) => (
            <div
              key={oldWay}
              className="grid grid-cols-2 gap-x-8 border-t border-border py-6 md:gap-x-16"
            >
              <div className="text-[15px] leading-[1.5] text-foreground-subtle md:text-[17px]">
                {oldWay}
              </div>
              <div className="text-[15px] font-medium leading-[1.5] -tracking-[0.01em] text-foreground md:text-[17px]">
                {prmptWay}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
