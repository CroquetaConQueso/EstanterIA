type PersonalRequest = { userName: string; userAge: number };

const form = document.querySelector<HTMLFormElement>("#personForm")!;
const nameInput = document.querySelector<HTMLInputElement>("#name")!;
const ageInput = document.querySelector<HTMLInputElement>("#age")!;
const out = document.querySelector<HTMLPreElement>("#out")!;

function show(obj: unknown) {
  out.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
}

function validateClient(userName: string, userAge: number): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!userName.trim()) errors.userName = "El nombre es obligatorio";
  if (!Number.isFinite(userAge)) errors.userAge = "La edad es obligatoria";
  if (userAge < 0 || userAge > 100) errors.userAge = "La edad debe estar entre 0 y 100";
  return errors;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload: PersonalRequest = {
    userName: nameInput.value,
    userAge: Number(ageInput.value),
  };

  const clientErrors = validateClient(payload.userName, payload.userAge);
  if (Object.keys(clientErrors).length > 0) {
    show({ error: "CLIENT_VALIDATION_ERROR", fieldErrors: clientErrors });
    return;
  }

  try {
    const res = await fetch("/api/person", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      show(data ?? { error: "HTTP_ERROR", status: res.status });
      return;
    }

    show(data);
  } catch (err) {
    show({ error: "NETWORK_ERROR", detail: String(err) });
  }
});
