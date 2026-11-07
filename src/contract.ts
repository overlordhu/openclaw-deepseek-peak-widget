import { Type } from "typebox";
import { defineFeatureContract } from "openclaw/plugin-sdk/feature-contract";

const PriceRow = Type.Object(
  {
    inputMiss: Type.Object({
      off: Type.Number(),
      peak: Type.Number(),
    }),
    output: Type.Object({
      off: Type.Number(),
      peak: Type.Number(),
    }),
  },
  { additionalProperties: false },
);

const StatusOutput = Type.Object({
  state: Type.Union([Type.Literal("peak"), Type.Literal("off-peak")]),
  label: Type.String(),
  nextChangeAt: Type.Union([Type.String(), Type.Null()]),
  msUntilNextChange: Type.Number(),
  prices: Type.Record(Type.String(), PriceRow),
  banner: Type.Union([
    Type.Object(
      {
        text: Type.String(),
        color: Type.Union([Type.String(), Type.Null()]),
      },
      { additionalProperties: false },
    ),
    Type.Null(),
  ]),
  fresh: Type.Boolean(),
  lastFetchedAt: Type.Union([Type.String(), Type.Null()]),
  now: Type.String(),
});

export const contract = defineFeatureContract({
  pluginId: "deepseek-peak-widget",
  operations: {
    status: {
      kind: "query",
      description: "Current DeepSeek peak/off-peak status, next change, prices, and banner.",
      input: Type.Object({}, { additionalProperties: false }),
      output: StatusOutput,
    },
    refresh: {
      kind: "action",
      description: "Re-fetch the parameter file and recompute the schedule.",
      input: Type.Object({}, { additionalProperties: false }),
      output: StatusOutput,
    },
  },
  events: {},
});
