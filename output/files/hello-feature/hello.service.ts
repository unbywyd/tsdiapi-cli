
import { Service } from "typedi";

@Service()
export default class HelloService {
    public async getHello() {
        return { message: "Hello, World!" };
    }
}
    