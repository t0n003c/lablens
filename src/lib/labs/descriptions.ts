import type { ParsedLabResult } from "@/lib/labs/types";

type LabDescriptionRule = {
  description: string;
  matches: RegExp[];
};

function normalizeLabName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const labDescriptionRules: LabDescriptionRule[] = [
  {
    matches: [/\banc\b/, /\babsolute neutrophil count\b/, /\babsolute neutrophils?\b/, /\bneutrophils? absolute\b/],
    description:
      "Primarily used to assess infection risk, immune system strength, and bone marrow function. Low ANC can mean higher infection risk; high often points to infection, inflammation, stress, or steroid medicines.",
  },
  {
    matches: [/\bhemoglobin a1c\b/, /\ba1c\b/, /\bhba1c\b/],
    description:
      "Shows average blood sugar over about the last 2 to 3 months. High A1c can point to prediabetes, diabetes, or blood sugar running high; low A1c is usually reviewed with glucose history, anemia, or blood-cell turnover.",
  },
  {
    matches: [/\bwbc\b/, /\bwhite blood cells?\b/, /\bwhite blood count\b/, /\bleukocytes?\b/],
    description:
      "Counts immune cells that help fight infection. Low WBC can be linked to bone marrow, immune, infection, or medicine effects; high WBC often points to infection, inflammation, stress, or a medicine reaction.",
  },
  {
    matches: [/\brbc\b/, /\bred blood cells?\b/, /\bred blood count\b/],
    description:
      "Counts red blood cells, which carry oxygen. Low RBC often fits with anemia, blood loss, or low iron/B12/folate; high RBC can happen with dehydration, smoking or altitude, lung/heart strain, or bone marrow conditions.",
  },
  {
    matches: [/\bhemoglobin\b/, /\bhgb\b/],
    description:
      "Measures the oxygen-carrying protein in red blood cells. Low hemoglobin often points to anemia, blood loss, or low iron/B12/folate; high hemoglobin can happen with dehydration, smoking or altitude, lung/heart strain, or bone marrow conditions.",
  },
  {
    matches: [/\bhematocrit\b/, /\bhct\b/],
    description:
      "Shows how much of the blood volume is red blood cells. Low hematocrit often fits with anemia or blood loss; high hematocrit can reflect dehydration or the body making extra red blood cells.",
  },
  {
    matches: [/\bmcv\b/, /\bmean corpuscular volume\b/],
    description:
      "Shows the average size of red blood cells. Low MCV often points to iron deficiency or thalassemia; high MCV can go with B12/folate shortage, liver disease, long-term alcohol use, thyroid problems, or some medicines.",
  },
  {
    matches: [/\bmchc\b/, /\bmean corpuscular hemoglobin concentration\b/],
    description:
      "Shows how packed hemoglobin is inside red blood cells. Low MCHC often points to iron deficiency or thalassemia; high MCHC can go with red blood cell breakdown or inherited red-cell shape issues.",
  },
  {
    matches: [/\bmch\b/, /\bmean corpuscular hemoglobin\b/],
    description:
      "Shows how much hemoglobin is inside each red blood cell. Low MCH is often associated with iron deficiency or small red blood cells; high MCH can go with B12/folate shortage, liver or thyroid problems, long-term alcohol use, or certain medications/treatments.",
  },
  {
    matches: [/\brdw\b/, /\bred cell distribution width\b/],
    description:
      "Shows how mixed the red blood cell sizes are. High RDW means the cells vary more in size and is often reviewed with iron, B12/folate, and anemia patterns; low RDW is usually not a concern.",
  },
  {
    matches: [/\bplatelets?\b/, /\bplatelet count\b/, /\bplt\b/],
    description:
      "Counts cells that help blood clot. Low platelets can raise bleeding or bruising risk; high platelets can happen with inflammation, iron deficiency, recent bleeding/surgery, or bone marrow conditions.",
  },
  {
    matches: [/\blymphocytes? absolute\b/, /\babsolute lymphocytes?\b/],
    description:
      "Counts lymphocyte immune cells, which help target viruses and remember past infections. Low can be linked to stress, steroid medicines, immune issues, or some infections; high often fits viral infection or immune/blood-cell patterns.",
  },
  {
    matches: [/\bmonocytes? absolute\b/, /\babsolute monocytes?\b/],
    description:
      "Counts monocyte immune cells, which help clean up germs and damaged cells. High monocytes often appear with infection, inflammation, or recovery; low monocytes are usually interpreted with the full white-cell pattern.",
  },
  {
    matches: [/\beosinophils? absolute\b/, /\babsolute eosinophils?\b/],
    description:
      "Counts eosinophil immune cells. High eosinophils often fit allergies, asthma, parasites, or medicine reactions; low eosinophils are usually less meaningful by themselves.",
  },
  {
    matches: [/\bbasophils? absolute\b/, /\babsolute basophils?\b/],
    description:
      "Counts basophil immune cells, which can rise with allergic or inflammatory patterns. High basophils are reviewed with the rest of the white-cell differential; low basophils are usually not a standalone concern.",
  },
  {
    matches: [/\bglucose\b/, /\bblood sugar\b/],
    description:
      "Measures blood sugar at the time of the draw. High glucose can point to prediabetes/diabetes, stress, illness, or a recent meal; low glucose is less common without diabetes medicine but can be important if symptoms are present.",
  },
  {
    matches: [/\btotal cholesterol\b/, /\bcholesterol total\b/, /^cholesterol$/],
    description:
      "A broad cholesterol number reviewed with LDL, HDL, triglycerides, and personal risk. High total cholesterol can raise heart-risk concern; very low values are uncommon and are usually reviewed with nutrition, thyroid, liver, and medication context.",
  },
  {
    matches: [/\bldl\b/],
    description:
      "Often called bad cholesterol because high LDL can build up in arteries. High LDL usually raises heart-risk concern; low LDL is often a treatment goal unless it is unexpectedly very low.",
  },
  {
    matches: [/\bhdl\b/],
    description:
      "Often called good cholesterol because it helps clear cholesterol from the blood. Low HDL can mean less heart protection; higher HDL is usually better, but it is still read with the full lipid panel.",
  },
  {
    matches: [/\btriglycerides?\b/],
    description:
      "Measures a type of fat in the blood. High triglycerides often rise with sugary drinks, refined carbs, alcohol, recent meals, or insulin resistance; low triglycerides are usually not a concern by themselves.",
  },
  {
    matches: [/\bbun creatinine ratio\b/, /\burea nitrogen creatinine ratio\b/],
    description:
      "Compares BUN with creatinine for kidney and hydration context. A high ratio often points toward dehydration, blood-flow changes, or higher protein breakdown; a low ratio can fit low protein intake, liver context, or overhydration.",
  },
  {
    matches: [/\bcreatinine\b/],
    description:
      "A muscle-waste marker used with eGFR to estimate kidney filtering. High creatinine can point to kidney strain, dehydration, heavy exercise, or muscle factors; low creatinine often reflects lower muscle mass.",
  },
  {
    matches: [/\begfr\b/, /\bestimated glomerular filtration\b/],
    description:
      "Estimates how well the kidneys filter blood. Low eGFR can point to reduced kidney filtering, especially if it persists; higher eGFR is usually not a concern unless your clinician is watching a specific pattern.",
  },
  {
    matches: [/\burea nitrogen\b/, /\bbun\b/],
    description:
      "Measures a protein-breakdown waste product filtered by the kidneys. High BUN can fit dehydration, kidney strain, or higher protein breakdown; low BUN can fit low protein intake, liver context, or overhydration.",
  },
  {
    matches: [/\balt\b/, /\balanine aminotransferase\b/],
    description:
      "A liver enzyme reviewed for liver-cell irritation or injury. High ALT can rise with fatty liver, viral illness, alcohol, medicines, or supplements; low ALT is usually not a concern by itself.",
  },
  {
    matches: [/\bast\b/, /\baspartate aminotransferase\b/],
    description:
      "An enzyme found in liver and muscle. High AST can rise with liver irritation, alcohol, medicines, or recent hard exercise/muscle injury; low AST is usually not a concern by itself.",
  },
  {
    matches: [/\balkaline phosphatase\b/, /\balk phos\b/, /\balp\b/],
    description:
      "An enzyme reviewed with liver, bile duct, and bone context. High ALP can point to bile-flow/liver or bone activity; low ALP is less common and is usually reviewed with nutrition and thyroid context.",
  },
  {
    matches: [/\bbilirubin\b/],
    description:
      "A pigment made when old red blood cells break down. High bilirubin can fit liver, bile-flow, or red-cell breakdown patterns; low bilirubin is usually not a concern.",
  },
  {
    matches: [/\bvitamin d\b/, /\b25 oh vitamin d\b/],
    description:
      "Reflects vitamin D status for bone, muscle, and calcium support. Low vitamin D can fit low sun, low intake, absorption issues, liver/kidney issues, or certain medicines; high vitamin D is usually from too much supplement intake.",
  },
  {
    matches: [/\btsh\b/, /\bthyroid stimulating hormone\b/],
    description:
      "A thyroid-control hormone used to screen or monitor thyroid function. High TSH often points to an underactive thyroid; low TSH often points to an overactive thyroid or too much thyroid medicine.",
  },
  {
    matches: [/\bsodium\b/],
    description:
      "An electrolyte that helps regulate fluid balance, nerves, and muscles. Low or high sodium often reflects water balance, kidney/hormone issues, illness, or medicines and can matter quickly when severe.",
  },
  {
    matches: [/\bpotassium\b/],
    description:
      "An electrolyte important for heart rhythm, nerves, and muscles. Low or high potassium can affect heartbeat and is often tied to kidney function, vomiting/diarrhea, supplements, or medicines.",
  },
  {
    matches: [/\bchloride\b/],
    description:
      "An electrolyte reviewed with sodium and carbon dioxide. Low chloride can fit vomiting or diuretic/water-balance patterns; high chloride can fit dehydration, kidney context, or acid-base changes.",
  },
  {
    matches: [/\bcarbon dioxide\b/, /\bco2\b/, /\bbicarbonate\b/],
    description:
      "Helps reflect acid-base balance in the blood. Low or high carbon dioxide/bicarbonate is usually interpreted with breathing, kidney function, dehydration, vomiting/diarrhea, and other electrolytes.",
  },
  {
    matches: [/\bcalcium\b/],
    description:
      "A mineral important for bones, nerves, muscles, and heart rhythm. Low calcium can fit vitamin D, kidney, or parathyroid patterns; high calcium can fit parathyroid, supplement, dehydration, or other medical causes.",
  },
  {
    matches: [/\balbumin\b/],
    description:
      "A major blood protein made by the liver. Low albumin can point to liver, kidney, nutrition, inflammation, or absorption issues; high albumin most often suggests dehydration.",
  },
  {
    matches: [/\btotal protein\b/],
    description:
      "Measures major blood proteins, including albumin and globulin. Low total protein can fit nutrition, liver, kidney, or absorption issues; high total protein can fit dehydration, inflammation, infection, or immune-protein patterns.",
  },
  {
    matches: [/\bglobulin\b/],
    description:
      "A group of blood proteins that includes immune proteins. High globulin can fit inflammation, infection, or immune-protein patterns; low globulin can fit immune, kidney, liver, or protein-loss context.",
  },
];

