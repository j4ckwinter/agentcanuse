export function Section({ id, title, action, children }: { id: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h2 id={id} className="scroll-mt-8">
          <a href={`#${id}`} onClick={(event) => {
            event.preventDefault()
            document.getElementById(id)?.scrollIntoView()
          }} className="group/anchor inline-flex items-baseline gap-1.5">
            {title}
            <span aria-hidden="true" className="text-fg-muted opacity-0 transition-opacity group-hover/anchor:opacity-100 group-focus-visible/anchor:opacity-100">
              #
            </span>
          </a>
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
