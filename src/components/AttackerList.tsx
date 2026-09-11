import { DiceInput, type DiceInputState } from "@/components/DiceInput";

interface AttackerListProps {
	inputs: DiceInputState[];
	onUpdate: (id: string, updates: Partial<DiceInputState>) => void;
	onRemove: (id: string) => void;
}

/** Renders one DiceInput card per attacker profile, with remove hidden while only one remains. */
export function AttackerList({ inputs, onUpdate, onRemove }: AttackerListProps) {
	return (
		<div className="space-y-4">
			{inputs.map((input) => (
				<DiceInput
					key={input.id}
					input={input}
					onUpdate={onUpdate}
					onRemove={onRemove}
					showRemove={inputs.length > 1}
				/>
			))}
		</div>
	);
}
