public class Greeter {

    /**
     * 返回问候语。
     *
     * @param name 被问候者的名字
     * @return 问候语字符串
     */
    public String greet(String name) {
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        Greeter greeter = new Greeter();
        System.out.println(greeter.greet("World"));
    }
}
