package beverage;

public class CafeLatte extends Beverage {

    public CafeLatte() {
        super("카페라떼", 3000);
    }

    @Override
    public void make() {
        System.out.println("  → 에스프레소 샷을 추출합니다...");
        System.out.println("  → 우유를 스팀합니다...");
        System.out.println("  ☕ 카페라떼 완성!");
    }
}
