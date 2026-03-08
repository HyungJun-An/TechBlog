package payment;

public class CardPayment implements PaymentStrategy {
    private String cardNumber;

    public CardPayment(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    @Override
    public boolean pay(int amount) {
        System.out.println("  카드(" + cardNumber + ") 승인 요청 중...");
        System.out.printf("  %,d원 승인 완료!%n", amount);
        return true;
    }

    @Override
    public String getType() { return "카드"; }
}
