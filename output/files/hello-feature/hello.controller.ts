
import {
    JsonController,
    Get,
} from "routing-controllers";
import { Service } from "typedi";
import { OpenAPI } from "routing-controllers-openapi";
import { SuccessResponse, Summary } from 'routing-controllers-openapi-extra';
import { HelloWorldResponseDTO } from "./hello.dto";
import HelloService from "@features/hello/hello.service";

@Service()
@OpenAPI({
    tags: ["Hello"],
})
@JsonController("/hello")
export class HelloController {
    constructor(private helloService: HelloService) { }

    @Get("/")
    @Summary("Hello World")
    @SuccessResponse(HelloWorldResponseDTO)
    public async getHello() {
        return this.helloService.getHello();
    }

}
