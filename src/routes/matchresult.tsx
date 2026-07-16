import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MatchResultPage } from "@/matchresult/components/MatchResultPage";
import { decodeArmyListParam } from "@/matchresult/utils/listShare";

const matchResultSearchSchema = z.object({
	l1: z.string().optional(),
	l2: z.string().optional(),
});

export const Route = createFileRoute("/matchresult")({
	validateSearch: matchResultSearchSchema,
	component: MatchResultRoute,
});

function MatchResultRoute() {
	const { l1, l2 } = Route.useSearch();

	return (
		<MatchResultPage
			initialList1={l1 ? (decodeArmyListParam(l1) ?? undefined) : undefined}
			initialList2={l2 ? (decodeArmyListParam(l2) ?? undefined) : undefined}
		/>
	);
}
