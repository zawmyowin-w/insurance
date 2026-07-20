package com.insurance.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.portal.model.InsuranceType;
import com.insurance.portal.repository.InsurancePackageRepository;
import com.insurance.portal.repository.InsuranceTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiChatController {

    @Value("${XAI_API_KEY:}")
    private String xaiApiKey;

    private final InsuranceTypeRepository insuranceTypeRepo;
    private final InsurancePackageRepository packageRepo;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {
        String message = body.getOrDefault("message", "").toString().trim();
        if (message.isBlank())
            return ResponseEntity.badRequest().body(Map.of("reply", "Please enter a question."));
        if (message.length() > 1000)
            return ResponseEntity.badRequest().body(Map.of("reply", "Message is too long."));

        var types = insuranceTypeRepo.findAllByOrderByNameAsc();
        var packages = packageRepo.findAllByActive(true);

        String context = buildContext(types, packages);

        if (xaiApiKey != null && !xaiApiKey.isBlank()) {
            try {
                String reply = callXai(message, context);
                return ResponseEntity.ok(Map.of("reply", reply));
            } catch (Exception ignored) {
                // fall through to rule-based reply
            }
        }

        return ResponseEntity.ok(Map.of("reply", buildFallbackReply(message, types, packages)));
    }

    // ── Build system context from DB ────────────────────────────────

    private String buildContext(List<InsuranceType> types, List<?> packages) {
        var sb = new StringBuilder();
        sb.append("You are an AI assistant for Digital Insurance Claim and Premiums (DICP), a Myanmar-based insurance portal. ");
        sb.append("Answer questions about insurance types, plans, and benefits helpfully and concisely in the same language the user writes in (English or Myanmar/Burmese).\n\n");

        sb.append("=== Available Insurance Types ===\n");
        for (var t : types) {
            sb.append("• ").append(t.getName());
            if (t.getDescription() != null && !t.getDescription().isBlank())
                sb.append(": ").append(t.getDescription());
            if (t.getBenefits() != null && !t.getBenefits().isBlank())
                sb.append("\n  Benefits: ").append(t.getBenefits());
            if (t.getRules() != null && !t.getRules().isBlank())
                sb.append("\n  Rules: ").append(t.getRules());
            sb.append("\n");
        }

        sb.append("\n=== Available Insurance Plans ===\n");
        for (var p : packages) {
            try {
                var pr = com.insurance.portal.dto.PackageResponse.from((com.insurance.portal.model.InsurancePackage) p);
                sb.append("• ").append(pr.getName()).append(" [").append(pr.getType()).append("]");
                if (pr.getDescription() != null) sb.append(": ").append(pr.getDescription());
                if (pr.getCoverageMin() != null && pr.getCoverageMax() != null)
                    sb.append(" | Coverage: ").append(pr.getCoverageMin()).append("–").append(pr.getCoverageMax()).append(" MMK");
                sb.append("\n");
            } catch (Exception ignored) {}
        }

        sb.append("\nKeep answers concise. If you don't know something specific, guide the user to contact an agent or browse the Plans page.");
        return sb.toString();
    }

    // ── xAI Grok API call ─────────────────────────────────────────

    private String callXai(String message, String context) throws Exception {
        String requestBody = MAPPER.writeValueAsString(Map.of(
            "model", "grok-3-mini",
            "messages", List.of(
                Map.of("role", "system", "content", context),
                Map.of("role", "user", "content", message)
            ),
            "max_tokens", 600,
            "temperature", 0.7
        ));

        var request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.x.ai/v1/chat/completions"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + xaiApiKey)
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .timeout(Duration.ofSeconds(30))
            .build();

        var client = HttpClient.newHttpClient();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());

        var json = MAPPER.readTree(response.body());
        String reply = json.path("choices").path(0).path("message").path("content").asText("");
        if (reply.isBlank()) throw new RuntimeException("Empty reply from xAI");
        return reply;
    }

    // ── Rule-based fallback (no API key) ─────────────────────────

    private String buildFallbackReply(String message, List<InsuranceType> types, List<?> packages) {
        String lower = message.toLowerCase();

        if (lower.contains("type") || lower.contains("အမျိုးအစား") || lower.contains("kind") || lower.contains("မျိုး")) {
            if (types.isEmpty()) {
                return "We currently offer a range of insurance products. Please visit our Plans page for details.";
            }
            StringBuilder sb = new StringBuilder("We offer the following insurance types:\n");
            for (var t : types) {
                sb.append("• **").append(t.getName()).append("**");
                if (t.getDescription() != null && !t.getDescription().isBlank())
                    sb.append(" — ").append(t.getDescription());
                sb.append("\n");
            }
            sb.append("\nVisit the Plans page to see all available plans and calculate your premium.");
            return sb.toString();
        }

        if (lower.contains("plan") || lower.contains("package") || lower.contains("premium") || lower.contains("ပရီမီယံ") || lower.contains("plan")) {
            return "We have " + packages.size() + " active insurance plan(s) available. Each plan comes with different coverage amounts, premium rates, and payment frequencies. Visit our **Plans** page to compare all plans and calculate your premium.";
        }

        if (lower.contains("benefit") || lower.contains("coverage") || lower.contains("cover") || lower.contains("အကျိုးခံစားခွင့်")) {
            StringBuilder sb = new StringBuilder("Here's a summary of benefits by insurance type:\n");
            boolean any = false;
            for (var t : types) {
                if (t.getBenefits() != null && !t.getBenefits().isBlank()) {
                    sb.append("• **").append(t.getName()).append("**: ").append(t.getBenefits()).append("\n");
                    any = true;
                }
            }
            if (!any) sb.append("Please visit our Plans page or contact an agent for detailed benefit information.");
            return sb.toString();
        }

        if (lower.contains("claim") || lower.contains("တောင်းဆိုမှု")) {
            return "To file a claim:\n1. Log in to your account\n2. Go to **Claims** in your dashboard\n3. Select your approved policy and fill in the claim details\n4. Upload supporting documents\n5. Submit — an agent will review and process your claim shortly.";
        }

        if (lower.contains("payment") || lower.contains("pay") || lower.contains("ငွေပေးချေ")) {
            return "Premium payments are made through your dashboard:\n1. Go to **Payments** after your policy is approved\n2. Select the payment period\n3. Choose your payment method (KBZ Pay, Wave Pay, etc.)\n4. Transfer the amount and upload your transaction screenshot\n5. Admin will verify your payment.";
        }

        if (lower.contains("apply") || lower.contains("register") || lower.contains("လျှောက်") || lower.contains("sign up") || lower.contains("how")) {
            return "Getting started is easy:\n1. **Register** a free account\n2. Browse **Plans** and choose the right one\n3. Submit your application — an agent will review it\n4. Once approved, make your premium payment\n5. You're covered! Download your policy contract from the dashboard.";
        }

        // Default greeting / fallback
        return "Hello! I'm the DICP Insurance Assistant. I can help you with:\n" +
               "• Information about insurance types and plans\n" +
               "• How to apply for a policy\n" +
               "• Understanding benefits and coverage\n" +
               "• Payment and claims guidance\n\n" +
               "What would you like to know?";
    }
}
