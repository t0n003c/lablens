import { describe, expect, it } from "vitest";
import { buildNextStepDetails } from "@/lib/action-plan/details";
import { buildShortNextStep } from "@/lib/action-plan/shorten";

describe("action plan next steps", () => {
  it("turns detailed recommendations into short habit text", () => {
    expect(
      buildShortNextStep(
        "For meals that feel familiar to your Vietnamese / United States background, keep the flavors; make rice or noodles the smaller part, add extra vegetables/herbs and protein, and choose water or unsweetened tea most often.",
      ),
    ).toBe("Make rice or noodles the smaller part.");

    expect(
      buildShortNextStep(
        "For A1c, cut back on sweet drinks, juice, sweet coffee, desserts, white bread, white rice, and other refined carbs; start with the one you have most often.",
      ),
    ).toBe("Cut back one sweet drink or refined carb.");

    expect(buildShortNextStep("For your remote desk job, attach a 5-10 minute walk or stretch to something already on your calendar.")).toBe(
      "Take a 5-10 minute walk or stretch after lunch.",
    );

    expect(
      buildShortNextStep(
        'Your profile lists gender as "woman". If hormones, periods, menopause, pregnancy, testosterone, or gender-affirming medicines apply, note them before your visit.',
      ),
    ).not.toBe("Note hormone or reproductive context if it applies.");

    expect(
      buildShortNextStep("Keep your pre-lab morning routine consistent when you can: follow fasting instructions, hydrate normally, and avoid last-minute habit changes."),
    ).toBe("Follow fasting instructions for lab work.");

    expect(buildShortNextStep("At age 42, protect consistency: place movement after lunch or dinner instead of waiting for free time.")).toBe(
      "Take a short walk or stretch after lunch or dinner.",
    );

    expect(
      buildShortNextStep("Vitamin D is 27 ng/mL. Add vitamin-D foods you tolerate: salmon, sardines, trout, eggs, or fortified milk/soy/oat drinks."),
    ).toBe("Add salmon, eggs, or fortified milk.");

    expect(
      buildShortNextStep("Avoid extra alcohol, supplements, pain relievers, or hard workouts when liver markers are flagged."),
    ).toBe("Avoid extra alcohol, supplements, pain relievers, or hard workouts.");

    expect(
      buildShortNextStep("Make one default grocery swap this week: keep oats, beans, nuts, olive oil, or fish on hand."),
    ).toBe("Add oats, beans, or olive oil to your list.");
  });

  it("adds why, frequency, effort, tags, and priority for next steps", () => {
    const details = buildNextStepDetails(
      "Food",
      "Cut back one sweet drink or refined carb.",
      "For A1c, cut back on sweet drinks, juice, sweet coffee, desserts, white bread, white rice, and other refined carbs; start with the one you have most often.",
    );

    expect(details.reason).toContain("Helps with A1c");
    expect(details.frequency).toBe("Start with 1 regular choice");
    expect(details.effort).toBe("meal swap");
    expect(details.tags).toContain("A1c");
    expect(details.priority).toBeGreaterThan(70);
    expect(details.alternativeText).toBe("Switch one regular sweet drink to unsweetened.");
  });

  it("uses marker-specific why text instead of generic why text", () => {
    const hdlDetails = buildNextStepDetails(
      "Movement",
      "Do 2 simple strength sessions this week.",
      "HDL is low. If exercise is safe for you, regular walking plus 2 simple strength sessions per week is a reasonable habit to discuss.",
    );
    const liverDetails = buildNextStepDetails(
      "Routine",
      "Avoid extra alcohol, supplements, pain relievers, or hard workouts.",
      "Avoid extra alcohol, supplements, pain relievers, or hard workouts when liver markers are flagged.",
    );

    expect(hdlDetails.reason).toContain("Helps with low HDL");
    expect(liverDetails.reason).toContain("Helps with liver markers");
    expect(`${hdlDetails.reason} ${liverDetails.reason}`).not.toContain("Chosen because");
  });

  it("does not show an info reason when no marker can be named", () => {
    const details = buildNextStepDetails("Routine", "Choose one smaller version you can do this week.");

    expect(details.reason).toBeUndefined();
  });

  it("keeps saturated-fat swap steps tied to cholesterol", () => {
    const details = buildNextStepDetails("Food", "Swap one saturated-fat food.");

    expect(details.tags).toContain("Cholesterol");
    expect(details.reason).toContain("Helps with cholesterol");
  });

  it("lets a replaced step swap back to the original short step", () => {
    const details = buildNextStepDetails(
      "Movement",
      "Stand or stretch 5 minutes after that meal.",
      "For A1c, try a 10-20 minute easy walk after the meal that usually has the most carbs, if that is safe for you.",
    );

    expect(details.isReplacement).toBe(true);
    expect(details.alternativeText).toBe("Walk 10-20 minutes after a carb-heavy meal.");
  });

  it("does not show generic profile-only why text", () => {
    const details = buildNextStepDetails(
      "Routine",
      "Take a short walk or stretch after lunch or dinner.",
      "At age 42, make movement easier to remember: take a short walk or stretch after lunch or dinner instead of waiting for free time.",
    );

    expect(details.reason).toBeUndefined();
    expect(details.tags).toContain("Profile");
  });

  it("does not tag ordinary sleep wording as liver-related", () => {
    const details = buildNextStepDetails(
      "Sleep",
      "Keep sleep and wake times steady.",
      "For A1c, keep sleep and wake times steady and aim for at least 7 hours when possible.",
    );

    expect(details.tags).toContain("A1c");
    expect(details.tags).not.toContain("Liver");
  });

  it("does not suggest hormone or reproductive-context replacement steps", () => {
    const details = buildNextStepDetails(
      "Routine",
      "Note hormone or reproductive context if it applies.",
      'Your profile lists gender as "woman". If hormones, periods, menopause, pregnancy, testosterone, or gender-affirming medicines apply, note them before your visit.',
    );

    expect(details.alternativeText).not.toContain("hormone");
    expect(details.alternativeText).not.toContain("reproductive");
  });

  it("marks pre-lab-only steps so the dashboard can hide them", () => {
    const details = buildNextStepDetails(
      "Sleep",
      "Note short sleep, illness, or stress before labs.",
      "Before your next lab, note any unusually short sleep, illness, or stress because they can make glucose markers harder to interpret.",
    );

    expect(details.frequency).toBe("Before your next lab");
  });
});
