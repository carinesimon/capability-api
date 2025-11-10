export function mapGhlStageToLeadStage(ghlStageName?: string): "UNASSIGNED"|"RV0"|"RV1"|"RV2"|"WON"|"LOST"|"NOT_QUALIFIED"|null {
  if (!ghlStageName) return null;
  const name = ghlStageName.trim().toLowerCase();
  if (["prospect","nouveau","new"].includes(name)) return "UNASSIGNED";
  if (["rv0","rv0 fait","setter","call done"].includes(name)) return "RV0";
  if (["rv1","rv1 fait","closer","closing done"].includes(name)) return "RV1";
  if (["rv2","follow-up","rv2 fait"].includes(name)) return "RV2";
  if (["won","client","inscrit"].includes(name)) return "WON";
  if (["lost","perdu"].includes(name)) return "LOST";
  if (["not qualified","not_qualified","nq"].includes(name)) return "NOT_QUALIFIED";
  return null;
  
}