const categoryDescriptions: Record<string, string> = {
  "Blood Count":
    "Part of the blood count. Low or high values can reflect anemia, infection, inflammation, clotting, medicine effects, or bone marrow patterns, so they are read with the full CBC.",
  Cholesterol:
    "Part of the lipid panel. High LDL, high triglycerides, or low HDL can raise heart-risk concern; the full pattern and personal risk factors matter.",
  Glucose:
    "Part of blood sugar review. High values can fit prediabetes/diabetes, stress, illness, or recent meals; low values can be important when paired with symptoms or diabetes medicines.",
  Kidney:
    "Part of kidney-function review. High waste markers or low filtering estimates can suggest kidney or hydration issues, but medicines, muscle, protein intake, and trends matter.",
  Liver:
    "Part of liver and bile-flow review. High enzymes or bilirubin can fit liver irritation, bile-flow issues, alcohol, medicines, supplements, illness, or recent hard exercise.",
  "Vitamins and Minerals":
    "A vitamin or mineral marker. Low values often relate to intake, absorption, sunlight, kidney/liver handling, or medicines; high values can happen with heavy supplementation.",
  Thyroid:
    "Part of thyroid review. High or low values can point toward underactive or overactive thyroid patterns, but timing, medicines, symptoms, and related thyroid tests matter.",
  Electrolytes:
    "Part of electrolyte and fluid-balance review. Low or high values can reflect hydration, kidney function, medicines, vomiting/diarrhea, hormones, or acid-base balance.",
};

export function getLabTestDescription(result: Pick<ParsedLabResult, "testName" | "category">) {
  const normalized = normalizeLabName(result.testName);
  const matchedRule = labDescriptionRules.find((rule) => rule.matches.some((pattern) => pattern.test(normalized)));
  return matchedRule?.description ?? categoryDescriptions[result.category] ?? "General lab marker; interpret it with the report's range, symptoms, medications, and prior results.";
}
