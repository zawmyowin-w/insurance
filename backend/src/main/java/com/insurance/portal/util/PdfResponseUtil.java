package com.insurance.portal.util;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * Builds the PDF download responses served by the report and contract
 * endpoints. The frontend fetches these as blobs (downloadPdfFromApi), so the
 * Content-Disposition filename is what the user ends up saving.
 */
public final class PdfResponseUtil {

    private PdfResponseUtil() {}

    /** 200 with an {@code application/pdf} attachment body. */
    public static ResponseEntity<byte[]> attachment(byte[] data, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
