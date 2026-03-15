package beverage;

public class Americano extends Beverage {

    public Americano() {
        super("아메리카노", 2500);
    }

    @Override
    public void make() {
        System.out.println("  → 에스프레소 샷을 추출합니다...");
        System.out.println("  → 물을 붓습니다...");
        System.out.println("  ☕ 아메리카노 완성!");
    }
}
