import { createFileRoute } from "@tanstack/react-router";
import { MatchResultPage } from "@/matchresult/components/MatchResultPage";

export const Route = createFileRoute("/matchresult")({
	component: MatchResultPage,
});
