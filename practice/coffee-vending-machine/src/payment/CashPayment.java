package payment;

public class CashPayment implements PaymentStrategy {
    private int balance;

    public void insert(int amount) {
        balance += amount;
        System.out.printf("  %,d원 투입 (현재 잔액: %,d원)%n", amount, balance);
    }

    @Override
    public boolean pay(int amount) {
        if (balance < amount) {
            System.out.printf("  잔액 부족 (현재: %,d원 / 필요: %,d원)%n", balance, amount);
            return false;
        }
        balance -= amount;
        return true;
    }

    public int refund() {
        int change = balance;
        balance = 0;
        return change;
    }

    public int getBalance() { return balance; }

    @Override
    public String getType() { return "현금"; }
}
