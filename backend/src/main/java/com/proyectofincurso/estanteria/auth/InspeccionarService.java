package com.proyectofincurso.estanteria.auth;


public class InspeccionarService {
    
    private final InspeccionarRepository insRepo;

    public InspeccionarService(InspeccionarRepository insRepo){
        this.insRepo = insRepo;
    }

    public void verificar(String estanteriaCodigo, String notas, String imagenPath){
        if(insRepo.existsByEstanteriaCodigoIgnoreCase(estanteriaCodigo)){
            throw new UnauthorizedException("Ya existe una estanteria con ese código");
        }

        Inspeccion ins = new Inspeccion();
        ins.setEstanteriaCodigo(estanteriaCodigo);
    }
}
