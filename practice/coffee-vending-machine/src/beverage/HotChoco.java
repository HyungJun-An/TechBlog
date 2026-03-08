package beverage;

public class HotChoco extends Beverage {

    public HotChoco() {
        super("핫초코", 3000);
    }

    @Override
    public void make() {
        System.out.println("  → 우유를 데웁니다...");
        System.out.println("  → 초코 시럽을 넣습니다...");
        System.out.println("  ☕ 핫초코 완성!");
    }
}
