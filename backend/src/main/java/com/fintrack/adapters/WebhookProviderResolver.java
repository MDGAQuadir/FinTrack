package com.fintrack.adapters;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class WebhookProviderResolver {

    private final Map<String, PaymentWebhookProvider> providerMap = new HashMap<>();

    public WebhookProviderResolver(List<PaymentWebhookProvider> providers) {
        for (PaymentWebhookProvider p : providers) {
            providerMap.put(p.getProviderName().toLowerCase(), p);
        }
    }

    public Optional<PaymentWebhookProvider> resolve(String providerSlug) {
        if (providerSlug == null) return Optional.empty();
        return Optional.ofNullable(providerMap.get(providerSlug.trim().toLowerCase()));
    }
}
