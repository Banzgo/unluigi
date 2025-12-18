import { useState } from "react";
import { parseDiceExpression, type RerollType } from "../engine";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type ToggleValue = 2 | 3 | 4 | 5 | 6 | "auto" | "none";

export interface DiceInputState {
  id: string;
  numAttacks: string;
  hit: ToggleValue;
  wound: ToggleValue;
  armorSave: ToggleValue;
  specialSave: ToggleValue;
  rerollHits: RerollType;
  rerollWounds: RerollType;
  rerollArmorSaves: RerollType;
  rerollSpecialSaves: RerollType;
  poison: boolean;
  lethalStrike: boolean;
  fury: boolean;
  multipleWounds: string;
  targetMaxWounds: number;
}

interface DiceInputProps {
  input: DiceInputState;
  onUpdate: (id: string, updates: Partial<DiceInputState>) => void;
  onRemove: (id: string) => void;
  showRemove: boolean;
}

export function DiceInput({
  input,
  onUpdate,
  onRemove,
  showRemove,
}: DiceInputProps) {
  const [isNumAttacksValid, setIsNumAttacksValid] = useState<boolean>(true);

  const hitOptions: ToggleValue[] = [2, 3, 4, 5, 6, "auto"];
  const woundOptions: ToggleValue[] = [2, 3, 4, 5, 6, "auto"];
  const saveOptions: ToggleValue[] = [2, 3, 4, 5, 6, "none"];
  const rerollOptions: RerollType[] = ["none", "1s", "fails", "successes"];

  const cycleValue = (current: ToggleValue, options: ToggleValue[]) => {
    const currentIndex = options.indexOf(current);
    return options[(currentIndex + 1) % options.length];
  };

  const cycleReroll = (current: RerollType) => {
    const currentIndex = rerollOptions.indexOf(current);
    return rerollOptions[(currentIndex + 1) % rerollOptions.length];
  };

  const getRerollLabel = (reroll: RerollType) => {
    switch (reroll) {
      case "none":
        return "No Reroll";
      case "1s":
        return "Reroll 1s";
      case "fails":
        return "Reroll Fails";
      case "successes":
        return "Reroll Successes";
    }
  };

  const validateNumAttacks = (value: string): boolean => {
    if (!value || value.trim() === "") {
      return false;
    }
    try {
      parseDiceExpression(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleNumAttacksChange = (value: string) => {
    onUpdate(input.id, { numAttacks: value });
    setIsNumAttacksValid(validateNumAttacks(value));
  };

  return (
    <Card className="p-6 space-y-6 bg-card border-border relative">
      {showRemove && (
        <Button
          onClick={() => onRemove(input.id)}
          className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
          variant="outline"
        >
          ×
        </Button>
      )}

      {/* Input Fields Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor={`attacks-${input.id}`}
            className="text-sm text-foreground"
          >
            Number of Attacks
          </Label>
          <Input
            id={`attacks-${input.id}`}
            type="text"
            value={input.numAttacks}
            onChange={(e) => handleNumAttacksChange(e.target.value)}
            className={`bg-input text-foreground placeholder:text-muted-foreground ${
              isNumAttacksValid ? "border-border" : "border-red-500 border-2"
            }`}
            placeholder="10 or 2d6"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`mw-${input.id}`} className="text-sm text-foreground">
            Multiple Wounds
          </Label>
          <Input
            id={`mw-${input.id}`}
            type="text"
            value={input.multipleWounds}
            onChange={(e) =>
              onUpdate(input.id, { multipleWounds: e.target.value })
            }
            className="bg-input text-foreground"
            placeholder="1, d3, d6+1"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor={`max-${input.id}`}
            className="text-sm text-foreground"
          >
            Target Max Wounds
          </Label>
          <Input
            id={`max-${input.id}`}
            type="number"
            value={input.targetMaxWounds}
            onChange={(e) =>
              onUpdate(input.id, {
                targetMaxWounds: Number.parseInt(e.target.value) || 1,
              })
            }
            className="bg-input text-foreground"
            min="1"
          />
        </div>
      </div>

      {/* Dice Values and Special Rules Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Hit Column */}
        <div className="flex flex-col space-y-1.5">
          <Label className="text-sm text-muted-foreground text-center">
            To Hit
          </Label>
          <Button
            onClick={() =>
              onUpdate(input.id, { hit: cycleValue(input.hit, hitOptions) })
            }
            className="w-full aspect-square text-3xl font-bold bg-primary border-border hover:bg-secondary text-foreground"
            variant="outline"
          >
            {input.hit === "auto" ? "AUTO" : `${input.hit}+`}
          </Button>
          <Button
            onClick={() =>
              onUpdate(input.id, {
                rerollHits: cycleReroll(input.rerollHits),
              })
            }
            className={`w-full h-7 text-xs ${
              input.rerollHits !== "none"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
            variant="outline"
          >
            {getRerollLabel(input.rerollHits)}
          </Button>
          <Button
            onClick={() => onUpdate(input.id, { poison: !input.poison })}
            className={`w-full h-7 text-xs ${
              input.poison
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
            variant="outline"
          >
            Poison
          </Button>
          <Button
            onClick={() => onUpdate(input.id, { fury: !input.fury })}
            className={`w-full h-7 text-xs ${
              input.fury
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
            variant="outline"
          >
            Fury
          </Button>
        </div>

        {/* Wound Column */}
        <div className="flex flex-col space-y-1.5">
          <Label className="text-sm text-muted-foreground text-center">
            To Wound
          </Label>
          <Button
            onClick={() =>
              onUpdate(input.id, {
                wound: cycleValue(input.wound, woundOptions),
              })
            }
            className="w-full aspect-square text-3xl font-bold bg-primary border-border hover:bg-secondary text-foreground"
            variant="outline"
          >
            {input.wound === "auto" ? "AUTO" : `${input.wound}+`}
          </Button>
          <Button
            onClick={() =>
              onUpdate(input.id, {
                rerollWounds: cycleReroll(input.rerollWounds),
              })
            }
            className={`w-full h-7 text-xs ${
              input.rerollWounds !== "none"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
            variant="outline"
          >
            {getRerollLabel(input.rerollWounds)}
          </Button>
          <Button
            onClick={() =>
              onUpdate(input.id, { lethalStrike: !input.lethalStrike })
            }
            className={`w-full h-7 text-xs ${
              input.lethalStrike
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
            variant="outline"
          >
            Lethal Strike
          </Button>
        </div>

        {/* Armor Save Column */}
        <div className="flex flex-col space-y-1.5">
          <Label className="text-sm text-muted-foreground text-center">
            Armor Save
          </Label>
          <Button
            onClick={() =>
              onUpdate(input.id, {
                armorSave: cycleValue(input.armorSave, saveOptions),
              })
            }
            className="w-full aspect-square text-3xl font-bold bg-primary border-border hover:bg-secondary text-foreground"
            variant="outline"
          >
            {input.armorSave === "none" ? "NONE" : `${input.armorSave}+`}
          </Button>
          <Button
            onClick={() =>
              onUpdate(input.id, {
                rerollArmorSaves: cycleReroll(input.rerollArmorSaves),
              })
            }
            className={`w-full h-7 text-xs ${
              input.rerollArmorSaves !== "none"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
            variant="outline"
          >
            {getRerollLabel(input.rerollArmorSaves)}
          </Button>
        </div>

        {/* Special Save Column */}
        <div className="flex flex-col space-y-1.5">
          <Label className="text-sm text-muted-foreground text-center">
            Special Save
          </Label>
          <Button
            onClick={() =>
              onUpdate(input.id, {
                specialSave: cycleValue(input.specialSave, saveOptions),
              })
            }
            className="w-full aspect-square text-3xl font-bold bg-primary border-border hover:bg-secondary text-foreground"
            variant="outline"
          >
            {input.specialSave === "none" ? "NONE" : `${input.specialSave}+`}
          </Button>
          <Button
            onClick={() =>
              onUpdate(input.id, {
                rerollSpecialSaves: cycleReroll(input.rerollSpecialSaves),
              })
            }
            className={`w-full h-7 text-xs ${
              input.rerollSpecialSaves !== "none"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-secondary hover:bg-secondary/80"
            }`}
            variant="outline"
          >
            {getRerollLabel(input.rerollSpecialSaves)}
          </Button>
        </div>
      </div>
    </Card>
  );
}
