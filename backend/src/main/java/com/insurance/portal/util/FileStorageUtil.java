package com.insurance.portal.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;

/**
 * Shared helper for saving customer-uploaded files (payment screenshots, claim documents,
 * application supporting documents) safely under ./uploads/{subDir}, and for tracking
 * multiple uploaded paths as a JSON array string in a single TEXT/VARCHAR column.
 */
public final class FileStorageUtil {

    private static final Map<String, String> IMAGE_EXT = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private FileStorageUtil() {}

    /** Saves a single file under uploads/{subDir}, validating it is an image or PDF. Returns the saved absolute path, or null if file is empty. */
    public static String saveDocument(MultipartFile file, String subDir, String prefix) throws IOException {
        if (file == null || file.isEmpty()) return null;
        String contentType = file.getContentType();
        String ext;
        if (contentType != null && IMAGE_EXT.containsKey(contentType.toLowerCase())) {
            ext = IMAGE_EXT.get(contentType.toLowerCase());
        } else if ("application/pdf".equalsIgnoreCase(contentType)) {
            ext = ".pdf";
        } else {
            throw new RuntimeException("Unsupported file type. Only JPEG, PNG, WEBP, GIF, and PDF are allowed.");
        }
        // Ignore client filename — generate server-side UUID name to prevent path traversal
        String safeFilename = prefix + "_" + UUID.randomUUID() + ext;
        File uploadRoot = new File("./uploads/" + subDir).getCanonicalFile();
        uploadRoot.mkdirs();
        File dest = new File(uploadRoot, safeFilename).getCanonicalFile();
        // Verify resolved path stays within upload root (path traversal guard)
        if (!dest.getPath().startsWith(uploadRoot.getPath())) {
            throw new RuntimeException("Invalid upload path");
        }
        file.transferTo(dest);
        return dest.getPath();
    }

    /** Saves a single image file (profile pictures) under uploads/{subDir} — rejects PDFs and any non-image type. */
    public static String saveImage(MultipartFile file, String subDir, String prefix) throws IOException {
        if (file == null || file.isEmpty()) return null;
        String contentType = file.getContentType();
        if (contentType == null || !IMAGE_EXT.containsKey(contentType.toLowerCase())) {
            throw new RuntimeException("Only JPEG, PNG, WEBP, and GIF images are allowed.");
        }
        String ext = IMAGE_EXT.get(contentType.toLowerCase());
        String safeFilename = prefix + "_" + UUID.randomUUID() + ext;
        File uploadRoot = new File("./uploads/" + subDir).getCanonicalFile();
        uploadRoot.mkdirs();
        File dest = new File(uploadRoot, safeFilename).getCanonicalFile();
        if (!dest.getPath().startsWith(uploadRoot.getPath())) {
            throw new RuntimeException("Invalid upload path");
        }
        file.transferTo(dest);
        return dest.getPath();
    }

    /** Best-effort delete of a previously stored file (e.g. when replacing a profile picture). */
    public static void deleteFileQuietly(String path) {
        if (path == null || path.isBlank()) return;
        try { new File(path).delete(); } catch (Exception ignored) {}
    }

    public static List<String> saveDocuments(List<MultipartFile> files, String subDir, String prefix) throws IOException {
        List<String> paths = new ArrayList<>();
        if (files == null) return paths;
        for (MultipartFile f : files) {
            String p = saveDocument(f, subDir, prefix);
            if (p != null) paths.add(p);
        }
        return paths;
    }

    public static String toJsonArray(List<String> paths) {
        if (paths == null || paths.isEmpty()) return null;
        try { return new ObjectMapper().writeValueAsString(paths); }
        catch (Exception e) { return null; }
    }

    @SuppressWarnings("unchecked")
    public static List<String> fromJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return new ObjectMapper().readValue(json, List.class);
        } catch (Exception e) { return List.of(); }
    }

    public static String contentTypeFor(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".pdf")) return "application/pdf";
        return "application/octet-stream";
    }

    /** Streams a file from disk as an HTTP response. Returns 404 if the file does not exist. */
    public static ResponseEntity<?> streamFile(String path) {
        File file = new File(path);
        if (!file.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentTypeFor(path)))
                .body(new FileSystemResource(file));
    }

    /**
     * Serves a single file whose path is stored inside a dynamic form-data JSON string.
     * formDataJson: JSON object where fieldId maps to a file path on disk.
     */
    @SuppressWarnings("unchecked")
    public static ResponseEntity<?> serveFormFile(String formDataJson, String fieldId) {
        if (formDataJson == null) return ResponseEntity.notFound().build();
        try {
            Map<String, Object> data = new ObjectMapper().readValue(formDataJson, Map.class);
            Object val = data.get(fieldId);
            if (val == null) return ResponseEntity.notFound().build();
            return streamFile(val.toString());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
