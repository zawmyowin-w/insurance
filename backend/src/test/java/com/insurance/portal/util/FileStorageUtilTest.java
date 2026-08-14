package com.insurance.portal.util;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileStorageUtilTest {

    /**
     * FileStorageUtil resolves its storage root once, in a static initializer, so the
     * property has to be set before the class is loaded by any test method.
     */
    private static final Path STORAGE_ROOT;

    static {
        try {
            STORAGE_ROOT = Files.createTempDirectory("file-storage-util-test");
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        System.setProperty("app.upload.dir", STORAGE_ROOT.toString());
    }

    private static MockMultipartFile png(String name) {
        return new MockMultipartFile(name, name + ".png", "image/png", new byte[]{1, 2, 3});
    }

    @Test
    void savesImageUnderSubDirAndReturnsRelativePath() throws IOException {
        String path = FileStorageUtil.saveImage(png("sig"), "signatures", "sig");

        assertNotNull(path);
        assertFalse(Paths.get(path).isAbsolute());
        assertTrue(path.startsWith("signatures" + File.separator));
        assertTrue(path.endsWith(".png"));
        assertTrue(Files.exists(STORAGE_ROOT.resolve(path)));
    }

    @Test
    void savesPdfAndImageDocuments() throws IOException {
        String pdf = FileStorageUtil.saveDocument(
                new MockMultipartFile("doc", "doc.pdf", "application/pdf", new byte[]{4}), "claims", "claim");
        String image = FileStorageUtil.saveDocument(png("doc"), "claims", "claim");

        assertTrue(pdf.endsWith(".pdf"));
        assertTrue(image.endsWith(".png"));
    }

    @Test
    void returnsNullForMissingOrEmptyUploads() throws IOException {
        assertNull(FileStorageUtil.saveDocument(null, "claims", "claim"));
        assertNull(FileStorageUtil.saveImage(null, "claims", "claim"));
        assertNull(FileStorageUtil.saveDocument(
                new MockMultipartFile("doc", "doc.pdf", "application/pdf", new byte[0]), "claims", "claim"));
    }

    @Test
    void rejectsUnsupportedContentTypes() {
        MockMultipartFile exe = new MockMultipartFile("doc", "doc.exe", "application/x-msdownload", new byte[]{1});
        MockMultipartFile pdf = new MockMultipartFile("doc", "doc.pdf", "application/pdf", new byte[]{1});

        assertThrows(RuntimeException.class, () -> FileStorageUtil.saveDocument(exe, "claims", "claim"));
        assertThrows(RuntimeException.class, () -> FileStorageUtil.saveImage(pdf, "claims", "claim"));
    }

    @Test
    void savesMultipleDocumentsAndSkipsEmptyOnes() throws IOException {
        List<String> paths = FileStorageUtil.saveDocuments(
                List.of(png("a"), new MockMultipartFile("b", "b.png", "image/png", new byte[0]), png("c")),
                "documents", "doc");

        assertEquals(2, paths.size());
        assertTrue(FileStorageUtil.saveDocuments(null, "documents", "doc").isEmpty());
    }

    @Test
    void deleteFileQuietlyRemovesStoredFileAndIgnoresBadInput() throws IOException {
        String path = FileStorageUtil.saveImage(png("temp"), "documents", "temp");

        FileStorageUtil.deleteFileQuietly(path);
        assertFalse(Files.exists(STORAGE_ROOT.resolve(path)));

        FileStorageUtil.deleteFileQuietly(null);
        FileStorageUtil.deleteFileQuietly("  ");
        FileStorageUtil.deleteFileQuietly("../../etc/passwd");
    }

    @Test
    void jsonArrayRoundTrip() {
        String json = FileStorageUtil.toJsonArray(List.of("a.png", "b.pdf"));

        assertEquals(List.of("a.png", "b.pdf"), FileStorageUtil.fromJsonArray(json));
        assertNull(FileStorageUtil.toJsonArray(null));
        assertNull(FileStorageUtil.toJsonArray(List.of()));
        assertTrue(FileStorageUtil.fromJsonArray(null).isEmpty());
        assertTrue(FileStorageUtil.fromJsonArray("  ").isEmpty());
        assertTrue(FileStorageUtil.fromJsonArray("not-json").isEmpty());
    }

    @Test
    void mapsExtensionsToContentTypes() {
        assertEquals("image/png", FileStorageUtil.contentTypeFor("a/b.PNG"));
        assertEquals("image/jpeg", FileStorageUtil.contentTypeFor("a.jpg"));
        assertEquals("image/jpeg", FileStorageUtil.contentTypeFor("a.jpeg"));
        assertEquals("image/webp", FileStorageUtil.contentTypeFor("a.webp"));
        assertEquals("image/gif", FileStorageUtil.contentTypeFor("a.gif"));
        assertEquals("application/pdf", FileStorageUtil.contentTypeFor("a.pdf"));
        assertEquals("application/octet-stream", FileStorageUtil.contentTypeFor("a.txt"));
        assertEquals("application/octet-stream", FileStorageUtil.contentTypeFor(null));
    }

    @Test
    void streamFileServesStoredFileAndRejectsTraversal() throws IOException {
        String path = FileStorageUtil.saveImage(png("stream"), "documents", "stream");

        ResponseEntity<?> ok = FileStorageUtil.streamFile(path);
        assertEquals(HttpStatus.OK, ok.getStatusCode());
        assertEquals("image/png", ok.getHeaders().getContentType().toString());
        assertTrue(ok.getBody() instanceof FileSystemResource);

        assertEquals(HttpStatus.NOT_FOUND, FileStorageUtil.streamFile("documents/missing.png").getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, FileStorageUtil.streamFile("../outside.png").getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, FileStorageUtil.streamFile("  ").getStatusCode());
    }

    @Test
    void serveFormFileResolvesPathFromFormData() throws IOException {
        String path = FileStorageUtil.saveImage(png("form"), "documents", "form");
        String formData = "{\"field-1\":\"" + path.replace("\\", "\\\\") + "\"}";

        assertEquals(HttpStatus.OK, FileStorageUtil.serveFormFile(formData, "field-1").getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, FileStorageUtil.serveFormFile(formData, "field-2").getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, FileStorageUtil.serveFormFile(null, "field-1").getStatusCode());
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR,
                FileStorageUtil.serveFormFile("not-json", "field-1").getStatusCode());
    }
}
