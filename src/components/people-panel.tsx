"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Plus, Save, Trash2, UserRound } from "lucide-react";

type ProfileState = {
  profileAge: string;
  profileGender: string;
  profileCountry: string;
  profileEthnicity: string;
  profileJob: string;
  profileHobbies: string;
  profileRoutine: string;
};

type PersonOption = {
  id: string;
  name: string;
  isDefault: boolean;
  profileAge?: number | null;
  profileGender?: string | null;
  profileCountry?: string | null;
  profileEthnicity?: string | null;
  profileJob?: string | null;
  profileHobbies?: string | null;
  profileRoutine?: string | null;
  _count?: {
    reports: number;
  };
};

const emptyProfile: ProfileState = {
  profileAge: "",
  profileGender: "",
  profileCountry: "",
  profileEthnicity: "",
  profileJob: "",
  profileHobbies: "",
  profileRoutine: "",
};

function profileFromPerson(person?: PersonOption | null): ProfileState {
  return {
    profileAge: person?.profileAge == null ? "" : String(person.profileAge),
    profileGender: person?.profileGender ?? "",
    profileCountry: person?.profileCountry ?? "",
    profileEthnicity: person?.profileEthnicity ?? "",
    profileJob: person?.profileJob ?? "",
    profileHobbies: person?.profileHobbies ?? "",
    profileRoutine: person?.profileRoutine ?? "",
  };
}

