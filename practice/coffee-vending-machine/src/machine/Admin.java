package machine;

import beverage.Beverage;

public class Admin {
    private String password;
    private VendingMachine machine;

    public Admin(String password, VendingMachine machine) {
        this.password = password;
        this.machine = machine;
    }

    public boolean authenticate(String input) {
        return password.equals(input);
    }

    public void restock(int index, int amount) {
        Beverage[] beverages = machine.getBeverages();
        if (index < 0 || index >= beverages.length) {
            System.out.println("잘못된 번호입니다.");
            return;
        }
        machine.restock(index, amount);
        System.out.printf("  %s 재고 %d개 보충 완료.%n", beverages[index].getName(), amount);
    }

    public void showStatus() {
        Beverage[] beverages = machine.getBeverages();
        int[] stock = machine.getStock();

        System.out.println("\n==============================");
        System.out.println("        관리자 현황");
        System.out.println("==============================");
        System.out.println("[재고]");
        for (int i = 0; i < beverages.length; i++) {
            System.out.printf("  %d. %-10s %d개%n", i + 1, beverages[i].getName(), stock[i]);
        }
        System.out.printf("%n[총 매출] %,d원%n", machine.getTotalSales());
        System.out.println("==============================");
    }
}
