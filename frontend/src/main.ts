type PersonalRequest = { userName: string; userAge: number };

const root = document.querySelector<HTMLDivElement>("#app")!;

root.innerHTML = `
  <h1>Demo: validar nombre y edad (TS → Spring)</h1>

  <form id="personForm">
    <label>
      Nombre:
      <input id="name" type="text" autocomplete="off" />
    </label>

    <br /><br />

    <label>
      Edad:
      <input id="age" type="number" min="0" max="100" />
    </label>

    <br /><br />

    <button type="submit">Enviar</button>
  </form>

  <pre id="out"></pre>
`;

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

  // Validación mínima en cliente (para UX). La validación real es en Spring.
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

    const data = await res.json();

    if (!res.ok) {
      show(data); // aquí verás VALIDATION_ERROR con fieldErrors desde Spring
      return;
    }

    show(data); // OK
  } catch (err) {
    show({ error: "NETWORK_ERROR", detail: String(err) });
  }
});
