package com.fintrack.service;

import com.fintrack.dto.StatementImportDto.ParsedTransactionDto;
import com.fintrack.models.Credit;
import com.fintrack.models.Debit;
import com.fintrack.models.User;
import com.fintrack.repository.CreditRepository;
import com.fintrack.repository.DebitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class BankStatementParserServiceTest {

    private SmartCategorizerService categorizerService;
    private BankStatementParserService parserService;
    private CreditRepository creditRepository;
    private DebitRepository debitRepository;
    private DuplicateDetectionService duplicateDetectionService;

    @BeforeEach
    void setUp() {
        categorizerService = new SmartCategorizerService();
        parserService = new BankStatementParserService(categorizerService);
        creditRepository = Mockito.mock(CreditRepository.class);
        debitRepository = Mockito.mock(DebitRepository.class);
        duplicateDetectionService = new DuplicateDetectionService(creditRepository, debitRepository);
    }

    @Test
    @DisplayName("1. Should parse standard HDFC/SBI CSV bank statement with Withdrawal/Deposit columns")
    void testParseHdfcSbiCsv() throws Exception {
        String csvContent = """
                Date,Narration,Chq/Ref No,Value Dt,Withdrawal Amt,Deposit Amt,Closing Balance
                01/08/2026,UPI/523412341234/SWIGGY/swiggy@icici,UPI-523412,01/08/2026,450.00,,12550.00
                05/08/2026,SALARY CREDIT FROM ACME CORP,ACH-98765,05/08/2026,,85000.00,97550.00
                10/08/2026,UBER RIDES TRIP 98124,POS-1234,10/08/2026,620.50,,96929.50
                15/08/2026,BESCOM ELECTRICITY BILL,BILL-7762,15/08/2026,1850.00,,95079.50
                """;

        MockMultipartFile file = new MockMultipartFile("file", "hdfc_statement.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(4, results.size(), "Should extract 4 transactions");

        // Transaction 1: Swiggy Debit
        ParsedTransactionDto tx1 = results.get(0);
        assertEquals("2026-08-01", tx1.getDate());
        assertEquals(450.00, tx1.getAmount());
        assertEquals("DEBIT", tx1.getType());
        assertEquals("Food & Dining", tx1.getCategory());

        // Transaction 2: Salary Credit
        ParsedTransactionDto tx2 = results.get(1);
        assertEquals("2026-08-05", tx2.getDate());
        assertEquals(85000.00, tx2.getAmount());
        assertEquals("CREDIT", tx2.getType());
        assertEquals("Salary", tx2.getCategory());

        // Transaction 3: Uber Debit
        ParsedTransactionDto tx3 = results.get(2);
        assertEquals("2026-08-10", tx3.getDate());
        assertEquals(620.50, tx3.getAmount());
        assertEquals("DEBIT", tx3.getType());
        assertEquals("Transportation", tx3.getCategory());

        // Transaction 4: Electricity Debit
        ParsedTransactionDto tx4 = results.get(3);
        assertEquals("2026-08-15", tx4.getDate());
        assertEquals(1850.00, tx4.getAmount());
        assertEquals("DEBIT", tx4.getType());
        assertEquals("Bills & Utilities", tx4.getCategory());
    }

    @Test
    @DisplayName("2. Should parse SBI format with dd-MMM-yyyy dates and alphanumeric remarks")
    void testParseSbiHyphenDates() throws Exception {
        String csvContent = """
                Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
                05-Aug-2026,05-Aug-2026,TO TRANSFER-UPI/DR/62341234/ZOMATO/Paytm,TRANSFER,350.00,,45000.00
                12-Aug-2026,12-Aug-2026,BY TRANSFER-NEFT*MUTUAL FUND DIVIDEND,NEFT-0012,,2400.00,47400.00
                20-Aug-2026,20-Aug-2026,POS 412345 APNA BAZAR GROCERY,POS-8822,1250.00,,46150.00
                """;

        MockMultipartFile file = new MockMultipartFile("file", "sbi_statement.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(3, results.size());
        assertEquals("2026-08-05", results.get(0).getDate());
        assertEquals(350.00, results.get(0).getAmount());
        assertEquals("DEBIT", results.get(0).getType());
        assertEquals("Food & Dining", results.get(0).getCategory());

        assertEquals("2026-08-12", results.get(1).getDate());
        assertEquals(2400.00, results.get(1).getAmount());
        assertEquals("CREDIT", results.get(1).getType());
        assertEquals("Investment", results.get(1).getCategory());
    }

    @Test
    @DisplayName("3. Should parse PhonePe/GooglePay UPI transaction export format")
    void testParsePhonePeUpiFormat() throws Exception {
        String csvContent = """
                Date,Transaction Details,Type,Amount,Status
                2026-08-01,Paid to Swiggy Bangalore,DEBIT,299.00,COMPLETED
                2026-08-03,Received from Rahul Sharma UPI,CREDIT,1500.00,COMPLETED
                2026-08-05,Paid to Apollo Pharmacy,DEBIT,450.00,COMPLETED
                2026-08-07,Paid to Netflix India,DEBIT,649.00,COMPLETED
                """;

        MockMultipartFile file = new MockMultipartFile("file", "phonepe.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(4, results.size());
        assertEquals("Food & Dining", results.get(0).getCategory());
        assertEquals("DEBIT", results.get(0).getType());

        assertEquals("CREDIT", results.get(1).getType());
        assertEquals(1500.00, results.get(1).getAmount());

        assertEquals("Healthcare", results.get(2).getCategory());
        assertEquals("Entertainment", results.get(3).getCategory());
    }

    @Test
    @DisplayName("4. Should parse Debit-only statement correctly")
    void testParseDebitOnlyStatement() throws Exception {
        String csvContent = """
                Date,Description,Withdrawal,Balance
                2026-08-01,Starbucks Coffee,350.00,9650.00
                2026-08-02,Metro Card Recharge,200.00,9450.00
                2026-08-03,BookMyShow Tickets,750.00,8700.00
                """;

        MockMultipartFile file = new MockMultipartFile("file", "debits.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(3, results.size());
        assertTrue(results.stream().allMatch(t -> "DEBIT".equals(t.getType())), "All records should be DEBIT");
    }

    @Test
    @DisplayName("5. Should parse Credit-only statement correctly")
    void testParseCreditOnlyStatement() throws Exception {
        String csvContent = """
                Date,Description,Deposit,Balance
                2026-08-01,Salary Tech Corp,85000.00,85000.00
                2026-08-05,Freelance Web Development,25000.00,110000.00
                2026-08-10,Stock Dividend Payout,1200.00,111200.00
                """;

        MockMultipartFile file = new MockMultipartFile("file", "credits.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(3, results.size());
        assertTrue(results.stream().allMatch(t -> "CREDIT".equals(t.getType())), "All records should be CREDIT");
    }

    @Test
    @DisplayName("6. Should ignore metadata and summary rows (Opening/Closing Balance, Totals, B/F)")
    void testIgnoreMetadataAndSummaryRows() throws Exception {
        String csvContent = """
                Date,Narration,Withdrawal,Deposit,Balance
                01/08/2026,OPENING BALANCE B/F,,,10000.00
                02/08/2026,SWIGGY ONLINE FOOD,450.00,,9550.00
                05/08/2026,BROUGHT FORWARD BALANCE,,,9550.00
                06/08/2026,AMAZON SHOPPING,1200.00,,8350.00
                31/08/2026,TOTAL TURNOVER DEBITS: 1650.00 CREDITS: 0.00,,,
                31/08/2026,CLOSING BALANCE C/F,,,8350.00
                """;

        MockMultipartFile file = new MockMultipartFile("file", "statement_with_metadata.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        // Only the 2 legitimate transactions (Swiggy & Amazon) should be kept
        assertEquals(2, results.size());
        assertEquals(450.00, results.get(0).getAmount());
        assertEquals(1200.00, results.get(1).getAmount());
    }

    @Test
    @DisplayName("7. Should handle malformed CSV with extra empty lines and quoted strings")
    void testMalformedAndMessyCsv() throws Exception {
        String csvContent = """
                
                "Date","Description","Withdrawal Amount","Deposit Amount"
                
                "2026-08-01","  Swiggy Restaurant Delivery ","550.00",""
                
                "2026-08-02","Salary Direct Deposit","","90,000.00"
                
                """;

        MockMultipartFile file = new MockMultipartFile("file", "messy.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(2, results.size());
        assertEquals(550.00, results.get(0).getAmount());
        assertEquals(90000.00, results.get(1).getAmount());
        assertEquals("CREDIT", results.get(1).getType());
    }

    @Test
    @DisplayName("8. Should gracefully skip rows with missing amounts or invalid dates")
    void testSkipMissingAmountAndMissingDate() throws Exception {
        String csvContent = """
                Date,Description,Amount,Type
                2026-08-01,Valid Debit,300.00,DEBIT
                INVALID_DATE,Some Note,500.00,DEBIT
                2026-08-02,Zero Amount,0.00,DEBIT
                2026-08-03,Empty Amount,,DEBIT
                2026-08-04,Valid Credit,1500.00,CREDIT
                """;

        MockMultipartFile file = new MockMultipartFile("file", "missing_data.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(2, results.size(), "Only 2 valid transactions should be parsed");
        assertEquals(300.00, results.get(0).getAmount());
        assertEquals(1500.00, results.get(1).getAmount());
    }

    @Test
    @DisplayName("9. Should accurately preserve same-day multiple transactions")
    void testSameDayMultipleTransactions() throws Exception {
        String csvContent = """
                Date,Description,Withdrawal,Deposit
                2026-08-01,Morning Tea Stall,25.00,
                2026-08-01,Lunch Restaurant,250.00,
                2026-08-01,Evening Grocery Store,450.00,
                2026-08-01,Dinner Swiggy Order,320.00,
                """;

        MockMultipartFile file = new MockMultipartFile("file", "same_day.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(4, results.size());
        assertTrue(results.stream().allMatch(t -> "2026-08-01".equals(t.getDate())));
        // All IDs must be uniquely generated UUIDs
        long uniqueIdCount = results.stream().map(ParsedTransactionDto::getId).distinct().count();
        assertEquals(4, uniqueIdCount);
    }

    @Test
    @DisplayName("10. Should parse semicolon-delimited CSV format")
    void testSemicolonDelimitedCsv() throws Exception {
        String csvContent = "Date;Description;Amount;Type\n" +
                "2026-08-01;Supermarket Grocery;45.50;DEBIT\n" +
                "2026-08-05;Monthly Salary;3200.00;CREDIT\n";

        MockMultipartFile file = new MockMultipartFile("file", "european.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(2, results.size());
        assertEquals("CSV / Delimited Table", format[0]);
        assertEquals(45.50, results.get(0).getAmount());
        assertEquals(3200.00, results.get(1).getAmount());
    }

    @Test
    @DisplayName("11. Should resolve signed amounts (-500 as Debit, +1500 as Credit)")
    void testSignedAmountCsv() throws Exception {
        String csvContent = """
                Date,Transaction Details,Amount
                2026-08-01,Uber Trip,-450.00
                2026-08-02,Consulting Inflow,12000.00
                2026-08-03,Electricity Bill,-1800.00
                """;

        MockMultipartFile file = new MockMultipartFile("file", "signed.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(3, results.size());
        assertEquals("DEBIT", results.get(0).getType());
        assertEquals(450.00, results.get(0).getAmount());

        assertEquals("CREDIT", results.get(1).getType());
        assertEquals(12000.00, results.get(1).getAmount());

        assertEquals("DEBIT", results.get(2).getType());
        assertEquals(1800.00, results.get(2).getAmount());
    }

    @Test
    @DisplayName("12. Should detect duplicate transactions against existing user ledger and auto-uncheck them")
    void testDuplicateDetectionWithDateAndAmount() throws Exception {
        User user = new User();
        user.setEmail("abdulquadir@sharklasers.com");

        Debit existingDebit = new Debit();
        existingDebit.setEmail("abdulquadir@sharklasers.com");
        existingDebit.setDate("2026-08-01");
        existingDebit.setAmount(450.00);
        existingDebit.setPaidTo("Swiggy");

        when(debitRepository.findByEmailIgnoreCase(Mockito.anyString()))
                .thenReturn(List.of(existingDebit));
        when(creditRepository.findByEmailIgnoreCase(Mockito.anyString()))
                .thenReturn(List.of());

        String csvContent = """
                Date,Description,Amount,Type
                2026-08-01,Swiggy Food Order,450.00,DEBIT
                2026-08-02,Zomato Food Order,320.00,DEBIT
                """;

        MockMultipartFile file = new MockMultipartFile("file", "statement.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);

        assertEquals(2, results.size());

        duplicateDetectionService.checkAndFlagDuplicates(user, results);

        // First transaction should be flagged duplicate and unselected
        assertTrue(results.get(0).getIsDuplicate(), "Swiggy on 2026-08-01 should be detected as duplicate");
        assertFalse(results.get(0).getSelected(), "Duplicate should be unselected by default");
        assertNotNull(results.get(0).getDuplicateReason());

        // Second transaction should NOT be duplicate and selected
        assertFalse(results.get(1).getIsDuplicate());
        assertTrue(results.get(1).getSelected());
    }

    @Test
    @DisplayName("13. Should classify diverse keywords into accurate financial categories")
    void testSmartCategorizationAccuracy() {
        assertEquals("Food & Dining", categorizerService.categorize("SWIGGY BANGALORE", "DEBIT"));
        assertEquals("Food & Dining", categorizerService.categorize("Zomato Order 9812", "DEBIT"));
        assertEquals("Transportation", categorizerService.categorize("UBER TRIP INDIA", "DEBIT"));
        assertEquals("Transportation", categorizerService.categorize("HPCL PETROL PUMP FUEL", "DEBIT"));
        assertEquals("Entertainment", categorizerService.categorize("Netflix monthly subscription", "DEBIT"));
        assertEquals("Entertainment", categorizerService.categorize("Spotify Premium", "DEBIT"));
        assertEquals("Healthcare", categorizerService.categorize("Apollo Pharmacy Meds", "DEBIT"));
        assertEquals("Bills & Utilities", categorizerService.categorize("Airtel Broadband Bill Payment", "DEBIT"));
        assertEquals("Bills & Utilities", categorizerService.categorize("Bescom Electricity Bill", "DEBIT"));
        assertEquals("Salary", categorizerService.categorize("ACH SALARY CREDIT ACME CORP", "CREDIT"));
        assertEquals("Investment", categorizerService.categorize("ZERODHA BROKING DIVIDEND", "CREDIT"));
        assertEquals("Freelancing", categorizerService.categorize("FREELANCE CONSULTING INVOICE", "CREDIT"));
    }

    @Test
    @DisplayName("14. Should process large 100-row statement batch in under 100 milliseconds")
    void testLargeStatementPerformance() throws Exception {
        StringBuilder sb = new StringBuilder("Date,Description,Withdrawal,Deposit,Balance\n");
        for (int i = 1; i <= 100; i++) {
            String day = String.format("%02d", (i % 28) + 1);
            if (i % 5 == 0) {
                sb.append(String.format("2026-08-%s,Client Payment #%d,,15000.00,15000.00\n", day, i));
            } else {
                sb.append(String.format("2026-08-%s,Store Purchase #%d,250.00,,14750.00\n", day, i));
            }
        }

        MockMultipartFile file = new MockMultipartFile("file", "large_statement.csv", "text/csv", sb.toString().getBytes(StandardCharsets.UTF_8));
        long startTime = System.currentTimeMillis();

        String[] format = new String[1];
        List<ParsedTransactionDto> results = parserService.parseFile(file, format);
        long elapsed = System.currentTimeMillis() - startTime;

        assertEquals(100, results.size());
        assertTrue(elapsed < 100, "100 transactions should parse in less than 100ms (took " + elapsed + "ms)");
    }
}
