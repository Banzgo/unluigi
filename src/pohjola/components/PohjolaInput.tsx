import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseDiceExpression } from "@/engine";
import { runPohjolaSimulationWithStats } from "../engine/stats";
import type { PohjolaSimulationResults, RerollCount } from "../engine/types";
import { encodePohjolaShareState } from "../utils/share";

export interface PohjolaInputState {
	attackPool: string;
	as: 2 | 3 | 4 | 5 | 6;
	ds: 2 | 3 | 4 | 5 | 6;
	lethality: 0 | 1 | 2 | 3;
	criticalStrike: -1 | 0 | 1 | 2 | 3;
	crush: 0 | 1 | 2 | 3;
	block: 0 | 1 | 2 | 3;
	titanicStrikes: 0 | 1 | 2 | 3;
	resilient: 0 | 1 | 2 | 3;
	attackerGoodRerolls: RerollCount;
	attackerBadTokens: RerollCount;
	defenderGoodRerolls: RerollCount;
	defenderBadTokens: RerollCount;
	divineTruth: 0 | 1 | 2 | 3 | 4 | 5;
	defenderDivineTruth: 0 | 1 | 2 | 3 | 4 | 5;
	reverberating: boolean;
}

export const POHJOLA_DEFAULT_STATE: PohjolaInputState = {
	attackPool: "4",
	as: 4,
	ds: 4,
	lethality: 0,
	criticalStrike: 0,
	crush: 0,
	block: 0,
	titanicStrikes: 0,
	resilient: 0,
	attackerGoodRerolls: 0,
	attackerBadTokens: 0,
	defenderGoodRerolls: 0,
	defenderBadTokens: 0,
	divineTruth: 0,
	defenderDivineTruth: 0,
	reverberating: false,
};

interface PohjolaInputProps {
	initialState?: Partial<PohjolaInputState>;
	autoRun?: boolean;
	onResults?: (results: PohjolaSimulationResults) => void;
}

const AS_DS_OPTIONS: Array<2 | 3 | 4 | 5 | 6> = [2, 3, 4, 5, 6];
const LETHALITY_OPTIONS: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];
const CRUSH_BLOCK_OPTIONS: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];
const TITANIC_RESILIENT_OPTIONS: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];
const CRIT_STRIKE_OPTIONS: Array<-1 | 0 | 1 | 2 | 3> = [-1, 0, 1, 2, 3];
const DIVINE_TRUTH_OPTIONS: Array<0 | 1 | 2 | 3 | 4 | 5> = [0, 1, 2, 3, 4, 5];
const REROLL_OPTIONS: RerollCount[] = [0, 1, 2, "all"];

function cycleNext<T>(options: T[], current: T): T {
	const idx = options.indexOf(current);
	return options[(idx + 1) % options.length] as T;
}

function critStrikeLabel(v: -1 | 0 | 1 | 2 | 3): string {
	if (v === -1) return "No crits";
	if (v === 0) return "6s only";
	return `${6 - v}+`;
}

function rerollLabel(v: RerollCount): string {
	if (v === 0) return "None";
	if (v === "all") return "All";
	return String(v);
}

