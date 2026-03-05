package com.proyectofincurso.estanteria.auth;


public class InspeccionarService {
    
    private final InspeccionarRepository insRepo;
    private static final int IMAGEN_PATH_CAPACIDAD = 255;
    private static final java.util.regex.Pattern SAFE_RELATIVE_PATH = java.util.regex.Pattern.compile("^[a-zA-Z0-9/_\\-.]+$");
    private static final java.util.Set<String> ALLOWED_EXT = java.util.Set.of("jpg", "jpeg", "png", "webp");

    public InspeccionarService(InspeccionarRepository insRepo){
        this.insRepo = insRepo;
    }

    private String verificarImagenPath(String imagenPath){
        if(imagenPath == null) return null;
        imagenPath = imagenPath.trim();

        if(imagenPath.isEmpty()) return null;
        if(imagenPath.length>IMAGEN_PATH_CAPACIDAD){
            throw new IllegalArgumentException("El path de la imagen es demasiado largo, solo se permiten 255 caracteres");
        }

        if(imagenPath.contains("..")){
            throw new IllegalArgumentException("No está permitido los caracteres '..' dentro del path.");
        }
        if(imagenPath.startsWith("/") || imagenPath.startsWith("\\") || imagenPath.startsWith("\\") || imagenPath.contains(":")){
            throw new IllegalArgumentException("Rutas absolutas no están permitidas");
        }

        if (imagenPath.startsWith("http://") || imagenPath.startsWith("https://")) {
        throw new IllegalArgumentException("imagenPath inválido (URLs no permitidas)");
        }

        if (!SAFE_RELATIVE_PATH.matcher(imagenPath).matches()) {
            throw new IllegalArgumentException("imagenPath inválido (caracteres no permitidos)");
        }

        int dot = imagenPath.lastIndexOf('.');
        if (dot <= 0 || dot == imagenPath.length() - 1) {
            throw new IllegalArgumentException("imagenPath inválido (falta extensión)");
        }
        String ext = imagenPath.substring(dot + 1).toLowerCase();
        if (!ALLOWED_EXT.contains(ext)) {
            throw new IllegalArgumentException("imagenPath inválido (extensión no permitida)");
        }

        return imagenPath;
    }
    public void verificar(String estanteriaCodigo, String notas, String imagenPath){
        if(insRepo.existsByEstanteriaCodigoIgnoreCase(estanteriaCodigo)){
            throw new UnauthorizedException("Ya existe una estanteria con ese código");
        }

        Inspeccion ins = new Inspeccion();
        ins.setEstanteriaCodigo(estanteriaCodigo);
    }
}
