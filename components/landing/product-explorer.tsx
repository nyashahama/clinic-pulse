import { ProductExplorerTabs } from "@/components/landing/product-explorer-tabs";
import { operationalNarrative } from "@/lib/landing/operational-narrative-content";

export function ProductExplorer() {
  return (
    <section
      id="product-surfaces"
      data-landing-chapter="product-explorer"
      className="scroll-mt-20 border-b border-landing-ink/12 bg-white px-4 py-20 text-landing-ink dark:border-white/10 dark:bg-[#0d1d1a] sm:px-6 sm:py-24 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-[80rem]">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,0.72fr)] lg:items-end">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-landing-green">
              {operationalNarrative.product.eyebrow}
            </p>
            <h2 className="mt-5 max-w-[15ch] font-display text-4xl leading-[1.02] tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem] dark:text-white">
              {operationalNarrative.product.title}
            </h2>
          </div>
          <div>
            <p className="max-w-xl text-sm leading-7 text-landing-ink/64 sm:text-base dark:text-white/62">
              {operationalNarrative.product.description}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-landing-ink/42 dark:text-white/42">
              {operationalNarrative.disclosure}
            </p>
          </div>
        </header>

        <ProductExplorerTabs />
      </div>
    </section>
  );
}