export function PohjolaInput({ initialState, autoRun, onResults }: PohjolaInputProps) {
	const [inputs, setInputs] = useState<PohjolaInputState>({
		...POHJOLA_DEFAULT_STATE,
		...(initialState ?? {}),
	});
	const [isSimulating, setIsSimulating] = useState(false);
	const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
	const [poolValid, setPoolValid] = useState(true);
	const hasAutoRun = useRef(false);
	const initialInputsRef = useRef<PohjolaInputState | null>(null);

	const set = <K extends keyof PohjolaInputState>(key: K, value: PohjolaInputState[K]) =>
		setInputs((prev) => ({ ...prev, [key]: value }));

	useEffect(() => {
		if (initialInputsRef.current === null) initialInputsRef.current = { ...inputs };
	}, [inputs]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: runSim defined below, auto-run fires once via ref guard
	useEffect(() => {
		if (!autoRun || hasAutoRun.current) return;
		hasAutoRun.current = true;
		const snap = initialInputsRef.current ?? inputs;
		runSim(snap);
	}, [autoRun, inputs]);

	const runSim = (state: PohjolaInputState) => {
		try {
			parseDiceExpression(state.attackPool);
		} catch {
			setPoolValid(false);
			return;
		}
		setPoolValid(true);
		setIsSimulating(true);
		setTimeout(() => {
			const res = runPohjolaSimulationWithStats({
				attackPool: state.attackPool,
				as: state.as,
				ds: state.ds,
				lethality: state.lethality,
				criticalStrike: state.criticalStrike,
				crush: state.crush,
				block: state.block,
				titanicStrikes: state.titanicStrikes,
				resilient: state.resilient,
				attackerGoodRerolls: state.attackerGoodRerolls,
				attackerBadTokens: state.attackerBadTokens,
				defenderGoodRerolls: state.defenderGoodRerolls,
				defenderBadTokens: state.defenderBadTokens,
				divineTruth: state.divineTruth,
				defenderDivineTruth: state.defenderDivineTruth,
				reverberating: state.reverberating,
				iterations: 50_000,
			});
			onResults?.(res);
			setIsSimulating(false);
		}, 10);
	};

	const handleShare = async () => {
		try {
			const diff: Partial<PohjolaInputState> = {};
			for (const k of Object.keys(POHJOLA_DEFAULT_STATE) as (keyof PohjolaInputState)[]) {
				if (inputs[k] !== POHJOLA_DEFAULT_STATE[k]) {
					(diff as Record<string, unknown>)[k] = inputs[k];
				}
			}

			const encoded = encodePohjolaShareState({ v: 1, inputs: diff });
			const url = new URL(window.location.href);
			url.searchParams.set("sim", encoded);

			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(url.toString());
				setShareStatus("copied");
				window.setTimeout(() => setShareStatus("idle"), 2000);
			} else {
				window.prompt("Copy this link:", url.toString());
			}
		} catch {
			setShareStatus("error");
			window.setTimeout(() => setShareStatus("idle"), 2000);
		}
	};

	return (
		<div className="space-y-4">
			<Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-card border-border">
				{/* Attack Pool */}
				<div className="space-y-2">
					<Label htmlFor="pohjola-pool" className="text-sm text-foreground">
						Attack Pool
					</Label>
					<Input
						id="pohjola-pool"
						type="text"
						value={inputs.attackPool}
						onChange={(e) => {
							set("attackPool", e.target.value);
							setPoolValid(true);
						}}
						className={`bg-input text-foreground placeholder:text-gray-400 ${
							poolValid ? "border-border" : "border-red-500 border-2"
						}`}
						placeholder="6, 2d6, 2d3+1"
					/>
				</div>

				{/* AS / DS */}
				<div className="grid grid-cols-2 gap-3 sm:gap-4">
					{/* AS */}
					<div className="flex flex-col space-y-1.5">
						<Label className="text-sm text-muted-foreground text-center">Attack Skill</Label>
						<div className="flex sm:hidden gap-1">
							<button
								type="button"
								onClick={() => {
									const idx = AS_DS_OPTIONS.indexOf(inputs.as);
									if (idx > 0) set("as", AS_DS_OPTIONS[idx - 1]);
								}}
								className="flex-1 h-10 text-2xl font-bold bg-primary border-2 border-amber-500/50 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
							>
								−
							</button>
							<button
								type="button"
								onClick={() => {
									const idx = AS_DS_OPTIONS.indexOf(inputs.as);
									if (idx < AS_DS_OPTIONS.length - 1) set("as", AS_DS_OPTIONS[idx + 1]);
								}}
								className="flex-1 h-10 text-2xl font-bold bg-primary border-2 border-amber-500/50 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
							>
								+
							</button>
						</div>
						<div className="relative w-full h-20 sm:h-24 bg-primary border-2 border-amber-500/50 rounded-md overflow-hidden">
							<button
								type="button"
								onClick={() => {
									const idx = AS_DS_OPTIONS.indexOf(inputs.as);
									if (idx > 0) set("as", AS_DS_OPTIONS[idx - 1]);
								}}
								className="hidden sm:block absolute left-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
							>
								−
							</button>
							<button
								type="button"
								onClick={() => set("as", cycleNext(AS_DS_OPTIONS, inputs.as))}
								className="w-full h-full text-3xl sm:text-4xl font-bold hover:bg-secondary/80 text-foreground transition-colors"
							>
								{inputs.as}+
							</button>
							<button
								type="button"
								onClick={() => {
									const idx = AS_DS_OPTIONS.indexOf(inputs.as);
									if (idx < AS_DS_OPTIONS.length - 1) set("as", AS_DS_OPTIONS[idx + 1]);
								}}
								className="hidden sm:block absolute right-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
							>
								+
							</button>
						</div>
					</div>

					{/* DS */}
					<div className="flex flex-col space-y-1.5">
						<Label className="text-sm text-muted-foreground text-center">Defence Skill</Label>
						<div className="flex sm:hidden gap-1">
							<button
								type="button"
								onClick={() => {
									const idx = AS_DS_OPTIONS.indexOf(inputs.ds);
									if (idx > 0) set("ds", AS_DS_OPTIONS[idx - 1]);
								}}
								className="flex-1 h-10 text-2xl font-bold bg-primary border-2 border-amber-500/50 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
							>
								−
							</button>
							<button
								type="button"
								onClick={() => {
									const idx = AS_DS_OPTIONS.indexOf(inputs.ds);
									if (idx < AS_DS_OPTIONS.length - 1) set("ds", AS_DS_OPTIONS[idx + 1]);
								}}
								className="flex-1 h-10 text-2xl font-bold bg-primary border-2 border-amber-500/50 rounded-md hover:bg-secondary/80 text-foreground transition-colors"
							>
								+
							</button>
						</div>
						<div className="relative w-full h-20 sm:h-24 bg-primary border-2 border-amber-500/50 rounded-md overflow-hidden">
							<button
								type="button"
								onClick={() => {
									const idx = AS_DS_OPTIONS.indexOf(inputs.ds);
									if (idx > 0) set("ds", AS_DS_OPTIONS[idx - 1]);
								}}
								className="hidden sm:block absolute left-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
							>
								−
							</button>
							<button
								type="button"
								onClick={() => set("ds", cycleNext(AS_DS_OPTIONS, inputs.ds))}
								className="w-full h-full text-3xl sm:text-4xl font-bold hover:bg-secondary/80 text-foreground transition-colors"
							>
								{inputs.ds}+
							</button>
							<button
								type="button"
								onClick={() => {
									const idx = AS_DS_OPTIONS.indexOf(inputs.ds);
									if (idx < AS_DS_OPTIONS.length - 1) set("ds", AS_DS_OPTIONS[idx + 1]);
								}}
								className="hidden sm:block absolute right-0 top-0 h-full px-3 sm:px-4 text-2xl sm:text-3xl font-bold hover:bg-secondary/80 text-foreground transition-colors z-10"
							>
								+
							</button>
						</div>
					</div>
				</div>

				{/* Attack modifiers */}
				<div>
					<p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Attack</p>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
						<CycleBtn
							label="Critical Strike"
							value={critStrikeLabel(inputs.criticalStrike)}
							active={inputs.criticalStrike !== 0}
							onClick={() => set("criticalStrike", cycleNext(CRIT_STRIKE_OPTIONS, inputs.criticalStrike))}
						/>
						<CycleBtn
							label="Lethality"
							value={inputs.lethality === 0 ? "Off" : `[${inputs.lethality}]`}
							active={inputs.lethality !== 0}
							onClick={() => set("lethality", cycleNext(LETHALITY_OPTIONS, inputs.lethality))}
						/>
						<CycleBtn
							label="Titanic Strikes"
							value={inputs.titanicStrikes === 0 ? "Off" : `[${inputs.titanicStrikes}]`}
							active={inputs.titanicStrikes !== 0}
							onClick={() => set("titanicStrikes", cycleNext(TITANIC_RESILIENT_OPTIONS, inputs.titanicStrikes))}
						/>
						<CycleBtn
							label="Divine Truth"
							value={inputs.divineTruth === 0 ? "Off" : `${inputs.divineTruth} crits`}
							active={inputs.divineTruth !== 0}
							onClick={() => set("divineTruth", cycleNext(DIVINE_TRUTH_OPTIONS, inputs.divineTruth))}
						/>
						<CycleBtn
							label="Reverberating"
							value={inputs.reverberating ? "On" : "Off"}
							active={inputs.reverberating}
							onClick={() => set("reverberating", !inputs.reverberating)}
						/>
					</div>
				</div>

				{/* Defence modifiers */}
				<div>
					<p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Defence</p>
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
						<CycleBtn
							label="Block"
							value={inputs.block === 0 ? "Off" : `[${inputs.block}]`}
							active={inputs.block !== 0}
							onClick={() => set("block", cycleNext(CRUSH_BLOCK_OPTIONS, inputs.block))}
						/>
						<CycleBtn
							label="Crush"
							value={inputs.crush === 0 ? "Off" : `[${inputs.crush}]`}
							active={inputs.crush !== 0}
							onClick={() => set("crush", cycleNext(CRUSH_BLOCK_OPTIONS, inputs.crush))}
						/>
						<CycleBtn
							label="Resilient"
							value={inputs.resilient === 0 ? "Off" : `[${inputs.resilient}]`}
							active={inputs.resilient !== 0}
							onClick={() => set("resilient", cycleNext(TITANIC_RESILIENT_OPTIONS, inputs.resilient))}
						/>
						<CycleBtn
							label="Divine Truth"
							value={inputs.defenderDivineTruth === 0 ? "Off" : `${inputs.defenderDivineTruth} saves`}
							active={inputs.defenderDivineTruth !== 0}
							onClick={() => set("defenderDivineTruth", cycleNext(DIVINE_TRUTH_OPTIONS, inputs.defenderDivineTruth))}
						/>
					</div>
				</div>

				{/* Rerolls */}
				<div>
					<p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Rerolls</p>
					<div className="grid grid-cols-2 gap-2">
						<CycleBtn
							label="Attacker Good"
							value={rerollLabel(inputs.attackerGoodRerolls)}
							active={inputs.attackerGoodRerolls !== 0}
							onClick={() => set("attackerGoodRerolls", cycleNext(REROLL_OPTIONS, inputs.attackerGoodRerolls))}
						/>
						<CycleBtn
							label="Attacker Bad Tokens"
							value={rerollLabel(inputs.attackerBadTokens)}
							active={inputs.attackerBadTokens !== 0}
							onClick={() => set("attackerBadTokens", cycleNext(REROLL_OPTIONS, inputs.attackerBadTokens))}
						/>
						<CycleBtn
							label="Defender Good"
							value={rerollLabel(inputs.defenderGoodRerolls)}
							active={inputs.defenderGoodRerolls !== 0}
							onClick={() => set("defenderGoodRerolls", cycleNext(REROLL_OPTIONS, inputs.defenderGoodRerolls))}
						/>
						<CycleBtn
							label="Defender Bad Tokens"
							value={rerollLabel(inputs.defenderBadTokens)}
							active={inputs.defenderBadTokens !== 0}
							onClick={() => set("defenderBadTokens", cycleNext(REROLL_OPTIONS, inputs.defenderBadTokens))}
						/>
					</div>
				</div>
			</Card>

			<Button
				onClick={() => runSim(inputs)}
				disabled={isSimulating}
				className="w-full h-12 sm:h-14 text-lg sm:text-xl bg-amber-700 hover:bg-amber-600 text-white disabled:opacity-50"
			>
				{isSimulating ? "Simulating…" : "Simulate"}
			</Button>

			<div className="flex justify-end">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={handleShare}
					className="text-xs sm:text-[11px] h-8 px-3"
				>
					{shareStatus === "copied" ? "Link copied" : shareStatus === "error" ? "Copy failed" : "Share link"}
				</Button>
			</div>
		</div>
	);
}

interface CycleBtnProps {
	label: string;
	value: string;
	active: boolean;
	onClick: () => void;
}

function CycleBtn({ label, value, active, onClick }: CycleBtnProps) {
	return (
		<Button
			type="button"
			variant="outline"
			onClick={onClick}
			className={`flex flex-col h-auto py-2 px-3 gap-0.5 w-full ${
				active
					? "bg-amber-600/20 border-amber-500/50 text-amber-300 hover:bg-amber-600/30"
					: "bg-secondary hover:bg-secondary/80 text-foreground"
			}`}
		>
			<span className="text-[10px] text-muted-foreground leading-none">{label}</span>
			<span className="text-sm font-semibold leading-none">{value}</span>
		</Button>
	);
}
