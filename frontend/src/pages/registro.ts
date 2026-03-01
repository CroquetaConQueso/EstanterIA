//Establecimiento del tipo de contrato
type RegistroRequest = {username : string; email: string; role: string; tienda: string; password: string;}

//Toma de los valores de cada campo del formulario
const form = document.querySelector<HTMLFormElement>("#form-registro");
const usernameInput = document.querySelector<HTMLInputElement>("#reg-nombre");
const useremailInput = document.querySelector<HTMLInputElement>("#reg-email");
const userroleInput = document.querySelector<HTMLSelectElement>("#reg-rol");
const usertiendaInput= document.querySelector<HTMLInputElement>("#reg-tienda");
const userpasswordInput = document.querySelector<HTMLInputElement>("#reg-pass");
const userpassword2Input = document.querySelector<HTMLInputElement>("#reg-pass2");
const useracceptInput = document.querySelector<HTMLInputElement>("#reg-terms");
const errorReg = document.querySelector<HTMLElement>("#reg-error");

//Feedback/Toma de errores
function setError(msg:string | null){
    if(!errorReg) return;
    if(!msg){
        errorReg.textContent="";
        errorReg.setAttribute("hidden","");
        return;
    }

    errorReg.textContent = msg;
    errorReg.removeAttribute("hidden");
}


//Validacion de los valores del cliente
function validateClient(username : string, email :string, role: string,  tienda:string, password:string, acceptedTerms: boolean){
    const errors: Record<string,string> ={};
    if(!username.trim()) errors.username = "El nombre del usuario es obligatorio";
    if(!email.trim()) errors.email = "El email es obligatorio";
    else if(!email.includes("@")) errors.email = "El email no es válido";
    if(!role) errors.role = "Debes de escoger un rol";
    if(!tienda.trim()) errors.tienda = "Se debe de establecer el nombre de una tienda";
    if(!password.trim()) errors.password = "La contraseña es obligatoria";
    if(!acceptedTerms) errors.terms = "Debes aceptar las condiciones"

    return errors;
}



if (form && usernameInput && useremailInput && userroleInput && usertiendaInput && userpasswordInput && userpassword2Input){
    //Limpiamos errores antiguos al añadir listeners a cada uno de estos
    usernameInput.addEventListener("input", ()=> setError(null));
    useremailInput.addEventListener("input", ()=> setError(null));
    userroleInput.addEventListener("input", ()=> setError(null));
    usertiendaInput.addEventListener("input", ()=> setError(null));
    userpasswordInput.addEventListener("input", ()=> setError(null));
    userpassword2Input.addEventListener("input", ()=> setError(null));

    //Evitamos recarga y controlamos el flujo con fetch
    form.addEventListener("submit", async (e)=>{
        e.preventDefault();
        setError(null);

        //Verificacion de las contraseñas
        const password = userpasswordInput.value;
        const password2 = userpassword2Input.value;

        if(password != password2){
            setError("Las contraseñas no coinciden");
            return;
        }

        //Construccion del json
        const payload: RegistroRequest = {
            username : usernameInput.value.trim(),
            email : useremailInput.value.trim(),
            role : userroleInput.value,
            tienda : usertiendaInput.value,
            password,
        };

        const acceptedTerms = !!useracceptInput?.checked;
        //Validacion de los datos
        const clienteErrores = validateClient(payload.username, payload.email , payload.role, payload.tienda, payload.password, acceptedTerms);
        //Si hemos encontrado algun error lo mostramos
        if (Object.keys(clienteErrores).length > 0){
            setError(Object.values(clienteErrores).join(" "));
            return;
        }

        //Evita doble submit
        const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        if(submitBtn) submitBtn.disabled = true;


        try{
            //Se realiza el http request, mandado los datos al backend
            const res = await fetch("/api/registro",{
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            });

            //Esperamos a la respuesta
            const text = await res.text();
            const data = text ? JSON.parse(text) : null;

            //Si no es correcto mostramos feedback
            if(!res.ok){
                let msg = data?.message;

                if (!msg){
                    if(res.status === 409) msg = "Ya existe una cuenta con ese email o usuario";
                    else if(res.status === 400) msg = "Revisa los datos del formulario";
                    else msg = "Error al crear la cuenta";
                }
                setError(msg);
                return;
            }

            //Si todo es correcto volvemos al login
            window.location.href = "/html/login.html";
        }catch{
            setError("No se puede conectar con el servidor");
        }finally{
            if(submitBtn) submitBtn.disabled = false;
        }
    })
}