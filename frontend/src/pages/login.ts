//Establecemos los tipos para no equivocarnos con los campos
type LoginRequest = {email: string; password:string}
type LoginResponse = {message: string; userName: string; role: string; token: string}

//Toma de los valores de cada campo del formulario, document representa la pagina cargada
const form = document.querySelector<HTMLFormElement>("#form-login");
const useremailInput = document.querySelector<HTMLInputElement>("#login-email");
const userpasswordInput = document.querySelector<HTMLInputElement>("#login-password");
const rememberInput = document.querySelector<HTMLInputElement>("#login-remember");
const errorEl = document.querySelector<HTMLElement>("#login-error");
const out = document.querySelector<HTMLPreElement>("#out");


//Si el objeto es un string se pone tal cual, si no se hace un json de este
function show(obj:unknown){
    if(!out) return;
    out.textContent = typeof obj === "string" ? obj : JSON.stringify(obj,null,2);
}

function setError(msg: string | null){
    if(!errorEl) return;
    if(!msg){ 
        errorEl.textContent="";
        errorEl.setAttribute("hidden","");
        return;
    }

    errorEl.textContent = msg;
    errorEl.removeAttribute("hidden");
}

//Se validan los datos en el frontend para evitar errores y mandar datos inutiles
function validateClient(email: string, password: string): Record<string,string>{
    const errors: Record<string, string> = {};
    if(!email.trim()) errors.email = "El email es obligatorio";
    if (!password) errors.password = "La contraseña es obligatoria";
    return errors;
}

//Aseguramos que estos elementos existen ya que el script se ejecuta antes que el documento y puede dar error
if (form && useremailInput && userpasswordInput) {
    //Limpiamos errores antiguos
    useremailInput.addEventListener("input", () => setError(null));
    userpasswordInput.addEventListener("input", () => setError(null));

    
    // Un formulario por defecto recarga la página y manda un POST/GET tradicional.
    // No queremos eso; queremos enviar manualmente un fetch a la API y controlar errores sin recargar.
    form.addEventListener("submit", async (e) =>{
        e.preventDefault();
        setError(null);
        //Construimos el json con los datos tomados
        const payload: LoginRequest = {
            email : useremailInput.value.trim(),
            password : userpasswordInput.value,
        };

        //En el caso que tengamos un error devolvemos este
        const clienteErrores = validateClient(payload.email, payload.password);
        if (Object.keys(clienteErrores).length > 0) {
            setError(Object.values(clienteErrores).join(" "));
            show({ error: "CLIENTE_VALIDACION_ERROR", fieldErrors: clienteErrores});
            return;
        }

        //Bloqueo para evitar doble submit
        const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        if(submitBtn) submitBtn.disabled = true;

        try{
            //Funcion del navegador para hacer HTTP requests, mandamos los datos al backend
            const res = await fetch("/api/login",{
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify(payload)
            });

            //Esperamos a que llegue , leemos el body como texto y lo parseamos a JSON si existe contenido
            const text = await res.text();
            const data = text ? JSON.parse(text) : null;

            //Si no es correcta mandamos el error
            if(!res.ok){
                show(data ?? {error: "HTTP_ERROR", status: res.status});
                
                const msg= data?.message ?? (res.status === 401 ? "Credenciales inválidas." : "Error al iniciar sesión");
                setError(msg);
                return;
            }

            const login = data as LoginResponse;

            //Si esta marcado , localStorage persiste si no, sessionStore el cual se borra al cerrar la pestaña
            const storage = rememberInput?.checked ? localStorage : sessionStorage;
            storage.setItem("auth_token", login.token);
            storage.setItem("auth_user", login.userName);
            storage.setItem("auth_role", login.role);


            show(login);
            //Aquí es donde se redirige tras haber conseguido realizar los pasos que deseamos
            window.location.href = "/html/home.html";
        }catch{
            setError("No se pudo conectar con el servidor.");
            show({error:"NETWORK_ERROR"});
        }finally{
            if(submitBtn) submitBtn.disabled = false;
        }
    })
}