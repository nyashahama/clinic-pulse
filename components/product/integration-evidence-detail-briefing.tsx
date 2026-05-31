import { AdminDetailJsonBlock } from "@/components/product/admin-detail";
import {
  EvidenceCaseBriefPanel,
  EvidenceCommandChip,
  EvidenceCommandHeader,
  EvidenceCommandMetricStrip,
  EvidenceDecisionPanel,
  EvidenceTimeline,
} from "@/components/product/evidence-command";
import type { IntegrationDetailModel } from "@/lib/product/integration-detail";

export function IntegrationEvidenceDetailBriefing({
  model,
}: {
  model: IntegrationDetailModel;
}) {
  const headerActions = model.decision.actions.filter(
    (action) => action.priority === "secondary",
  );

  return (
    <>
      <EvidenceCommandHeader
        eyebrow={model.eyebrow}
        title={model.title}
        description={model.description}
        actions={headerActions}
      >
        {model.contextItems.length ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {model.contextItems.map((item, index) => (
              <span
                className={index === 0 ? "font-medium text-foreground" : undefined}
                key={`${item}-${index}`}
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {model.chips.map((chip) => (
            <EvidenceCommandChip chip={chip} key={`${chip.label}-${chip.tone}`} />
          ))}
        </div>
      </EvidenceCommandHeader>

      <EvidenceCommandMetricStrip metrics={model.metrics} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="grid min-w-0 content-start gap-4">
          <EvidenceCaseBriefPanel
            title={model.caseBrief.title}
            description={model.caseBrief.description}
            summary={model.caseBrief.summary}
            primaryFields={model.caseBrief.primaryFields}
            sections={model.caseBrief.sections}
          />
          {model.jsonBlocks.map((block) => (
            <AdminDetailJsonBlock
              key={block.title}
              title={block.title}
              value={block.value}
            />
          ))}
        </div>

        <div className="grid min-w-0 content-start gap-4">
          <EvidenceDecisionPanel decision={model.decision} />
          <EvidenceTimeline
            title={model.timeline.title}
            description={model.timeline.description}
            items={model.timeline.items}
          />
        </div>
      </div>
    </>
  );
}
