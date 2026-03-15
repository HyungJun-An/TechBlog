package beverage;

public abstract class Beverage {
    protected String name;
    protected int price;

    public Beverage(String name, int price) {
        this.name = name;
        this.price = price;
    }

    public String getName()  { return name; }
    public int    getPrice() { return price; }

    public abstract void make();
}
