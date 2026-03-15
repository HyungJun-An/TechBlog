package payment;

public interface PaymentStrategy {
    boolean pay(int amount);
    String getType();
}
