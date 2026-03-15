import beverage.Beverage;
import machine.Admin;
import machine.VendingMachine;
import payment.CardPayment;
import payment.CashPayment;

import java.util.Scanner;

public class Main {
    private static Scanner scanner = new Scanner(System.in);
    private static VendingMachine machine = new VendingMachine();
    private static Admin admin = new Admin("1234", machine);

    public static void main(String[] args) {
        System.out.println("커피 자판기에 오신 것을 환영합니다!");

        while (true) {
            machine.showMenu();
            System.out.print("번호를 입력하세요: ");
            int input = readInt();

            if (input == 0) {
                System.out.println("이용해주셔서 감사합니다.");
                break;
            } else if (input == 9) {
                enterAdminMode();
            } else if (input >= 1 && input <= 4) {
                processPurchase(input - 1);
            } else {
                System.out.println("잘못된 입력입니다.");
            }
        }
        scanner.close();
    }

    // ── 구매 흐름 ─────────────────────────────────────────
    private static void processPurchase(int index) {
        Beverage beverage = machine.selectBeverage(index);
        if (beverage == null) return;

        System.out.printf("%n[%s - %,d원] 결제 수단을 선택하세요.%n", beverage.getName(), beverage.getPrice());
        System.out.println("  1. 현금   2. 카드   0. 취소");
        System.out.print("선택: ");
        int choice = readInt();

        if (choice == 0) return;

        if (choice == 1) {
            payCash(beverage);
        } else if (choice == 2) {
            payCard(beverage);
        } else {
            System.out.println("잘못된 선택입니다.");
        }
    }

    private static void payCash(Beverage beverage) {
        CashPayment cash = new CashPayment();
        machine.setPaymentStrategy(cash);

        System.out.println("금액을 투입하세요 (0 입력 시 취소)");
        while (cash.getBalance() < beverage.getPrice()) {
            System.out.printf("  투입 금액 (부족: %,d원): ",
                beverage.getPrice() - cash.getBalance());
            int amount = readInt();

            if (amount == 0) {
                machine.cancelPayment();
                return;
            }
            if (amount > 0) {
                cash.insert(amount);
            }
        }

        boolean success = machine.purchase(beverage);
        if (success) {
            int change = cash.refund();
            if (change > 0) {
                System.out.printf("  거스름돈 %,d원이 반환됩니다.%n", change);
            }
            System.out.println("맛있게 드세요!\n");
        }
        machine.setPaymentStrategy(null);
    }

    private static void payCard(Beverage beverage) {
        System.out.print("카드 번호를 입력하세요: ");
        String cardNumber = scanner.nextLine().trim();

        machine.setPaymentStrategy(new CardPayment(cardNumber));
        boolean success = machine.purchase(beverage);
        if (success) {
            System.out.println("맛있게 드세요!\n");
        }
        machine.setPaymentStrategy(null);
    }

    // ── 관리자 모드 ───────────────────────────────────────
    private static void enterAdminMode() {
        System.out.print("관리자 비밀번호: ");
        String pwd = scanner.nextLine().trim();

        if (!admin.authenticate(pwd)) {
            System.out.println("비밀번호가 틀렸습니다.");
            return;
        }

        System.out.println("관리자 모드 진입.");
        while (true) {
            System.out.println("\n  1. 재고 보충   2. 현황 조회   0. 나가기");
            System.out.print("선택: ");
            int choice = readInt();

            if (choice == 0) {
                System.out.println("관리자 모드 종료.");
                break;
            } else if (choice == 1) {
                admin.showStatus();
                System.out.print("보충할 음료 번호: ");
                int idx = readInt() - 1;
                System.out.print("보충할 수량: ");
                int amount = readInt();
                admin.restock(idx, amount);
            } else if (choice == 2) {
                admin.showStatus();
            } else {
                System.out.println("잘못된 입력입니다.");
            }
        }
    }

    // ── 유틸 ─────────────────────────────────────────────
    private static int readInt() {
        try {
            return Integer.parseInt(scanner.nextLine().trim());
        } catch (NumberFormatException e) {
            System.out.println("숫자를 입력해주세요.");
            return -1;
        }
    }
}
