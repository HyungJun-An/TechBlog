package beverage;

public class Espresso extends Beverage {

    public Espresso() {
        super("에스프레소", 2000);
    }

    @Override
    public void make() {
        System.out.println("  → 에스프레소 샷을 추출합니다...");
        System.out.println("  ☕ 에스프레소 완성!");
    }
}
