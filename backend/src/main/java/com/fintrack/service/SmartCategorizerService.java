package com.fintrack.service;

import org.springframework.stereotype.Service;
import java.util.Locale;

@Service
public class SmartCategorizerService {

    public String categorize(String description, String type) {
        if (description == null || description.isBlank()) {
            return "CREDIT".equalsIgnoreCase(type) ? "Other Income" : "General Expense";
        }

        String lower = description.toLowerCase(Locale.ROOT);

        // Credit Categorization
        if ("CREDIT".equalsIgnoreCase(type)) {
            if (lower.contains("salary") || lower.contains("payroll") || lower.contains("wages") || lower.contains("stipend") || lower.contains("ach credit")) {
                return "Salary";
            }
            if (lower.contains("interest") || lower.contains("dividend") || lower.contains("fd int") || lower.contains("yield")) {
                return "Investment";
            }
            if (lower.contains("refund") || lower.contains("reversal") || lower.contains("cashback") || lower.contains("reward")) {
                return "Refunds";
            }
            if (lower.contains("freelance") || lower.contains("consult") || lower.contains("client") || lower.contains("invoice")) {
                return "Freelancing";
            }
            if (lower.contains("rent") || lower.contains("tenant")) {
                return "Rental Income";
            }
            return "UPI Inflow";
        }

        // Debit / Outflow Categorization
        // 1. Food & Dining / Groceries
        if (lower.contains("swiggy") || lower.contains("zomato") || lower.contains("blinkit") || lower.contains("zepto") ||
            lower.contains("instamart") || lower.contains("mcdonald") || lower.contains("starbucks") || lower.contains("domino") ||
            lower.contains("kfc") || lower.contains("pizza") || lower.contains("restaurant") || lower.contains("cafe") ||
            lower.contains("bakery") || lower.contains("grocery") || lower.contains("supermarket") || lower.contains("dmart")) {
            return "Food & Dining";
        }

        // 2. Transportation & Travel
        if (lower.contains("uber") || lower.contains("ola") || lower.contains("rapido") || lower.contains("metro") ||
            lower.contains("fuel") || lower.contains("petrol") || lower.contains("hpcl") || lower.contains("bpcl") ||
            lower.contains("ioc l") || lower.contains("iocl") || lower.contains("shell") || lower.contains("irctc") ||
            lower.contains("makemytrip") || lower.contains("indigo") || lower.contains("air india") || lower.contains("fastag")) {
            return "Transportation";
        }

        // 3. Shopping & E-Commerce
        if (lower.contains("amazon") || lower.contains("flipkart") || lower.contains("myntra") || lower.contains("ajio") ||
            lower.contains("nykaa") || lower.contains("tata cliq") || lower.contains("zara") || lower.contains("h&m") ||
            lower.contains("retail") || lower.contains("store") || lower.contains("mall")) {
            return "Shopping";
        }

        // 4. Bills & Utilities
        if (lower.contains("electricity") || lower.contains("bescom") || lower.contains("tneb") || lower.contains("mahadiscom") ||
            lower.contains("airtel") || lower.contains("jio") || lower.contains("vodafone") || lower.contains("vi bill") ||
            lower.contains("broadband") || lower.contains("act fiber") || lower.contains("wifi") || lower.contains("water bill") ||
            lower.contains("gas bill") || lower.contains("indane") || lower.contains("hp gas") || lower.contains("recharge")) {
            return "Bills & Utilities";
        }

        // 5. Entertainment & Subscriptions
        if (lower.contains("netflix") || lower.contains("spotify") || lower.contains("prime video") || lower.contains("hotstar") ||
            lower.contains("disney") || lower.contains("youtube") || lower.contains("apple.com") || lower.contains("google play") ||
            lower.contains("bookmyshow") || lower.contains("pvr") || lower.contains("inox") || lower.contains("cinema")) {
            return "Entertainment";
        }

        // 6. Healthcare & Fitness
        if (lower.contains("pharmacy") || lower.contains("apollo") || lower.contains("medplus") || lower.contains("1mg") ||
            lower.contains("pharmeasy") || lower.contains("hospital") || lower.contains("clinic") || lower.contains("doctor") ||
            lower.contains("gym") || lower.contains("cult.fit") || lower.contains("lab")) {
            return "Healthcare";
        }

        // 7. Housing & Maintenance
        if (lower.contains("rent") || lower.contains("maintenance") || lower.contains("society") || lower.contains("nobroker") ||
            lower.contains("mygate")) {
            return "Housing";
        }

        // 8. Financial Services / EMIs / Investments
        if (lower.contains("emi") || lower.contains("loan") || lower.contains("insurance") || lower.contains("lic") ||
            lower.contains("groww") || lower.contains("zerodha") || lower.contains("mutual fund") || lower.contains("sip") ||
            lower.contains("cred") || lower.contains("credit card payment")) {
            return "Financial Services";
        }

        // Default Debit Category
        return "General Expense";
    }
}
