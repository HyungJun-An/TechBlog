package machine;

import beverage.*;
import payment.CashPayment;
import payment.PaymentStrategy;

public class VendingMachine {
    private Beverage[] beverages;
    private int[] stock;
    private int totalSales;
    private PaymentStrategy paymentStrategy;

    public VendingMachine() {
        beverages = new Beverage[]{
            new Espresso(),
            new Americano(),
            new CafeLatte(),
            new HotChoco()
        };
        stock = new int[]{10, 10, 10, 10};
        totalSales = 0;
    }

    public void showMenu() {
        System.out.println("\n==============================");
        System.out.println("         커피 자판기");
        System.out.println("==============================");
        for (int i = 0; i < beverages.length; i++) {
            String status = (stock[i] > 0) ? "" : " [품절]";
            System.out.printf("  %d. %-10s %,5d원%s%n",
                i + 1, beverages[i].getName(), beverages[i].getPrice(), status);
        }
        System.out.println("  0. 종료  |  9. 관리자 모드");
        System.out.println("==============================");
    }

    public Beverage selectBeverage(int index) {
        if (index < 0 || index >= beverages.length) {
            System.out.println("없는 번호입니다.");
            return null;
        }
        if (stock[index] == 0) {
            System.out.println("품절된 음료입니다.");
            return null;
        }
        return beverages[index];
    }

    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.paymentStrategy = strategy;
    }

    public PaymentStrategy getPaymentStrategy() {
        return paymentStrategy;
    }

    public boolean purchase(Beverage beverage) {
        if (paymentStrategy == null) {
            System.out.println("결제 수단을 선택해주세요.");
            return false;
        }

        if (paymentStrategy.pay(beverage.getPrice())) {
            int index = findIndex(beverage);
            stock[index]--;
            totalSales += beverage.getPrice();

            System.out.println("\n[ " + beverage.getName() + " 제조 중... ]");
            beverage.make();
            return true;
        }
        return false;
    }

    public void cancelPayment() {
        if (paymentStrategy instanceof CashPayment) {
            int refund = ((CashPayment) paymentStrategy).refund();
            if (refund > 0) {
                System.out.printf("  %,d원이 반환됩니다.%n", refund);
            }
        }
        paymentStrategy = null;
        System.out.println("결제가 취소됐습니다.");
    }

    // Admin 접근용
    public Beverage[] getBeverages() { return beverages; }
    public int[]      getStock()     { return stock; }
    public int        getTotalSales(){ return totalSales; }

    public void restock(int index, int amount) {
        stock[index] += amount;
    }

    private int findIndex(Beverage beverage) {
        for (int i = 0; i < beverages.length; i++) {
            if (beverages[i] == beverage) return i;
        }
        return -1;
    }
}