export function PeoplePanel() {
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<ProfileState>(emptyProfile);
  const [people, setPeople] = useState<PersonOption[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [newPersonName, setNewPersonName] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/people")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const body = await response.json();
        const nextPeople: PersonOption[] = body.people ?? [];
        if (cancelled) return;
        setPeople(nextPeople);
        const nextPerson = nextPeople.find((person) => person.id === body.defaultPersonId) ?? nextPeople[0];
        if (nextPerson) {
          setSelectedPersonId(nextPerson.id);
          setProfile(profileFromPerson(nextPerson));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile() {
    if (!selectedPersonId) {
      setMessage("Choose a person first.");
      return;
    }

    setMessage("Saving person profile...");
    const response = await fetch(`/api/people/${selectedPersonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const body = await response.json().catch(() => ({ error: "Could not save this profile." }));

    if (!response.ok) {
      setMessage(body.error ?? "Could not save this profile.");
      return;
    }

    const updatedPerson = body.person as PersonOption | undefined;
    if (updatedPerson) {
      setPeople((currentPeople) => currentPeople.map((person) => (person.id === updatedPerson.id ? { ...person, ...updatedPerson } : person)));
      setProfile(profileFromPerson(updatedPerson));
    }
    setMessage(
      body.refreshedReports
        ? `Person profile saved. Refreshed ${body.refreshedReports} report${body.refreshedReports === 1 ? "" : "s"}.`
        : "Person profile saved.",
    );
  }

  function updateProfile(key: keyof ProfileState, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function selectPerson(person: PersonOption, nextPeople = people) {
    setSelectedPersonId(person.id);
    setProfile(profileFromPerson(person));
    setPeople(nextPeople);
  }

  async function addPerson() {
    const name = newPersonName.trim();
    if (!name) {
      setMessage("Enter a name first.");
      return;
    }

    setMessage("Adding person...");
    const response = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await response.json().catch(() => ({ error: "Could not add that person." }));

    if (!response.ok) {
      setMessage(body.error ?? "Could not add that person.");
      return;
    }

    const person = body.person as PersonOption;
    const nextPeople = [...people, person];
    setPeople(nextPeople);
    setNewPersonName("");
    selectPerson(person, nextPeople);
    setMessage(`${person.name} added.`);
  }

  async function makeDefaultPerson() {
    if (!selectedPersonId) return;
    setMessage("Saving default person...");
    const response = await fetch(`/api/people/${selectedPersonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    const body = await response.json().catch(() => ({ error: "Could not update default person." }));

    if (!response.ok) {
      setMessage(body.error ?? "Could not update default person.");
      return;
    }

    setPeople((currentPeople) => currentPeople.map((person) => ({ ...person, isDefault: person.id === selectedPersonId })));
    setMessage("Default person updated.");
  }

  async function deletePerson() {
    const selectedPerson = people.find((person) => person.id === selectedPersonId);
    if (!selectedPerson) return;
    const confirmed = window.confirm(`Delete ${selectedPerson.name} and their saved reports?`);
    if (!confirmed) return;

    setMessage("Deleting person...");
    const response = await fetch(`/api/people/${selectedPerson.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => ({ error: "Could not delete that person." }));

    if (!response.ok) {
      setMessage(body.error ?? "Could not delete that person.");
      return;
    }

    const nextPeople = people
      .filter((person) => person.id !== selectedPerson.id)
      .map((person, index) => ({ ...person, isDefault: selectedPerson.isDefault ? index === 0 : person.isDefault }));
    setPeople(nextPeople);
    if (nextPeople[0]) selectPerson(nextPeople[0], nextPeople);
    setMessage(`${selectedPerson.name} deleted.`);
  }

  return (
    <div className="grid gap-4">
      {message ? <p className="rounded-md border border-border bg-panel p-3 text-sm text-muted">{message}</p> : null}

      <section className="rounded-md border border-border bg-panel p-5">
        <div className="flex items-start gap-3">
          <UserRound className="mt-1 size-5 text-primary" aria-hidden="true" />
          <div className="w-full">
            <h2 className="font-semibold">People for lab reports</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Add each person who may have reports in this account. Recommendations use the selected person&apos;s optional context, but lab ranges do not change.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="grid gap-2 text-sm font-medium">
                Selected person
                <select
                  value={selectedPersonId}
                  onChange={(event) => {
                    const person = people.find((item) => item.id === event.target.value);
                    if (person) selectPerson(person);
                  }}
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                >
                  {selectedPersonId ? null : <option value="">Loading people</option>}
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                      {person.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-end gap-2">
                <button onClick={makeDefaultPerson} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 font-medium" type="button">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  Make default
                </button>
                <button onClick={deletePerson} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-danger/40 px-3 font-medium text-danger" type="button">
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete person
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="grid gap-2 text-sm font-medium">
                Add new person
                <input
                  value={newPersonName}
                  onChange={(event) => setNewPersonName(event.target.value)}
                  placeholder="Mom, Dad, Alex"
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                />
              </label>
              <button onClick={addPerson} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-md border border-border px-3 font-medium" type="button">
                <Plus className="size-4" aria-hidden="true" />
                Add person
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Age
                <input
                  value={profile.profileAge}
                  onChange={(event) => updateProfile("profileAge", event.target.value)}
                  type="number"
                  min={0}
                  max={120}
                  inputMode="numeric"
                  placeholder="42"
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Gender
                <input
                  value={profile.profileGender}
                  onChange={(event) => updateProfile("profileGender", event.target.value)}
                  placeholder="Woman, man, nonbinary, prefer not to say"
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Country or region
                <input
                  value={profile.profileCountry}
                  onChange={(event) => updateProfile("profileCountry", event.target.value)}
                  placeholder="United States"
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Cultural background or ethnicity
                <input
                  value={profile.profileEthnicity}
                  onChange={(event) => updateProfile("profileEthnicity", event.target.value)}
                  placeholder="Optional"
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Work or daily role
                <input
                  value={profile.profileJob}
                  onChange={(event) => updateProfile("profileJob", event.target.value)}
                  placeholder="Desk job, night shift, driver, active job"
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Hobbies or movement you enjoy
                <input
                  value={profile.profileHobbies}
                  onChange={(event) => updateProfile("profileHobbies", event.target.value)}
                  placeholder="Walking, cooking, gardening, dancing"
                  className="min-h-11 rounded-md border border-border bg-background px-3"
                />
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-medium">
              Daily routine notes
              <textarea
                value={profile.profileRoutine}
                onChange={(event) => updateProfile("profileRoutine", event.target.value)}
                rows={3}
                placeholder="Busy mornings, family dinners, travel days, late work"
                className="rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <button onClick={saveProfile} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 font-semibold text-white dark:text-[#06201d]" type="button">
              <Save className="size-4" aria-hidden="true" />
              Save profile
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
